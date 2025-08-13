/**
 * Shared utility functions for processing form data before submission
 * Handles type conversions, data transformations, and business logic consistently across forms
 */

export interface FormDataWithNumbers {
  contractTermMonths?: string | number;
  growthAmbition?: string | number;
  [key: string]: any;
}

export interface AdvertiserData {
  id: string | number;
  name: string;
  region: string;
  previousYearRevenue?: number;
  previousYearMargin?: number;
}

export interface AgencyData {
  id: string | number;
  name: string;
  type: string;
  region: string;
  previousYearRevenue?: number;
  previousYearMargin?: number;
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
 * Calculates contract term in months from ISO date strings
 */
export function calculateContractTerm(startDateStr: string, endDateStr: string): number {
  if (!startDateStr || !endDateStr) return 12; // Default to 12 months
  
  const startDate = new Date(startDateStr);
  const endDate = new Date(endDateStr);
  return Math.max(1, (endDate.getFullYear() - startDate.getFullYear()) * 12 + (endDate.getMonth() - startDate.getMonth()));
}

/**
 * Determines region from selected advertiser or agency
 */
export function getRegionFromSelection(
  salesChannel: string,
  advertiserName: string,
  agencyName: string,
  advertisers: AdvertiserData[],
  agencies: AgencyData[]
): string | undefined {
  if (salesChannel === "client_direct" && advertiserName) {
    const advertiser = advertisers.find(a => a.name === advertiserName);
    return advertiser?.region;
  } else if (
    (salesChannel === "holding_company" || salesChannel === "independent_agency") && 
    agencyName
  ) {
    const agency = agencies.find(a => a.name === agencyName);
    return agency?.region;
  }
  return undefined;
}

/**
 * Creates pre-fill data mapping from scoping request to deal submission
 */
export function createPreFillMapping(scopingData: any): any {
  return {
    salesChannel: scopingData.salesChannel,
    region: scopingData.region,
    dealType: scopingData.dealType,
    dealStructure: scopingData.dealStructure,
    contractTermMonths: scopingData.contractTermMonths,
    termStartDate: scopingData.termStartDate,
    termEndDate: scopingData.termEndDate,
    advertiserName: scopingData.advertiserName || "",
    agencyName: scopingData.agencyName || "",
    growthOpportunityMIQ: scopingData.growthOpportunityMIQ || "",
    growthOpportunityClient: scopingData.growthOpportunityClient || "",
    clientAsks: scopingData.clientAsks || "",
    growthAmbition: scopingData.growthAmbition || 0,
    businessSummary: scopingData.description || "",
    dealName: `Deal from ${scopingData.requestTitle}`,
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

/**
 * Standard mutation success handler for deal submissions
 */
export function createSuccessHandler(
  toast: any,
  navigate: any,
  queryClient: any,
  queryKey: string,
  resetForm?: () => void,
  successMessage?: string,
  navigateTo?: string
) {
  return () => {
    if (resetForm) resetForm();
    queryClient.invalidateQueries({ queryKey: [queryKey] });
    toast({
      title: "Success",
      description: successMessage || "Operation completed successfully!",
      variant: "default",
    });
    if (navigateTo) navigate(navigateTo);
  };
}

/**
 * Standard mutation error handler for form submissions
 */
export function createErrorHandler(toast: any, defaultMessage?: string) {
  return (error: any) => {
    console.error("Form submission error:", error);
    toast({
      title: "Error",
      description: error.message || defaultMessage || "Operation failed",
      variant: "destructive",
    });
  };
}