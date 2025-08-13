import { DealTier } from "@/hooks/useDealTiers";
import { DEAL_CONSTANTS } from "@/config/businessConstants";
import { useCallback, useMemo } from "react";

interface UseTierManagementProps {
  dealTiers: DealTier[];
  setDealTiers: (tiers: DealTier[]) => void;
  isFlat?: boolean;
}

export function useTierManagement({
  dealTiers,
  setDealTiers,
  isFlat = false
}: UseTierManagementProps) {
  
  // Add new tier (memoized for performance)
  const addTier = useCallback(() => {
    if (isFlat) return; // Don't add tiers for flat commit
    
    const newTierNumber = dealTiers.length + 1;
    const newTier: DealTier = {
      tierNumber: newTierNumber,
      annualRevenue: 0,
      annualGrossMargin: 0.35, // 35% as decimal
      incentives: []
    };
    const updatedTiers = [...dealTiers, newTier];
    setDealTiers(updatedTiers);
  }, [dealTiers, setDealTiers, isFlat]);

  // Remove a tier (memoized for performance)
  const removeTier = useCallback((tierNumber: number) => {
    if (dealTiers.length > 1) {
      const updatedTiers = dealTiers
        .filter((tier) => tier.tierNumber !== tierNumber)
        .map((tier, index) => ({ ...tier, tierNumber: index + 1 }));
      setDealTiers(updatedTiers);
    }
  }, [dealTiers, setDealTiers]);

  // Update a tier (memoized for performance)
  const updateTier = useCallback((tierNumber: number, updates: Partial<DealTier>) => {
    const updatedTiers = dealTiers.map((tier) =>
      tier.tierNumber === tierNumber ? { ...tier, ...updates } : tier
    );
    setDealTiers(updatedTiers);
  }, [dealTiers, setDealTiers]);

  return {
    addTier,
    removeTier,
    updateTier
  };
}