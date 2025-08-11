import { useState, useCallback, useMemo } from 'react';

// Types for tier management
export interface DealTier {
  id: string;
  tierName: string;
  minimumCommit: number;
  incentiveType: 'rebate' | 'bonus' | 'other';
  incentivePercentage: number;
  incentiveAmount: number;
  incentiveNotes?: string;
}

export interface TierValidationError {
  tierId: string;
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
      id: crypto.randomUUID(),
      tierName: 'Tier 1',
      minimumCommit: 0,
      incentiveType: 'rebate' as const,
      incentivePercentage: 0,
      incentiveAmount: 0,
      incentiveNotes: ''
    }];
  });

  // Add new tier
  const addTier = useCallback(() => {
    if (tiers.length >= maxTiers) {
      throw new Error(`Maximum of ${maxTiers} tiers allowed`);
    }

    const newTier: DealTier = {
      id: crypto.randomUUID(),
      tierName: `Tier ${tiers.length + 1}`,
      minimumCommit: 0,
      incentiveType: 'rebate',
      incentivePercentage: 0,
      incentiveAmount: 0,
      incentiveNotes: ''
    };

    setTiers(prev => [...prev, newTier]);
    return newTier;
  }, [tiers.length, maxTiers]);

  // Remove tier
  const removeTier = useCallback((tierId: string) => {
    if (tiers.length <= minTiers) {
      throw new Error(`Minimum of ${minTiers} tier(s) required`);
    }

    setTiers(prev => prev.filter(tier => tier.id !== tierId));
  }, [tiers.length, minTiers]);

  // Update specific tier
  const updateTier = useCallback((tierId: string, updates: Partial<DealTier>) => {
    setTiers(prev => prev.map(tier => 
      tier.id === tierId 
        ? { ...tier, ...updates }
        : tier
    ));
  }, []);

  // Update tier with revenue-based calculations
  const updateTierWithCalculations = useCallback((
    tierId: string, 
    updates: Partial<DealTier>,
    annualRevenue?: number
  ) => {
    setTiers(prev => prev.map(tier => {
      if (tier.id !== tierId) return tier;

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
        id: crypto.randomUUID(),
        tierName: 'Tier 1',
        minimumCommit: 0,
        incentiveType: 'rebate',
        incentivePercentage: 0,
        incentiveAmount: 0,
        incentiveNotes: ''
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