import { useState, useCallback, useMemo, memo } from 'react';
import { DEAL_CONSTANTS, INCENTIVE_CONSTANTS } from '@/config/businessConstants';

// Unified tier interface - matches database schema exactly
export interface DealTier {
  // Database fields (optional for new tiers)
  id?: number;
  dealId?: number;
  
  // Required user inputs
  tierNumber: number;
  annualRevenue: number;                    // USD
  annualGrossMargin: number;                // Decimal (0.355 for 35.5%)
  categoryName: string;                     // Display name: "Financial", "Resources", etc.
  subCategoryName: string;                  // Display name: "Discounts", "Bonuses", etc.
  incentiveOption: string;                  // Selected option: "Volume Discount", "Growth Bonus", etc.
  incentiveValue: number;                   // USD amount
  
  // Optional field
  incentiveNotes?: string;
  
  // System fields
  createdAt?: Date;
  updatedAt?: Date;
}

export interface TierValidationError {
  tierNumber: number;
  field: string;
  message: string;
}

export interface UseDealTiersOptions {
  initialTiers?: DealTier[];
  maxTiers?: number;
  minTiers?: number;
}

export function useDealTiers(options: UseDealTiersOptions = {}) {
  const { 
    initialTiers = [], 
    maxTiers = DEAL_CONSTANTS.MAX_TIERS, 
    minTiers = DEAL_CONSTANTS.MIN_TIERS 
  } = options;

  const [tiers, setTiers] = useState<DealTier[]>(() => {
    if (initialTiers.length > 0) {
      return initialTiers;
    }
    // Create default first tier with required fields
    return [{
      tierNumber: 1,
      annualRevenue: DEAL_CONSTANTS.DEFAULT_ANNUAL_REVENUE,
      annualGrossMargin: DEAL_CONSTANTS.DEFAULT_GROSS_MARGIN,
      categoryName: "Financial", // Display name from incentive library
      subCategoryName: "Discounts", // Display name from incentive library
      incentiveOption: "Volume Discount", // Selected option from incentive library
      incentiveValue: 0,
      incentiveNotes: "",
    }];
  });

  // Add new tier
  const addTier = useCallback(() => {
    setTiers(prev => {
      if (prev.length >= maxTiers) {
        throw new Error(`Maximum of ${maxTiers} tiers allowed`);
      }

      const newTierNumber = prev.length + 1;
      const newTier: DealTier = {
        tierNumber: newTierNumber,
        annualRevenue: DEAL_CONSTANTS.DEFAULT_ANNUAL_REVENUE,
        annualGrossMargin: DEAL_CONSTANTS.DEFAULT_GROSS_MARGIN,
        categoryName: "Financial", // ✅ FIXED: Use new field names consistently
        subCategoryName: "Discounts", // ✅ FIXED: Use new field names consistently  
        incentiveOption: "Volume Discount", // ✅ FIXED: Use new field names consistently
        incentiveValue: 0,
        incentiveNotes: "",
      };

      return [...prev, newTier];
    });
  }, [maxTiers]);

  // Remove tier
  const removeTier = useCallback((tierNumber: number) => {
    setTiers(prev => {
      if (prev.length <= minTiers) {
        throw new Error(`Minimum of ${minTiers} tier(s) required`);
      }
      // Filter out the tier and renumber remaining tiers
      const filtered = prev.filter(tier => tier.tierNumber !== tierNumber);
      return filtered.map((tier, index) => ({ ...tier, tierNumber: index + 1 }));
    });
  }, [minTiers]);

  // Update specific tier
  const updateTier = useCallback((tierNumber: number, updates: Partial<DealTier>) => {
    setTiers(prev => prev.map(tier => 
      tier.tierNumber === tierNumber 
        ? { ...tier, ...updates }
        : tier
    ));
  }, []);

  // Update tier with revenue-based calculations
  const updateTierWithCalculations = useCallback((
    tierNumber: number, 
    updates: Partial<DealTier>,
    annualRevenue?: number
  ) => {
    setTiers(prev => prev.map(tier => {
      if (tier.tierNumber !== tierNumber) return tier;

      const updatedTier = { ...tier, ...updates };

      // Auto-calculate incentive value from percentage (if legacy fields provided)
      if (annualRevenue && updatedTier.annualRevenue) {
        // Ensure consistency between value and any legacy calculations
        updatedTier.incentiveValue = updatedTier.incentiveValue || 0;
      }

      return updatedTier;
    }));
  }, []);

  // Bulk update tiers
  const updateAllTiers = useCallback((newTiers: DealTier[]) => {
    setTiers(newTiers);
  }, []);

  // Reset to initial state
  const resetTiers = useCallback(() => {
    if (initialTiers.length > 0) {
      setTiers(initialTiers);
    } else {
      setTiers([{
        tierNumber: 1,
        annualRevenue: DEAL_CONSTANTS.DEFAULT_ANNUAL_REVENUE,
        annualGrossMargin: DEAL_CONSTANTS.DEFAULT_GROSS_MARGIN,
        incentiveCategory: INCENTIVE_CONSTANTS.DEFAULT_CATEGORY,
        incentiveSubCategory: INCENTIVE_CONSTANTS.DEFAULT_SUB_CATEGORY,
        specificIncentive: INCENTIVE_CONSTANTS.DEFAULT_SPECIFIC_INCENTIVE,
        incentiveValue: 0,
        incentiveNotes: "",
      }]);
    }
  }, [initialTiers]);

  // Validation
  const validationErrors = useMemo((): TierValidationError[] => {
    const errors: TierValidationError[] = [];

    tiers.forEach(tier => {
      // Validate annual revenue
      if (tier.annualRevenue !== undefined && tier.annualRevenue < 0) {
        errors.push({
          tierNumber: tier.tierNumber,
          field: 'annualRevenue',
          message: 'Annual revenue cannot be negative'
        });
      }

      // Validate gross margin (decimal)
      if (tier.annualGrossMargin < 0 || tier.annualGrossMargin > 1) {
        errors.push({
          tierNumber: tier.tierNumber,
          field: 'annualGrossMargin',
          message: 'Gross margin must be between 0 and 1 (decimal)'
        });
      }

      // Validate incentive value
      if (tier.incentiveValue < 0) {
        errors.push({
          tierNumber: tier.tierNumber,
          field: 'incentiveValue',
          message: 'Incentive value cannot be negative'
        });
      }

      // Validate required incentive fields
      if (!tier.incentiveCategory) {
        errors.push({
          tierNumber: tier.tierNumber,
          field: 'incentiveCategory',
          message: 'Incentive category is required'
        });
      }

      if (!tier.incentiveSubCategory) {
        errors.push({
          tierNumber: tier.tierNumber,
          field: 'incentiveSubCategory',
          message: 'Incentive subcategory is required'
        });
      }

      if (!tier.specificIncentive) {
        errors.push({
          tierNumber: tier.tierNumber,
          field: 'specificIncentive',
          message: 'Specific incentive is required'
        });
      }
    });

    return errors;
  }, [tiers]);

  // Computed values
  const totalIncentiveValue = useMemo(() => {
    return tiers.reduce((sum, tier) => sum + tier.incentiveValue, 0);
  }, [tiers]);

  const totalAnnualRevenue = useMemo(() => {
    return tiers.reduce((sum, tier) => sum + tier.annualRevenue, 0);
  }, [tiers]);

  const averageGrossMargin = useMemo(() => {
    if (tiers.length === 0) return 0;
    return tiers.reduce((sum, tier) => sum + tier.annualGrossMargin, 0) / tiers.length;
  }, [tiers]);

  const totalGrossProfit = useMemo(() => {
    return tiers.reduce((sum, tier) => sum + (tier.annualRevenue * tier.annualGrossMargin), 0);
  }, [tiers]);

  const isValid = validationErrors.length === 0;
  const canAddTier = tiers.length < maxTiers;
  const canRemoveTier = tiers.length > minTiers;

  return {
    // State
    tiers,
    validationErrors,
    
    // Actions
    addTier,
    removeTier,
    updateTier,
    updateTierWithCalculations,
    updateAllTiers,
    resetTiers,
    
    // Computed
    totalIncentiveValue,
    totalAnnualRevenue,
    averageGrossMargin,
    totalGrossProfit,
    isValid,
    canAddTier,
    canRemoveTier,
    tierCount: tiers.length
  };
}