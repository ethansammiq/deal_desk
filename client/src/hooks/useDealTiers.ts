import { useState, useCallback, useMemo } from 'react';

// Unified tier interface - matches existing DealTierData throughout the app
export interface DealTier {
  tierNumber: number;
  annualRevenue?: number;
  annualGrossMargin?: number;
  annualGrossMarginPercent?: number;
  incentivePercentage?: number;
  incentiveNotes?: string;
  incentiveType?: "rebate" | "discount" | "bonus" | "other";
  incentiveThreshold?: number;
  incentiveAmount?: number;
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
  const { initialTiers = [], maxTiers = 10, minTiers = 1 } = options;

  const [tiers, setTiers] = useState<DealTier[]>(() => {
    if (initialTiers.length > 0) {
      return initialTiers;
    }
    // Create default first tier matching app structure
    return [{
      tierNumber: 1,
      annualRevenue: 0,
      annualGrossMargin: 0,
      annualGrossMarginPercent: 35,
      incentivePercentage: 0,
      incentiveNotes: "",
      incentiveType: "rebate",
      incentiveThreshold: 0,
      incentiveAmount: 0,
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
        annualRevenue: 0,
        annualGrossMargin: 0,
        annualGrossMarginPercent: 35,
        incentivePercentage: 0,
        incentiveNotes: "",
        incentiveType: "rebate",
        incentiveThreshold: 0,
        incentiveAmount: 0,
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

      // Auto-calculate incentive amount from percentage
      if (updates.incentivePercentage !== undefined && annualRevenue) {
        updatedTier.incentiveAmount = (annualRevenue * updates.incentivePercentage) / 100;
      }
      
      // Auto-calculate percentage from amount
      if (updates.incentiveAmount !== undefined && annualRevenue && annualRevenue > 0) {
        updatedTier.incentivePercentage = (updates.incentiveAmount / annualRevenue) * 100;
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
        annualRevenue: 0,
        annualGrossMargin: 0,
        annualGrossMarginPercent: 35,
        incentivePercentage: 0,
        incentiveNotes: "",
        incentiveType: "rebate",
        incentiveThreshold: 0,
        incentiveAmount: 0,
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

      // Validate incentive percentage
      if (tier.incentivePercentage !== undefined && (tier.incentivePercentage < 0 || tier.incentivePercentage > 100)) {
        errors.push({
          tierNumber: tier.tierNumber,
          field: 'incentivePercentage',
          message: 'Incentive percentage must be between 0 and 100'
        });
      }

      // Validate incentive amount
      if (tier.incentiveAmount !== undefined && tier.incentiveAmount < 0) {
        errors.push({
          tierNumber: tier.tierNumber,
          field: 'incentiveAmount',
          message: 'Incentive amount cannot be negative'
        });
      }

      // Validate gross margin percent
      if (tier.annualGrossMarginPercent !== undefined && (tier.annualGrossMarginPercent < 0 || tier.annualGrossMarginPercent > 100)) {
        errors.push({
          tierNumber: tier.tierNumber,
          field: 'annualGrossMarginPercent',
          message: 'Gross margin percentage must be between 0 and 100'
        });
      }
    });

    return errors;
  }, [tiers]);

  // Computed values
  const totalIncentiveAmount = useMemo(() => {
    return tiers.reduce((sum, tier) => sum + (tier.incentiveAmount || 0), 0);
  }, [tiers]);

  const totalAnnualRevenue = useMemo(() => {
    return tiers.reduce((sum, tier) => sum + (tier.annualRevenue || 0), 0);
  }, [tiers]);

  const averageIncentivePercentage = useMemo(() => {
    const validPercentages = tiers.filter(t => (t.incentivePercentage || 0) > 0);
    if (validPercentages.length === 0) return 0;
    
    return validPercentages.reduce((sum, tier) => sum + (tier.incentivePercentage || 0), 0) / validPercentages.length;
  }, [tiers]);

  const averageGrossMarginPercent = useMemo(() => {
    const validMargins = tiers.filter(t => (t.annualGrossMarginPercent || 0) > 0);
    if (validMargins.length === 0) return 0;
    
    return validMargins.reduce((sum, tier) => sum + (tier.annualGrossMarginPercent || 0), 0) / validMargins.length;
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
    totalIncentiveAmount,
    totalAnnualRevenue,
    averageIncentivePercentage,
    averageGrossMarginPercent,
    isValid,
    canAddTier,
    canRemoveTier,
    tierCount: tiers.length
  };
}