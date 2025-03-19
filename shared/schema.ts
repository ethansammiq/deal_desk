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

// Deal scoping requests table
export const dealScopingRequests = pgTable("deal_scoping_requests", {
  id: serial("id").primaryKey(),
  email: text("email"),
  salesChannel: text("sales_channel").notNull(),
  advertiserName: text("advertiser_name"),
  agencyName: text("agency_name"),
  growthOpportunityMIQ: text("growth_opportunity_miq").notNull(),
  growthAmbition: doublePrecision("growth_ambition").notNull(),
  growthOpportunityClient: text("growth_opportunity_client").notNull(),
  clientAsks: text("client_asks"),
  requestTitle: text("request_title").notNull(),
  description: text("description"),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertDealScopingRequestSchema = createInsertSchema(dealScopingRequests)
  .omit({ id: true, createdAt: true, updatedAt: true, status: true })
  .extend({
    growthAmbition: z.number().min(1000000, "Growth ambition must be at least $1M"),
  });

// Deals table
export const deals = pgTable("deals", {
  id: serial("id").primaryKey(),
  dealName: text("deal_name").notNull(),
  dealType: text("deal_type").notNull(), // growth, protect, custom
  description: text("summary").notNull(),
//  department: text("department").notNull(), // sales, marketing, operations, it, finance
//  expectedCloseDate: text("expected_close_date").notNull(),
  priority: text("priority").notNull().default("medium"), // high, medium, low
  
  // Client information
  advertiserName: text("advertiser_name").notNull(),
  agencyName: text("agency_name").notNull(),
  salesChannel: text("sales_channel").notNull(), // holding company, indendpent agency, client direct
//  industry: text("industry"),
  region: text("region"),
//  companySize: text("company_size"),
  
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
  customField1: text("custom_field1"),
  customField2: text("custom_field2"),
  
  // Status and tracking
  status: text("status").notNull().default("?"), // pending, approved, rejected, in_progress, completed
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
    // Custom fields
    customField1: z.string().optional(),
    customField2: z.string().optional(),
  });



// Support request schema has been removed as per user request

// Type definitions for ORM
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Deal = typeof deals.$inferSelect;
export type InsertDeal = z.infer<typeof insertDealSchema>;

export type DealScopingRequest = typeof dealScopingRequests.$inferSelect;
export type InsertDealScopingRequest = z.infer<typeof insertDealScopingRequestSchema>;
