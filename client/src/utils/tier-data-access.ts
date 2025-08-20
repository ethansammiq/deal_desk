/**
 * Direct Tier Data Access Utilities
 * Replaces migratedFinancials compatibility layer with direct tier access
 * 
 * Core Principle: Use expected tier logic (Tier 2 or first available)
 * NO aggregation across all tiers - always single tier selection
 */

import { DealTier } from "@/hooks/useDealTiers";
import { getTotalIncentiveValue } from "@/hooks/useDealTiers";

/**
 * Core tier selection using expected tier business logic
 * Replaces: deal.migratedFinancials.* access patterns
 */
export const TierDataAccess = {
  /**
   * Get the expected tier for financial calculations
   * Business Logic: Tier 2 if exists, otherwise first available tier
   */
  getExpectedTier(tiers: DealTier[]): DealTier | null {
    if (!tiers || tiers.length === 0) return null;
    
    // Look for Tier 2 first (expected tier)
    const tier2 = tiers.find(tier => tier.tierNumber === 2);
    if (tier2) return tier2;
    
    // Fallback to first available tier
    return tiers[0] || null;
  },

  /**
   * Get expected annual revenue for the deal
   * Replaces: deal.migratedFinancials.annualRevenue
   */
  getExpectedRevenue(tiers: DealTier[]): number {
    const expectedTier = this.getExpectedTier(tiers);
    return expectedTier?.annualRevenue || 0;
  },

  /**
   * Get expected gross margin for the deal  
   * Replaces: deal.migratedFinancials.annualGrossMargin
   */
  getExpectedGrossMargin(tiers: DealTier[]): number {
    const expectedTier = this.getExpectedTier(tiers);
    return expectedTier?.annualGrossMargin || 0;
  },

  /**
   * Get expected incentive cost for the deal
   * Replaces: deal.migratedFinancials.addedValueBenefitsCost
   */
  getExpectedIncentiveCost(tiers: DealTier[]): number {
    const expectedTier = this.getExpectedTier(tiers);
    if (!expectedTier) return 0;
    
    // Use shared utility for incentive calculation
    return getTotalIncentiveValue(expectedTier);
  },

  /**
   * Calculate expected gross profit (revenue * margin - incentives)
   * New utility for components that need profit calculations
   */
  getExpectedGrossProfit(tiers: DealTier[]): number {
    const revenue = this.getExpectedRevenue(tiers);
    const marginDecimal = this.getExpectedGrossMargin(tiers);
    const incentiveCost = this.getExpectedIncentiveCost(tiers);
    
    return (revenue * marginDecimal) - incentiveCost;
  },

  /**
   * Enhanced tier fetcher with intelligent fallback for flat commit deals
   * Creates tier from migratedFinancials when tiers array is empty
   */
  async fetchTiersWithFallback(dealId: number): Promise<DealTier[]> {
    try {
      // Get tiers from API
      const response = await fetch(`/api/deals/${dealId}/tiers`);
      if (response.ok) {
        const data = await response.json();
        let tiers = data.tiers || [];
        
        // Enhanced fallback: If no tiers, create one from deal data
        if (tiers.length === 0) {
          const dealResponse = await fetch(`/api/deals/${dealId}`);
          if (dealResponse.ok) {
            const deal = await dealResponse.json();
            // Use migratedFinancials.previousYearRevenue for Tesla-type deals
            const revenue = deal.migratedFinancials?.annualRevenue || 
                           deal.migratedFinancials?.previousYearRevenue || 
                           deal.previousYearRevenue || 0;
            const margin = deal.migratedFinancials?.annualGrossMargin || 
                          deal.migratedFinancials?.previousYearMargin ||
                          deal.previousYearMargin || 0.25; // Default 25% margin
            
            if (revenue > 0) {
              tiers = [{
                tierNumber: 1,
                annualRevenue: revenue,
                annualGrossMargin: margin,
                incentives: []
              }];
            }
          }
        }
        
        return tiers;
      }
      
      return [];
    } catch (error) {
      console.error('Error fetching tiers with fallback:', error);
      return [];
    }
  },

  // =============================================================
  // COMPONENT-SPECIFIC HELPERS
  // =============================================================

  /**
   * Get display revenue for dashboard rows  
   * Replaces: deal.migratedFinancials?.annualRevenue || 0
   */
  getDisplayRevenue(tiers: DealTier[]): number {
    return this.getExpectedRevenue(tiers);
  },

  /**
   * Get revenue array for chart data
   * Replaces: multiple migratedFinancials.annualRevenue fetches
   */
  getChartRevenues(dealTiersArray: DealTier[][]): number[] {
    return dealTiersArray.map(tiers => this.getDisplayRevenue(tiers));
  },

  /**
   * Get total revenue for deal aggregation
   * Replaces: sum of migratedFinancials.annualRevenue values
   */
  getTotalRevenue(dealTiersArray: DealTier[][]): number {
    return dealTiersArray.reduce((sum, tiers) => sum + this.getDisplayRevenue(tiers), 0);
  },

  /**
   * Get risk metrics for strategic insights
   * New utility for enhanced risk analysis using tier data
   */
  getRiskMetrics(tiers: DealTier[]): {
    revenue: number;
    grossProfit: number;
    marginPercent: number;
    incentiveRatio: number;
  } {
    const revenue = this.getExpectedRevenue(tiers);
    const grossProfit = this.getExpectedGrossProfit(tiers);
    const marginDecimal = this.getExpectedGrossMargin(tiers);
    const incentiveCost = this.getExpectedIncentiveCost(tiers);
    
    return {
      revenue,
      grossProfit,
      marginPercent: marginDecimal * 100, // Convert to percentage for display
      incentiveRatio: revenue > 0 ? (incentiveCost / revenue) * 100 : 0,
    };
  },

  // =============================================================
  // VALIDATION HELPERS
  // =============================================================

  /**
   * Check if tiers have valid data for calculations
   */
  hasValidTierData(tiers: DealTier[]): boolean {
    const expectedTier = this.getExpectedTier(tiers);
    return expectedTier !== null && (expectedTier.annualRevenue || 0) > 0;
  },

  /**
   * Get tier structure info for debugging
   */
  getTierInfo(tiers: DealTier[]): {
    tierCount: number;
    hasExpectedTier: boolean;
    expectedTierNumber: number | null;
    availableTiers: number[];
  } {
    const expectedTier = this.getExpectedTier(tiers);
    
    return {
      tierCount: tiers.length,
      hasExpectedTier: expectedTier !== null,
      expectedTierNumber: expectedTier?.tierNumber || null,
      availableTiers: tiers.map((t: DealTier) => t.tierNumber).sort(),
    };
  }
};

// =============================================================
// TYPE DEFINITIONS FOR MIGRATION
// =============================================================

/**
 * Migration helper types for component updates
 */
export interface TierFinancialData {
  revenue: number;
  grossMargin: number;
  incentiveCost: number;
  grossProfit: number;
}

/**
 * Enhanced financial metrics from tier data
 */
export interface TierRiskMetrics {
  revenue: number;
  grossProfit: number;
  marginPercent: number;
  incentiveRatio: number;
}