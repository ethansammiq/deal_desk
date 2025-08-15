import express, { type Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertDealSchema, 
  insertDealScopingRequestSchema,
  DEAL_STATUSES,
  DEAL_STATUS_LABELS,
  type DealStatus,
  type UserRole,
  insertUserSchema
} from "@shared/schema";
import { getCurrentUser, hasPermission, canTransitionToStatus, getAllowedTransitions } from "@shared/auth";
import { z } from "zod";
import { fromZodError } from "zod-validation-error";
import { canTransitionStatus } from "@shared/status-transitions";
import { registerChatbotRoutes, ChatMemStorage } from "./chatbot";
import { 
  analyzeDeal, 
  getDealRecommendations, 
  getMarketAnalysis,
  generateStructuredResponse 
} from "./claude-analyzer";

export async function registerRoutes(app: Express): Promise<Server> {
  // prefix all routes with /api
  const router = express.Router();
  app.use("/api", router);
  
  // Stats endpoint
  // Phase 7A: Updated stats endpoint for 9-status workflow
  router.get("/stats", async (req: Request, res: Response) => {
    try {
      const realStats = await storage.getDealStats();
      res.status(200).json(realStats);
    } catch (error) {
      console.error("Error fetching deal stats:", error);
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });
  
  // Deals endpoints
  router.get("/deals", async (req: Request, res: Response) => {
    try {
      const status = req.query.status as string | undefined;
      const filters = status ? { status } : undefined;
      const deals = await storage.getDeals(filters);
      
      // Enhance deals with tier data for accurate value calculation
      const dealsWithTiers = await Promise.all(
        deals.map(async (deal) => {
          if (deal.dealStructure === 'tiered') {
            const tiers = await storage.getDealTiers(deal.id);
            return {
              ...deal,
              tiers: tiers,
              // Calculate total tier revenue for display
              totalTierRevenue: tiers.length > 0 
                ? tiers.reduce((sum, tier) => sum + tier.annualRevenue, 0)
                : deal.annualRevenue || 0,
              // Get Tier 1 revenue specifically
              tier1Revenue: tiers.find(t => t.tierNumber === 1)?.annualRevenue || deal.annualRevenue || 0
            };
          }
          return deal;
        })
      );
      
      res.status(200).json(dealsWithTiers);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch deals" });
    }
  });
  
  router.get("/deals/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid deal ID" });
      }
      
      const deal = await storage.getDeal(id);
      if (!deal) {
        return res.status(404).json({ message: "Deal not found" });
      }
      
      res.status(200).json(deal);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch deal" });
    }
  });
  
  // Phase 7A: Deal status management routes
  router.put("/deals/:id/status", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid deal ID" });
      }
      
      const { status, changedBy, comments } = req.body;
      
      // Validate status
      if (!status || !Object.values(DEAL_STATUSES).includes(status)) {
        return res.status(400).json({ 
          message: "Invalid status", 
          validStatuses: Object.values(DEAL_STATUSES) 
        });
      }
      
      // Validate changedBy
      if (!changedBy || typeof changedBy !== 'string') {
        return res.status(400).json({ message: "changedBy is required" });
      }
      
      const updatedDeal = await storage.updateDealStatus(id, status as DealStatus, changedBy, comments);
      
      if (!updatedDeal) {
        return res.status(404).json({ message: "Deal not found" });
      }
      
      res.status(200).json(updatedDeal);
    } catch (error) {
      console.error("Error updating deal status:", error);
      res.status(500).json({ message: "Failed to update deal status" });
    }
  });
  
  router.get("/deals/:id/history", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid deal ID" });
      }
      
      // Verify deal exists
      const deal = await storage.getDeal(id);
      if (!deal) {
        return res.status(404).json({ message: "Deal not found" });
      }
      
      const history = await storage.getDealStatusHistory(id);
      res.status(200).json(history);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch deal status history" });
    }
  });
  
  // Phase 7B: Nudge endpoint for sending reminders/notifications
  router.post("/deals/:id/nudge", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid deal ID" });
      }
      
      const { targetRole, message, sender } = req.body;
      
      // Validate required fields
      if (!targetRole || !message || !sender) {
        return res.status(400).json({ 
          message: "targetRole, message, and sender are required" 
        });
      }
      
      // Verify deal exists
      const deal = await storage.getDeal(id);
      if (!deal) {
        return res.status(404).json({ message: "Deal not found" });
      }
      
      // Create a status history entry for the nudge
      const nudgeComment = `NUDGE from ${sender} to ${targetRole}: ${message}`;
      await storage.createDealStatusHistory({
        dealId: id,
        status: deal.status, // Keep current status
        previousStatus: deal.status,
        changedBy: sender,
        comments: nudgeComment
      });
      
      // In a real system, this would also trigger notifications
      // For now, we'll just log and return success
      console.log(`Nudge sent: Deal ${id}, From: ${sender}, To: ${targetRole}, Message: ${message}`);
      
      res.status(200).json({ 
        message: "Nudge sent successfully",
        targetRole,
        dealId: id
      });
    } catch (error) {
      console.error("Error sending nudge:", error);
      res.status(500).json({ message: "Failed to send nudge" });
    }
  });

  // Phase 7A: Status constants endpoint
  router.get("/deal-statuses", async (req: Request, res: Response) => {
    try {
      res.status(200).json({
        statuses: DEAL_STATUSES,
        labels: DEAL_STATUS_LABELS,
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch deal statuses" });
    }
  });

  // Phase 3: Enhanced status transition validation endpoint
  router.get("/deals/:id/allowed-transitions", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const userRole = req.query.role as string || 'admin';
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid deal ID" });
      }

      const deal = await storage.getDeal(id);
      if (!deal) {
        return res.status(404).json({ message: "Deal not found" });
      }

      const allowedTransitions = getAllowedTransitions(deal.status as any, userRole as any);
      
      res.status(200).json({
        currentStatus: deal.status,
        allowedTransitions,
        userRole
      });
    } catch (error) {
      console.error("Error fetching allowed transitions:", error);
      res.status(500).json({ message: "Failed to fetch allowed transitions" });
    }
  });

  // Phase 3: Deal comments endpoints
  router.get("/deals/:id/comments", async (req: Request, res: Response) => {
    try {
      const dealId = parseInt(req.params.id);
      if (isNaN(dealId)) {
        return res.status(400).json({ message: "Invalid deal ID" });
      }

      const deal = await storage.getDeal(dealId);
      if (!deal) {
        return res.status(404).json({ message: "Deal not found" });
      }

      const comments = await storage.getDealComments(dealId);
      res.status(200).json(comments);
    } catch (error) {
      console.error("Error fetching deal comments:", error);
      res.status(500).json({ message: "Failed to fetch comments" });
    }
  });

  router.post("/deals/:id/comments", async (req: Request, res: Response) => {
    try {
      const dealId = parseInt(req.params.id);
      if (isNaN(dealId)) {
        return res.status(400).json({ message: "Invalid deal ID" });
      }

      const { content, author, authorRole } = req.body;
      
      if (!content?.trim()) {
        return res.status(400).json({ message: "Comment content is required" });
      }
      
      if (!author || !authorRole) {
        return res.status(400).json({ message: "Author and author role are required" });
      }

      const deal = await storage.getDeal(dealId);
      if (!deal) {
        return res.status(404).json({ message: "Deal not found" });
      }

      const comment = await storage.createDealComment({
        dealId,
        content: content.trim(),
        author,
        authorRole,
        createdAt: new Date()
      });

      res.status(201).json(comment);
    } catch (error) {
      console.error("Error creating deal comment:", error);
      res.status(500).json({ message: "Failed to create comment" });
    }
  });

  // Draft management endpoints  
  router.post("/deals/drafts", async (req: Request, res: Response) => {
    try {
      const { name, description, formData, draftId } = req.body;
      
      if (!name?.trim()) {
        return res.status(400).json({ message: "Draft name is required" });
      }
      
      if (!formData) {
        return res.status(400).json({ message: "Form data is required" });
      }

      // Check if this is an update to an existing draft
      if (draftId && !isNaN(parseInt(draftId))) {
        const existingDraft = await storage.getDeal(parseInt(draftId));
        if (existingDraft && existingDraft.status === 'draft') {
          // Update existing draft using the updateDeal method
          const updatedDraftData = {
            ...formData,
            dealName: name,
            businessSummary: description || formData.businessSummary || "",
            dealStructure: formData.dealStructure || "tiered",
            dealType: formData.dealType || "grow",
            region: formData.region || "west",
            salesChannel: formData.salesChannel || "client_direct",
            advertiserName: formData.advertiserName || "",
            termStartDate: formData.termStartDate || new Date().toISOString().split('T')[0],
            termEndDate: formData.termEndDate || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            annualRevenue: formData.annualRevenue && Number(formData.annualRevenue) > 0 ? Number(formData.annualRevenue) : 1,
            annualGrossMargin: formData.annualGrossMargin && Number(formData.annualGrossMargin) >= 0 ? Number(formData.annualGrossMargin) : 0,
            status: "draft" as const,
            isDraft: true,
            draftType: "submission_draft",
            updatedAt: new Date()
          };

          const validatedData = insertDealSchema.safeParse(updatedDraftData);
          if (!validatedData.success) {
            const errorMessage = fromZodError(validatedData.error);
            return res.status(400).json({ 
              message: "Draft validation failed", 
              errors: errorMessage.message
            });
          }

          const updatedDraft = await storage.updateDeal(parseInt(draftId), validatedData.data);

          // Save tier data separately if provided
          if (formData.dealTiers && Array.isArray(formData.dealTiers) && formData.dealTiers.length > 0) {
            // Clear existing tiers for this deal
            await storage.clearDealTiers(parseInt(draftId));
            // Save new tier data
            for (const tier of formData.dealTiers) {
              await storage.createDealTier({
                dealId: parseInt(draftId),
                tierNumber: tier.tierNumber,
                annualRevenue: tier.annualRevenue,
                annualGrossMargin: tier.annualGrossMargin,
                incentives: tier.incentives || []
              });
            }
          }

          return res.status(200).json(updatedDraft);
        }
      }

      // Create new draft if no existing draft ID or draft not found
      const draftDeal = {
        ...formData,
        dealName: name,
        businessSummary: description || formData.businessSummary || "",
        dealStructure: formData.dealStructure || "tiered",
        dealType: formData.dealType || "grow",
        region: formData.region || "west",
        salesChannel: formData.salesChannel || "client_direct",
        advertiserName: formData.advertiserName || "",
        termStartDate: formData.termStartDate || new Date().toISOString().split('T')[0],
        termEndDate: formData.termEndDate || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        // For drafts, provide default values for required fields to avoid validation errors
        annualRevenue: formData.annualRevenue && Number(formData.annualRevenue) > 0 ? Number(formData.annualRevenue) : 1, // Default to 1 to pass positive validation
        annualGrossMargin: formData.annualGrossMargin && Number(formData.annualGrossMargin) >= 0 ? Number(formData.annualGrossMargin) : 0, // Allow 0 for margins
        status: "draft" as const,
        isDraft: true,
        draftType: "submission_draft"
      };

      const validatedData = insertDealSchema.safeParse(draftDeal);
      if (!validatedData.success) {
        const errorMessage = fromZodError(validatedData.error);
        console.error("Draft validation errors:", validatedData.error.errors);
        console.error("Draft data being validated:", JSON.stringify(draftDeal, null, 2));
        return res.status(400).json({ 
          message: "Draft validation failed", 
          errors: errorMessage.message,
          details: validatedData.error.errors
        });
      }

      const savedDraft = await storage.createDeal(validatedData.data);

      // Save tier data separately if provided
      if (formData.dealTiers && Array.isArray(formData.dealTiers) && formData.dealTiers.length > 0) {
        // Save new tier data for the new draft
        for (const tier of formData.dealTiers) {
          await storage.createDealTier({
            dealId: savedDraft.id,
            tierNumber: tier.tierNumber,
            annualRevenue: tier.annualRevenue,
            annualGrossMargin: tier.annualGrossMargin,
            incentives: tier.incentives || []
          });
        }
      }

      res.status(201).json(savedDraft);
    } catch (error) {
      console.error("Error creating draft:", error);
      res.status(500).json({ message: "Failed to create draft" });
    }
  });

  router.get("/deals/drafts", async (req: Request, res: Response) => {
    try {
      // Get all deals with draft status
      const allDeals = await storage.getDeals();
      const drafts = allDeals.filter(deal => deal.status === 'draft');
      res.status(200).json(drafts);
    } catch (error) {
      console.error("Error fetching drafts:", error);
      res.status(500).json({ message: "Failed to fetch drafts" });
    }
  });

  router.delete("/deals/drafts/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid draft ID" });
      }

      const draft = await storage.getDeal(id);
      if (!draft) {
        return res.status(404).json({ message: "Draft not found" });
      }

      if (draft.status !== "draft") {
        return res.status(400).json({ message: "Only drafts can be deleted via this endpoint" });
      }

      await storage.deleteDeal(id);
      res.status(200).json({ message: "Draft deleted successfully" });
    } catch (error) {
      console.error("Error deleting draft:", error);
      res.status(500).json({ message: "Failed to delete draft" });
    }
  });

  // Add endpoint to fetch tier data for a specific deal
  router.get("/deals/:id/tiers", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid deal ID" });
      }

      const deal = await storage.getDeal(id);
      if (!deal) {
        return res.status(404).json({ message: "Deal not found" });
      }

      // Get tier data from the dealTiers table
      const tierData = await storage.getDealTiers(id);
      res.status(200).json(tierData);
    } catch (error) {
      console.error("Error fetching tier data:", error);
      res.status(500).json({ message: "Failed to fetch tier data" });
    }
  });
  
  // Deal scoping requests endpoints
  router.get("/deal-scoping-requests", async (req: Request, res: Response) => {
    try {
      const status = req.query.status as string | undefined;
      const filters = status ? { status } : undefined;
      const requests = await storage.getDealScopingRequests(filters);
      res.status(200).json(requests);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch scoping requests" });
    }
  });

  router.get("/deal-scoping-requests/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid scoping request ID" });
      }
      
      const request = await storage.getDealScopingRequest(id);
      if (!request) {
        return res.status(404).json({ message: "Scoping request not found" });
      }
      
      res.status(200).json(request);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch scoping request" });
    }
  });


  
  router.post("/deal-scoping-requests", async (req: Request, res: Response) => {
    try {
      console.log("Creating deal scoping request with data:", req.body);
      
      // Validate the request data against the schema
      const validatedData = insertDealScopingRequestSchema.safeParse(req.body);
      
      if (!validatedData.success) {
        console.error("Deal scoping request validation failed:", validatedData.error);
        const errorMessage = fromZodError(validatedData.error);
        return res.status(400).json({ 
          message: "Validation failed", 
          errors: errorMessage.message 
        });
      }
      
      // Create the deal scoping request in storage
      const request = await storage.createDealScopingRequest(validatedData.data);
      console.log("Deal scoping request created successfully:", request);
      
      res.status(201).json(request);
    } catch (error) {
      console.error("Failed to create deal scoping request:", error);
      res.status(500).json({ message: "Failed to create deal scoping request" });
    }
  });

  // Phase 8: Revision Request API endpoint
  router.post("/deals/:id/request-revision", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid deal ID" });
      }

      const { revisionReason } = req.body;
      
      if (!revisionReason || typeof revisionReason !== 'string' || !revisionReason.trim()) {
        return res.status(400).json({ message: "Revision reason is required" });
      }

      // Get the current deal
      const currentDeal = await storage.getDeal(id);
      if (!currentDeal) {
        return res.status(404).json({ message: "Deal not found" });
      }

      // Validate that deal can be moved to revision_requested status
      if (!["under_review", "negotiating"].includes(currentDeal.status)) {
        return res.status(400).json({ 
          message: "Deal must be in 'under_review' or 'negotiating' status to request revision",
          currentStatus: currentDeal.status
        });
      }

      // Update deal status to revision_requested with revision data
      const updatedDeal = await storage.updateDealWithRevision(id, {
        status: "revision_requested" as DealStatus,
        revisionReason: revisionReason.trim(),
        revisionCount: (currentDeal.revisionCount || 0) + 1,
        isRevision: true,
        lastRevisedAt: new Date(),
        canEdit: true // Allow seller to edit when revision is requested
      });

      if (!updatedDeal) {
        return res.status(500).json({ message: "Failed to update deal with revision request" });
      }

      res.status(200).json({
        message: "Revision requested successfully",
        deal: updatedDeal
      });
    } catch (error) {
      console.error("Error requesting revision:", error);
      res.status(500).json({ message: "Failed to request revision" });
    }
  });

  // Phase 8 Phase 3: Resubmit deal after revisions
  router.post("/deals/:id/resubmit", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid deal ID" });
      }

      const deal = await storage.getDeal(id);
      if (!deal) {
        return res.status(404).json({ message: "Deal not found" });
      }

      // Only allow resubmission of deals in revision_requested status
      if (deal.status !== 'revision_requested') {
        return res.status(400).json({ message: "Deal is not in revision requested status" });
      }

      // Update deal status to under_review and increment revision count
      const updatedDeal = await storage.updateDealWithRevision(id, {
        status: 'under_review' as DealStatus,
        submittedAt: new Date(),
        revisionCount: (deal.revisionCount || 0) + 1,
        lastResubmittedAt: new Date()
      });

      res.status(200).json({
        message: "Deal resubmitted successfully",
        deal: updatedDeal
      });
    } catch (error) {
      console.error("Error resubmitting deal:", error);
      res.status(500).json({ message: "Failed to resubmit deal" });
    }
  });

  router.post("/deals", async (req: Request, res: Response) => {
    try {
      // Extract dealTiers from request body if present
      const { dealTiers, ...reqData } = req.body;
      
      // Validate the deal data against the schema
      const validatedData = insertDealSchema.safeParse(reqData);
      
      if (!validatedData.success) {
        const errorMessage = fromZodError(validatedData.error).message;
        return res.status(400).json({ message: errorMessage });
      }
      
      // Generate a unique reference number (format: DEAL-YYYY-XXX)
      const year = new Date().getFullYear();
      const allDeals = await storage.getDeals();
      const nextSequence = allDeals.length + 1;
      const referenceNumber = `DEAL-${year}-${String(nextSequence).padStart(3, '0')}`;
      
      // Create the deal with the generated reference number
      // We need to pass both the deal data and reference number to the storage layer
      // which will handle adding the referenceNumber during creation
      const newDeal = await storage.createDeal(
        validatedData.data as any, 
        referenceNumber
      );
      
      // If this is a tiered deal structure and dealTiers were provided, create them
      if (validatedData.data.dealStructure === "tiered" && Array.isArray(dealTiers) && dealTiers.length > 0) {
        // Create each tier and associate it with the new deal
        for (const tier of dealTiers) {
          await storage.createDealTier({
            ...tier,
            dealId: newDeal.id
          });
        }
      }
      
      // Trigger AI analysis for deal optimization recommendations
      try {
        const aiAnalysis = await analyzeDeal(newDeal);
        console.log("AI analysis completed for deal:", newDeal.id);
        
        res.status(201).json({ 
          deal: newDeal, 
          aiAnalysis: {
            recommendations: aiAnalysis.recommendations,
            riskFactors: aiAnalysis.riskFactors,
            confidence: aiAnalysis.confidence
          }
        });
      } catch (aiError) {
        console.warn("AI analysis failed, but deal was created:", aiError);
        res.status(201).json({ deal: newDeal });
      }
    } catch (error) {
      console.error("Error creating deal:", error);
      res.status(500).json({ message: "Failed to create deal" });
    }
  });
  
  router.patch("/deals/:id/status", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid deal ID" });
      }
      
      // Validate status
      const statusSchema = z.object({
        status: z.enum(["pending", "approved", "rejected", "in_progress", "completed"])
      });
      
      const validatedData = statusSchema.safeParse(req.body);
      
      if (!validatedData.success) {
        const errorMessage = fromZodError(validatedData.error).message;
        return res.status(400).json({ message: errorMessage });
      }
      
      const { status } = validatedData.data;
      
      const updatedDeal = await storage.updateDealStatus(id, status as DealStatus, "system");
      if (!updatedDeal) {
        return res.status(404).json({ message: "Deal not found" });
      }
      
      res.status(200).json(updatedDeal);
    } catch (error) {
      console.error("Error updating deal status:", error);
      
      // Attempt to get the deal from storage anyway
      // This allows the app to continue working even if the Airtable operation fails
      try {
        const deal = await storage.getDeal(parseInt(req.params.id));
        if (deal) {
          console.log("Retrieved deal after update error. Returning cached version.");
          return res.json({
            ...deal,
            status: req.body.status,
            updatedAt: new Date()
          });
        }
      } catch (fallbackError) {
        console.error("Error in fallback operation:", fallbackError);
      }
      
      res.status(500).json({ message: "Failed to update deal status" });
    }
  });
  
  // Deal scoping requests endpoints
  router.get("/deal-scoping-requests", async (req: Request, res: Response) => {
    try {
      const filters = req.query.status ? { status: req.query.status as string } : undefined;
      const requests = await storage.getDealScopingRequests(filters);
      res.json(requests);
    } catch (error) {
      console.error("Error fetching deal scoping requests:", error);
      // Return an empty array instead of an error to make the client-side handling easier
      res.json([]);
    }
  });

  router.get("/deal-scoping-requests/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const request = await storage.getDealScopingRequest(id);
      
      if (!request) {
        return res.status(404).json({ error: "Deal scoping request not found" });
      }
      
      res.json(request);
    } catch (error) {
      console.error("Error fetching deal scoping request:", error);
      res.status(500).json({ error: "Failed to fetch deal scoping request" });
    }
  });

  router.post("/deal-scoping-requests", async (req: Request, res: Response) => {
    try {
      console.log("Creating deal scoping request with data:", JSON.stringify(req.body, null, 2));
      
      // Check if requestTitle is present
      if (!req.body.requestTitle) {
        console.log("Adding default requestTitle");
        req.body.requestTitle = "Deal Scoping Request";
      }
      
      // Set default status if not provided
      if (!req.body.status) {
        req.body.status = "pending";
      }
      
      const request = await storage.createDealScopingRequest(req.body);
      console.log("Created deal scoping request:", JSON.stringify(request, null, 2));
      res.status(201).json(request);
    } catch (error) {
      console.error("Error creating deal scoping request:", error);
      // Log more details about the error
      if (error instanceof Error) {
        console.error("Error message:", error.message);
        console.error("Error stack:", error.stack);
      }
      res.status(500).json({ error: "Failed to create deal scoping request" });
    }
  });

  // Conversion endpoint for scoping requests to deals
  router.post("/deal-scoping-requests/:id/convert", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid scoping request ID" });
      }

      const scopingRequest = await storage.getDealScopingRequest(id);
      if (!scopingRequest) {
        return res.status(404).json({ message: "Scoping request not found" });
      }

      // Convert scoping request to deal
      const dealData = {
        dealName: scopingRequest.requestTitle || "Converted Deal",
        dealType: scopingRequest.dealType || "grow",
        salesChannel: scopingRequest.salesChannel,
        region: scopingRequest.region,
        advertiserName: scopingRequest.advertiserName,
        agencyName: scopingRequest.agencyName,
        dealStructure: scopingRequest.dealStructure || "flat_commit",
        growthAmbition: scopingRequest.growthAmbition,
        growthOpportunityMIQ: scopingRequest.growthOpportunityMIQ,
        growthOpportunityClient: scopingRequest.growthOpportunityClient,
        clientAsks: scopingRequest.clientAsks,
        termStartDate: scopingRequest.termStartDate,
        termEndDate: scopingRequest.termEndDate,
        contractTermMonths: scopingRequest.contractTermMonths,
        status: "submitted" as const,
        email: scopingRequest.email
      };

      // Generate reference number
      const year = new Date().getFullYear();
      const allDeals = await storage.getDeals();
      const nextSequence = allDeals.length + 1;
      const referenceNumber = `DEAL-${year}-${String(nextSequence).padStart(3, '0')}`;

      const newDeal = await storage.createDeal(dealData, referenceNumber);

      res.status(201).json({ 
        deal: newDeal,
        dealId: newDeal.id,
        message: "Scoping request converted to deal successfully" 
      });
    } catch (error) {
      console.error("Error converting scoping request to deal:", error);
      res.status(500).json({ message: "Failed to convert scoping request" });
    }
  });

  router.patch("/deal-scoping-requests/:id/status", async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    const { status } = req.body;
    
    if (!status) {
      return res.status(400).json({ error: "Status is required" });
    }

    try {
      const request = await storage.updateDealScopingRequestStatus(id, status);
      
      if (!request) {
        return res.status(404).json({ error: "Deal scoping request not found" });
      }
      
      res.json(request);
    } catch (error) {
      console.error("Error updating deal scoping request status:", error);
      res.status(500).json({ error: "Failed to update deal scoping request status" });
    }
  });

  // Advertisers endpoints
  router.get("/advertisers", async (req: Request, res: Response) => {
    try {
      const advertisers = await storage.getAdvertisers();
      res.status(200).json(advertisers);
    } catch (error) {
      console.error("Error fetching advertisers:", error);
      res.status(500).json({ message: "Failed to fetch advertisers" });
    }
  });

  // Agencies endpoints
  router.get("/agencies", async (req: Request, res: Response) => {
    try {
      const type = req.query.type as string | undefined;
      const filters = type ? { type } : undefined;
      const agencies = await storage.getAgencies(filters);
      res.status(200).json(agencies);
    } catch (error) {
      console.error("Error fetching agencies:", error);
      res.status(500).json({ message: "Failed to fetch agencies" });
    }
  });
  
  // Incentive values endpoints
  router.get("/deals/:dealId/incentives", async (req: Request, res: Response) => {
    try {
      const dealId = parseInt(req.params.dealId);
      if (isNaN(dealId)) {
        return res.status(400).json({ message: "Invalid deal ID" });
      }
      
      const incentives = await storage.getIncentiveValues(dealId);
      res.status(200).json(incentives);
    } catch (error) {
      console.error("Error fetching incentives:", error);
      res.status(500).json({ message: "Failed to fetch incentives" });
    }
  });
  
  router.post("/deals/:dealId/incentives", async (req: Request, res: Response) => {
    try {
      const dealId = parseInt(req.params.dealId);
      if (isNaN(dealId)) {
        return res.status(400).json({ message: "Invalid deal ID" });
      }
      
      const deal = await storage.getDeal(dealId);
      if (!deal) {
        return res.status(404).json({ message: "Deal not found" });
      }
      
      const incentiveData = {
        ...req.body,
        dealId
      };
      
      const incentive = await storage.createIncentiveValue(incentiveData);
      res.status(201).json(incentive);
    } catch (error) {
      console.error("Error creating incentive:", error);
      res.status(500).json({ message: "Failed to create incentive" });
    }
  });
  
  router.patch("/deals/:dealId/incentives/:id", async (req: Request, res: Response) => {
    try {
      const dealId = parseInt(req.params.dealId);
      const id = parseInt(req.params.id);
      
      if (isNaN(dealId) || isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID" });
      }
      
      const incentive = await storage.updateIncentiveValue(id, req.body);
      if (!incentive) {
        return res.status(404).json({ message: "Incentive value not found" });
      }
      
      res.status(200).json(incentive);
    } catch (error) {
      console.error("Error updating incentive:", error);
      res.status(500).json({ message: "Failed to update incentive" });
    }
  });
  
  router.delete("/deals/:dealId/incentives/:id", async (req: Request, res: Response) => {
    try {
      const dealId = parseInt(req.params.dealId);
      const id = parseInt(req.params.id);
      
      if (isNaN(dealId) || isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID" });
      }
      
      const success = await storage.deleteIncentiveValue(id);
      if (!success) {
        return res.status(404).json({ message: "Incentive value not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting incentive:", error);
      res.status(500).json({ message: "Failed to delete incentive" });
    }
  });

  // Claude AI endpoints
  router.post("/ai/analyze-deal", async (req: Request, res: Response) => {
    try {
      const dealData = req.body;
      const analysis = await analyzeDeal(dealData);
      res.status(200).json(analysis);
    } catch (error) {
      console.error("Error analyzing deal with Claude:", error);
      res.status(500).json({ 
        message: "Failed to analyze deal", 
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });
  
  router.post("/ai/deal-recommendations", async (req: Request, res: Response) => {
    try {
      const dealData = req.body;
      const recommendations = await getDealRecommendations(dealData);
      res.status(200).json(recommendations);
    } catch (error) {
      console.error("Error getting deal recommendations with Claude:", error);
      res.status(500).json({ 
        message: "Failed to get deal recommendations", 
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });
  
  router.post("/ai/market-analysis", async (req: Request, res: Response) => {
    try {
      const dealData = req.body;
      const marketAnalysis = await getMarketAnalysis(dealData);
      res.status(200).json(marketAnalysis);
    } catch (error) {
      console.error("Error getting market analysis with Claude:", error);
      res.status(500).json({ 
        message: "Failed to get market analysis", 
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });
  
  router.post("/ai/query", async (req: Request, res: Response) => {
    try {
      const { query, systemPrompt } = req.body;
      
      if (!query) {
        return res.status(400).json({ message: "Query is required" });
      }
      
      const response = await generateStructuredResponse(query, systemPrompt);
      res.status(200).json(response);
    } catch (error) {
      console.error("Error querying Claude:", error);
      res.status(500).json({ 
        message: "Failed to query Claude", 
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Phase 7B: User management and role-based routes
  router.get("/users", async (req: Request, res: Response) => {
    try {
      const role = req.query.role as string | undefined;
      let users: any[] = [];
      
      if (role) {
        users = await storage.getUsersByRole(role);
      } else {
        // For now, return all users (in production, add proper auth check)
        users = [];
      }
      
      res.status(200).json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  router.get("/users/current", async (req: Request, res: Response) => {
    try {
      // Phase 7B: Mock current user with role switching support
      // Check for role override in query params (for demo role switching)
      const demoRole = req.query.role as string || "seller";
      
      const roleConfigs = {
        seller: {
          id: 1,
          username: "demo_seller",
          email: "seller@company.com",
          role: "seller",
          firstName: "John",
          lastName: "Seller",
          department: "Sales"
        },
        approver: {
          id: 2,
          username: "demo_approver", 
          email: "approver@company.com",
          role: "approver",
          firstName: "Sarah",
          lastName: "Chen",
          department: "Revenue Operations"
        },
        legal: {
          id: 3,
          username: "demo_legal",
          email: "legal@company.com",
          role: "legal",
          firstName: "Mike",
          lastName: "Johnson",
          department: "Legal"
        },
        admin: {
          id: 4,
          username: "demo_admin",
          email: "admin@company.com",
          role: "admin",
          firstName: "Alex",
          lastName: "Administrator",
          department: "IT & Operations"
        }
      };
      
      // Return the requested role or default to seller
      const selectedRole = ["seller", "approver", "legal", "admin"].includes(demoRole) ? demoRole : "seller";
      res.status(200).json(roleConfigs[selectedRole as keyof typeof roleConfigs]);
    } catch (error) {
      console.error("Error fetching current user:", error);
      res.status(500).json({ message: "Failed to fetch current user" });
    }
  });

  router.put("/users/:id/role", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const { role } = req.body;
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      if (!role || !["seller", "approver", "legal", "admin"].includes(role)) {
        return res.status(400).json({ message: "Invalid role" });
      }
      
      const user = await storage.updateUserRole(id, role);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.status(200).json(user);
    } catch (error) {
      console.error("Error updating user role:", error);
      res.status(500).json({ message: "Failed to update user role" });
    }
  });

  // Phase 7B: Enhanced deal status route with role-based permissions
  router.get("/deals/:id/allowed-transitions", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid deal ID" });
      }
      
      const deal = await storage.getDeal(id);
      if (!deal) {
        return res.status(404).json({ message: "Deal not found" });
      }
      
      // Get current user role (mock for now)
      const currentUser = getCurrentUser();
      const allowedTransitions = getAllowedTransitions(currentUser.role, deal.status as DealStatus);
      
      res.status(200).json({ allowedTransitions });
    } catch (error) {
      console.error("Error fetching allowed transitions:", error);
      res.status(500).json({ message: "Failed to fetch allowed transitions" });
    }
  });

  // Initialize and register chatbot routes
  const chatStorage = new ChatMemStorage();
  registerChatbotRoutes(app, {
    basePath: '/api',
    storage: chatStorage,
    welcomeMessage: "Hi there! I'm your Deal Assistant. How can I help you with deals and incentives today?"
  });

  const httpServer = createServer(app);
  return httpServer;
}
