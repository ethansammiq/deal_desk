import express, { type Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertDealSchema, insertSupportRequestSchema } from "@shared/schema";
import { z } from "zod";
import { fromZodError } from "zod-validation-error";

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
      // Validate the request body against the schema
      const validatedData = insertDealSchema.safeParse(req.body);
      
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
      const newDeal = await storage.createDeal({
        ...validatedData.data,
        referenceNumber
      });
      
      res.status(201).json(newDeal);
    } catch (error) {
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
      res.status(500).json({ message: "Failed to update deal status" });
    }
  });
  
  // Support requests endpoints
  router.get("/support-requests", async (req: Request, res: Response) => {
    try {
      const requests = await storage.getSupportRequests();
      res.status(200).json(requests);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch support requests" });
    }
  });
  
  router.get("/support-requests/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid request ID" });
      }
      
      const request = await storage.getSupportRequest(id);
      if (!request) {
        return res.status(404).json({ message: "Support request not found" });
      }
      
      res.status(200).json(request);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch support request" });
    }
  });
  
  router.post("/support-requests", async (req: Request, res: Response) => {
    try {
      // Validate the request body against the schema
      const validatedData = insertSupportRequestSchema.safeParse(req.body);
      
      if (!validatedData.success) {
        const errorMessage = fromZodError(validatedData.error).message;
        return res.status(400).json({ message: errorMessage });
      }
      
      const newRequest = await storage.createSupportRequest(validatedData.data);
      res.status(201).json(newRequest);
    } catch (error) {
      res.status(500).json({ message: "Failed to create support request" });
    }
  });
  
  router.patch("/support-requests/:id/status", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid request ID" });
      }
      
      // Validate status
      const statusSchema = z.object({
        status: z.enum(["open", "in_progress", "resolved", "closed"])
      });
      
      const validatedData = statusSchema.safeParse(req.body);
      
      if (!validatedData.success) {
        const errorMessage = fromZodError(validatedData.error).message;
        return res.status(400).json({ message: errorMessage });
      }
      
      const { status } = validatedData.data;
      
      const updatedRequest = await storage.updateSupportRequestStatus(id, status);
      if (!updatedRequest) {
        return res.status(404).json({ message: "Support request not found" });
      }
      
      res.status(200).json(updatedRequest);
    } catch (error) {
      res.status(500).json({ message: "Failed to update support request status" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
