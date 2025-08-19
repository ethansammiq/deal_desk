/**
 * Enhanced Multi-Stage Approval Matrix Service
 * 
 * This service provides sophisticated approval workflow management
 * supporting parallel incentive reviews, sequential stage dependencies,
 * and comprehensive approval tracking.
 */

import type { DealTier } from "@/hooks/useDealTiers";

// Core approval types
export type ApprovalDepartment = 'product' | 'creative' | 'finance' | 'analytics' | 'trading';
export type ApprovalStatus = 'pending' | 'approved' | 'revision_requested';
export type ApprovalStage = 'incentive_review' | 'margin_review' | 'final_review';
export type FinalApproverLevel = 'MD' | 'Executive';

// Individual approval requirement
export interface ApprovalRequirement {
  id: string;
  dealId: number;
  stage: ApprovalStage;
  department: ApprovalDepartment;
  reviewer?: string; // User ID or role
  status: ApprovalStatus;
  requiredFor: string[]; // Which incentive types or aspects this covers
  estimatedTime: string;
  canRunParallel: boolean;
  dependencies: string[]; // IDs of other approvals that must complete first
  createdAt: Date;
  completedAt?: Date;
  comments?: string;
}

// Approval stage definition
export interface ApprovalStageDefinition {
  stage: ApprovalStage;
  name: string;
  description: string;
  canRunParallel: boolean;
  requiredDepartments: ApprovalDepartment[];
  estimatedTime: string;
}

// Deal approval pipeline status
export interface ApprovalPipelineStatus {
  dealId: number;
  currentStage: ApprovalStage;
  overallStatus: 'pending' | 'in_progress' | 'completed' | 'revision_requested';
  stages: {
    stage: ApprovalStage;
    status: ApprovalStatus;
    progress: number; // 0-100
    completedCount: number;
    totalCount: number;
    estimatedCompletionDate?: Date;
  }[];
  nextActions: string[];
  bottlenecks: ApprovalRequirement[];
}

// Enhanced approval matrix configuration
export const approvalStages: ApprovalStageDefinition[] = [
  {
    stage: 'incentive_review',
    name: 'Incentive Review',
    description: 'Department-specific review of proposed incentives',
    canRunParallel: true,
    requiredDepartments: ['finance'], // Base requirement, others added based on incentives
    estimatedTime: '1-2 business days'
  },
  {
    stage: 'margin_review',
    name: 'Margin & Profitability Review',
    description: 'Trading and Finance review of deal margins',
    canRunParallel: false, // Sequential with incentive review completion
    requiredDepartments: ['trading', 'finance'],
    estimatedTime: '1-2 business days'
  },
  {
    stage: 'final_review',
    name: 'Final Deal Structure Review',
    description: 'MD or Executive approval of overall deal',
    canRunParallel: false,
    requiredDepartments: [], // Determined by deal value
    estimatedTime: 'varies'
  }
];

// Department configurations
export const departmentConfig = {
  product: {
    name: 'Product Team',
    description: 'Reviews product-related incentives and offerings',
    contactInfo: 'product-team@company.com',
    incentiveTypes: ['product_incentive', 'feature_access', 'product_discount']
  },
  creative: {
    name: 'Creative Team',
    description: 'Reviews creative and marketing incentives',
    contactInfo: 'creative-team@company.com',
    incentiveTypes: ['creative_incentive', 'marketing_support', 'brand_exposure']
  },
  finance: {
    name: 'Finance Team',
    description: 'Reviews financial incentives and overall deal viability',
    contactInfo: 'finance-team@company.com',
    incentiveTypes: ['financial_incentive', 'payment_terms', 'credit_terms']
  },
  analytics: {
    name: 'Analytics Team',
    description: 'Reviews data and analytics related incentives',
    contactInfo: 'analytics-team@company.com',
    incentiveTypes: ['analytics_incentive', 'data_access', 'reporting_tools']
  },
  trading: {
    name: 'Trading Team',
    description: 'Reviews margin implications and trading viability',
    contactInfo: 'trading-team@company.com',
    incentiveTypes: [] as string[]
  }
};

// Revenue thresholds for final approval
export const finalApprovalThresholds = {
  MD: 500000, // Up to $500K
  Executive: Infinity // Above $500K
};

/**
 * Determines which departments need to review based on deal incentives
 */
export function determineRequiredDepartments(
  dealTiers: DealTier[],
  dealIncentives: any[]
): ApprovalDepartment[] {
  const departments = new Set<ApprovalDepartment>(['finance']); // Always required
  
  // Add departments based on incentive types present in the deal
  if (Array.isArray(dealIncentives)) {
    dealIncentives.forEach(incentive => {
      if (incentive && incentive.type) {
        Object.entries(departmentConfig).forEach(([dept, config]) => {
          if (config.incentiveTypes.includes(incentive.type)) {
            departments.add(dept as ApprovalDepartment);
          }
        });
      }
    });
  }
  
  // Always add trading for margin review
  departments.add('trading');
  
  return Array.from(departments);
}

/**
 * Determines final approver level based on deal value and characteristics
 */
export function determineFinalApproverLevel(
  totalValue: number,
  dealType: string,
  salesChannel: string
): FinalApproverLevel {
  // Executive approval required for high-value or non-standard deals
  if (totalValue >= finalApprovalThresholds.MD || 
      dealType !== 'grow' || 
      salesChannel === 'holding_company') {
    return 'Executive';
  }
  
  return 'MD';
}

/**
 * Generates complete approval requirements for a deal
 */
export function generateApprovalRequirements(
  dealId: number,
  totalValue: number,
  dealType: string,
  salesChannel: string,
  dealTiers: DealTier[],
  dealIncentives: any[]
): ApprovalRequirement[] {
  const requirements: ApprovalRequirement[] = [];
  const requiredDepartments = determineRequiredDepartments(dealTiers, dealIncentives);
  const finalApprover = determineFinalApproverLevel(totalValue, dealType, salesChannel);
  
  // Stage 1: Incentive Reviews (can run in parallel) - Only Finance for now
  requirements.push({
    id: `${dealId}-incentive-finance`,
    dealId,
    stage: 'incentive_review',
    department: 'finance',
    status: 'pending',
    requiredFor: departmentConfig.finance.incentiveTypes,
    estimatedTime: '1-2 business days',
    canRunParallel: true,
    dependencies: [],
    createdAt: new Date()
  });
  
  // Stage 2: Margin Review (depends on incentive completion)
  requirements.push({
    id: `${dealId}-margin-trading`,
    dealId,
    stage: 'margin_review',
    department: 'trading',
    status: 'pending',
    requiredFor: ['margin_validation', 'trading_viability'],
    estimatedTime: '1-2 business days',
    canRunParallel: false,
    dependencies: [`${dealId}-incentive-finance`],
    createdAt: new Date()
  });
  
  // Stage 3: Final Review (depends on all previous stages)
  requirements.push({
    id: `${dealId}-final-${finalApprover.toLowerCase()}`,
    dealId,
    stage: 'final_review',
    department: 'finance', // Represents MD/Executive approval
    status: 'pending',
    requiredFor: ['final_approval'],
    estimatedTime: finalApprover === 'MD' ? '1-2 business days' : '3-5 business days',
    canRunParallel: false,
    dependencies: [`${dealId}-incentive-finance`, `${dealId}-margin-trading`],
    createdAt: new Date()
  });
  
  return requirements;
}

/**
 * Calculates current approval pipeline status
 */
export function calculateApprovalPipelineStatus(
  requirements: ApprovalRequirement[]
): ApprovalPipelineStatus {
  if (requirements.length === 0) {
    // Return default empty status instead of throwing error
    return {
      dealId: 0,
      overallStatus: 'pending',
      currentStage: 'incentive_review',
      stages: [],
      bottlenecks: [],
      nextActions: []
    };
  }
  
  const dealId = requirements[0].dealId;
  const stageGroups = new Map<ApprovalStage, ApprovalRequirement[]>();
  
  // Group requirements by stage
  requirements.forEach(req => {
    const existing = stageGroups.get(req.stage) || [];
    existing.push(req);
    stageGroups.set(req.stage, existing);
  });
  
  // Calculate stage status
  const stages = Array.from(stageGroups.entries()).map(([stage, reqs]) => {
    const completed = reqs.filter(req => req.status === 'approved').length;
    const total = reqs.length;
    const progress = Math.round((completed / total) * 100);
    
    let status: ApprovalStatus = 'pending';
    if (reqs.some(req => req.status === 'revision_requested')) {
      status = 'revision_requested';
    } else if (completed === total) {
      status = 'approved';
    } else if (completed > 0) {
      status = 'pending'; // In progress
    }
    
    return {
      stage,
      status,
      progress,
      completedCount: completed,
      totalCount: total
    };
  });
  
  // Determine current stage and overall status
  const currentStage = stages.find(s => s.status === 'pending')?.stage || 'final_review';
  const overallCompleted = stages.every(s => s.status === 'approved');
  const hasRevisions = stages.some(s => s.status === 'revision_requested');
  
  let overallStatus: ApprovalPipelineStatus['overallStatus'];
  if (hasRevisions) {
    overallStatus = 'revision_requested';
  } else if (overallCompleted) {
    overallStatus = 'completed';
  } else if (stages.some(s => s.progress > 0)) {
    overallStatus = 'in_progress';
  } else {
    overallStatus = 'pending';
  }
  
  // Identify bottlenecks and next actions
  const bottlenecks = requirements.filter(req => 
    req.status === 'pending' && 
    req.dependencies.every(depId => 
      requirements.find(r => r.id === depId)?.status === 'approved'
    )
  );
  
  const nextActions = bottlenecks.map(req => 
    `Waiting for ${departmentConfig[req.department].name} approval`
  );
  
  return {
    dealId,
    currentStage,
    overallStatus,
    stages,
    nextActions,
    bottlenecks
  };
}

/**
 * Get follow-up recommendations for sellers
 */
export function getFollowUpRecommendations(
  pipelineStatus: ApprovalPipelineStatus
): string[] {
  const recommendations: string[] = [];
  
  pipelineStatus.bottlenecks.forEach(bottleneck => {
    const deptConfig = departmentConfig[bottleneck.department];
    recommendations.push(
      `Contact ${deptConfig.name} (${deptConfig.contactInfo}) about ${bottleneck.requiredFor.join(', ')}`
    );
  });
  
  if (pipelineStatus.overallStatus === 'revision_requested') {
    recommendations.push('Address revision requests and resubmit');
  }
  
  return recommendations;
}