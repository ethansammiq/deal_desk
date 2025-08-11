/**
 * Business Constants Configuration
 * Centralized location for all hardcoded business values used throughout the application
 */

export const DEAL_CONSTANTS = {
  // Tier Management
  MAX_TIERS: 5,
  MIN_TIERS: 1,
  DEFAULT_TIER_COUNT: 1,
  
  // Financial Defaults
  DEFAULT_GROSS_MARGIN: 0.35, // 35% as decimal
  DEFAULT_CONTRACT_TERM_MONTHS: 12,
  DEFAULT_ANNUAL_REVENUE: 0,
  
  // Percentage Limits
  MAX_GROSS_MARGIN_PERCENT: 100,
  MIN_GROSS_MARGIN_PERCENT: 0,
  MAX_INCENTIVE_PERCENT: 100,
  MIN_INCENTIVE_PERCENT: 0,
  
  // Approval Thresholds (in USD)
  APPROVAL_THRESHOLDS: {
    MANAGER: 50000,
    DIRECTOR: 100000,
    VP: 500000,
    SVP: 1000000,
  },
  
  // Form Validation
  MAX_FORM_STEPS: 5, // Keep forms under 5 steps for user experience
  
  // Deal Types
  DEFAULT_DEAL_TYPE: "grow",
  DEFAULT_SALES_CHANNEL: "independent_agency",
  
  // Historical Data Defaults (fallback values)
  DEFAULT_LAST_YEAR_REVENUE: 50000,
  DEFAULT_LAST_YEAR_MARGIN: 35,
  DEFAULT_LAST_YEAR_INCENTIVE_COST: 50000,
} as const;

export const INCENTIVE_CONSTANTS = {
  // Default Categories
  DEFAULT_CATEGORY: "financial",
  DEFAULT_SUB_CATEGORY: "discounts",
  DEFAULT_SPECIFIC_INCENTIVE: "Volume Discount",
  
  // Available Categories (matching database enum)
  CATEGORIES: [
    "financial",
    "resources", 
    "product-innovation",
    "technology",
    "analytics",
    "marketing"
  ] as const,
  
  // Category Display Names
  CATEGORY_NAMES: {
    "financial": "Financial Incentives",
    "resources": "Resource Allocation",
    "product-innovation": "Product Innovation",
    "technology": "Technology Access",
    "analytics": "Analytics & Insights",
    "marketing": "Marketing Support"
  },
} as const;

export const FORM_CONSTANTS = {
  // Step Definitions
  SUBMIT_DEAL_STEPS: 4,
  REQUEST_SUPPORT_STEPS: 3,
  
  // Step Names
  SUBMIT_DEAL_STEP_NAMES: [
    "Deal Overview",
    "Business Context", 
    "Value Structure",
    "Review & Submit"
  ] as const,
  
  REQUEST_SUPPORT_STEP_NAMES: [
    "Client Information",
    "Deal Timeline", 
    "Growth Opportunity"
  ] as const,
  
  // Validation Settings
  ENABLE_AUTO_ADVANCE: false,
  VALIDATE_ON_CHANGE: true,
} as const;

export const UI_CONSTANTS = {
  // Loading and Animation
  SUBMIT_BUTTON_MIN_WIDTH: 120,
  SPINNER_SIZE: 16, // h-4 w-4 in Tailwind
  
  // Formatting
  CURRENCY_LOCALE: "en-US",
  CURRENCY_CODE: "USD",
  PERCENTAGE_DECIMAL_PLACES: 2,
  
  // Reference Number Generation
  REFERENCE_PREFIX: "DEAL",
  REFERENCE_YEAR_FORMAT: true,
  
  // Display Name Mappings (for legacy compatibility)
  DEAL_TYPE_DISPLAY_NAMES: {
    "grow": "Grow",
    "protect": "Protect", 
    "custom": "Custom"
  },
  
  SALES_CHANNEL_DISPLAY_NAMES: {
    "client_direct": "Direct",
    "holding_company": "Holding",
    "independent_agency": "Indep"
  },
  
  DEAL_STRUCTURE_DISPLAY_NAMES: {
    "tiered": "Tiered",
    "flat_commit": "Flat"
  },
} as const;

// Type exports for TypeScript safety
export type DealType = typeof DEAL_CONSTANTS.DEFAULT_DEAL_TYPE;
export type SalesChannel = typeof DEAL_CONSTANTS.DEFAULT_SALES_CHANNEL;
export type IncentiveCategory = typeof INCENTIVE_CONSTANTS.CATEGORIES[number];