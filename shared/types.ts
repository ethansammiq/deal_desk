/**
 * Shared type definitions for the Deal Desk application
 * Production-ready interfaces using name-based primary identifiers
 */

// Production-ready client data interfaces
export interface AdvertiserData {
  name: string;          // Primary identifier - used for all lookups and form processing
  region: string;        // Business region for the advertiser
  previousYearRevenue?: number;
  previousYearMargin?: number;
  previousYearProfit?: number;
  previousYearIncentiveCost?: number;
  previousYearClientValue?: number;
  // Optional fields for development/testing only (not relied upon in production)
  id?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface AgencyData {
  name: string;          // Primary identifier - used for all lookups and form processing
  type: string;          // "holding_company" | "independent" - determines available options
  region: string;        // Business region for the agency
  previousYearRevenue?: number;
  previousYearMargin?: number;
  previousYearProfit?: number;
  previousYearIncentiveCost?: number;
  previousYearClientValue?: number;
  // Optional fields for development/testing only (not relied upon in production)
  id?: number;
  createdAt?: string;
  updatedAt?: string;
}

// Form data processing interfaces
export interface FormDataWithNumbers {
  contractTermMonths?: string | number;
  growthAmbition?: string | number;
  [key: string]: any;
}

// Common form field types used across deal forms
export type DealType = "custom" | "grow" | "protect";
export type DealStructure = "tiered" | "flat_commit";
export type SalesChannel = "client_direct" | "holding_company" | "independent_agency";
export type Region = "northeast" | "midwest" | "midatlantic" | "west" | "south";

// Business workflow types  
export type DealStatus = "scoping" | "submitted" | "under_review" | "negotiating" | "approved" | "legal_review" | "contract_sent" | "signed" | "lost";

export interface ClientSelection {
  // Form values - always use names for selections
  advertiserName?: string;    // Selected advertiser name from dropdown
  agencyName?: string;       // Selected agency name from dropdown  
  salesChannel?: SalesChannel;
  region?: Region;
}

/**
 * Production Pattern Notes:
 * 
 * 1. Primary Identifiers: Always use 'name' field for lookups and form processing
 * 2. Historical Data: Access via name-based finds: advertisers.find(a => a.name === advertiserName)
 * 3. API Compatibility: Real APIs provide names in dropdowns, not database IDs
 * 4. React Keys: Use name for key attributes: key={advertiser.name}
 * 5. Form Processing: Store advertiserName/agencyName strings in form data
 */