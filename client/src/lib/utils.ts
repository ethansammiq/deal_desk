import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatPercentage(value: number): string {
  // For growth rates, we already have the actual multiplier (e.g., 1.35 for 135% growth)
  // so we don't need to convert it - just display as is
  return new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 2,
  }).format(value);
}

// ❌ REMOVED: Legacy calculateMonthlyValue - use inline calculation instead

export function calculateNetValue(totalValue: number, discountPercentage: number): number {
  if (!totalValue) return 0;
  return totalValue * (1 - (discountPercentage / 100));
}

export function calculateProfit(totalValue: number, discountPercentage: number, costPercentage: number): number {
  if (!totalValue) return 0;
  const netValue = calculateNetValue(totalValue, discountPercentage);
  return netValue * (1 - (costPercentage / 100));
}

export function calculateProfitMargin(totalValue: number, discountPercentage: number, costPercentage: number): number {
  if (!totalValue) return 0;
  const profit = calculateProfit(totalValue, discountPercentage, costPercentage);
  const netValue = calculateNetValue(totalValue, discountPercentage);
  return (profit / netValue) * 100;
}

// ❌ REMOVED: Legacy calculateYOYGrowth - not used in current system

export function calculateIncentiveImpact(totalValue: number, incentivePercentage: number): number {
  if (!totalValue) return 0;
  return totalValue * (incentivePercentage / 100);
}

// Extended financial calculation functions
export function calculateGrossMarginValue(revenue: number, marginPercent: number): number {
  if (!revenue || !marginPercent) return 0;
  return revenue * (marginPercent / 100);
}

export function calculateTotalIncentiveValue(tiers: Array<{
  annualRevenue: number,
  incentivePercentage: number
}>): number {
  if (!tiers || !tiers.length) return 0;
  return tiers.reduce((total, tier) => {
    return total + calculateIncentiveImpact(tier.annualRevenue, tier.incentivePercentage);
  }, 0);
}

export function calculateNetDealValue(
  tiers: Array<{
    annualRevenue: number,
    incentivePercentage: number
  }>,
  contractTerm: number
): number {
  if (!tiers || !tiers.length || !contractTerm || contractTerm <= 0) return 0;
  
  // Calculate total revenue across all tiers
  const totalRevenue = tiers.reduce((sum, tier) => sum + (tier.annualRevenue || 0), 0);
  
  // Calculate total incentive amount across all tiers
  const totalIncentives = calculateTotalIncentiveValue(tiers);
  
  // Net deal value = (Total Revenue - Total Incentives) normalized for contract term
  return (totalRevenue - totalIncentives) / contractTerm;
}

export function calculateEffectiveDiscountRate(
  tiers: Array<{
    annualRevenue: number,
    incentivePercentage: number
  }>
): number {
  if (!tiers || !tiers.length) return 0;
  
  // Calculate total revenue across all tiers
  const totalRevenue = tiers.reduce((sum, tier) => sum + (tier.annualRevenue || 0), 0);
  
  if (totalRevenue === 0) return 0;
  
  // Calculate total incentive amount across all tiers
  const totalIncentives = calculateTotalIncentiveValue(tiers);
  
  // Effective discount rate = (Total Incentives / Total Revenue) * 100
  return (totalIncentives / totalRevenue) * 100;
}

export function calculateTierContribution(
  tierRevenue: number,
  totalRevenue: number
): number {
  if (!tierRevenue || !totalRevenue || totalRevenue === 0) return 0;
  return (tierRevenue / totalRevenue) * 100;
}

export interface DealFinancialSummary {
  totalAnnualRevenue: number;
  totalGrossMargin: number;
  averageGrossMarginPercent: number;
  totalIncentiveValue: number;
  projectedNetValue: number;
  // Removed legacy fields: effectiveDiscountRate, monthlyValue, yearOverYearGrowth
  // These can be calculated inline when needed: monthlyValue = totalAnnualRevenue/12
}

// ❌ DEPRECATED: Legacy calculation function - use DealCalculationService instead
export function calculateDealFinancialSummary(
  tiers: Array<{
    annualRevenue?: number,
    annualGrossMargin?: number,
    annualGrossMarginPercent?: number,
    incentivePercentage?: number,
    incentiveAmount?: number
  }>,
  contractTerm: number,
  previousYearRevenue: number = 0
): DealFinancialSummary {
  // Calculate total revenue across all tiers
  const totalAnnualRevenue = tiers.reduce((sum, tier) => sum + (tier.annualRevenue || 0), 0);
  
  // Calculate total gross margin
  const totalGrossMargin = tiers.reduce((sum, tier) => sum + (tier.annualGrossMargin || 0), 0);
  
  // Calculate average gross margin percent
  const averageGrossMarginPercent = totalAnnualRevenue > 0 
    ? (totalGrossMargin / totalAnnualRevenue) * 100 
    : 0;
  
  // Calculate total incentive value
  const totalIncentiveValue = tiers.reduce((sum, tier) => sum + (tier.incentiveAmount || 0), 0);
  
  // Calculate projected net value for the full contract term
  const projectedNetValue = (totalAnnualRevenue - totalIncentiveValue) * (contractTerm / 12);
  
  return {
    totalAnnualRevenue,
    totalGrossMargin,
    averageGrossMarginPercent,
    totalIncentiveValue,
    projectedNetValue
    // Removed legacy calculations: effectiveDiscountRate, monthlyValue, yearOverYearGrowth
  };
}
