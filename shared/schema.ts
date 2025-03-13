import { pgTable, text, serial, integer, boolean, timestamp, doublePrecision } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table (keep the existing one)
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

// Deals table
export const deals = pgTable("deals", {
  id: serial("id").primaryKey(),
  dealName: text("deal_name").notNull(),
  dealType: text("deal_type").notNull(), // new_business, renewal, upsell, expansion, special_project
  description: text("description").notNull(),
  department: text("department").notNull(), // sales, marketing, operations, it, finance
  expectedCloseDate: text("expected_close_date").notNull(),
  priority: text("priority").notNull().default("medium"), // high, medium, low
  
  // Client information
  clientName: text("client_name").notNull(),
  clientType: text("client_type").notNull().default("new"), // existing, new, partner
  industry: text("industry"),
  region: text("region"),
  companySize: text("company_size"),
  
  // Pricing information
  totalValue: doublePrecision("total_value").notNull(),
  contractTerm: integer("contract_term").notNull(), // in months
  paymentTerms: text("payment_terms").default("monthly"), // monthly, quarterly, annually, upfront
  discountPercentage: doublePrecision("discount_percentage").default(0),
  costPercentage: doublePrecision("cost_percentage").default(30), // default cost basis is 30%
  incentivePercentage: doublePrecision("incentive_percentage").default(0), // sales incentives 
  previousYearValue: doublePrecision("previous_year_value").default(0), // for YOY calculations
  renewalOption: text("renewal_option").default("manual"), // automatic, manual, none
  pricingNotes: text("pricing_notes"),
  
  // Status and tracking
  status: text("status").notNull().default("pending"), // pending, approved, rejected, in_progress, completed
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  
  // Reference number - displayed as #DEAL-YYYY-XXX
  referenceNumber: text("reference_number").notNull().unique(),
});

export const insertDealSchema = createInsertSchema(deals)
  .omit({ id: true, createdAt: true, updatedAt: true, referenceNumber: true })
  .extend({
    // Add validation rules
    totalValue: z.number().positive("Deal value must be positive"),
    contractTerm: z.number().int().positive("Contract term must be positive"),
    discountPercentage: z.number().min(0).max(100, "Discount must be between 0 and 100%"),
    costPercentage: z.number().min(0).max(100, "Cost must be between 0 and 100%"),
    // Make these fields optional with defaults
    incentivePercentage: z.number().min(0).max(50, "Incentives must be between 0 and 50%").default(0),
    previousYearValue: z.number().min(0, "Previous year value must be non-negative").default(0),
    priority: z.string().default("medium"),
    companySize: z.string().optional(),
    paymentTerms: z.string().default("monthly"),
    pricingNotes: z.string().optional(),
    renewalOption: z.string().default("manual"),
  });

// Support requests table
export const supportRequests = pgTable("support_requests", {
  id: serial("id").primaryKey(),
  supportType: text("support_type").notNull(), // pricing, technical, legal, proposal, other
  requestTitle: text("request_title").notNull(),
  description: text("description").notNull(),
  relatedDealId: integer("related_deal_id"),
  priorityLevel: text("priority_level").notNull().default("medium"), // high, medium, low
  deadline: text("deadline"),
  status: text("status").notNull().default("open"), // open, in_progress, resolved, closed
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertSupportRequestSchema = createInsertSchema(supportRequests)
  .omit({ id: true, createdAt: true, updatedAt: true })
  .extend({
    relatedDealId: z.number().int().positive().optional(),
  });

// Type definitions for ORM
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Deal = typeof deals.$inferSelect;
export type InsertDeal = z.infer<typeof insertDealSchema>;

export type SupportRequest = typeof supportRequests.$inferSelect;
export type InsertSupportRequest = z.infer<typeof insertSupportRequestSchema>;
