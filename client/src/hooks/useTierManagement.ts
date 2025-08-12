import { DealTier } from "@/hooks/useDealTiers";
import { DEAL_CONSTANTS } from "@/config/businessConstants";

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
  
  // Add new tier
  const addTier = () => {
    if (isFlat) return; // Don't add tiers for flat commit
    
    const newTierNumber = dealTiers.length + 1;
    const newTier: DealTier = {
      tierNumber: newTierNumber,
      annualRevenue: 0,
      annualGrossMargin: 0.35, // 35% as decimal
      categoryName: "Financial",
      subCategoryName: "Discounts", 
      incentiveOption: "Volume Discount",
      incentiveValue: 0,
      incentiveNotes: "",
    };
    const updatedTiers = [...dealTiers, newTier];
    setDealTiers(updatedTiers);
  };

  // Remove a tier
  const removeTier = (tierNumber: number) => {
    if (dealTiers.length > 1) {
      const updatedTiers = dealTiers
        .filter((tier) => tier.tierNumber !== tierNumber)
        .map((tier, index) => ({ ...tier, tierNumber: index + 1 }));
      setDealTiers(updatedTiers);
    }
  };

  // Update a tier
  const updateTier = (tierNumber: number, updates: Partial<DealTier>) => {
    const updatedTiers = dealTiers.map((tier) =>
      tier.tierNumber === tierNumber ? { ...tier, ...updates } : tier
    );
    setDealTiers(updatedTiers);
  };

  return {
    addTier,
    removeTier,
    updateTier
  };
}