import express, { type Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertDealSchema, 
  insertDealScopingRequestSchema,
  insertDealApprovalSchema,
  insertApprovalActionSchema,
  insertApprovalDepartmentSchema,
  DEAL_STATUSES,
  DEAL_STATUS_LABELS,
  type DealStatus,
  type UserRole,
  type DepartmentType,
  type DealApproval,
  type InsertDealApproval,
  type ApprovalAction,
  type InsertApprovalAction,
  insertUserSchema
} from "@shared/schema";
import { fromZodError } from "zod-validation-error";
import { getCurrentUser, hasPermission, canTransitionToStatus, getAllowedTransitions } from "@shared/auth";
import { z } from "zod";
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

// Workflow Automation Helper Function - Type-safe version
interface WorkflowStorage {
  getDealApprovals(dealId: number): Promise<DealApproval[]>;
  getDeal(dealId: number): Promise<any>;
  updateDealStatus(id: number, status: DealStatus, changedBy: string, comments?: string): Promise<any>;
}

async function checkAndUpdateDealStatus(dealId: number, storage: WorkflowStorage): Promise<void> {
  try {
    const approvals = await storage.getDealApprovals(dealId);
    const deal = await storage.getDeal(dealId);
    
    if (!deal || !approvals.length) return;

    // Check completion status
    const allApproved = approvals.every((a: DealApproval) => a.status === 'approved');
    // Simplified system: no rejected status, use revision_requested instead

    let newStatus = deal.status;
    
    const anyRevisionRequested = approvals.some((a: DealApproval) => a.status === 'revision_requested');
    
    if (anyRevisionRequested) {
      // Keep deal in under_review status when departments need revisions
    } else if (allApproved) {
      newStatus = 'approved';
    } else {
      // Check stage progression for intermediate statuses
      const stages = Array.from(new Set(approvals.map((a: DealApproval) => a.approvalStage))).sort();
      const completedStages = stages.filter((stage: number) => 
        approvals.filter((a: DealApproval) => a.approvalStage === stage)
          .every((a: DealApproval) => a.status === 'approved')
      );
      
      if (completedStages.length === 0) {
        newStatus = 'under_review';
      } else if (completedStages.includes(2) && !completedStages.includes(3)) {
        newStatus = 'negotiating';
      } else if (completedStages.includes(3)) {
        newStatus = 'contract_drafting';
      }
    }

    // Update deal status if changed
    if (newStatus !== deal.status) {
      await storage.updateDealStatus(
        dealId, 
        newStatus as DealStatus, 
        'System Automation',
        `Status auto-updated based on approval workflow progress`
      );
        console.log(`✅ Deal ${dealId} status auto-updated: ${deal.status} → ${newStatus}`);
      
      // Send notifications for status change
      await sendStatusChangeNotification(dealId, deal.status, newStatus, storage);
    }
  } catch (error) {
    console.error(`Error in workflow automation for deal ${dealId}:`, error);
  }
}

// Notification System Helper Function - Type-safe version
interface NotificationStorage extends WorkflowStorage {
  getDeal(dealId: number): Promise<any>;
}

async function sendStatusChangeNotification(dealId: number, oldStatus: string, newStatus: string, storage: NotificationStorage): Promise<any[]> {
  try {
    const deal = await storage.getDeal(dealId);
    const approvals = await storage.getDealApprovals(dealId);
    
    // Get all relevant stakeholders
    const notifications: any[] = [];
    
    // Notify deal creator
    if (deal?.createdBy) {
      notifications.push({
        userId: deal.createdBy,
        type: 'deal_status_change',
        title: `Deal Status Updated`,
        message: `Your deal "${deal.dealName}" status changed from ${oldStatus} to ${newStatus}`,
        dealId: dealId,
        priority: newStatus === 'approved' ? 'high' : 'normal'
      });
    }
    
    // Notify pending reviewers
    const pendingApprovals = approvals.filter((a: DealApproval) => a.status === 'pending');
    for (const approval of pendingApprovals) {
      if (approval.assignedTo) {
        notifications.push({
          userId: approval.assignedTo,
          type: 'approval_assignment',
          title: `New Approval Required`,
          message: `Deal "${deal.dealName}" requires your review (${approval.department} department)`,
          dealId: dealId,
          approvalId: approval.id,
          priority: approval.priority || 'normal'
        });
      }
    }
    
    // Log notifications (in production, these would be sent via email/push/webhook)
    for (const notification of notifications) {
      console.log(`📧 NOTIFICATION: [${notification.type}] ${notification.title} → User ${notification.userId}`);
      console.log(`   Message: ${notification.message}`);
    }
    
    return notifications;
  } catch (error) {
    console.error(`Error sending notifications for deal ${dealId}:`, error);
    return [];
  }
}

// Approval Assignment Notification Helper - Type-safe version
async function sendApprovalAssignmentNotifications(dealId: number, approvals: DealApproval[], storage: NotificationStorage): Promise<void> {
  try {
    const deal = await storage.getDeal(dealId);
    
    for (const approval of approvals) {
      console.log(`📬 APPROVAL ASSIGNMENT: Deal "${deal.dealName}" assigned for ${approval.department} department review`);
      console.log(`   Stage: ${approval.approvalStage}, Priority: ${approval.priority}, Due: ${approval.dueDate}`);
    }
  } catch (error) {
    console.error(`Error sending approval assignment notifications:`, error);
  }
}
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
      const flowIntelligence = req.query.filter as string | undefined;
      const filters = status ? { status } : undefined;
      let deals = await storage.getDeals(filters);
      
      // Filter by flow intelligence if requested
      if (flowIntelligence && ['needs_attention', 'on_track'].includes(flowIntelligence)) {
        deals = deals.filter(deal => deal.flowIntelligence === flowIntelligence);
      }
      
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
      
      // Validate performedBy
      if (!changedBy || typeof changedBy !== 'string') {
        return res.status(400).json({ message: "performedBy is required" });
      }
      
      const updatedDeal = await storage.updateDealStatus(id, status as DealStatus, getCurrentUser().id.toString(), comments);
      
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
      
      // Get all history data
      const [statusHistory, approvals] = await Promise.all([
        storage.getDealStatusHistory(id),
        storage.getDealApprovals(id)
      ]);
      
      // Get unique user IDs from status history and approvals
      const userIds = new Set<number>();
      statusHistory.forEach(h => h.performedBy && userIds.add(h.performedBy));
      approvals.forEach(a => a.assignedTo && userIds.add(a.assignedTo));
      
      // Get user information for those IDs
      const users = await Promise.all(
        Array.from(userIds).map(async (userId) => {
          const user = await storage.getUser(userId);
          return user;
        })
      );
      
      const validUsers = users.filter(Boolean);
      
      // Get all approval actions for the deal's approvals
      const approvalActions = await Promise.all(
        approvals.map(approval => storage.getApprovalActions(approval.id))
      );
      const allApprovalActions = approvalActions.flat();
      
      // Create a map of user IDs to names for quick lookup
      const userMap = new Map(validUsers.map(user => [user!.id, `${user!.firstName || ''} ${user!.lastName || ''}`.trim() || user!.username]));
      
      // Transform data into timeline events
      const events: any[] = [];
      
      // Add status change events
      statusHistory.forEach(history => {
        const actor = history.performedBy ? userMap.get(history.performedBy) : undefined;
        const statusLabels: Record<string, string> = {
          'draft': 'Draft Created',
          'scoping': 'Scoping Phase Started', 
          'submitted': 'Deal Submitted',
          'under_review': 'Review Process Started',
          'negotiating': 'Negotiations Started',
          'approved': 'Deal Approved',
          'contract_drafting': 'Contract Drafting',
          'client_review': 'Client Review Phase',
          'signed': 'Contract Signed',
          'lost': 'Deal Lost'
        };
        
        events.push({
          id: `status_${history.id}`,
          type: 'status_change',
          title: statusLabels[history.status] || `Status: ${history.status}`,
          description: history.comments || undefined,
          timestamp: history.changedAt,
          actor,
          status: history.status === 'approved' ? 'completed' :
                  history.status === 'lost' ? 'attention' :
                  history.status === 'under_review' ? 'pending' : undefined
        });
      });
      
      // Add approval milestone events
      approvals.forEach(approval => {
        // Add completion events for approved/revision_requested approvals
        if (approval.status === 'approved' && approval.completedAt) {
          const actor = approval.assignedTo ? userMap.get(approval.assignedTo) : undefined;
          events.push({
            id: `approval_${approval.id}`,
            type: 'department_approval',
            title: `${approval.department.charAt(0).toUpperCase() + approval.department.slice(1)} Department Approved`,
            description: approval.comments || undefined,
            timestamp: approval.completedAt,
            actor,
            status: 'completed',
            department: approval.department
          });
        } else if (approval.status === 'revision_requested') {
          const actor = approval.assignedTo ? userMap.get(approval.assignedTo) : undefined;
          events.push({
            id: `revision_${approval.id}`,
            type: 'approval_action', 
            title: `${approval.department.charAt(0).toUpperCase() + approval.department.slice(1)} Requested Revision`,
            description: approval.revisionReason || approval.comments || undefined,
            timestamp: approval.completedAt || new Date().toISOString(),
            actor,
            status: 'revision',
            department: approval.department
          });
        }
      });
      
      // Add significant approval actions
      allApprovalActions.forEach(action => {
        if (['approve', 'request_revision'].includes(action.actionType)) {
          const approval = approvals.find(a => a.id === action.approvalId);
          const actor = userMap.get(action.performedBy);
          const department = approval?.department;
          
          if (action.actionType === 'approve') {
            events.push({
              id: `action_approve_${action.id}`,
              type: 'approval_action',
              title: `${department ? department.charAt(0).toUpperCase() + department.slice(1) + ' ' : ''}Approval Completed`,
              description: action.comments || undefined,
              timestamp: action.createdAt,
              actor,
              status: 'completed',
              department
            });
          } else if (action.actionType === 'request_revision') {
            events.push({
              id: `action_revision_${action.id}`,
              type: 'approval_action',
              title: `${department ? department.charAt(0).toUpperCase() + department.slice(1) + ' ' : ''}Revision Requested`,
              description: action.comments || undefined,
              timestamp: action.createdAt,
              actor,
              status: 'revision',
              department
            });
          }
        }
      });
      
      // Sort events by timestamp (newest first) and remove duplicates
      const uniqueEvents = events.filter((event, index, self) => 
        index === self.findIndex(e => e.title === event.title && e.timestamp === event.timestamp)
      );
      
      const sortedEvents = uniqueEvents.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
      
      res.status(200).json(sortedEvents);
    } catch (error) {
      console.error("Error fetching deal history:", error);
      res.status(500).json({ message: "Failed to fetch deal history" });
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
        status: deal.status as DealStatus, // Keep current status
        previousStatus: deal.status,
        performedBy: getCurrentUser().id,
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

  // Scoping deal conversion endpoint
  router.post("/deals/:id/convert-to-deal", async (req: Request, res: Response) => {
    try {
      const scopingId = parseInt(req.params.id);
      
      if (isNaN(scopingId)) {
        return res.status(400).json({ message: "Invalid deal ID" });
      }
      
      const scopingDeal = await storage.getDeal(scopingId);
      if (!scopingDeal) {
        return res.status(404).json({ message: "Scoping deal not found" });
      }
      
      if (scopingDeal.status !== "scoping") {
        return res.status(400).json({ message: "Deal is not a scoping request" });
      }
      
      // Check if already converted
      if (scopingDeal.convertedDealId || scopingDeal.convertedAt) {
        return res.status(400).json({ message: "Scoping deal has already been converted" });
      }
      
      // Mark the scoping deal as converted (but keep status as scoping for now)
      const updatedScopingDeal = await storage.updateDeal(scopingId, {
        convertedAt: new Date().toISOString()
        // Keep status as "scoping" - will be filtered out by convertedAt check
      });
      
      res.status(200).json({
        message: "Scoping deal marked as converted",
        scopingDeal: updatedScopingDeal,
        scopingId
      });
    } catch (error) {
      console.error("Error converting scoping deal:", error);
      res.status(500).json({ message: "Failed to convert scoping deal" });
    }
  });

  // Draft management endpoints  
  router.post("/deals/drafts", async (req: Request, res: Response) => {
    try {
      const { name, description, formData, draftId, sourceScopingId } = req.body;
      
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
          const currentUser = getCurrentUser(); // Get current user context
          
          // Filter out scoping-specific fields that don't belong in deal submission drafts
          const {
            growthAmbition, // Remove scoping-only field
            convertedDealId, // Remove scoping metadata
            convertedAt, // Remove scoping metadata
            ...cleanFormData
          } = formData;
          
          const updatedDraftData = {
            ...cleanFormData,
            dealName: name,
            businessSummary: description || formData.businessSummary || "",
            dealStructure: formData.dealStructure || "tiered",
            dealType: formData.dealType || "grow",
            region: formData.region || "west",
            salesChannel: formData.salesChannel || "client_direct",
            advertiserName: formData.advertiserName || "",
            email: currentUser.email, // Ensure email is set for draft updates too
            termStartDate: formData.termStartDate || new Date().toISOString().split('T')[0],
            termEndDate: formData.termEndDate || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            annualRevenue: formData.annualRevenue && Number(formData.annualRevenue) > 0 ? Number(formData.annualRevenue) : 1,
            annualGrossMargin: formData.annualGrossMargin && Number(formData.annualGrossMargin) >= 0 ? Number(formData.annualGrossMargin) : 0,
            status: "draft" as const,
            isDraft: true,
            draftType: "submission_draft",
            updatedAt: new Date()
          };

          // Explicitly remove any remaining scoping fields that might have slipped through
          delete updatedDraftData.growthAmbition;
          delete updatedDraftData.convertedDealId;
          delete updatedDraftData.convertedAt;

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
                categoryName: tier.categoryName,
                subCategoryName: tier.subCategoryName,
                incentiveOption: tier.incentiveOption,
                incentiveValue: tier.incentiveValue,
                incentiveNotes: tier.incentiveNotes || ""
              });
            }
          }

          return res.status(200).json(updatedDraft);
        }
      }

      // Create new draft if no existing draft ID or draft not found
      const currentUser = getCurrentUser(); // Get current user context
      
      // Filter out scoping-specific fields that don't belong in deal submission drafts
      const {
        growthAmbition, // Remove scoping-only field
        convertedDealId, // Remove scoping metadata
        convertedAt, // Remove scoping metadata
        ...cleanFormData
      } = formData;
      
      const draftDeal = {
        ...cleanFormData,
        dealName: name,
        businessSummary: description || formData.businessSummary || "",
        dealStructure: formData.dealStructure || "tiered",
        dealType: formData.dealType || "grow",
        region: formData.region || "west",
        salesChannel: formData.salesChannel || "client_direct",
        advertiserName: formData.advertiserName || "",
        email: currentUser.email, // Associate draft with current user
        termStartDate: formData.termStartDate || new Date().toISOString().split('T')[0],
        termEndDate: formData.termEndDate || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        // For drafts, provide default values for required fields to avoid validation errors
        annualRevenue: formData.annualRevenue && Number(formData.annualRevenue) > 0 ? Number(formData.annualRevenue) : 1, // Default to 1 to pass positive validation
        annualGrossMargin: formData.annualGrossMargin && Number(formData.annualGrossMargin) >= 0 ? Number(formData.annualGrossMargin) : 0, // Allow 0 for margins
        status: "draft" as const,
        isDraft: true,
        draftType: "submission_draft"
      };

      // Explicitly remove any remaining scoping fields that might have slipped through
      delete draftDeal.growthAmbition;
      delete draftDeal.convertedDealId;
      delete draftDeal.convertedAt;

      // Debug log to confirm growthAmbition is not in the final object
      console.log("Draft data after filtering - contains growthAmbition?", 'growthAmbition' in draftDeal);
      console.log("Draft keys:", Object.keys(draftDeal).filter(key => key.includes('growth')));

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

      // If this draft came from a scoping conversion, link them together
      if (sourceScopingId && !isNaN(parseInt(sourceScopingId))) {
        try {
          await storage.updateDeal(parseInt(sourceScopingId), {
            convertedDealId: savedDraft.id
          });
        } catch (error) {
          console.warn('Could not link scoping deal to draft:', error);
          // Don't fail the draft creation if linking fails
        }
      }

      // Save tier data separately if provided
      if (formData.dealTiers && Array.isArray(formData.dealTiers) && formData.dealTiers.length > 0) {
        // Save new tier data for the new draft
        for (const tier of formData.dealTiers) {
          await storage.createDealTier({
            dealId: savedDraft.id,
            tierNumber: tier.tierNumber,
            annualRevenue: tier.annualRevenue,
            annualGrossMargin: tier.annualGrossMargin,
            categoryName: tier.categoryName,
            subCategoryName: tier.subCategoryName,
            incentiveOption: tier.incentiveOption,
            incentiveValue: tier.incentiveValue,
            incentiveNotes: tier.incentiveNotes || ""
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
        // submittedAt field removed as it's not in the schema
        revisionCount: (deal.revisionCount || 0) + 1,
        // lastResubmittedAt removed - use lastRevisedAt instead
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
  
  // TEST ENDPOINT: Create deal with short delay for demo purposes
  router.post("/deals/test-auto-transition", async (req: Request, res: Response) => {
    try {
      // Extract dealTiers from request body if present
      const { dealTiers, ...reqData } = req.body;
      
      // Validate the deal data against the schema
      const validatedData = insertDealSchema.safeParse(reqData);
      
      if (!validatedData.success) {
        const errorMessage = fromZodError(validatedData.error).message;
        return res.status(400).json({ message: errorMessage });
      }
      
      // Force status to submitted for testing
      const dealData = { ...validatedData.data, status: 'submitted' as any };
      
      // Generate a unique reference number
      const year = new Date().getFullYear();
      const allDeals = await storage.getDeals();
      const nextSequence = allDeals.length + 1;
      const referenceNumber = `TEST-${year}-${String(nextSequence).padStart(3, '0')}`;
      
      // Create deal with short delay (2 minutes instead of 2 hours)
      const newDeal = await storage.createTestDealWithShortDelay(dealData);
      
      res.status(201).json({ 
        deal: newDeal,
        message: "Test deal created - will auto-transition to under_review in 2 minutes",
        note: "This is a testing endpoint with accelerated timing"
      });
    } catch (error) {
      console.error("Error creating test deal:", error);
      res.status(500).json({ message: "Failed to create test deal" });
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

      // Convert scoping request to deal with all required fields
      const dealData = {
        dealName: scopingRequest.requestTitle || "Converted Deal",
        dealType: (scopingRequest.dealType as "grow" | "protect" | "custom") || "grow",
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
        email: scopingRequest.email,
        // Required fields with default values
        isRevision: false,
        hasTradeAMImplications: false,
        yearlyRevenueGrowthRate: 0,
        forecastedMargin: 0,
        yearlyMarginGrowthRate: 0,
        addedValueBenefitsCost: 0,
        analyticsTier: "silver",
        requiresCustomMarketing: false
      };

      // Generate reference number
      const year = new Date().getFullYear();
      const allDeals = await storage.getDeals();
      const nextSequence = allDeals.length + 1;
      const referenceNumber = `DEAL-${year}-${String(nextSequence).padStart(3, '0')}`;

      const newDeal = await storage.createDeal({
        ...dealData,
        salesChannel: dealData.salesChannel as "holding_company" | "independent_agency" | "client_direct",
        region: dealData.region as "northeast" | "midwest" | "midatlantic" | "west" | "south"
      }, referenceNumber);

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
      const role = (req.query.role as string) || 'seller';
      const department = req.query.department as string;
      const currentUser = getCurrentUser(role, department);
      res.status(200).json(currentUser);
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

  // ============================================================================
  // MULTI-LAYERED APPROVAL SYSTEM ENDPOINTS
  // ============================================================================

  // Get all approvals for a specific deal
  router.get("/deals/:dealId/approvals", async (req: Request, res: Response) => {
    try {
      const dealId = parseInt(req.params.dealId);
      
      if (isNaN(dealId)) {
        return res.status(400).json({ message: "Invalid deal ID" });
      }

      const approvals = await storage.getDealApprovals(dealId);
      
      // Enhance approvals with action history
      const approvalsWithActions = await Promise.all(
        approvals.map(async (approval) => {
          const actions = await storage.getApprovalActions(approval.id);
          return {
            ...approval,
            actions
          };
        })
      );

      res.status(200).json(approvalsWithActions);
    } catch (error) {
      console.error("Error fetching deal approvals:", error);
      res.status(500).json({ message: "Failed to fetch deal approvals" });
    }
  });

  // Create a new approval requirement for a deal
  router.post("/deals/:dealId/approvals", async (req: Request, res: Response) => {
    try {
      const dealId = parseInt(req.params.dealId);
      
      if (isNaN(dealId)) {
        return res.status(400).json({ message: "Invalid deal ID" });
      }

      // Validate request body using Zod schema
      const validationResult = insertDealApprovalSchema.safeParse({
        ...req.body,
        dealId
      });

      if (!validationResult.success) {
        return res.status(400).json({
          message: "Invalid approval data",
          errors: fromZodError(validationResult.error).toString()
        });
      }

      const approval = await storage.createDealApproval(validationResult.data);
      res.status(201).json(approval);
    } catch (error) {
      console.error("Error creating deal approval:", error);
      res.status(500).json({ message: "Failed to create deal approval" });
    }
  });

  // Update an approval status (approve/reject/request revision)
  router.patch("/deals/:dealId/approvals/:approvalId", async (req: Request, res: Response) => {
    try {
      const dealId = parseInt(req.params.dealId);
      const approvalId = parseInt(req.params.approvalId);
      
      if (isNaN(dealId) || isNaN(approvalId)) {
        return res.status(400).json({ message: "Invalid ID" });
      }

      const { status, comments } = req.body;

      // Validate status
      if (!["pending", "approved", "revision_requested"].includes(status)) {
        return res.status(400).json({ message: "Invalid approval status" });
      }

      // Update the approval - remove reviewedBy field (not in schema)
      const updatedApproval = await storage.updateDealApproval(approvalId, {
        status,
        comments
      });

      if (!updatedApproval) {
        return res.status(404).json({ message: "Approval not found" });
      }

      // Create an action record for this approval decision
      const currentUser = getCurrentUser();
      await storage.createApprovalAction({
        approvalId,
        actionType: status === 'approved' ? 'approve' : 
                   'request_revision',
        performedBy: currentUser.id,
        comments: comments || null
      });

      // AUTO-TRIGGER WORKFLOW AUTOMATION: Check if deal status should be updated
      if (status === 'approved') {
        await checkAndUpdateDealStatus(dealId, storage);
      }

      res.status(200).json(updatedApproval);
    } catch (error) {
      console.error("Error updating approval:", error);
      res.status(500).json({ message: "Failed to update approval" });
    }
  });

  // Get all approval departments
  router.get("/approval-departments", async (req: Request, res: Response) => {
    try {
      const departments = await storage.getApprovalDepartments();
      res.status(200).json(departments);
    } catch (error) {
      console.error("Error fetching approval departments:", error);
      res.status(500).json({ message: "Failed to fetch approval departments" });
    }
  });

  // Get specific approval department
  router.get("/approval-departments/:departmentName", async (req: Request, res: Response) => {
    try {
      const departmentName = req.params.departmentName as DepartmentType;
      
      if (!["finance", "trading", "creative", "marketing", "product", "solutions"].includes(departmentName)) {
        return res.status(400).json({ message: "Invalid department name" });
      }

      const department = await storage.getApprovalDepartment(departmentName);
      
      if (!department) {
        return res.status(404).json({ message: "Department not found" });
      }

      res.status(200).json(department);
    } catch (error) {
      console.error("Error fetching approval department:", error);
      res.status(500).json({ message: "Failed to fetch approval department" });
    }
  });

  // Enhanced Multi-Department Approval Workflow - ALL Departments Review
  router.post("/deals/:dealId/initiate-approval", async (req: Request, res: Response) => {
    try {
      const dealId = parseInt(req.params.dealId);
      
      if (isNaN(dealId)) {
        return res.status(400).json({ message: "Invalid deal ID" });
      }

      const { initiatedBy } = req.body;
      
      if (!initiatedBy) {
        return res.status(400).json({ message: "initiatedBy is required" });
      }

      const deal = await storage.getDeal(dealId);
      if (!deal) {
        return res.status(404).json({ message: "Deal not found" });
      }

      // Use enhanced workflow that includes ALL departments
      const result = await storage.initiateEnhancedApprovalWorkflow(dealId, initiatedBy);

      // Update deal status
      await storage.updateDealStatus(dealId, "under_review", `system_${initiatedBy}`, "Enhanced approval workflow initiated - all departments reviewing");

      res.status(201).json({
        message: "Enhanced approval workflow initiated successfully",
        ...result
      });
    } catch (error) {
      console.error("Error initiating approval workflow:", error);
      res.status(500).json({ message: "Failed to initiate approval workflow" });
    }
  });

  // Enhanced Approval Status Updates with Complex States
  router.patch("/approvals/:approvalId/status", async (req: Request, res: Response) => {
    try {
      const approvalId = parseInt(req.params.approvalId);
      const { status, reviewerNotes, revisionReason } = req.body;
      
      if (isNaN(approvalId)) {
        return res.status(400).json({ message: "Invalid approval ID" });
      }
      
      if (!["pending", "revision_requested", "approved"].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }
      
      const updatedApproval = await storage.updateApprovalStatus(approvalId, status, reviewerNotes, revisionReason);
      
      if (!updatedApproval) {
        return res.status(404).json({ message: "Approval not found" });
      }
      
      res.status(200).json({
        approval: updatedApproval,
        message: `Approval status updated to ${status}`
      });
    } catch (error) {
      console.error("Error updating approval status:", error);
      res.status(500).json({ message: "Failed to update approval status" });
    }
  });

  // Get complex deal approval state
  router.get("/deals/:dealId/approval-state", async (req: Request, res: Response) => {
    try {
      const dealId = parseInt(req.params.dealId);
      
      if (isNaN(dealId)) {
        return res.status(400).json({ message: "Invalid deal ID" });
      }
      
      const approvals = await storage.getDealApprovals(dealId);
      
      // Simplified approval state calculation
      const departmentApprovals = approvals.filter(a => a.approvalStage === 1);
      const businessApprovals = approvals.filter(a => a.approvalStage === 2);
      
      const allDepartmentsApproved = departmentApprovals.length > 0 && 
        departmentApprovals.every(a => a.status === 'approved');
      const anyDepartmentRevisions = departmentApprovals.some(a => a.status === 'revision_requested');
      const allBusinessApproved = businessApprovals.length > 0 && 
        businessApprovals.every(a => a.status === 'approved');
      
      let overallState = 'pending_department_review';
      if (allBusinessApproved) {
        overallState = 'fully_approved';
      } else if (allDepartmentsApproved) {
        overallState = 'pending_business_approval';  
      } else if (anyDepartmentRevisions) {
        overallState = 'revision_requested';
      }
      
      res.status(200).json({
        overallState,
        departmentApprovals: departmentApprovals.length,
        businessApprovals: businessApprovals.length,
        departmentsComplete: allDepartmentsApproved,
        revisionsRequested: anyDepartmentRevisions
      });
    } catch (error) {
      console.error("Error getting deal approval state:", error);
      res.status(500).json({ message: "Failed to get deal approval state" });
    }
  });

  // Get approval workflow status for a deal
  router.get("/deals/:dealId/approval-status", async (req: Request, res: Response) => {
    try {
      const dealId = parseInt(req.params.dealId);
      
      if (isNaN(dealId)) {
        return res.status(400).json({ message: "Invalid deal ID" });
      }

      const approvals = await storage.getDealApprovals(dealId);
      
      // Group approvals by stage
      const stageGroups = approvals.reduce((groups, approval) => {
        const stage = approval.approvalStage;
        if (!groups[stage]) groups[stage] = [];
        groups[stage].push(approval);
        return groups;
      }, {} as Record<number, typeof approvals>);

      // Calculate progress
      const totalApprovals = approvals.length;
      const completedApprovals = approvals.filter(a => 
        a.status === 'approved'
      ).length;
      const progressPercentage = totalApprovals > 0 
        ? Math.round((completedApprovals / totalApprovals) * 100)
        : 0;

      // Determine current stage
      let currentStage = 1;
      for (const stage of Object.keys(stageGroups).map(Number).sort()) {
        const stageApprovals = stageGroups[stage];
        const allStageComplete = stageApprovals.every(a => 
          a.status === 'approved'
        );
        if (!allStageComplete) {
          currentStage = stage;
          break;
        }
        currentStage = stage + 1;
      }

      res.status(200).json({
        dealId,
        approvals,
        stageGroups,
        currentStage,
        progressPercentage,
        isComplete: completedApprovals === totalApprovals,
        pendingApprovals: approvals.filter(a => a.status === 'pending'),
        blockedStages: Object.keys(stageGroups).map(Number).filter(stage => 
          stage > currentStage
        )
      });
    } catch (error) {
      console.error("Error fetching approval status:", error);
      res.status(500).json({ message: "Failed to fetch approval status" });
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
  // Universal Approval Queue - Role-Based Queues for All Users
  router.get("/approvals/pending", async (req: Request, res: Response) => {
    try {
      // Get current user context from query params
      const userRole = req.query.role as string || "seller";
      const userDepartment = req.query.department as string;
      const userId = req.query.userId ? parseInt(req.query.userId as string) : undefined;
      
      // For department reviewers, fetch actual pending approvals
      if (userRole === "department_reviewer" && userDepartment) {
        const pendingApprovals = await storage.getPendingApprovals(userRole, userId, userDepartment);
        
        // Enhanced approval data with deal information
        const approvalItems = await Promise.all(
          pendingApprovals.map(async (approval) => {
            const deal = await storage.getDeal(approval.dealId);
            return {
              id: approval.id,
              type: "department_approval",
              title: `Review Required: ${deal?.dealName || 'Unknown Deal'}`,
              description: `${approval.department} department review needed`,
              dealId: approval.dealId,
              dealName: deal?.dealName || 'Unknown Deal',
              priority: approval.priority,
              dueDate: approval.dueDate.toISOString(),
              status: approval.status,
              department: approval.department,
              actionRequired: "review_and_approve",
              isOverdue: new Date() > approval.dueDate
            };
          })
        );

        return res.status(200).json({
          items: approvalItems,
          queueType: "department_approvals",
          summary: `${userDepartment} department review queue`,
          metrics: {
            totalPending: approvalItems.length,
            urgentTasks: approvalItems.filter(item => item.priority === 'urgent').length,
            highPriorityTasks: approvalItems.filter(item => item.priority === 'high').length,
            overdueTasks: approvalItems.filter(item => item.isOverdue).length
          },
          userContext: {
            role: userRole,
            department: userDepartment,
            timestamp: new Date().toISOString()
          }
        });
      }

      // Fetch all deals to build role-specific queues for non-department users
      const allDeals = await storage.getDeals();
      
      // Role-specific queue generation
      const generateRoleQueue = (role: string, department?: string) => {
        switch (role) {
          case "seller":
            return {
              items: allDeals
                .filter(deal => 
                  deal.status === "revision_requested" || 
                  deal.status === "draft" ||
                  (deal.status === "submitted" && deal.createdBy === 1) // Mock seller ID
                )
                .map(deal => ({
                  id: deal.id,
                  type: "deal_action",
                  title: deal.status === "revision_requested" ? 
                    `Revision Required: ${deal.dealName}` : 
                    `Continue Working: ${deal.dealName}`,
                  description: deal.status === "revision_requested" ? 
                    deal.revisionReason || "Revision feedback received" :
                    "Complete deal submission or review progress",
                  dealId: deal.id,
                  dealName: deal.dealName,
                  clientName: deal.clientName,
                  priority: deal.status === "revision_requested" ? "urgent" : "normal",
                  dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
                  dealValue: deal.dealValue,
                  status: deal.status,
                  actionRequired: deal.status === "revision_requested" ? "address_revision" : "complete_submission",
                  isOverdue: false
                })),
              queueType: "seller_actions",
              summary: "Your active deals and revision requests"
            };
            
          case "approver":
            return {
              items: allDeals
                .filter(deal => 
                  deal.status === "negotiating" || 
                  deal.status === "pending_approval" ||
                  deal.status === "under_review"
                )
                .map(deal => ({
                  id: deal.id,
                  type: "business_approval",
                  title: `Business Approval: ${deal.dealName}`,
                  description: `Review deal terms and provide business approval decision`,
                  dealId: deal.id,
                  dealName: deal.dealName,
                  clientName: deal.clientName,
                  priority: deal.dealValue > 1000000 ? "high" : "normal",
                  dueDate: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
                  dealValue: deal.dealValue,
                  status: deal.status,
                  actionRequired: "business_approval",
                  stage: "Stage 2: Business Approval",
                  isOverdue: false
                })),
              queueType: "business_approvals",
              summary: "Deals pending your business approval"
            };
            
          case "department_reviewer":
            return {
              items: allDeals
                .filter(deal => 
                  deal.status === "submitted" || 
                  deal.status === "under_review"
                )
                .map(deal => ({
                  id: deal.id,
                  type: "technical_review",
                  title: `${department?.charAt(0).toUpperCase()}${department?.slice(1)} Review: ${deal.dealName}`,
                  description: department === 'legal' ? 
                    "Legal compliance review and contract validation" :
                    `Technical validation from ${department} perspective`,
                  dealId: deal.id,
                  dealName: deal.dealName,
                  clientName: deal.clientName,
                  priority: department === 'legal' ? "high" : "normal",
                  dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
                  dealValue: deal.dealValue,
                  status: deal.status,
                  actionRequired: "department_review",
                  stage: "Stage 1: Technical Review",
                  department: department,
                  reviewType: department === 'legal' ? 'legal_compliance' : 'technical_validation',
                  isOverdue: false
                })),
              queueType: "department_reviews",
              summary: `${department?.charAt(0).toUpperCase()}${department?.slice(1)} department reviews`
            };
            
          case "admin":
            const allItems = [
              ...allDeals
                .filter(deal => deal.status === "submitted")
                .map(deal => ({
                  id: deal.id,
                  type: "system_oversight",
                  title: `System Review: ${deal.dealName}`,
                  description: "Administrative oversight and system monitoring",
                  dealId: deal.id,
                  dealName: deal.dealName,
                  clientName: deal.clientName,
                  priority: "normal",
                  dueDate: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString(),
                  dealValue: deal.dealValue,
                  status: deal.status,
                  actionRequired: "system_review",
                  isOverdue: false
                }))
            ];
            
            return {
              items: allItems,
              queueType: "admin_oversight",
              summary: "System administration and oversight tasks"
            };
            
          default:
            return {
              items: [],
              queueType: "empty",
              summary: "No pending items"
            };
        }
      };
      
      const queueData = generateRoleQueue(userRole, userDepartment);
      
      // Calculate metrics
      const metrics = {
        totalPending: queueData.items.length,
        urgentTasks: queueData.items.filter(item => item.priority === "urgent").length,
        highPriorityTasks: queueData.items.filter(item => item.priority === "high").length,
        overdueTasks: queueData.items.filter(item => item.isOverdue).length,
        avgDealValue: queueData.items.length > 0 ? 
          queueData.items.reduce((sum, item) => sum + (item.dealValue || 0), 0) / queueData.items.length : 0,
        completedToday: Math.floor(Math.random() * 5), // Mock data
        currentLoad: Math.min(100, (queueData.items.length / 10) * 100) // Mock capacity calculation
      };
      
      res.status(200).json({
        ...queueData,
        metrics,
        userContext: {
          role: userRole,
          department: userDepartment,
          timestamp: new Date().toISOString()
        }
      });
      
    } catch (error) {
      console.error("Error fetching pending approvals:", error);
      res.status(500).json({ message: "Failed to fetch pending approvals" });
    }
  });

  // Department Queue Dashboard endpoints (Enhanced)
  router.get("/department-queue/:department", async (req: Request, res: Response) => {
    try {
      const { department } = req.params;
      
      // Enhanced queue data with real deal integration
      const allDeals = await storage.getDeals();
      const departmentDeals = allDeals.filter(deal => 
        deal.status === "submitted" || deal.status === "under_review"
      );
      
      const queueData = {
        items: departmentDeals.map((deal, index) => ({
          id: deal.id,
          dealId: deal.id,
          dealName: deal.dealName,
          clientName: deal.clientName,
          priority: department === 'legal' ? "high" : index % 3 === 0 ? "urgent" : "normal",
          dueDate: new Date(Date.now() + ((index + 1) * 12 * 60 * 60 * 1000)).toISOString(),
          createdAt: deal.createdAt,
          assignedTo: index + 1,
          assignedToName: `${department.charAt(0).toUpperCase()}${department.slice(1)} Reviewer`,
          dealValue: deal.dealValue,
          stage: 1,
          isOverdue: index > 5, // Mock some overdue items
          daysSinceCreated: Math.floor((Date.now() - new Date(deal.createdAt).getTime()) / (24 * 60 * 60 * 1000))
        })),
        metrics: {
          totalPending: departmentDeals.length,
          overdueTasks: Math.floor(departmentDeals.length * 0.2),
          avgProcessingTime: department === 'legal' ? 8.5 : 5.2,
          completedToday: Math.floor(Math.random() * 5),
          departmentCapacity: 20,
          currentLoad: Math.min(100, (departmentDeals.length / 15) * 100)
        }
      };
      
      res.json(queueData);
    } catch (error) {
      console.error("Error fetching department queue:", error);
      res.status(500).json({ message: "Failed to fetch department queue" });
    }
  });

  router.get("/department-workload-distribution", async (req: Request, res: Response) => {
    try {
      // Mock workload distribution data
      const mockDistribution = [
        {
          department: "trading",
          displayName: "Trading",
          pendingCount: 5,
          overdueCount: 1,
          avgProcessingTime: 4.5,
          loadPercentage: 62
        },
        {
          department: "finance",
          displayName: "Finance", 
          pendingCount: 8,
          overdueCount: 2,
          avgProcessingTime: 6.2,
          loadPercentage: 85
        },
        {
          department: "creative",
          displayName: "Creative",
          pendingCount: 3,
          overdueCount: 0,
          avgProcessingTime: 3.1,
          loadPercentage: 42
        },
        {
          department: "marketing",
          displayName: "Marketing",
          pendingCount: 6,
          overdueCount: 1,
          avgProcessingTime: 5.8,
          loadPercentage: 78
        }
      ];
      
      res.json(mockDistribution);
    } catch (error) {
      console.error("Error fetching workload distribution:", error);
      res.status(500).json({ message: "Failed to fetch workload distribution" });
    }
  });

  // SLA Monitoring endpoints
  router.get("/sla-metrics/:timeframe", async (req: Request, res: Response) => {
    try {
      const { timeframe } = req.params;
      
      // Mock SLA metrics - in production, calculate from actual data
      const mockMetrics = {
        totalApprovals: 156,
        onTimeCompletions: 142,
        overdueItems: 8,
        avgCompletionTime: 5.2,
        slaComplianceRate: 91.0,
        criticalBreaches: 3,
        upcomingDeadlines: 12
      };
      
      res.json(mockMetrics);
    } catch (error) {
      console.error("Error fetching SLA metrics:", error);
      res.status(500).json({ message: "Failed to fetch SLA metrics" });
    }
  });

  router.get("/sla-items/:department", async (req: Request, res: Response) => {
    try {
      const { department } = req.params;
      
      // Mock SLA items with real-time countdown data
      const mockItems = [
        {
          id: 1,
          dealId: 1,
          dealName: "Tesla Growth Campaign",
          department: "trading",
          priority: "high",
          dueDate: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
          createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
          slaTarget: 8,
          timeRemaining: 2,
          riskLevel: "warning",
          assignedTo: "John Smith",
          clientName: "Tesla Inc.",
          dealValue: 2500000
        },
        {
          id: 2,
          dealId: 2,
          dealName: "Netflix Brand Partnership", 
          department: "finance",
          priority: "urgent",
          dueDate: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
          createdAt: new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString(),
          slaTarget: 24,
          timeRemaining: -1,
          riskLevel: "overdue",
          assignedTo: "Sarah Johnson",
          clientName: "Netflix",
          dealValue: 5000000
        },
        {
          id: 3,
          dealId: 3,
          dealName: "Microsoft Partnership",
          department: "creative",
          priority: "normal",
          dueDate: new Date(Date.now() + 18 * 60 * 60 * 1000).toISOString(),
          createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          slaTarget: 24,
          timeRemaining: 18,
          riskLevel: "safe",
          assignedTo: "Mike Chen",
          clientName: "Microsoft",
          dealValue: 1800000
        }
      ];
      
      res.json(mockItems);
    } catch (error) {
      console.error("Error fetching SLA items:", error);
      res.status(500).json({ message: "Failed to fetch SLA items" });
    }
  });

  router.get("/department-sla-performance", async (req: Request, res: Response) => {
    try {
      // Mock department SLA performance data
      const mockPerformance = [
        {
          department: "trading",
          displayName: "Trading",
          complianceRate: 94.2,
          avgCompletionTime: 5.8,
          overdueCount: 1,
          slaTarget: 8,
          trend: "up",
          riskItems: 2
        },
        {
          department: "finance",
          displayName: "Finance", 
          complianceRate: 87.5,
          avgCompletionTime: 18.5,
          overdueCount: 3,
          slaTarget: 24,
          trend: "down",
          riskItems: 5
        },
        {
          department: "creative",
          displayName: "Creative",
          complianceRate: 96.8,
          avgCompletionTime: 4.2,
          overdueCount: 0,
          slaTarget: 6,
          trend: "up",
          riskItems: 1
        },
        {
          department: "marketing",
          displayName: "Marketing",
          complianceRate: 89.1,
          avgCompletionTime: 7.3,
          overdueCount: 2,
          slaTarget: 12,
          trend: "stable",
          riskItems: 3
        }
      ];
      
      res.json(mockPerformance);
    } catch (error) {
      console.error("Error fetching department SLA performance:", error);
      res.status(500).json({ message: "Failed to fetch department SLA performance" });
    }
  });

  // User Management API endpoints
  router.get("/admin/users", async (req: Request, res: Response) => {
    try {
      // Mock user data - in production, fetch from actual user table
      const mockUsers = [
        {
          id: 1,
          username: "demo_seller",
          email: "seller@company.com", 
          firstName: "Demo",
          lastName: "Seller",
          role: "seller",
          department: null,
          isActive: true,
          createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 2,
          username: "demo_approver",
          email: "approver@company.com",
          firstName: "Demo", 
          lastName: "Approver",
          role: "approver",
          department: null,
          isActive: true,
          createdAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 3,
          username: "trading_reviewer",
          email: "trading@company.com",
          firstName: "Trading",
          lastName: "Reviewer", 
          role: "department_reviewer",
          department: "trading",
          isActive: true,
          createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 4,
          username: "finance_reviewer", 
          email: "finance@company.com",
          firstName: "Finance",
          lastName: "Reviewer",
          role: "department_reviewer", 
          department: "finance",
          isActive: true,
          createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 5,
          username: "creative_reviewer",
          email: "creative@company.com", 
          firstName: "Creative",
          lastName: "Reviewer",
          role: "department_reviewer",
          department: "creative", 
          isActive: true,
          createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
        }
      ];
      
      res.json(mockUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  router.get("/admin/available-roles", async (req: Request, res: Response) => {
    try {
      const availableRoles = [
        { role: "seller", description: "Creates and manages deal submissions" },
        { role: "department_reviewer", description: "Technical review within assigned department" },
        { role: "approver", description: "Business approval authority across all deals" },
        { role: "legal", description: "Legal review and contract management" },
        { role: "admin", description: "Full system access and user management" }
      ];
      
      res.json(availableRoles);
    } catch (error) {
      console.error("Error fetching roles:", error);
      res.status(500).json({ message: "Failed to fetch available roles" });
    }
  });

  router.post("/admin/users/:userId/assign-role", async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const { role, department, reason } = req.body;
      
      // Validate input
      if (!role) {
        return res.status(400).json({ message: "Role is required" });
      }
      
      if (role === 'department_reviewer' && !department) {
        return res.status(400).json({ message: "Department is required for department_reviewer role" });
      }
      
      // In production: Update user in database
      console.log(`Assigning role ${role} to user ${userId}`, { department, reason });
      
      res.json({ 
        message: "Role assigned successfully",
        userId: parseInt(userId),
        role,
        department,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error("Error assigning role:", error);
      res.status(500).json({ message: "Failed to assign role" });
    }
  });

  // Deal loss tracking endpoints
  router.post("/deals/:dealId/mark-lost", async (req: Request, res: Response) => {
    try {
      const { dealId } = req.params;
      const { lostReason, lostReasonDetails, competitorName, estimatedLostValue, lessonsLearned } = req.body;
      
      if (!lostReason) {
        return res.status(400).json({ message: "Lost reason is required" });
      }
      
      // In production: Create loss tracking record and update deal status
      const lossTracking = {
        id: Math.floor(Math.random() * 1000),
        dealId: parseInt(dealId),
        lostReason,
        lostReasonDetails,
        lostAt: new Date().toISOString(),
        lostBy: 1, // Current user ID
        competitorName,
        estimatedLostValue: estimatedLostValue ? parseFloat(estimatedLostValue) : null,
        lessonsLearned
      };
      
      console.log("Deal marked as lost:", lossTracking);
      
      res.json({
        message: "Deal marked as lost successfully",
        lossTracking
      });
    } catch (error) {
      console.error("Error marking deal as lost:", error);
      res.status(500).json({ message: "Failed to mark deal as lost" });
    }
  });

  router.get("/deals/loss-analytics", async (req: Request, res: Response) => {
    try {
      // Mock loss analytics data
      const mockAnalytics = {
        totalLostDeals: 45,
        totalLostValue: 12500000,
        topLossReasons: [
          { reason: "competitive_loss", count: 15, percentage: 33.3 },
          { reason: "client_budget_cut", count: 12, percentage: 26.7 },
          { reason: "pricing_mismatch", count: 8, percentage: 17.8 },
          { reason: "technical_unfeasibility", count: 5, percentage: 11.1 },
          { reason: "other", count: 5, percentage: 11.1 }
        ],
        lossRateByMonth: [
          { month: "Jan", lostDeals: 8, totalDeals: 45, rate: 17.8 },
          { month: "Feb", lostDeals: 6, totalDeals: 38, rate: 15.8 },
          { month: "Mar", lostDeals: 12, totalDeals: 52, rate: 23.1 },
          { month: "Apr", lostDeals: 9, totalDeals: 41, rate: 22.0 },
          { month: "May", lostDeals: 10, totalDeals: 48, rate: 20.8 }
        ]
      };
      
      res.json(mockAnalytics);
    } catch (error) {
      console.error("Error fetching loss analytics:", error);
      res.status(500).json({ message: "Failed to fetch loss analytics" });
    }
  });

  // Scoping deals analytics endpoint for partnership team
  router.get("/analytics/scoping", async (req: Request, res: Response) => {
    try {
      const deals = await storage.getAllDeals();
      
      // Filter all scoping deals (both active and converted)
      const allScopingDeals = deals.filter(deal => 
        deal.status === 'scoping' || deal.convertedAt || deal.convertedDealId
      );
      
      const activeScopingDeals = deals.filter(deal => 
        deal.status === 'scoping' && !deal.convertedAt && !deal.convertedDealId
      );
      
      const convertedScopingDeals = deals.filter(deal => 
        deal.status === 'scoping' && (deal.convertedAt || deal.convertedDealId)
      );

      // Calculate conversion metrics
      const totalScopingRequests = allScopingDeals.length;
      const conversionRate = totalScopingRequests > 0 
        ? Math.round((convertedScopingDeals.length / totalScopingRequests) * 100) 
        : 0;

      // Calculate average values for converted deals
      const convertedDealsWithValue = convertedScopingDeals.filter(deal => deal.annualRevenue > 0);
      const totalConvertedValue = convertedDealsWithValue.reduce((sum, deal) => sum + (deal.annualRevenue || 0), 0);
      const avgConvertedValue = convertedDealsWithValue.length > 0 
        ? totalConvertedValue / convertedDealsWithValue.length 
        : 0;

      // Group by sales channel for insights
      const scopingByChannel = allScopingDeals.reduce((acc, deal) => {
        const channel = deal.salesChannel || 'unknown';
        acc[channel] = (acc[channel] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Group by region for insights
      const scopingByRegion = allScopingDeals.reduce((acc, deal) => {
        const region = deal.region || 'unknown';
        acc[region] = (acc[region] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Recent conversion timeline (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const recentConversions = convertedScopingDeals.filter(deal => {
        if (!deal.convertedAt) return false;
        const convertedDate = new Date(deal.convertedAt);
        return convertedDate >= thirtyDaysAgo;
      }).length;

      res.json({
        overview: {
          totalScopingRequests,
          activeScopingDeals: activeScopingDeals.length,
          convertedScopingDeals: convertedScopingDeals.length,
          conversionRate,
          avgConvertedValue: Math.round(avgConvertedValue),
          recentConversions
        },
        breakdown: {
          bySalesChannel: scopingByChannel,
          byRegion: scopingByRegion
        },
        dealDetails: allScopingDeals.map(deal => ({
          id: deal.id,
          dealName: deal.dealName || deal.advertiserName || 'Unnamed Deal',
          salesChannel: deal.salesChannel,
          region: deal.region,
          status: deal.status,
          convertedAt: deal.convertedAt,
          convertedDealId: deal.convertedDealId,
          annualRevenue: deal.annualRevenue || 0,
          createdAt: deal.createdAt,
          email: deal.email
        }))
      });
    } catch (error) {
      console.error("Error fetching scoping analytics:", error);
      res.status(500).json({ message: "Failed to fetch scoping analytics" });
    }
  });

  return httpServer;
}
