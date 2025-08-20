// ❌ ELIMINATED: SelectedIncentive and TierIncentive imports - using DealTier only
// DealFinancialSummary type removed - using direct calculation metrics

// Import DealTier from the central hook
import { DealTier, getTotalIncentiveValue } from "@/hooks/useDealTiers";

// ❌ ELIMINATED: Legacy SelectedIncentive and TierIncentive interfaces  
// Now using DealTier as single source of truth for all incentive data

/**
 * Service class for all deal-related financial calculations
 * Extracted from SubmitDeal.tsx to improve maintainability and testability
 */
export class DealCalculationService {
  private advertisers: any[];
  private agencies: any[];

  constructor(advertisers: any[] = [], agencies: any[] = []) {
    this.advertisers = advertisers;
    this.agencies = agencies;
  }

  /**
   * Get previous year revenue value based on sales channel and client
   */
  getPreviousYearValue(salesChannel: string, advertiserName?: string, agencyName?: string): number {
    if (salesChannel === "client_direct" && advertiserName) {
      const advertiser = this.advertisers.find((a) => a.name === advertiserName);
      return advertiser?.previousYearRevenue || 2500000; // Default to Coca-Cola's revenue
    } else if (
      (salesChannel === "holding_company" || salesChannel === "independent_agency") &&
      agencyName
    ) {
      const agency = this.agencies.find((a) => a.name === agencyName);
      return agency?.previousYearRevenue || 620000; // Default to 72andSunny's revenue
    }

    return 2500000; // Default to industry average from our data
  }

  /**
   * Get previous year margin percentage
   */
  getPreviousYearMargin(salesChannel: string, advertiserName?: string, agencyName?: string): number {
    if (salesChannel === "client_direct" && advertiserName) {
      const advertiser = this.advertisers.find((a) => a.name === advertiserName);
      // ✅ FIXED: Data now stored as decimal, no conversion needed
      return advertiser?.previousYearMargin || 0.185; // Default to Coca-Cola's margin
    } else if (
      (salesChannel === "holding_company" || salesChannel === "independent_agency") &&
      agencyName
    ) {
      const agency = this.agencies.find((a) => a.name === agencyName);
      // ✅ FIXED: Data now stored as decimal, no conversion needed
      return agency?.previousYearMargin || 0.315; // Default to 72andSunny's margin
    }

    return 0.25; // Default to industry average from our data (25%)
  }

  /**
   * Get previous year gross profit
   */
  getPreviousYearGrossProfit(salesChannel: string, advertiserName?: string, agencyName?: string): number {
    const previousValue = this.getPreviousYearValue(salesChannel, advertiserName, agencyName);
    const previousMarginDecimal = this.getPreviousYearMargin(salesChannel, advertiserName, agencyName);
    return previousValue * previousMarginDecimal; // Now using decimal format directly
  }

  /**
   * Get previous year's incentive cost from actual data
   */
  getPreviousYearIncentiveCost(salesChannel: string, advertiserName?: string, agencyName?: string): number {
    if (salesChannel === "client_direct" && advertiserName) {
      const advertiser = this.advertisers.find((a) => a.name === advertiserName);
      return advertiser?.previousYearIncentiveCost || 45000; // Default to Coca-Cola's incentive cost
    } else if (
      (salesChannel === "holding_company" || salesChannel === "independent_agency") &&
      agencyName
    ) {
      const agency = this.agencies.find((a) => a.name === agencyName);
      return agency?.previousYearIncentiveCost || 22000; // Default to 72andSunny's incentive cost
    }

    return 35000; // Default to industry average from our data
  }



  /**
   * Calculate previous year's adjusted gross profit
   */
  getPreviousYearAdjustedGrossProfit(salesChannel: string, advertiserName?: string, agencyName?: string): number {
    const previousGrossProfit = this.getPreviousYearGrossProfit(salesChannel, advertiserName, agencyName);
    const previousIncentiveCost = this.getPreviousYearIncentiveCost(salesChannel, advertiserName, agencyName);
    return previousGrossProfit - previousIncentiveCost;
  }

  /**
   * Calculate previous year's adjusted gross margin dynamically
   */
  getPreviousYearAdjustedGrossMargin(salesChannel: string, advertiserName?: string, agencyName?: string): number {
    const previousRevenue = this.getPreviousYearValue(salesChannel, advertiserName, agencyName);
    const previousAdjustedProfit = this.getPreviousYearAdjustedGrossProfit(salesChannel, advertiserName, agencyName);
    
    if (previousRevenue === 0) return 0;
    return previousAdjustedProfit / previousRevenue; // Returns decimal (0.25 = 25%)
  }

  /**
   * Get previous year adjusted profit (alias for adjusted gross profit for consistency)
   */
  getPreviousYearAdjustedProfit(salesChannel: string, advertiserName?: string, agencyName?: string): number {
    return this.getPreviousYearAdjustedGrossProfit(salesChannel, advertiserName, agencyName);
  }

  /**
   * Get previous year client value from actual data
   */
  getPreviousYearClientValue(salesChannel: string, advertiserName?: string, agencyName?: string): number {
    if (salesChannel === "client_direct" && advertiserName) {
      const advertiser = this.advertisers.find((a) => a.name === advertiserName);
      return advertiser?.previousYearClientValue || 157500; // Default to Coca-Cola's client value
    } else if (
      (salesChannel === "holding_company" || salesChannel === "independent_agency") &&
      agencyName
    ) {
      const agency = this.agencies.find((a) => a.name === agencyName);
      return agency?.previousYearClientValue || 77000; // Default to 72andSunny's client value
    }

    return 122500; // Default to industry average from our data (35k * 3.5x)
  }

  // ========================================
  // PHASE 2: ENHANCED MIGRATION LOGIC
  // Migration from deprecated base deal fields to tier + historical data
  // ========================================

  /**
   * MIGRATION: Get current year annual revenue (replaces deprecated deal.annualRevenue)
   * Uses tier data aggregation as primary source
   */
  getCurrentYearRevenue(tiers: DealTier[]): number {
    return tiers.reduce((sum, tier) => sum + (tier.annualRevenue || 0), 0);
  }

  /**
   * MIGRATION: Get current year gross margin (replaces deprecated deal.annualGrossMargin)
   * Calculates weighted average from tier data
   */
  getCurrentYearGrossMargin(tiers: DealTier[]): number {
    const totalRevenue = this.getCurrentYearRevenue(tiers);
    if (totalRevenue === 0) return 0;
    
    const totalGrossProfit = tiers.reduce((sum, tier) => 
      sum + (tier.annualRevenue || 0) * (tier.annualGrossMargin || 0), 0
    );
    
    return totalGrossProfit / totalRevenue; // Returns decimal (0.25 = 25%)
  }

  /**
   * MIGRATION: Get current year incentive cost (replaces deprecated deal.addedValueBenefitsCost)
   * Uses tier incentive values aggregation
   */
  getCurrentYearIncentiveCost(tiers: DealTier[]): number {
    return tiers.reduce((sum, tier) => sum + (tier.incentiveValue || 0), 0);
  }

  /**
   * MIGRATION: Calculate yearly revenue growth rate (replaces deprecated deal.yearlyRevenueGrowthRate)
   * Uses current tier data vs historical advertiser/agency data
   */
  getYearlyRevenueGrowthRate(tiers: DealTier[], salesChannel: string, advertiserName?: string, agencyName?: string): number {
    const currentRevenue = this.getCurrentYearRevenue(tiers);
    const previousRevenue = this.getPreviousYearValue(salesChannel, advertiserName, agencyName);
    
    return previousRevenue > 0 ? ((currentRevenue - previousRevenue) / previousRevenue) : 0;
  }

  /**
   * MIGRATION: Calculate yearly margin growth rate (replaces deprecated deal.yearlyMarginGrowthRate)
   * Uses current tier margin vs historical advertiser/agency margin
   */
  getYearlyMarginGrowthRate(tiers: DealTier[], salesChannel: string, advertiserName?: string, agencyName?: string): number {
    const currentMargin = this.getCurrentYearGrossMargin(tiers);
    const previousMargin = this.getPreviousYearMargin(salesChannel, advertiserName, agencyName);
    
    return previousMargin > 0 ? ((currentMargin - previousMargin) / previousMargin) : 0;
  }

  /**
   * MIGRATION: Calculate forecasted margin (replaces deprecated deal.forecastedMargin)
   * Projects margin based on tier data and growth trends
   */
  getForecastedMargin(tiers: DealTier[], salesChannel: string, advertiserName?: string, agencyName?: string): number {
    const currentMargin = this.getCurrentYearGrossMargin(tiers);
    const marginGrowthRate = this.getYearlyMarginGrowthRate(tiers, salesChannel, advertiserName, agencyName);
    
    // Project next year margin based on current + growth trend
    return Math.max(0, Math.min(1, currentMargin * (1 + marginGrowthRate))); // Cap between 0-100%
  }

  /**
   * MIGRATION: Complete deal financial data using tier + historical data
   * Replaces all deprecated base deal financial fields with calculated equivalents
   */
  getMigratedDealFinancials(tiers: DealTier[], salesChannel: string, advertiserName?: string, agencyName?: string) {
    return {
      // Current year (from tiers)
      annualRevenue: this.getCurrentYearRevenue(tiers),
      annualGrossMargin: this.getCurrentYearGrossMargin(tiers),
      addedValueBenefitsCost: this.getCurrentYearIncentiveCost(tiers),
      
      // Historical (from advertiser/agency tables)
      previousYearRevenue: this.getPreviousYearValue(salesChannel, advertiserName, agencyName),
      previousYearMargin: this.getPreviousYearMargin(salesChannel, advertiserName, agencyName),
      
      // Calculated/Derived (combination of current + historical)
      yearlyRevenueGrowthRate: this.getYearlyRevenueGrowthRate(tiers, salesChannel, advertiserName, agencyName),
      yearlyMarginGrowthRate: this.getYearlyMarginGrowthRate(tiers, salesChannel, advertiserName, agencyName),
      forecastedMargin: this.getForecastedMargin(tiers, salesChannel, advertiserName, agencyName),
    };
  }

  /**
   * Calculate client value using 3.5x multiplier on incentive cost
   */
  calculateClientValueFromIncentives(tier: DealTier): number {
    const incentiveCost = this.calculateTierIncentiveCost(tier);
    return incentiveCost * 3.5; // 3.5x multiplier for realistic ROI
  }

  /**
   * Calculate incentive cost growth rate compared to previous year
   */
  calculateIncentiveCostGrowthRate(tier: DealTier, salesChannel: string, advertiserName?: string, agencyName?: string): number {
    const currentCost = this.calculateTierIncentiveCost(tier);
    const previousCost = this.getPreviousYearIncentiveCost(salesChannel, advertiserName, agencyName);
    return previousCost > 0 ? ((currentCost - previousCost) / previousCost) : 0;
  }

  /**
   * Calculate client value growth rate compared to previous year  
   */
  calculateClientValueGrowthRateFromIncentives(tier: DealTier, salesChannel: string, advertiserName?: string, agencyName?: string): number {
    const currentValue = this.calculateClientValueFromIncentives(tier);
    const previousValue = this.getPreviousYearClientValue(salesChannel, advertiserName, agencyName);
    return previousValue > 0 ? ((currentValue - previousValue) / previousValue) : 0;
  }

  /**
   * Calculate current client value (40% of tier revenue)
   */
  calculateClientValue(tier: DealTier): number {
    const revenue = tier.annualRevenue || 0;
    return revenue * 0.4; // 40% of current tier revenue
  }

  /**
   * Calculate basic gross profit (revenue * margin only)
   * Standardizes simple gross profit calculations across components
   */
  calculateBasicGrossProfit(tier: DealTier): number {
    return (tier.annualRevenue || 0) * (tier.annualGrossMargin || 0);
  }

  /**
   * Calculate tier gross profit (revenue * margin - incentive cost)
   */
  calculateTierGrossProfit(tier: DealTier): number {
    const revenue = tier.annualRevenue || 0;
    const marginDecimal = tier.annualGrossMargin || 0;
    const grossProfit = revenue * marginDecimal; // Already a decimal (0.355 for 35.5%)
    
    // Subtract incentive cost for this tier
    const incentiveCost = getTotalIncentiveValue(tier);
    return grossProfit - incentiveCost;
  }

  /**
   * Calculate total incentive cost for a tier
   */
  // ✅ FIXED: Using getTotalIncentiveValue for array-based incentives
  calculateTierIncentiveCost(tier: DealTier): number {
    // Sum all incentive values from the incentives array
    return getTotalIncentiveValue(tier);
  }

  /**
   * Calculate gross margin growth rate for a tier
   */
  calculateGrossMarginGrowthRate(tier: DealTier, salesChannel: string, advertiserName?: string, agencyName?: string): number {
    const previousYearMarginDecimal = this.getPreviousYearMargin(salesChannel, advertiserName, agencyName);
    const currentMarginDecimal = tier.annualGrossMargin || 0;
    
    if (previousYearMarginDecimal === 0) return 0;
    
    // Calculate as decimal growth rate: (Current - Previous) / Previous
    // GrowthIndicator will multiply by 100 for display
    return (currentMarginDecimal - previousYearMarginDecimal) / previousYearMarginDecimal;
  }

  /**
   * Calculate profit growth rate for a tier
   */
  calculateProfitGrowthRate(tier: DealTier, salesChannel: string, advertiserName?: string, agencyName?: string): number {
    const previousYearRevenue = this.getPreviousYearValue(salesChannel, advertiserName, agencyName);
    const previousYearMarginDecimal = this.getPreviousYearMargin(salesChannel, advertiserName, agencyName);
    
    // Calculate previous year profit and current profit (both using decimal margins)
    const previousYearProfit = previousYearRevenue * previousYearMarginDecimal;
    const currentProfit = (tier.annualRevenue || 0) * (tier.annualGrossMargin || 0);

    // Calculate growth rate
    if (previousYearProfit <= 0) return 0;
    
    // Return as decimal growth rate - GrowthIndicator will multiply by 100 for display
    return currentProfit / previousYearProfit - 1;
  }

  /**
   * Calculate revenue growth rate for a tier
   */
  calculateRevenueGrowthRate(tier: DealTier, salesChannel: string, advertiserName?: string, agencyName?: string): number {
    const previousYearRevenue = this.getPreviousYearValue(salesChannel, advertiserName, agencyName);
    const currentRevenue = tier.annualRevenue || 0;
    
    if (previousYearRevenue <= 0) return 0;
    
    // Return as decimal growth rate - GrowthIndicator will multiply by 100 for display
    return (currentRevenue - previousYearRevenue) / previousYearRevenue;
  }

  /**
   * Calculate financial summary for the entire deal
   */
  calculateDealMetrics(
    dealTiers: DealTier[]
  ): {
    totalAnnualRevenue: number;
    totalGrossMargin: number;
    averageGrossMarginPercent: number;
    totalIncentiveValue: number;
  } {
    let totalAnnualRevenue = 0;
    let totalGrossMargin = 0;
    let totalIncentiveValue = 0;

    // Calculate totals from all tiers using DealTier as single source of truth
    dealTiers.forEach((tier) => {
      totalAnnualRevenue += tier.annualRevenue || 0;
      totalGrossMargin += ((tier.annualRevenue || 0) * (tier.annualGrossMargin || 0)); // Already decimal
      totalIncentiveValue += getTotalIncentiveValue(tier); // Sum from incentives array
    });

    const averageGrossMarginPercent = totalAnnualRevenue > 0 ? (totalGrossMargin / totalAnnualRevenue) * 100 : 0;
    const projectedNetValue = totalGrossMargin - totalIncentiveValue;

    return {
      totalAnnualRevenue,
      totalGrossMargin,
      averageGrossMarginPercent,
      totalIncentiveValue
    };
  }

  /**
   * Create AI analysis data from tier records for both tiered and flat deals
   * This ensures consistent data source for AI analysis regardless of deal structure
   */
  createAIAnalysisData(
    dealTiers: DealTier[],
    salesChannel: string,
    dealType: string,
    dealStructure: string,
    advertiserName?: string,
    agencyName?: string,
    addedValueBenefitsCost?: number
  ): any {
    if (dealTiers.length === 0) {
      return null;
    }

    const dealMetrics = this.calculateDealMetrics(dealTiers);
    
    // For flat deals, use tier 1 data directly
    // For tiered deals, use aggregated data from all tiers
    const analysisRevenue = dealStructure === 'flat_commit' 
      ? (dealTiers[0]?.annualRevenue || 0)
      : dealMetrics.totalAnnualRevenue;
      
    const analysisMargin = dealStructure === 'flat_commit'
      ? (dealTiers[0]?.annualGrossMargin || 0)
      : (dealMetrics.totalGrossMargin / dealMetrics.totalAnnualRevenue);
      
    const analysisIncentiveCost = dealStructure === 'flat_commit'
      ? getTotalIncentiveValue(dealTiers[0] || { incentives: [] } as any)
      : dealMetrics.totalIncentiveValue;

    return {
      dealType,
      dealStructure,
      salesChannel,
      advertiserName,
      agencyName,
      // Use tier data as the authoritative source
      annualRevenue: analysisRevenue,
      annualGrossMargin: analysisMargin, // Keep as decimal
      totalIncentiveCost: analysisIncentiveCost,
      addedValueBenefitsCost: addedValueBenefitsCost || 0,
      // Calculate derived metrics
      grossProfit: analysisRevenue * analysisMargin,
      netProfit: (analysisRevenue * analysisMargin) - analysisIncentiveCost - (addedValueBenefitsCost || 0),
      // Include tier structure for context
      tierCount: dealTiers.length,
      tiers: dealTiers.map(tier => ({
        tierNumber: tier.tierNumber,
        revenue: tier.annualRevenue,
        margin: tier.annualGrossMargin,
        incentiveCost: getTotalIncentiveValue(tier)
      }))
    };
  }

  /**
   * Generate deal analysis insights
   */
  generateDealAnalysis(
    dealTiers: DealTier[],
    salesChannel: string,
    advertiserName?: string,
    agencyName?: string
  ): string {
    if (dealTiers.length === 0) {
      return "Unable to analyze deal structure with the current data. Please ensure all tier values are completed.";
    }

    const dealMetrics = this.calculateDealMetrics(dealTiers);
    
    // Calculate growth rates for analysis
    let revenueGrowthRate = 0;
    let profitGrowthRate = 0;
    
    if (dealTiers.length > 0) {
      const firstTier = dealTiers[0];
      revenueGrowthRate = this.calculateRevenueGrowthRate(firstTier, salesChannel, advertiserName, agencyName);
      profitGrowthRate = this.calculateProfitGrowthRate(firstTier, salesChannel, advertiserName, agencyName);
    }

    // Calculate effective discount rate inline
    const effectiveDiscountRate = dealMetrics.totalAnnualRevenue > 0 
      ? (dealMetrics.totalIncentiveValue / dealMetrics.totalAnnualRevenue) * 100 
      : 0;

    // Generate analysis based on metrics
    if (effectiveDiscountRate > 15) {
      return "This deal structure has a high incentive rate (>15%). Consider reviewing the incentive structure to ensure it aligns with profitability targets.";
    } else if (dealMetrics.averageGrossMarginPercent < 25) {
      return "This deal structure shows lower than typical gross margins (<25%). Recommend reviewing pricing strategy or cost structure.";
    } else if (revenueGrowthRate > 0 && profitGrowthRate > 0) {
      return "This deal structure shows positive growth in both revenue and profitability, though the approval matrix indicates additional oversight required.";
    } else if (revenueGrowthRate < 0) {
      return "This deal structure shows a revenue decrease compared to last year. Recommend revisiting revenue targets before submission.";
    }

    return "Deal structure appears balanced with reasonable growth projections and margin targets.";
  }

  /**
   * Calculate gross profit growth rate for a tier
   */
  calculateGrossProfitGrowthRate(
    tier: DealTier, 
    salesChannel: string, 
    advertiserName?: string, 
    agencyName?: string
  ): number {
    const currentProfit = (tier.annualRevenue || 0) * (tier.annualGrossMargin || 0); // Already decimal
    const previousProfit = this.getPreviousYearGrossProfit(salesChannel, advertiserName, agencyName);

    if (previousProfit === 0) return 0;
    return currentProfit / previousProfit - 1;
  }

  /**
   * Calculate adjusted gross profit growth rate for a tier
   */
  calculateAdjustedGrossProfitGrowthRate(
    tier: DealTier,
    salesChannel: string,
    advertiserName?: string,
    agencyName?: string
  ): number {
    // Get the current tier's adjusted gross profit (gross profit minus incentive costs)
    const revenue = tier.annualRevenue || 0;
    const grossProfit = revenue * (tier.annualGrossMargin || 0); // Already decimal
    const incentiveCost = getTotalIncentiveValue(tier); // Sum from incentives array
    const currentAdjustedProfit = grossProfit - incentiveCost;

    // For last year's adjusted gross profit, we need to do the same calculation with last year's values
    const lastYearRevenue = this.getPreviousYearValue(salesChannel, advertiserName, agencyName); // 850,000
    const lastYearMarginDecimal = this.getPreviousYearMargin(salesChannel, advertiserName, agencyName); // 0.35 (35%)
    const lastYearGrossProfit = lastYearRevenue * lastYearMarginDecimal; // 297,500
    const lastYearIncentiveCost = this.getPreviousYearIncentiveCost(salesChannel, advertiserName, agencyName); // Dynamic based on selection
    const lastYearAdjustedProfit = lastYearGrossProfit - lastYearIncentiveCost; // 247,500 (297,500 - 50,000)

    if (lastYearAdjustedProfit === 0) return 0;
    return (currentAdjustedProfit - lastYearAdjustedProfit) / lastYearAdjustedProfit;
  }

  /**
   * Calculate adjusted gross margin for a tier
   */
  calculateAdjustedGrossMargin(tier: DealTier): number {
    // Get the current tier's adjusted gross profit (gross profit minus incentive costs)
    const revenue = tier.annualRevenue || 0;
    const grossProfit = revenue * (tier.annualGrossMargin || 0); // Already decimal
    const incentiveCost = getTotalIncentiveValue(tier); // Sum from incentives array
    const adjustedGrossProfit = grossProfit - incentiveCost;

    if (revenue === 0) return 0;
    return adjustedGrossProfit / revenue;
  }

  /**
   * Calculate adjusted gross profit for a tier (gross profit after incentive costs)
   */
  calculateAdjustedGrossProfit(tier: DealTier): number {
    const revenue = tier.annualRevenue || 0;
    const grossProfit = revenue * (tier.annualGrossMargin || 0); // Already decimal
    const incentiveCost = getTotalIncentiveValue(tier); // Sum from incentives array
    return grossProfit - incentiveCost;
  }

  /**
   * Calculate adjusted gross margin growth rate for a tier
   */
  calculateAdjustedGrossMarginGrowthRate(
    tier: DealTier,
    salesChannel: string,
    advertiserName?: string,
    agencyName?: string
  ): number {
    // Calculate current tier's adjusted gross margin as a decimal
    const revenue = tier.annualRevenue || 0;
    const grossProfit = revenue * (tier.annualGrossMargin || 0); // Already decimal
    const incentiveCost = getTotalIncentiveValue(tier); // Sum from incentives array
    const adjustedGrossProfit = grossProfit - incentiveCost;
    const currentAdjustedGrossMargin = revenue > 0 ? adjustedGrossProfit / revenue : 0;

    // Calculate last year's adjusted gross margin as a decimal (0.35 in your example)
    const lastYearRevenue = this.getPreviousYearValue(salesChannel, advertiserName, agencyName); // 850,000
    const lastYearMarginDecimal = this.getPreviousYearMargin(salesChannel, advertiserName, agencyName); // 0.35 (35%)
    const lastYearGrossProfit = lastYearRevenue * lastYearMarginDecimal; // 297,500
    const lastYearIncentiveCost = this.getPreviousYearIncentiveCost(salesChannel, advertiserName, agencyName); // Dynamic based on selection
    const lastYearAdjustedProfit = lastYearGrossProfit - lastYearIncentiveCost; // 247,500 (297,500 - 50,000)
    const lastYearAdjustedGrossMargin = lastYearRevenue > 0 ? lastYearAdjustedProfit / lastYearRevenue : 0;

    // Calculate growth rate as percentage change
    if (lastYearAdjustedGrossMargin === 0) return 0;
    return (currentAdjustedGrossMargin - lastYearAdjustedGrossMargin) / lastYearAdjustedGrossMargin;
  }

  /**
   * Calculate client value growth rate for a tier
   */
  calculateClientValueGrowthRate(
    tier: DealTier,
    salesChannel: string,
    advertiserName?: string,
    agencyName?: string
  ): number {
    const currentClientValue = this.calculateClientValue(tier);
    const previousClientValue = this.getPreviousYearClientValue(salesChannel, advertiserName, agencyName);

    if (previousClientValue === 0) return 0;
    return currentClientValue / previousClientValue - 1;
  }

  /**
   * Calculate cost growth rate for a tier
   */
  calculateCostGrowthRate(tier: DealTier, salesChannel: string, advertiserName?: string, agencyName?: string): number {
    const currentIncentiveCost = this.calculateTierIncentiveCost(tier);
    const previousIncentiveCost = this.getPreviousYearIncentiveCost(salesChannel, advertiserName, agencyName); // Dynamic based on selection

    // With the new incentive cost of 50,000, this condition will no longer be triggered
    if (previousIncentiveCost === 0) return 0;
    return currentIncentiveCost / previousIncentiveCost - 1;
  }

  /**
   * Update advertiser and agency data
   */
  updateClientData(advertisers: any[], agencies: any[]): void {
    this.advertisers = advertisers;
    this.agencies = agencies;
  }
}

// Export a default instance for convenience
export const dealCalculationService = new DealCalculationService();