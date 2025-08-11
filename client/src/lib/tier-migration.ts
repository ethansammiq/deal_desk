import { DealTier } from "@/hooks/useDealTiers";

// Legacy interface for migration
interface LegacyDealTierData {
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

/**
 * Migrates legacy tier data to the new unified DealTier interface
 */
export function migrateLegacyTier(legacy: LegacyDealTierData): DealTier {
  // Convert percentage to decimal for gross margin
  const grossMargin = legacy.annualGrossMarginPercent 
    ? legacy.annualGrossMarginPercent / 100 
    : legacy.annualGrossMargin || 0.35;

  // Map legacy incentiveType to new category structure
  const incentiveCategory: DealTier['incentiveCategory'] = 
    legacy.incentiveType === "rebate" || legacy.incentiveType === "discount" || legacy.incentiveType === "bonus" 
      ? "financial" 
      : "financial"; // Default to financial for all legacy types

  // Map to subcategory
  const incentiveSubCategory = legacy.incentiveType === "rebate" || legacy.incentiveType === "discount"
    ? "discounts"
    : "bonuses";

  // Map to specific incentive
  const specificIncentive = legacy.incentiveType === "rebate" 
    ? "Volume Discount"
    : legacy.incentiveType === "discount"
    ? "Volume Discount" 
    : legacy.incentiveType === "bonus"
    ? "Growth Bonus"
    : "Volume Discount";

  // Calculate incentive value from legacy fields
  const incentiveValue = legacy.incentiveAmount || 
    (legacy.incentivePercentage && legacy.annualRevenue 
      ? (legacy.incentivePercentage / 100) * legacy.annualRevenue 
      : 0);

  return {
    tierNumber: legacy.tierNumber,
    annualRevenue: legacy.annualRevenue || 0,
    annualGrossMargin: grossMargin,
    incentiveCategory,
    incentiveSubCategory,
    specificIncentive,
    incentiveValue,
    incentiveNotes: legacy.incentiveNotes || undefined,
  };
}

/**
 * Migrates array of legacy tiers
 */
export function migrateLegacyTiers(legacyTiers: LegacyDealTierData[]): DealTier[] {
  return legacyTiers.map(migrateLegacyTier);
}

/**
 * Converts new DealTier back to legacy format (for backward compatibility)
 */
export function toLegacyFormat(tier: DealTier): LegacyDealTierData {
  return {
    tierNumber: tier.tierNumber,
    annualRevenue: tier.annualRevenue,
    annualGrossMargin: tier.annualGrossMargin,
    annualGrossMarginPercent: tier.annualGrossMargin * 100, // Convert decimal to percentage
    incentivePercentage: tier.annualRevenue > 0 ? (tier.incentiveValue / tier.annualRevenue) * 100 : 0,
    incentiveNotes: tier.incentiveNotes,
    incentiveType: tier.incentiveCategory === "financial" && tier.incentiveSubCategory === "discounts" 
      ? "discount" 
      : tier.incentiveCategory === "financial" && tier.incentiveSubCategory === "bonuses"
      ? "bonus"
      : "rebate",
    incentiveThreshold: 0, // Legacy field, not used in new system
    incentiveAmount: tier.incentiveValue,
  };
}