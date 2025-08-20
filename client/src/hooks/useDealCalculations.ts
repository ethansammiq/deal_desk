import { useMemo } from "react";
import { DealCalculationService } from "@/services/dealCalculations";
// DealFinancialSummary removed - using direct calculation metrics
// Import DealTier from the central hook
import { DealTier } from "@/hooks/useDealTiers";

/**
 * Custom hook for deal calculations with memoization
 * Provides access to the DealCalculationService with optimized re-calculations
 */
export function useDealCalculations(
  advertisers: any[] = [],
  agencies: any[] = []
) {
  // Create memoized calculation service instance
  const calculationService = useMemo(
    () => new DealCalculationService(advertisers, agencies),
    [advertisers, agencies]
  );

  // Memoized financial summary calculation
  const calculateFinancialSummary = useMemo(
    () => (
      dealTiers: DealTier[],
      salesChannel: string,
      advertiserName?: string,
      agencyName?: string
    ): {
      totalAnnualRevenue: number;
      totalGrossMargin: number;
      averageGrossMarginPercent: number;
      totalIncentiveValue: number;
    } => {
      return calculationService.calculateDealMetrics(dealTiers);
    },
    [calculationService]
  );

  // Memoized deal analysis
  const generateDealAnalysis = useMemo(
    () => (
      dealTiers: DealTier[],
      salesChannel: string,
      advertiserName?: string,
      agencyName?: string
    ): string => {
      return calculationService.generateDealAnalysis(
        dealTiers,
        salesChannel,
        advertiserName,
        agencyName
      );
    },
    [calculationService]
  );

  return {
    // Service instance
    calculationService,
    
    // Memoized calculations
    calculateFinancialSummary,
    generateDealAnalysis,
    
    // Direct service methods for convenience
    getPreviousYearValue: calculationService.getPreviousYearValue.bind(calculationService),
    getPreviousYearMargin: calculationService.getPreviousYearMargin.bind(calculationService),
    getPreviousYearGrossProfit: calculationService.getPreviousYearGrossProfit.bind(calculationService),
    getPreviousYearIncentiveCost: calculationService.getPreviousYearIncentiveCost.bind(calculationService),
    calculateBasicGrossProfit: calculationService.calculateBasicGrossProfit.bind(calculationService),
    calculateTierIncentiveCost: calculationService.calculateTierIncentiveCost.bind(calculationService),
    calculateTierGrossProfit: calculationService.calculateTierGrossProfit.bind(calculationService),
    calculateGrossMarginGrowthRate: calculationService.calculateGrossMarginGrowthRate.bind(calculationService),
    calculateProfitGrowthRate: calculationService.calculateProfitGrowthRate.bind(calculationService),
    calculateRevenueGrowthRate: calculationService.calculateRevenueGrowthRate.bind(calculationService),
    calculateGrossProfitGrowthRate: calculationService.calculateGrossProfitGrowthRate.bind(calculationService),
    calculateAdjustedGrossProfitGrowthRate: calculationService.calculateAdjustedGrossProfitGrowthRate.bind(calculationService),
    calculateAdjustedGrossMargin: calculationService.calculateAdjustedGrossMargin.bind(calculationService),
    calculateAdjustedGrossMarginGrowthRate: calculationService.calculateAdjustedGrossMarginGrowthRate.bind(calculationService),
    calculateClientValue: calculationService.calculateClientValue.bind(calculationService),
    calculateClientValueGrowthRate: calculationService.calculateClientValueGrowthRate.bind(calculationService),
    calculateCostGrowthRate: (tier: DealTier, salesChannel: string, advertiserName?: string, agencyName?: string) => calculationService.calculateCostGrowthRate(tier, salesChannel, advertiserName, agencyName),
  };
}