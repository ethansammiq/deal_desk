import { incentiveCategories } from "./incentive-data";
import type { DealTier } from "@/hooks/useDealTiers";

/**
 * Utility functions for mapping between incentive library structure and DealTier
 */

// Get category ID from display name
export function getCategoryIdFromName(categoryName: string): string {
  const category = incentiveCategories.find(c => c.name === categoryName);
  return category?.id || "financial";
}

// Get subcategory ID from display name within a category
export function getSubCategoryIdFromName(categoryName: string, subCategoryName: string): string {
  const category = incentiveCategories.find(c => c.name === categoryName);
  const subCategory = category?.subCategories.find(s => s.name === subCategoryName);
  return subCategory?.id || "fin-discounts";
}

// Get display names from IDs
export function getCategoryDisplayName(categoryId: string): string {
  const category = incentiveCategories.find(c => c.id === categoryId);
  return category?.name || "Financial";
}

export function getSubCategoryDisplayName(categoryId: string, subCategoryId: string): string {
  const category = incentiveCategories.find(c => c.id === categoryId);
  const subCategory = category?.subCategories.find(s => s.id === subCategoryId);
  return subCategory?.name || "Discounts";
}

// Convert DealTier to incentive library IDs for form interactions
export function dealTierToIncentiveIds(tier: DealTier) {
  return {
    categoryId: getCategoryIdFromName(tier.categoryName),
    subCategoryId: getSubCategoryIdFromName(tier.categoryName, tier.subCategoryName),
    option: tier.incentiveOption
  };
}

// Convert incentive library selection to DealTier fields
export function incentiveSelectionToDealTier(categoryId: string, subCategoryId: string, option: string) {
  return {
    categoryName: getCategoryDisplayName(categoryId),
    subCategoryName: getSubCategoryDisplayName(categoryId, subCategoryId),
    incentiveOption: option
  };
}

// Validate if an option exists in the incentive library
export function validateIncentiveOption(categoryId: string, subCategoryId: string, option: string): boolean {
  const category = incentiveCategories.find(c => c.id === categoryId);
  const subCategory = category?.subCategories.find(s => s.id === subCategoryId);
  return subCategory?.options.includes(option) || false;
}