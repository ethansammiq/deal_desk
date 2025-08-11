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
  previousYearMargin: doublePrecision("previous_year_margin").default(0),
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
  previousYearMargin: doublePrecision("previous_year_margin").default(0),
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
  growthOpportunityCommercial: text("growth_opportunity_commercial").notNull(),
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
  }).passthrough(); // Allow additional fields from shared components

// Tier configuration for tiered deals
export const dealTiers = pgTable("deal_tiers", {
  id: serial("id").primaryKey(),
  dealId: integer("deal_id").notNull(),
  tierNumber: integer("tier_number").notNull(), // 1, 2, 3, 4 for tier ordering
  annualRevenue: doublePrecision("annual_revenue").notNull(),
  annualGrossMargin: doublePrecision("annual_gross_margin").notNull(), // as a percentage
  incentivePercentage: doublePrecision("incentive_percentage").default(0),
  incentiveNotes: text("incentive_notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertDealTierSchema = createInsertSchema(dealTiers)
  .omit({ id: true, createdAt: true, updatedAt: true });

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
  status: text("status").notNull().default("submitted"), // "submitted", "in_review", "initial_approval", "client_feedback", "legal_review", "signed"
  
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
  
  // System fields
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  
  // Reference number - displayed as #DEAL-YYYY-XXX
  referenceNumber: text("reference_number").notNull().unique(),
});

export const insertDealSchema = createInsertSchema(deals)
  .omit({ id: true, createdAt: true, updatedAt: true, referenceNumber: true, contractTerm: true })
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
