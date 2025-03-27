/**
 * Deal Approval Matrix Service
 * 
 * This service defines the approval matrix rules and provides utility functions
 * to determine required approvers based on deal parameters.
 */

export type ApproverLevel = 'MD' | 'Executive';

export interface ApprovalRule {
  level: ApproverLevel;
  title: string;
  description: string;
  estimatedTime: string; // e.g., "1-2 business days"
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
  'MD': {
    level: 'MD',
    title: 'Managing Director',
    description: 'Standard approval for deals meeting standard criteria',
    estimatedTime: '1-2 business days'
  },
  'Executive': {
    level: 'Executive',
    title: 'Executive Committee',
    description: 'Required for non-standard deals, high-value deals, or deals with special terms',
    estimatedTime: '3-5 business days'
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
  const levels = ['MD', 'Executive'];
  const index1 = levels.indexOf(level1);
  const index2 = levels.indexOf(level2);
  
  return index1 >= index2 ? level1 : level2;
}

/**
 * Determines the required approver level based on deal parameters
 */
export function determineRequiredApprover(totalValue: number, 
                                         dealType?: string, salesChannel?: string): ApproverLevel {
  // If any condition is met for Executive approval, return that
  if (totalValue > standardDealCriteria.maxValue || 
      (dealType && dealType !== standardDealCriteria.dealType) ||
      (salesChannel && !standardDealCriteria.salesChannel.includes(salesChannel))) {
    return 'Executive';
  }
  
  // Otherwise, it's a standard deal with MD approval
  return 'MD';
}