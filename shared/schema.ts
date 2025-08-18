import { pgTable, text, serial, integer, boolean, timestamp, doublePrecision, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Phase 7B: User roles for role-based permissions - Enhanced for multi-layered approval
export const userRoles = ["seller", "department_reviewer", "approver", "admin"] as const;
export type UserRole = typeof userRoles[number];

// Department types for the approval system
export const departmentTypes = ["trading", "finance", "creative", "marketing", "product", "solutions", "legal"] as const;
export type DepartmentType = typeof departmentTypes[number];

// Phase 7B: Enhanced users table with role-based permissions and department assignment
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  role: text("role", { enum: userRoles }).notNull().default("seller"),
  department: text("department", { enum: departmentTypes }), // Enhanced with specific department types
  firstName: text("first_name"),
  lastName: text("last_name"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Phase 7B: Enhanced user schema with role information
export const insertUserSchema = createInsertSchema(users)
  .omit({ id: true, createdAt: true, updatedAt: true });

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
  performedBy: integer("performed_by"), // Standardized to match approvalActions - user ID
  comments: text("comments"), // Optional comments about the status change
  changedAt: timestamp("changed_at").defaultNow(),
});

export const insertDealStatusHistorySchema = createInsertSchema(dealStatusHistory)
  .omit({ id: true, changedAt: true })
  .extend({
    dealId: z.number().positive("Deal ID must be positive"),
    status: z.enum([
      "draft",
      "scoping", 
      "submitted", 
      "under_review",
      "revision_requested", 
      "negotiating", 
      "approved", 
      "contract_drafting", 
      "client_review", 
      "signed", 
      "lost"
    ]),
    previousStatus: z.string().optional(),
    performedBy: z.number().positive("Performed by user ID is required"),
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
  
  status: text("status").notNull().default("submitted"), // Phase 8: Enhanced workflow with draft support
  
  // Phase 8: Draft and Revision Management
  draftType: text("draft_type"), // "scoping_draft" or "submission_draft" - only set when status is "draft"
  revisionCount: integer("revision_count").notNull().default(0),
  isRevision: boolean("is_revision").notNull().default(false),
  parentSubmissionId: integer("parent_submission_id"), // References deals.id for revision tracking
  revisionReason: text("revision_reason"), // Why revision was requested
  lastRevisedAt: timestamp("last_revised_at"),
  canEdit: boolean("can_edit").notNull().default(true), // Computed based on status + role
  draftExpiresAt: timestamp("draft_expires_at"), // Auto-cleanup after 30 days
  
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
  priority: text("priority", { enum: ["critical", "high", "medium", "low"] }).notNull().default("medium"), // Seller-defined priority
  
  // Phase 1 Flow Intelligence: Algorithm-controlled timing classification
  flowIntelligence: text("flow_intelligence", { enum: ["on_track", "accelerated", "delayed", "stalled"] }), // Computed field, nullable for backward compatibility
  
  // System fields
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  
  // Reference number - displayed as #DEAL-YYYY-XXX
  referenceNumber: text("reference_number").notNull().unique(),
});

// Phase 8: Enhanced Deal Status Constants with Draft Support
export const DEAL_STATUSES = {
  DRAFT: "draft",
  SCOPING: "scoping",
  SUBMITTED: "submitted", 
  UNDER_REVIEW: "under_review",
  REVISION_REQUESTED: "revision_requested",
  NEGOTIATING: "negotiating",
  APPROVED: "approved",
  CONTRACT_DRAFTING: "contract_drafting", // Renamed from legal_review
  CLIENT_REVIEW: "client_review", // Renamed from contract_sent
  SIGNED: "signed",
  LOST: "lost"
} as const;

export const DEAL_STATUS_LABELS = {
  draft: "Draft",
  scoping: "Scoping",
  submitted: "Submitted",
  under_review: "Under Review", 
  revision_requested: "Revision Requested",
  negotiating: "Negotiating",
  approved: "Approved",
  contract_drafting: "Contract Drafting", // Updated label
  client_review: "Client Review", // Updated label
  signed: "Signed",
  lost: "Lost"
} as const;

// Phase 8: Enhanced Deal Status Flow with Draft Support
export const DEAL_STATUS_FLOW = [
  "draft",
  "scoping",
  "submitted", 
  "under_review",
  "revision_requested",
  "negotiating",
  "approved",
  "contract_drafting", 
  "client_review",
  "signed"
] as const;

// Phase 8: Draft Type Constants for differentiation
export const DRAFT_TYPES = {
  SCOPING: "scoping_draft",
  SUBMISSION: "submission_draft"
} as const;

export type DraftType = typeof DRAFT_TYPES[keyof typeof DRAFT_TYPES];

export type DealStatus = keyof typeof DEAL_STATUS_LABELS;

// Priority Level Constants
export const DEAL_PRIORITIES = {
  CRITICAL: "critical",
  HIGH: "high", 
  MEDIUM: "medium",
  LOW: "low"
} as const;

export const DEAL_PRIORITY_LABELS = {
  critical: "Critical",
  high: "High",
  medium: "Medium", 
  low: "Low"
} as const;

// Phase 1 Flow Intelligence: Timing-based classification constants  
export const FLOW_STATUSES = {
  ON_TRACK: "on_track",
  ACCELERATED: "accelerated", 
  DELAYED: "delayed",
  STALLED: "stalled"
} as const;

export const FLOW_STATUS_LABELS = {
  on_track: "On Track",
  accelerated: "Accelerated", 
  delayed: "Delayed",
  stalled: "Stalled"
} as const;

export type DealPriority = keyof typeof DEAL_PRIORITY_LABELS;

export const insertDealSchema = createInsertSchema(deals)
  .omit({ 
    id: true, 
    createdAt: true, 
    updatedAt: true, 
    referenceNumber: true, 
    contractTerm: true, 
    lastStatusChange: true,
    revisionCount: true, // Auto-managed
    canEdit: true, // Computed field
    draftExpiresAt: true // Auto-set
  })
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
    
    // Phase 8: Enhanced status and draft validation
    status: z.enum([
      "draft",
      "scoping", 
      "submitted", 
      "under_review",
      "revision_requested", 
      "negotiating", 
      "approved", 
      "contract_drafting", 
      "client_review", 
      "signed", 
      "lost"
    ]).default("draft"),
    draftType: z.enum(["scoping_draft", "submission_draft"]).optional(),
    priority: z.enum(["critical", "high", "medium", "low"]).default("medium"),
    
    // Phase 8: Revision management validation
    isRevision: z.boolean().default(false),
    parentSubmissionId: z.number().positive().optional(),
    revisionReason: z.string().optional(),
    lastRevisedAt: z.string().optional(), // ISO timestamp string
    
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

// Multi-Layered Approval System Types - moved to end of file to avoid duplicates

// Multi-Layered Approval System Tables

// Deal approval requirements table - Updated to match routes.ts usage
export const dealApprovals = pgTable("deal_approvals", {
  id: serial("id").primaryKey(),
  dealId: integer("deal_id").notNull(),
  
  // Standardized field names for consistency
  approvalStage: integer("approval_stage").notNull(), // Used in workflow automation
  department: text("department", { enum: departmentTypes }).notNull(), // Consistent with users table
  requiredRole: text("required_role").notNull(), // Single role requirement
  
  status: text("status", { enum: ["pending", "approved", "rejected", "revision_requested"] }).default("pending"),
  priority: text("priority", { enum: ["normal", "high", "urgent"] }).default("normal"),
  dueDate: timestamp("due_date").notNull(),
  assignedTo: integer("assigned_to"),
  completedAt: timestamp("completed_at"),
  comments: text("comments"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertDealApprovalSchema = createInsertSchema(dealApprovals)
  .omit({ id: true, createdAt: true, completedAt: true })
  .extend({
    dealId: z.number().positive("Deal ID must be positive"),
    approvalStage: z.number().positive("Approval stage must be positive"),
    department: z.enum(departmentTypes),
    requiredRole: z.string().min(1, "Required role is required"),
    status: z.enum(["pending", "approved", "revision_requested", "rejected"]).default("pending"),
    priority: z.enum(["normal", "high", "urgent"]).default("normal"),
    dueDate: z.date(),
    assignedTo: z.number().positive().optional(),
    comments: z.string().optional(),
  });

// Individual approval actions/history - Updated to match routes.ts usage
export const approvalActions = pgTable("approval_actions", {
  id: serial("id").primaryKey(),
  approvalId: integer("approval_id").notNull(),
  actionType: text("action_type", { 
    enum: ["approve", "reject", "request_revision", "comment", "initiate", "assign"] 
  }).notNull(), // Added missing 'initiate' and 'assign' types
  performedBy: integer("performed_by").notNull(), // Updated field name to match routes.ts usage
  // Removed duplicate fields for consistency
  comments: text("comments"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertApprovalActionSchema = createInsertSchema(approvalActions)
  .omit({ id: true, createdAt: true })
  .extend({
    approvalId: z.number().positive("Approval ID must be positive"),
    actionType: z.enum(["approve", "reject", "request_revision", "comment", "initiate", "assign"]),
    performedBy: z.number().positive("Performed by user ID is required"),
    // Removed duplicate field validations
    comments: z.string().optional(),
  });

// Department configurations and assignments
export const approvalDepartments = pgTable("approval_departments", {
  id: serial("id").primaryKey(),
  department: text("department", { enum: departmentTypes }).notNull().unique(),
  displayName: text("display_name").notNull(),
  description: text("description"),
  contactEmail: text("contact_email"),
  defaultAssignee: integer("default_assignee"), // References users.id
  incentiveTypes: text("incentive_types").array().notNull().default([]), // Which incentive types this dept handles
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertApprovalDepartmentSchema = createInsertSchema(approvalDepartments)
  .omit({ id: true, createdAt: true, updatedAt: true })
  .extend({
    department: z.enum(departmentTypes),
    displayName: z.string().min(1, "Display name is required"),
    description: z.string().optional(),
    contactEmail: z.string().email().optional(),
    defaultAssignee: z.number().positive().optional(),
    incentiveTypes: z.array(z.string()).default([]),
    isActive: z.boolean().default(true),
  });

// Phase 7B: Role-based permissions system
export interface RolePermissions {
  canViewDeals: boolean;
  canCreateDeals: boolean;
  canEditDeals: boolean;
  canDeleteDeals: boolean;
  canChangeStatus: string[]; // Array of statuses this role can transition TO
  canViewAllDeals: boolean; // If false, only sees deals they created/are assigned to
  canApproveDeals: boolean;
  canAccessLegalReview: boolean;
  canManageContracts: boolean;
  dashboardSections: string[]; // Which dashboard sections they see
}

// Phase 7B: Permission definitions for each role
export const rolePermissions: Record<UserRole, RolePermissions> = {
  seller: {
    canViewDeals: true,
    canCreateDeals: true,
    canEditDeals: true, // Only their own deals
    canDeleteDeals: false,
    canChangeStatus: ["scoping", "submitted"], // Can only submit deals for review
    canViewAllDeals: false, // Only their deals
    canApproveDeals: false,
    canAccessLegalReview: false,
    canManageContracts: false,
    dashboardSections: ["deals", "scoping", "performance"]
  },
  approver: {
    canViewDeals: true,
    canCreateDeals: false,
    canEditDeals: false, // Cannot directly edit deals - must request revisions instead
    canDeleteDeals: false,
    canChangeStatus: ["under_review", "negotiating", "approved", "revision_requested", "lost"], // Review and approval flow
    canViewAllDeals: true,
    canApproveDeals: true,
    canAccessLegalReview: false,
    canManageContracts: false,
    dashboardSections: ["deals", "approvals", "analytics", "reports"]
  },

  admin: {
    canViewDeals: true,
    canCreateDeals: true,
    canEditDeals: true,
    canDeleteDeals: true,
    canChangeStatus: ["draft", "scoping", "submitted", "under_review", "revision_requested", "negotiating", "approved", "contract_drafting", "client_review", "signed", "lost"], // All status transitions
    canViewAllDeals: true,
    canApproveDeals: true,
    canAccessLegalReview: true,
    canManageContracts: true,
    dashboardSections: ["admin-panel", "deals", "scoping", "approvals", "legal-queue", "contracts", "analytics", "reports", "compliance", "performance", "user-management", "system-metrics", "audit-logs", "technical-support"]
  },
  department_reviewer: {
    canViewDeals: true,
    canCreateDeals: false,
    canEditDeals: false,
    canDeleteDeals: false,
    canChangeStatus: ["approved", "revision_requested", "contract_drafting", "client_review", "signed"], // Can approve, request revisions, and handle legal workflows
    canViewAllDeals: true, // Can view deals assigned to their department
    canApproveDeals: true,
    canAccessLegalReview: true, // Legal department reviewers have legal access
    canManageContracts: true, // Legal department reviewers can manage contracts
    dashboardSections: ["department-approvals", "deals", "workload"]
  }
};

// Simplified 2-stage approval pipeline
export const approvalStages = {
  TECHNICAL_REVIEW: 1,    // All department reviewers (parallel)
  BUSINESS_APPROVAL: 2    // Executive approver (after Stage 1 complete)
} as const;

// All 6 departments participate in Stage 1 technical review
export const stage1Departments: DepartmentType[] = [
  'trading', 'finance', 'creative', 'marketing', 'product', 'solutions'
];

// Export approval system types
export type DealApproval = typeof dealApprovals.$inferSelect;
export type InsertDealApproval = z.infer<typeof insertDealApprovalSchema>;

export type ApprovalAction = typeof approvalActions.$inferSelect;
export type InsertApprovalAction = z.infer<typeof insertApprovalActionSchema>;

export type ApprovalDepartment = typeof approvalDepartments.$inferSelect;
export type InsertApprovalDepartment = z.infer<typeof insertApprovalDepartmentSchema>;

// Enhanced loss tracking system
export const lostReasons = [
  'client_budget_cut',
  'client_timeline_change', 
  'competitive_loss',
  'technical_unfeasibility',
  'internal_resource_constraint',
  'pricing_mismatch',
  'compliance_issue',
  'strategic_misalignment',
  'client_cancelled_project',
  'other'
] as const;

export type LostReason = typeof lostReasons[number];

// Deal loss tracking table
export const dealLossTracking = pgTable("deal_loss_tracking", {
  id: serial("id").primaryKey(),
  dealId: integer("deal_id").notNull(),
  lostReason: text("lost_reason", { enum: lostReasons }).notNull(),
  lostReasonDetails: text("lost_reason_details"),
  lostAt: timestamp("lost_at").defaultNow(),
  lostBy: integer("lost_by").notNull(),
  competitorName: text("competitor_name"),
  estimatedLostValue: text("estimated_lost_value"), // Using text for now to avoid decimal import
  lessonsLearned: text("lessons_learned"),
  followUpDate: timestamp("follow_up_date"),
});

// Loss tracking schema
export const insertDealLossTrackingSchema = createInsertSchema(dealLossTracking);

// Export loss tracking types
export type DealLossTracking = typeof dealLossTracking.$inferSelect;
export type InsertDealLossTracking = z.infer<typeof insertDealLossTrackingSchema>;

// Enhanced status transition rules - sellers can mark lost from any non-terminal status
export const statusTransitionRules: Record<DealStatus, DealStatus[]> = {
  draft: ["scoping", "submitted", "lost"],
  scoping: ["submitted", "lost"],
  submitted: ["under_review", "lost"],
  under_review: ["negotiating", "revision_requested", "approved", "lost"],
  revision_requested: ["under_review", "lost"],
  negotiating: ["approved", "revision_requested", "lost"],
  approved: ["contract_drafting", "lost"],
  contract_drafting: ["client_review", "negotiating", "lost"],
  client_review: ["signed", "contract_drafting", "lost"],
  signed: [], // Terminal state
  lost: [] // Terminal state
};

// Role-based lost transition permissions
export const lostTransitionPermissions = {
  seller: ['draft', 'scoping', 'submitted', 'revision_requested'],
  approver: ['under_review', 'negotiating', 'approved'], 
  legal: ['contract_drafting', 'client_review'],
  admin: ['all'] as const
};
