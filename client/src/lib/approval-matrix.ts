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

// Define the standard deal criteria
export interface StandardDealCriteria {
  dealType: string;
  salesChannel: string[];
  hasTradeAMImplications: boolean;
  projectedAnnualSpendMin: number;
  projectedAnnualSpendMax: number;
  yearlyRevenueGrowthRate: number;
  forecastedMargin: number;
  yearlyMarginGrowthRate: number;
  addedValueBenefitsCost: number;
  analyticsTier: string;
  requiresCustomMarketing: boolean;
}

// Standard deal criteria 
export const standardDealCriteria: StandardDealCriteria = {
  dealType: "grow",
  salesChannel: ["independent_agency", "client_direct"],
  hasTradeAMImplications: false,
  projectedAnnualSpendMin: 1000000, // $1M
  projectedAnnualSpendMax: 3000000, // $3M
  yearlyRevenueGrowthRate: 25, // ≥ 25%
  forecastedMargin: 30, // ≥ 30%
  yearlyMarginGrowthRate: -5, // ≥ -5%
  addedValueBenefitsCost: 100000, // ≤ $100K
  analyticsTier: "silver",
  requiresCustomMarketing: false
};

// Define the approval matrix with all rules
export const approvalMatrix: ApprovalMatrix = {
  valueRanges: [
    {
      min: 0,
      max: 500000,
      standardTerms: 'MD',
      nonStandardTerms: 'Executive',
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
      description: 'Standard approval for deals meeting standard criteria',
      estimatedTime: '1-2 business days'
    },
    'Executive': {
      level: 'Executive',
      title: 'Executive Committee',
      description: 'Required for non-standard deals, high-value deals, or deals with special terms',
      estimatedTime: '3-5 business days'
    }
  }
};

export interface DealParameters {
  totalValue: number;
  annualValue?: number;
  dealType?: string;
  salesChannel?: string;
  hasTradeAMImplications?: boolean;
  yearlyRevenueGrowthRate?: number;
  forecastedMargin?: number;
  yearlyMarginGrowthRate?: number;
  addedValueBenefitsCost?: number;
  analyticsTier?: string;
  requiresCustomMarketing?: boolean;
  hasNonStandardTerms: boolean;
  discountPercentage: number;
  contractTerm: number; // in months
}

/**
 * Determines if a deal meets all standard deal criteria
 */
export function isStandardDeal(params: DealParameters): boolean {
  // All criteria must be met to be considered a standard deal
  
  // If any of these required parameters are missing, it's not a standard deal
  if (!params.dealType || !params.salesChannel || 
      params.yearlyRevenueGrowthRate === undefined || 
      params.forecastedMargin === undefined ||
      params.yearlyMarginGrowthRate === undefined) {
    return false;
  }
  
  const annualValue = params.annualValue || (params.totalValue / (params.contractTerm / 12));
  const addedValueBenefitsCost = params.addedValueBenefitsCost || 0;
  
  // Check all criteria
  const isDealTypeMatch = params.dealType.toLowerCase() === standardDealCriteria.dealType;
  const isSalesChannelMatch = standardDealCriteria.salesChannel.includes(params.salesChannel);
  const hasNoTradeImplications = params.hasTradeAMImplications === false;
  const isSpendInRange = annualValue >= standardDealCriteria.projectedAnnualSpendMin && 
                         annualValue <= standardDealCriteria.projectedAnnualSpendMax;
  const isRevenueGrowthSufficient = (params.yearlyRevenueGrowthRate || 0) >= standardDealCriteria.yearlyRevenueGrowthRate;
  const isMarginSufficient = (params.forecastedMargin || 0) >= standardDealCriteria.forecastedMargin;
  const isMarginGrowthSufficient = (params.yearlyMarginGrowthRate || 0) >= standardDealCriteria.yearlyMarginGrowthRate;
  const isBenefitCostAcceptable = addedValueBenefitsCost <= standardDealCriteria.addedValueBenefitsCost;
  const isAnalyticsTierAcceptable = (params.analyticsTier || "").toLowerCase() === standardDealCriteria.analyticsTier;
  const hasNoCustomMarketing = params.requiresCustomMarketing === false;
  
  // All criteria must pass
  return isDealTypeMatch && 
         isSalesChannelMatch && 
         hasNoTradeImplications && 
         isSpendInRange && 
         isRevenueGrowthSufficient && 
         isMarginSufficient && 
         isMarginGrowthSufficient && 
         isBenefitCostAcceptable && 
         isAnalyticsTierAcceptable && 
         hasNoCustomMarketing;
}

/**
 * Get failed criteria reasons for non-standard deals
 */
export function getNonStandardDealReasons(params: DealParameters): string[] {
  const reasons: string[] = [];
  
  // Calculate annual value
  const annualValue = params.annualValue || (params.totalValue / (params.contractTerm / 12));
  const addedValueBenefitsCost = params.addedValueBenefitsCost || 0;
  
  // Check each criterion and add reason if failed
  if (!params.dealType || params.dealType.toLowerCase() !== standardDealCriteria.dealType) {
    reasons.push(`Deal type is not 'Grow'`);
  }
  
  if (!params.salesChannel || !standardDealCriteria.salesChannel.includes(params.salesChannel)) {
    reasons.push(`Sales channel is not Independent Agency or Client Direct`);
  }
  
  if (params.hasTradeAMImplications === true) {
    reasons.push(`Has Trading & AM resource implications`);
  }
  
  if (annualValue < standardDealCriteria.projectedAnnualSpendMin || 
      annualValue > standardDealCriteria.projectedAnnualSpendMax) {
    reasons.push(`Projected annual spend not between $1M-$3M`);
  }
  
  if ((params.yearlyRevenueGrowthRate || 0) < standardDealCriteria.yearlyRevenueGrowthRate) {
    reasons.push(`Yearly revenue growth rate < 25%`);
  }
  
  if ((params.forecastedMargin || 0) < standardDealCriteria.forecastedMargin) {
    reasons.push(`Forecasted margin < 30%`);
  }
  
  if ((params.yearlyMarginGrowthRate || 0) < standardDealCriteria.yearlyMarginGrowthRate) {
    reasons.push(`Yearly margin growth rate < -5%`);
  }
  
  if (addedValueBenefitsCost > standardDealCriteria.addedValueBenefitsCost) {
    reasons.push(`Added value benefits cost > $100K`);
  }
  
  if ((params.analyticsTier || "").toLowerCase() !== standardDealCriteria.analyticsTier) {
    reasons.push(`Analytics solutions tier is not Silver`);
  }
  
  if (params.requiresCustomMarketing === true) {
    reasons.push(`Requires custom marketing/PR`);
  }
  
  return reasons;
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
  return discountPercentage > 30;
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
  const levels = ['MD', 'Executive'];
  const index1 = levels.indexOf(level1);
  const index2 = levels.indexOf(level2);
  
  return index1 >= index2 ? level1 : level2;
}

/**
 * Determines all required approvers based on deal parameters
 * Returns the highest level approver required
 */
export function determineRequiredApprover(params: DealParameters): ApproverLevel {
  // First check if deal meets standard criteria
  // Non-standard deals always require Executive approval
  if (!isStandardDeal(params)) {
    return 'Executive';
  }
  
  // Even if it's a standard deal, check other factors
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
  reasons: string[];
} {
  const requiredLevel = determineRequiredApprover(params);
  const approver = getApproverDetails(requiredLevel);
  
  // Determine alert level based on approver level
  let alertLevel: 'info' | 'warning' | 'alert' = 'info';
  if (requiredLevel === 'MD') {
    alertLevel = 'info';
  } else if (requiredLevel === 'Executive') {
    alertLevel = 'warning';
  }
  
  // Build a descriptive message
  let message = `This deal requires ${approver.title} approval`;
  
  // Get reasons for non-standard deal
  const standardDealReasons = getNonStandardDealReasons(params);
  
  // Additional reasons related to value, discounts, etc.
  const additionalReasons = [];
  if (params.totalValue > 500000) additionalReasons.push(`deal value of $${params.totalValue.toLocaleString()}`);
  if (params.hasNonStandardTerms) additionalReasons.push('non-standard terms');
  if (params.discountPercentage > 30) additionalReasons.push(`high discount of ${params.discountPercentage}%`);
  if (params.contractTerm > 36) additionalReasons.push(`extended contract term of ${params.contractTerm} months`);
  
  // Combine all reasons
  const reasons = [...standardDealReasons, ...additionalReasons];
  
  if (reasons.length > 0) {
    if (reasons.length === 1) {
      message += ` due to ${reasons[0]}. `;
    } else if (reasons.length === 2) {
      message += ` due to ${reasons.join(' and ')}. `;
    } else {
      const lastReason = reasons.pop();
      message += ` due to ${reasons.join(', ')}, and ${lastReason}. `;
    }
  } else {
    message += '. ';
  }
  
  message += `Estimated approval time: ${approver.estimatedTime}.`;
  
  return { message, level: alertLevel, approver, reasons };
}