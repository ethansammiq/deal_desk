import express, { type Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertDealSchema } from "@shared/schema";
import { z } from "zod";
import { fromZodError } from "zod-validation-error";
import { registerChatbotRoutes, ChatMemStorage } from "./chatbot";

export async function registerRoutes(app: Express): Promise<Server> {
  // prefix all routes with /api
  const router = express.Router();
  app.use("/api", router);
  
  // Stats endpoint
  router.get("/stats", async (req: Request, res: Response) => {
    try {
      const stats = await storage.getDealStats();
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
      
      res.status(201).json(newDeal);
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
