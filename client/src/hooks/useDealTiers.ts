import { useState, useCallback, useMemo } from 'react';

// Simplified tier interface matching component expectations
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
    // Create default first tier
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

      const newTier: DealTier = {
        tierNumber: prev.length + 1,
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
      return prev
        .filter(tier => tier.tierNumber !== tierNumber)
        .map((tier, index) => ({ ...tier, tierNumber: index + 1 })); // Renumber remaining tiers
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
    updates: Partial<DealTier>
  ) => {
    setTiers(prev => prev.map(tier => {
      if (tier.tierNumber !== tierNumber) return tier;

      const updatedTier = { ...tier, ...updates };
      const revenue = updatedTier.annualRevenue || 0;

      // Auto-calculate gross margin from percentage
      if (updates.annualGrossMarginPercent !== undefined && revenue > 0) {
        updatedTier.annualGrossMargin = (revenue * updates.annualGrossMarginPercent) / 100;
      }
      
      // Auto-calculate percentage from gross margin
      if (updates.annualGrossMargin !== undefined && revenue > 0) {
        updatedTier.annualGrossMarginPercent = (updates.annualGrossMargin / revenue) * 100;
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
      // Required field validation
      if (!tier.tierName || tier.tierName.trim() === '') {
        errors.push({
          tierId: tier.id,
          field: 'tierName',
          message: 'Tier name is required'
        });
      }

      if (tier.minimumCommit < 0) {
        errors.push({
          tierId: tier.id,
          field: 'minimumCommit',
          message: 'Minimum commit cannot be negative'
        });
      }

      if (tier.incentivePercentage < 0 || tier.incentivePercentage > 100) {
        errors.push({
          tierId: tier.id,
          field: 'incentivePercentage',
          message: 'Incentive percentage must be between 0 and 100'
        });
      }

      if (tier.incentiveAmount < 0) {
        errors.push({
          tierId: tier.id,
          field: 'incentiveAmount',
          message: 'Incentive amount cannot be negative'
        });
      }
    });

    // Check for duplicate tier names
    const tierNames = tiers.map(t => t.tierName.toLowerCase());
    const duplicateNames = tierNames.filter((name, index) => tierNames.indexOf(name) !== index);
    
    duplicateNames.forEach(name => {
      const duplicateTiers = tiers.filter(t => t.tierName.toLowerCase() === name);
      duplicateTiers.forEach(tier => {
        errors.push({
          tierId: tier.id,
          field: 'tierName',
          message: 'Tier names must be unique'
        });
      });
    });

    return errors;
  }, [tiers]);

  // Computed values
  const totalIncentiveAmount = useMemo(() => {
    return tiers.reduce((sum, tier) => sum + (tier.incentiveAmount || 0), 0);
  }, [tiers]);

  const averageIncentivePercentage = useMemo(() => {
    const validPercentages = tiers.filter(t => t.incentivePercentage > 0);
    if (validPercentages.length === 0) return 0;
    
    return validPercentages.reduce((sum, tier) => sum + tier.incentivePercentage, 0) / validPercentages.length;
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
    averageIncentivePercentage,
    isValid,
    canAddTier,
    canRemoveTier,
    tierCount: tiers.length
  };
}