/**
 * Shared utility functions for processing form data before submission
 * Handles type conversions and data transformations consistently across forms
 */

export interface FormDataWithNumbers {
  contractTermMonths?: string | number;
  growthAmbition?: string | number;
  [key: string]: any;
}

/**
 * Converts string fields to numbers for backend compatibility
 * Used by both Deal Scoping and Deal Submission forms
 */
export function processFormDataForSubmission(data: FormDataWithNumbers): any {
  return {
    ...data,
    // Convert string numbers to actual numbers for backend validation
    contractTermMonths: data.contractTermMonths ? Number(data.contractTermMonths) : undefined,
    growthAmbition: data.growthAmbition ? Number(data.growthAmbition) : undefined,
  };
}

/**
 * Processes Deal Scoping form data with required backend fields
 */
export function processDealScopingData(data: FormDataWithNumbers): any {
  const processedData = processFormDataForSubmission(data);
  
  return {
    ...processedData,
    // Ensure growthAmbition has a minimum value for scoping requests
    growthAmbition: Number(processedData.growthAmbition || 1000000),
    // Add required backend fields
    requestTitle: "Deal Scoping Request",
    description: "Growth opportunity assessment request",
  };
}

/**
 * Processes Deal Submission form data with all necessary transformations
 */
export function processDealSubmissionData(
  data: FormDataWithNumbers, 
  dealName: string,
  dealStructureType: string,
  dealTiers: any[],
  defaultAnnualRevenue: number,
  defaultGrossMargin: number
): any {
  const processedData = processFormDataForSubmission(data);
  
  return {
    ...processedData,
    dealName: dealName,
    // Convert contract term with default fallback
    contractTermMonths: processedData.contractTermMonths ? Number(processedData.contractTermMonths) : 12,
    // Add missing required fields for API compatibility
    annualRevenue: data.annualRevenue || defaultAnnualRevenue,
    annualGrossMargin: (data.annualGrossMarginPercent || defaultGrossMargin * 100) / 100,
    // Only include dealTiers if the structure is tiered
    ...(dealStructureType === "tiered" ? { dealTiers: dealTiers } : {}),
  };
}