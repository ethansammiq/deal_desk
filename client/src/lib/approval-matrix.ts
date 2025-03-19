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

export interface ApprovalMatrix {
  valueRanges: {
    min: number;
    max: number | null;
    standardTerms: ApproverLevel;
    nonStandardTerms: ApproverLevel;
    highDiscount: ApproverLevel;
  }[];
  discountThresholds: {
    threshold: number;
    level: ApproverLevel;
  }[];
  contractTermThresholds: {
    months: number;
    level: ApproverLevel;
  }[];
  approverLevels: Record<ApproverLevel, ApprovalRule>;
}

// Define the approval matrix with all rules
export const approvalMatrix: ApprovalMatrix = {
  valueRanges: [
    {
      min: 0,
      max: 500000,
      standardTerms: 'MD',
      nonStandardTerms: 'MD',
      highDiscount: 'Executive'
    },
    {
      min: 500001,
      max: null, // no upper limit
      standardTerms: 'Executive',
      nonStandardTerms: 'Executive',
      highDiscount: 'Executive'
    }
  ],
  discountThresholds: [
    { threshold: 30, level: 'Executive' }
  ],
  contractTermThresholds: [
    { months: 24, level: 'MD' },
    { months: 36, level: 'Executive' }
  ],
  approverLevels: {
    'MD': {
      level: 'MD',
      title: 'Managing Director',
      description: 'Standard approval for deals under $500K without high discounts',
      estimatedTime: '1-2 business days'
    },
    'Executive': {
      level: 'Executive',
      title: 'Executive Committee',
      description: 'Required for high-value deals, extended contracts, or significant discounts',
      estimatedTime: '3-5 business days'
    }
  }
};

export interface DealParameters {
  totalValue: number;
  hasNonStandardTerms: boolean;
  discountPercentage: number;
  contractTerm: number; // in months
}

/**
 * Determines the required approver level based on deal value
 */
export function getValueBasedApprover(value: number, hasNonStandardTerms: boolean, highDiscount: boolean): ApproverLevel {
  const range = approvalMatrix.valueRanges.find(
    range => value >= range.min && (range.max === null || value <= range.max)
  );
  
  if (!range) {
    // Default to highest level if no range matches (shouldn't happen with null max)
    return 'Executive';
  }
  
  if (highDiscount) {
    return range.highDiscount;
  }
  
  return hasNonStandardTerms ? range.nonStandardTerms : range.standardTerms;
}

/**
 * Determines if a discount percentage is considered "high" requiring special approval
 */
export function isHighDiscount(discountPercentage: number): boolean {
  return discountPercentage > 20;
}

/**
 * Determines the minimum required approver level based on discount percentage
 */
export function getDiscountBasedApprover(discountPercentage: number): ApproverLevel {
  // Sort thresholds from highest to lowest to find the first matching level
  const sortedThresholds = [...approvalMatrix.discountThresholds].sort((a, b) => b.threshold - a.threshold);
  
  for (const threshold of sortedThresholds) {
    if (discountPercentage >= threshold.threshold) {
      return threshold.level;
    }
  }
  
  // Default to MD for very low discounts
  return 'MD';
}

/**
 * Determines the minimum required approver level based on contract term length
 */
export function getContractTermBasedApprover(contractTerm: number): ApproverLevel {
  // Sort thresholds from highest to lowest to find the first matching level
  const sortedThresholds = [...approvalMatrix.contractTermThresholds].sort((a, b) => b.months - a.months);
  
  for (const threshold of sortedThresholds) {
    if (contractTerm >= threshold.months) {
      return threshold.level;
    }
  }
  
  // Default to MD for short contracts
  return 'MD';
}

/**
 * Returns the higher level between two approver levels
 */
function getHigherLevel(level1: ApproverLevel, level2: ApproverLevel): ApproverLevel {
  const levels = ['Manager', 'Director', 'VP', 'SVP', 'C-Level'];
  const index1 = levels.indexOf(level1);
  const index2 = levels.indexOf(level2);
  
  return index1 >= index2 ? level1 : level2;
}

/**
 * Determines all required approvers based on deal parameters
 * Returns the highest level approver required
 */
export function determineRequiredApprover(params: DealParameters): ApproverLevel {
  const isHighDiscountDeal = isHighDiscount(params.discountPercentage);
  
  const valueBasedLevel = getValueBasedApprover(params.totalValue, params.hasNonStandardTerms, isHighDiscountDeal);
  const discountBasedLevel = getDiscountBasedApprover(params.discountPercentage);
  const contractTermBasedLevel = getContractTermBasedApprover(params.contractTerm);
  
  // Return the highest level among all three factors
  return getHigherLevel(
    getHigherLevel(valueBasedLevel, discountBasedLevel),
    contractTermBasedLevel
  );
}

/**
 * Gets the full approver details based on the determined level
 */
export function getApproverDetails(level: ApproverLevel): ApprovalRule {
  return approvalMatrix.approverLevels[level];
}

/**
 * Generates an alert message for the deal submission page
 */
export function generateApprovalAlert(params: DealParameters): {
  message: string;
  level: 'info' | 'warning' | 'alert';
  approver: ApprovalRule;
} {
  const requiredLevel = determineRequiredApprover(params);
  const approver = getApproverDetails(requiredLevel);
  
  // Determine alert level based on approver level
  let alertLevel: 'info' | 'warning' | 'alert' = 'info';
  if (requiredLevel === 'VP') {
    alertLevel = 'warning';
  } else if (requiredLevel === 'SVP' || requiredLevel === 'C-Level') {
    alertLevel = 'alert';
  }
  
  // Build a descriptive message
  let message = `This deal requires ${approver.title} approval`;
  
  const reasons = [];
  if (params.totalValue > 50000) reasons.push(`deal value of $${params.totalValue.toLocaleString()}`);
  if (params.hasNonStandardTerms) reasons.push('non-standard terms');
  if (params.discountPercentage > 20) reasons.push(`high discount of ${params.discountPercentage}%`);
  if (params.contractTerm > 24) reasons.push(`extended contract term of ${params.contractTerm} months`);
  
  if (reasons.length > 0) {
    message += ` due to ${reasons.join(' and ')}. `;
  } else {
    message += '. ';
  }
  
  message += `Estimated approval time: ${approver.estimatedTime}.`;
  
  return { message, level: alertLevel, approver };
}