/**
 * Deal Approval Matrix Service
 * 
 * This service defines the approval matrix rules and provides utility functions
 * to determine required approvers based on deal parameters.
 */

export type ApproverLevel = 'RegionalDirector' | 'Finance' | 'Legal' | 'MD' | 'Executive';

export interface ApprovalRule {
  level: ApproverLevel;
  title: string;
  description: string;
  estimatedTime: string; // e.g., "1-2 business days"
  order?: number; // Used to determine approval workflow order
}

// Simplified standard deal criteria
export interface StandardDealCriteria {
  dealType: string;
  salesChannel: string[];
  maxValue: number;
}

// Standard deal criteria 
export const standardDealCriteria: StandardDealCriteria = {
  dealType: "grow",
  salesChannel: ["independent_agency", "client_direct"],
  maxValue: 500000 // $500K
};

// Define the approver levels
export const approverLevels: Record<ApproverLevel, ApprovalRule> = {
  'RegionalDirector': {
    level: 'RegionalDirector',
    title: 'Regional Director',
    description: 'Initial approval for all deals in the region, validates regional fit and market strategy',
    estimatedTime: '1-2 business days',
    order: 1
  },
  'Finance': {
    level: 'Finance',
    title: 'Finance Department',
    description: 'Reviews financial terms, deal profitability, and payment structures',
    estimatedTime: '1-3 business days',
    order: 2
  },
  'Legal': {
    level: 'Legal',
    title: 'Legal Department',
    description: 'Reviews contract terms, ensures compliance with company policies and regulations',
    estimatedTime: '2-3 business days',
    order: 3
  },
  'MD': {
    level: 'MD',
    title: 'Managing Director',
    description: 'Standard approval for deals meeting standard criteria after Finance and Legal review',
    estimatedTime: '1-2 business days',
    order: 4
  },
  'Executive': {
    level: 'Executive',
    title: 'Executive Committee',
    description: 'Required for non-standard deals, high-value deals, or deals with special terms',
    estimatedTime: '3-5 business days',
    order: 5
  }
};

/**
 * Gets the full approver details based on the level
 */
export function getApproverDetails(level: ApproverLevel): ApprovalRule {
  return approverLevels[level];
}

/**
 * Returns the higher level between two approver levels
 */
function getHigherLevel(level1: ApproverLevel, level2: ApproverLevel): ApproverLevel {
  // Use the order property from approverLevels to determine hierarchy
  const order1 = approverLevels[level1].order || 0;
  const order2 = approverLevels[level2].order || 0;
  
  return order1 >= order2 ? level1 : level2;
}

/**
 * Determines the required approvers based on deal parameters
 * Returns an array of approver levels in the order they need to approve
 */
export function determineRequiredApprovers(
  totalValue: number,
  dealType?: string, 
  salesChannel?: string,
  hasLegalExceptions?: boolean,
  hasFinancialExceptions?: boolean
): ApproverLevel[] {
  // All deals require Regional Director approval first
  const approvers: ApproverLevel[] = ['RegionalDirector'];
  
  // Finance review is always required for financial terms
  approvers.push('Finance');
  
  // Legal review is required when there are legal exceptions or for high-value deals
  if (hasLegalExceptions || totalValue > 250000) {
    approvers.push('Legal');
  }
  
  // Determine final approver based on deal criteria
  if (totalValue > standardDealCriteria.maxValue || 
      (dealType && dealType !== standardDealCriteria.dealType) ||
      (salesChannel && !standardDealCriteria.salesChannel.includes(salesChannel)) ||
      hasLegalExceptions || 
      hasFinancialExceptions) {
    // Non-standard deals require Executive approval
    approvers.push('Executive');
  } else {
    // Standard deals require MD approval
    approvers.push('MD');
  }
  
  return approvers;
}

/**
 * Determines the highest required approver level based on deal parameters
 * Used for backward compatibility with existing code
 */
export function determineRequiredApprover(
  totalValue: number, 
  dealType?: string, 
  salesChannel?: string
): ApproverLevel {
  // If any condition is met for Executive approval, return that
  if (totalValue > standardDealCriteria.maxValue || 
      (dealType && dealType !== standardDealCriteria.dealType) ||
      (salesChannel && !standardDealCriteria.salesChannel.includes(salesChannel))) {
    return 'Executive';
  }
  
  // Otherwise, it's a standard deal with MD approval
  return 'MD';
}