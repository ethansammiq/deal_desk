// Removed date-fns import - using ISO 8601 strings directly

/**
 * Service for handling data display mapping and formatting
 * Extracted from SubmitDeal.tsx to centralize mapping logic
 */
export class DataMappingService {
  // Static mapping configurations
  static readonly regionDisplayNames: Record<string, string> = {
    northeast: "Northeast",
    midwest: "Midwest",
    midatlantic: "Mid-Atlantic",
    south: "South",
    west: "West",
    southeast: "Southeast",
    southwest: "Southwest",
  };

  static readonly dealTypeDisplayNames: Record<string, string> = {
    standard_deal: "Standard Deal",
    seasonal_promotion: "Seasonal Promotion",
    annual_commitment: "Annual Commitment",
    new_business: "New Business",
    grow: "Grow",
  };

  static readonly salesChannelDisplayNames: Record<string, string> = {
    client_direct: "Client Direct",
    agency: "Agency",
    holding_company: "Holding Company",
    independent_agency: "Independent Agency",
  };

  static readonly dealStructureDisplayNames: Record<string, string> = {
    tiered: "Tiered",
    flat_commit: "Flat Commitment",
  };

  // Mapping objects for deal name generation (shortened versions)
  static readonly dealTypeMap: Record<string, string> = {
    standard_deal: "STD",
    seasonal_promotion: "SEAS",
    annual_commitment: "ANN",
    new_business: "NEW",
    grow: "GROW",
  };

  static readonly salesChannelMap: Record<string, string> = {
    client_direct: "CD",
    agency: "AG",
    holding_company: "HC",
    independent_agency: "IA",
  };

  static readonly dealStructureMap: Record<string, string> = {
    tiered: "TR",
    flat_commit: "FC",
  };

  /**
   * Format a field value for display using appropriate mapping
   */
  static formatDisplayValue(field: string, value: any): string {
    if (!value) return "Not provided";

    const stringValue = String(value);

    switch (field) {
      case "region":
        return this.regionDisplayNames[stringValue] || 
               stringValue.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
      
      case "dealType":
        return this.dealTypeDisplayNames[stringValue] || stringValue;
      
      case "salesChannel":
        return this.salesChannelDisplayNames[stringValue] || stringValue;
      
      case "dealStructure":
        return this.dealStructureDisplayNames[stringValue] || stringValue;
      
      default:
        return stringValue;
    }
  }

  /**
   * Generate a standardized deal name from form data
   */
  static generateDealName(formData: {
    dealType?: string;
    salesChannel?: string;
    dealStructure?: string;
    advertiserName?: string;
    agencyName?: string;
    termStartDate?: Date;
    termEndDate?: Date;
  }): string {
    const {
      dealType,
      salesChannel,
      dealStructure,
      advertiserName,
      agencyName,
      termStartDate,
      termEndDate
    } = formData;

    // Determine client name based on sales channel
    let clientName = "UNKNOWN";
    if (salesChannel === "client_direct" && advertiserName) {
      // Remove spaces and special characters, take first 8 chars, uppercase
      clientName = advertiserName
        .replace(/[^a-zA-Z0-9]/g, "")
        .substring(0, 8)
        .toUpperCase();
    } else if (agencyName) {
      // Remove spaces and special characters, take first 8 chars, uppercase
      clientName = agencyName
        .replace(/[^a-zA-Z0-9]/g, "")
        .substring(0, 8)
        .toUpperCase();
    }

    // Format dates - using ISO date strings
    const startDateFormatted = termStartDate ? new Date(termStartDate).toISOString().split('T')[0].replace(/-/g, '') : "NODATE";
    const endDateFormatted = termEndDate ? new Date(termEndDate).toISOString().split('T')[0].replace(/-/g, '') : "NODATE";

    // Safely access map values with type casting and fallbacks
    const dealTypeKey = typeof dealType === "string" 
      ? (dealType as keyof typeof this.dealTypeMap) 
      : "grow";
    const salesChannelKey = typeof salesChannel === "string" 
      ? (salesChannel as keyof typeof this.salesChannelMap) 
      : "client_direct";
    const dealStructureKey = typeof dealStructure === "string" 
      ? (dealStructure as keyof typeof this.dealStructureMap) 
      : "flat_commit";

    // Generate deal name using the mapping
    return `${this.dealTypeMap[dealTypeKey]}_${this.salesChannelMap[salesChannelKey]}_${clientName}_${this.dealStructureMap[dealStructureKey]}_${startDateFormatted}-${endDateFormatted}`;
  }

  /**
   * Get all available options for a specific field
   */
  static getFieldOptions(field: string): Array<{ value: string; label: string }> {
    switch (field) {
      case "region":
        return Object.entries(this.regionDisplayNames).map(([value, label]) => ({ value, label }));
      
      case "dealType":
        return Object.entries(this.dealTypeDisplayNames).map(([value, label]) => ({ value, label }));
      
      case "salesChannel":
        return Object.entries(this.salesChannelDisplayNames).map(([value, label]) => ({ value, label }));
      
      case "dealStructure":
        return Object.entries(this.dealStructureDisplayNames).map(([value, label]) => ({ value, label }));
      
      default:
        return [];
    }
  }

  /**
   * Validate that a value exists in the mapping for a field
   */
  static isValidFieldValue(field: string, value: string): boolean {
    switch (field) {
      case "region":
        return value in this.regionDisplayNames;
      
      case "dealType":
        return value in this.dealTypeDisplayNames;
      
      case "salesChannel":
        return value in this.salesChannelDisplayNames;
      
      case "dealStructure":
        return value in this.dealStructureDisplayNames;
      
      default:
        return true; // For unknown fields, assume valid
    }
  }
}