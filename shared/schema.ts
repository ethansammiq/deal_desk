import { pgTable, text, serial, integer, boolean, timestamp, doublePrecision, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table (keep the existing one)
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
});

// Advertisers lookup table
export const advertisers = pgTable("advertisers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  previousYearRevenue: doublePrecision("previous_year_revenue").default(0),
  previousYearMargin: doublePrecision("previous_year_margin").default(0), // stored as decimal (0.257 = 25.7%)
  previousYearProfit: doublePrecision("previous_year_profit").default(0),
  previousYearIncentiveCost: doublePrecision("previous_year_incentive_cost").default(0),
  previousYearClientValue: doublePrecision("previous_year_client_value").default(0),
  region: text("region"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertAdvertiserSchema = createInsertSchema(advertisers)
  .omit({ id: true, createdAt: true, updatedAt: true });

// Agencies lookup table
export const agencies = pgTable("agencies", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  type: text("type").notNull().default("independent"), // holding_company, independent
  previousYearRevenue: doublePrecision("previous_year_revenue").default(0),
  previousYearMargin: doublePrecision("previous_year_margin").default(0), // stored as decimal (0.285 = 28.5%)
  previousYearProfit: doublePrecision("previous_year_profit").default(0),
  previousYearIncentiveCost: doublePrecision("previous_year_incentive_cost").default(0),
  previousYearClientValue: doublePrecision("previous_year_client_value").default(0),
  region: text("region"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertAgencySchema = createInsertSchema(agencies)
  .omit({ id: true, createdAt: true, updatedAt: true });

// Deal scoping requests table
export const dealScopingRequests = pgTable("deal_scoping_requests", {
  id: serial("id").primaryKey(),
  email: text("email"),
  salesChannel: text("sales_channel").notNull(),
  advertiserName: text("advertiser_name"),
  agencyName: text("agency_name"),
  region: text("region"),
  dealType: text("deal_type"),
  dealStructure: text("deal_structure"),
  contractTermMonths: integer("contract_term_months"),
  termStartDate: text("term_start_date"),
  termEndDate: text("term_end_date"),
  growthOpportunityMIQ: text("growth_opportunity_miq").notNull(),
  growthAmbition: doublePrecision("growth_ambition").notNull(),
  growthOpportunityClient: text("growth_opportunity_client").notNull(),
  clientAsks: text("client_asks"),
  requestTitle: text("request_title").notNull(),
  description: text("description"),
  status: text("status").notNull().default("pending"),
  // Conversion tracking fields
  convertedDealId: integer("converted_deal_id"),
  convertedAt: timestamp("converted_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertDealScopingRequestSchema = createInsertSchema(dealScopingRequests)
  .omit({ id: true, createdAt: true, updatedAt: true, status: true, convertedDealId: true, convertedAt: true })
  .extend({
    growthAmbition: z.number().min(1000000, "Growth ambition must be at least $1M"),
    region: z.string().optional(),
    dealType: z.string().optional(),
    dealStructure: z.string().optional(),
    contractTermMonths: z.number().optional(),
    termStartDate: z.string().optional(),
    termEndDate: z.string().optional(),
  }).passthrough(); // Allow additional fields from shared components

// Tier configuration for tiered deals - Updated unified schema
export const dealTiers = pgTable("deal_tiers", {
  id: serial("id").primaryKey(),
  dealId: integer("deal_id").notNull(),
  tierNumber: integer("tier_number").notNull(), // 1, 2, 3, 4 for tier ordering
  annualRevenue: doublePrecision("annual_revenue").notNull(),
  annualGrossMargin: doublePrecision("annual_gross_margin").notNull(), // stored as decimal (0.355 for 35.5%)
  categoryName: text("category_name").notNull(), // Display name: "Financial", "Resources", etc.
  subCategoryName: text("sub_category_name").notNull(), // Display name: "Discounts", "Bonuses", etc.
  incentiveOption: text("incentive_option").notNull(), // Selected option: "Volume Discount", "Growth Bonus", etc.
  incentiveValue: doublePrecision("incentive_value").notNull(), // USD amount
  incentiveNotes: text("incentive_notes"), // Optional field
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Phase 7A: Export new types
export type DealStatusHistory = typeof dealStatusHistory.$inferSelect;
export type InsertDealStatusHistory = z.infer<typeof insertDealStatusHistorySchema>;

export const insertDealTierSchema = createInsertSchema(dealTiers)
  .omit({ id: true, createdAt: true, updatedAt: true })
  .extend({
    tierNumber: z.number().min(1, "Tier number must be positive"),
    annualRevenue: z.number().min(0, "Annual revenue must be positive"),
    annualGrossMargin: z.number().min(0).max(1, "Gross margin must be between 0 and 1 (decimal)"),
    incentiveValue: z.number().min(0, "Incentive value must be positive"),
    categoryName: z.string().min(1, "Category name is required"),
    subCategoryName: z.string().min(1, "Subcategory name is required"),
    incentiveOption: z.string().min(1, "Incentive option is required"),
    incentiveNotes: z.string().optional(),
  });

// Phase 7A: Deal Status History table
export const dealStatusHistory = pgTable("deal_status_history", {
  id: serial("id").primaryKey(),
  dealId: integer("deal_id").notNull(),
  status: text("status").notNull(),
  previousStatus: text("previous_status"),
  changedBy: text("changed_by"), // User email/identifier who made the change
  comments: text("comments"), // Optional comments about the status change
  changedAt: timestamp("changed_at").defaultNow(),
});

export const insertDealStatusHistorySchema = createInsertSchema(dealStatusHistory)
  .omit({ id: true, changedAt: true })
  .extend({
    dealId: z.number().positive("Deal ID must be positive"),
    status: z.enum([
      "scoping", 
      "submitted", 
      "under_review", 
      "negotiating", 
      "approved", 
      "legal_review", 
      "contract_sent", 
      "signed", 
      "lost"
    ]),
    previousStatus: z.string().optional(),
    changedBy: z.string().min(1, "Changed by is required"),
    comments: z.string().optional(),
  });

// Deals table - updated with new fields
export const deals = pgTable("deals", {
  id: serial("id").primaryKey(),
  
  // User information
  email: text("email"),
  
  // Basic deal information
  dealName: text("deal_name").notNull(),
  dealType: text("deal_type").notNull(), // "grow", "protect", "custom"
  salesChannel: text("sales_channel").notNull(), // "holding_company", "independent_agency", "client_direct"
  region: text("region"), // "northeast", "midwest", "midatlantic", "west", "south"
  
  // Client information based on salesChannel
  advertiserName: text("advertiser_name"),
  agencyName: text("agency_name"),
  
  // Deal structure
  dealStructure: text("deal_structure").notNull(), // "tiered", "flat_commit"
  
  // Business information
  businessSummary: text("business_summary"), // long text for describing deal purpose
  
  // Business Context fields (for SubmitDeal form)
  growthOpportunityMIQ: text("growth_opportunity_miq"),
  growthOpportunityClient: text("growth_opportunity_client"),
  clientAsks: text("client_asks"),
  
  // RequestSupport specific fields
  growthAmbition: doublePrecision("growth_ambition"), // Used in RequestSupport form
  
  // Contract term input field (months)
  contractTermMonths: integer("contract_term_months"),
  
  status: text("status").notNull().default("submitted"), // Phase 7A: 9-status workflow
  
  // Timeframe - using ISO 8601 date strings
  termStartDate: text("term_start_date"), // ISO 8601: "2025-01-15"
  termEndDate: text("term_end_date"), // ISO 8601: "2025-12-15"
  contractTerm: integer("contract_term"), // calculated in months from start and end dates
  
  // Financial data for flat commit structure
  annualRevenue: doublePrecision("annual_revenue"),
  annualGrossMargin: doublePrecision("annual_gross_margin"), // as a percentage
  previousYearRevenue: doublePrecision("previous_year_revenue").default(0),
  previousYearMargin: doublePrecision("previous_year_margin").default(0),
  
  // Standard deal criteria fields
  hasTradeAMImplications: boolean("has_trade_am_implications").default(false),
  yearlyRevenueGrowthRate: doublePrecision("yearly_revenue_growth_rate").default(0),
  forecastedMargin: doublePrecision("forecasted_margin").default(0),
  yearlyMarginGrowthRate: doublePrecision("yearly_margin_growth_rate").default(0),
  addedValueBenefitsCost: doublePrecision("added_value_benefits_cost").default(0),
  analyticsTier: text("analytics_tier").default("silver"),
  requiresCustomMarketing: boolean("requires_custom_marketing").default(false),
  
  // Phase 7A: Workflow fields
  lastStatusChange: timestamp("last_status_change").defaultNow(),
  priority: text("priority").default("medium"), // "low", "medium", "high"
  
  // System fields
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  
  // Reference number - displayed as #DEAL-YYYY-XXX
  referenceNumber: text("reference_number").notNull().unique(),
});

// Phase 7A: Deal Status Constants
export const DEAL_STATUSES = {
  SCOPING: "scoping",
  SUBMITTED: "submitted", 
  UNDER_REVIEW: "under_review",
  NEGOTIATING: "negotiating",
  APPROVED: "approved",
  LEGAL_REVIEW: "legal_review",
  CONTRACT_SENT: "contract_sent",
  SIGNED: "signed",
  LOST: "lost"
} as const;

export const DEAL_STATUS_LABELS = {
  scoping: "Scoping",
  submitted: "Submitted",
  under_review: "Under Review", 
  negotiating: "Negotiating",
  approved: "Approved",
  legal_review: "Legal Review",
  contract_sent: "Contract Sent",
  signed: "Signed",
  lost: "Lost"
} as const;

export const DEAL_STATUS_FLOW = [
  "scoping",
  "submitted", 
  "under_review",
  "negotiating",
  "approved",
  "legal_review", 
  "contract_sent",
  "signed"
] as const;

export type DealStatus = keyof typeof DEAL_STATUS_LABELS;

export const insertDealSchema = createInsertSchema(deals)
  .omit({ id: true, createdAt: true, updatedAt: true, referenceNumber: true, contractTerm: true, lastStatusChange: true })
  .extend({
    // Region validation
    region: z.enum(["northeast", "midwest", "midatlantic", "west", "south"]),
    
    // Deal type validation
    dealType: z.enum(["grow", "protect", "custom"])
      .describe("Deal type - grow, protect, or custom deal strategy"),
    
    // Sales channel validation
    salesChannel: z.enum(["holding_company", "independent_agency", "client_direct"]),
    
    // Deal structure validation
    dealStructure: z.enum(["tiered", "flat_commit"]),
    
    // Date validations - ISO 8601 format (YYYY-MM-DD)
    termStartDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format").optional(),
    termEndDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format").optional(),
    
    // Contract term validation
    contractTermMonths: z.number().positive("Contract term must be positive").optional(),
    
    // Business Context validations
    growthOpportunityMIQ: z.string().optional(),
    growthOpportunityClient: z.string().optional(),
    clientAsks: z.string().optional(),
    growthAmbition: z.number().min(1000000, "Growth ambition must be at least $1M").optional(),
    
    // Financial validations
    annualRevenue: z.number().positive("Annual revenue must be positive").optional(),
    annualGrossMargin: z.number().min(0).max(100, "Annual gross margin must be between 0 and 100%").optional(),
    
    // Deal criteria validations
    hasTradeAMImplications: z.boolean().default(false),
    yearlyRevenueGrowthRate: z.number().default(0),
    forecastedMargin: z.number().min(0).max(100, "Forecasted margin must be between 0 and 100%").default(0),
    yearlyMarginGrowthRate: z.number().default(0),
    addedValueBenefitsCost: z.number().min(0).default(0),
    analyticsTier: z.enum(["bronze", "silver", "gold", "platinum"]).default("silver"),
    
    // Phase 7A: Status and priority validation
    status: z.enum([
      "scoping", 
      "submitted", 
      "under_review", 
      "negotiating", 
      "approved", 
      "legal_review", 
      "contract_sent", 
      "signed", 
      "lost"
    ]).default("submitted"),
    priority: z.enum(["low", "medium", "high"]).default("medium").optional(),
    requiresCustomMarketing: z.boolean().default(false),
  });

// Type definitions for ORM
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Advertiser = typeof advertisers.$inferSelect;
export type InsertAdvertiser = z.infer<typeof insertAdvertiserSchema>;

export type Agency = typeof agencies.$inferSelect;
export type InsertAgency = z.infer<typeof insertAgencySchema>;

export type Deal = typeof deals.$inferSelect;
export type InsertDeal = z.infer<typeof insertDealSchema>;

export type DealTier = typeof dealTiers.$inferSelect;
export type InsertDealTier = z.infer<typeof insertDealTierSchema>;

// Incentives value table
export const incentiveValues = pgTable("incentive_values", {
  id: serial("id").primaryKey(),
  dealId: integer("deal_id").notNull(),
  categoryId: text("category_id").notNull(),
  subCategoryId: text("subcategory_id").notNull(),
  option: text("option").notNull(),
  value: doublePrecision("value").default(0),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertIncentiveValueSchema = createInsertSchema(incentiveValues)
  .omit({ id: true, createdAt: true, updatedAt: true });

export type DealScopingRequest = typeof dealScopingRequests.$inferSelect;
export type InsertDealScopingRequest = z.infer<typeof insertDealScopingRequestSchema>;

export type IncentiveValue = typeof incentiveValues.$inferSelect;
export type InsertIncentiveValue = z.infer<typeof insertIncentiveValueSchema>;
