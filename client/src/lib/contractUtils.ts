/**
 * Calculate contract term in months from start and end dates
 */
export function calculateContractTerm(startDate?: string, endDate?: string): number {
  if (!startDate || !endDate) {
    return 12; // Default to 12 months
  }

  try {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    // Calculate months difference
    const months = Math.max(1, (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth()));
    
    return months;
  } catch (error) {
    console.warn('Error calculating contract term:', error);
    return 12; // Fallback to 12 months
  }
}