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

export function calculateMonthlyValue(totalValue: number, contractTerm: number): number {
  if (!totalValue || !contractTerm || contractTerm <= 0) return 0;
  return totalValue / contractTerm;
}

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

export function calculateYOYGrowth(currentValue: number, previousValue: number): number {
  if (!previousValue || previousValue === 0) return 0;
  return ((currentValue - previousValue) / previousValue) * 100;
}

export function calculateIncentiveImpact(totalValue: number, incentivePercentage: number): number {
  if (!totalValue) return 0;
  return totalValue * (incentivePercentage / 100);
}
