import { useState, useCallback, useMemo, memo } from 'react';
import { DEAL_CONSTANTS, INCENTIVE_CONSTANTS } from '@/config/businessConstants';

// Individual incentive within a tier
export interface TierIncentive {
  id?: string;                              // Unique ID for React keys (UUID)
  category: string;                         // "Financial", "Resources", etc.
  subCategory: string;                      // "Discounts", "Bonuses", etc.
  option: string;                          // "Volume Discount", "Growth Bonus", etc.
  value: number;                           // USD amount
  notes?: string;                          // Optional notes
}

// Unified tier interface - now supports multiple incentives
export interface DealTier {
  // Database fields (optional for new tiers)
  id?: number;
  dealId?: number;
  
  // Required user inputs
  tierNumber: number;
  annualRevenue: number;                    // USD
  annualGrossMargin: number;                // Decimal (0.355 for 35.5%)
  incentives: TierIncentive[];              // ✅ Array of incentives per tier
  
  // System fields
  createdAt?: Date;
  updatedAt?: Date;
}

// Helper function to ensure a tier has proper incentives array structure  
export function ensureTierIncentives(tier: DealTier): DealTier {
  return {
    ...tier,
    incentives: Array.isArray(tier.incentives) ? tier.incentives : []
  };
}

// Helper functions for computed properties
export function getTotalIncentiveValue(tier: DealTier): number {
  if (!tier.incentives || !Array.isArray(tier.incentives)) {
    return 0;
  }
  return tier.incentives.reduce((sum, incentive) => sum + incentive.value, 0);
}

export function getIncentiveNotes(tier: DealTier): string {
  if (!tier.incentives || !Array.isArray(tier.incentives)) {
    return '';
  }
  return tier.incentives.map(i => i.notes).filter(Boolean).join('; ');
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
      // ✅ MIGRATION: Ensure existing tiers have incentives array initialized
      return initialTiers.map(tier => ({
        ...tier,
        incentives: tier.incentives || [] // Initialize if missing
      }));
    }
    // Create default first tier with empty incentives array
    return [{
      tierNumber: 1,
      annualRevenue: DEAL_CONSTANTS.DEFAULT_ANNUAL_REVENUE,
      annualGrossMargin: DEAL_CONSTANTS.DEFAULT_GROSS_MARGIN,
      incentives: [] // ✅ Start with empty incentives array
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
        incentives: [] // ✅ Start with empty incentives array
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

      // Auto-calculate incentive value from percentage (if needed)
      if (annualRevenue && updatedTier.annualRevenue) {
        // Ensure incentives array exists and is properly initialized
        if (!Array.isArray(updatedTier.incentives)) {
          updatedTier.incentives = [];
        }
      }

      return updatedTier;
    }));
  }, []);

  // Bulk update tiers
  const updateAllTiers = useCallback((newTiers: DealTier[]) => {
    // ✅ MIGRATION: Ensure all tiers have incentives array initialized
    const migratedTiers = newTiers.map(tier => ({
      ...tier,
      incentives: Array.isArray(tier.incentives) ? tier.incentives : []
    }));
    setTiers(migratedTiers);
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
        incentives: []
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

      // Validate incentives array
      if (tier.incentives) {
        tier.incentives.forEach((incentive, index) => {
          if (incentive.value < 0) {
            errors.push({
              tierNumber: tier.tierNumber,
              field: `incentives[${index}].value`,
              message: 'Incentive value cannot be negative'
            });
          }

          if (!incentive.category) {
            errors.push({
              tierNumber: tier.tierNumber,
              field: `incentives[${index}].category`,
              message: 'Incentive category is required'
            });
          }

          if (!incentive.subCategory) {
            errors.push({
              tierNumber: tier.tierNumber,
              field: `incentives[${index}].subCategory`,
              message: 'Incentive subcategory is required'
            });
          }

          if (!incentive.option) {
            errors.push({
              tierNumber: tier.tierNumber,
              field: `incentives[${index}].option`,
              message: 'Incentive option is required'
            });
          }
        });
      }
    });

    return errors;
  }, [tiers]);

  // Computed values
  const totalIncentiveValue = useMemo(() => {
    return tiers.reduce((sum, tier) => sum + getTotalIncentiveValue(tier), 0);
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