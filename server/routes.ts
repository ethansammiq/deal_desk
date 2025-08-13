import express, { type Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertDealSchema, insertDealScopingRequestSchema } from "@shared/schema";
import { z } from "zod";
import { fromZodError } from "zod-validation-error";
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
  router.get("/stats", async (req: Request, res: Response) => {
    try {
      // Get real stats from storage
      const realStats = await storage.getDealStats();
      const stats = {
        activeDeals: realStats.activeDeals,
        pendingApproval: realStats.pendingApproval, 
        completedDeals: realStats.completedDeals,
        successRate: realStats.successRate
      };
      res.status(200).json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });
  
  // Deals endpoints
  router.get("/deals", async (req: Request, res: Response) => {
    try {
      const status = req.query.status as string | undefined;
      const filters = status ? { status } : undefined;
      const deals = await storage.getDeals(filters);
      res.status(200).json(deals);
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

  // Conversion endpoint - convert scoping request to deal
  router.post("/deal-scoping-requests/:id/convert", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid scoping request ID" });
      }

      const result = await storage.convertScopingRequestToDeal(id);
      if (!result) {
        return res.status(404).json({ message: "Scoping request not found" });
      }

      res.status(200).json({
        message: "Successfully converted scoping request to deal",
        dealId: result.deal.id,
        scopingRequestId: result.scopingRequest.id,
        deal: result.deal
      });
    } catch (error) {
      console.error("Error converting scoping request:", error);
      res.status(500).json({ message: "Failed to convert scoping request to deal" });
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
      
      const updatedDeal = await storage.updateDealStatus(id, status);
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
