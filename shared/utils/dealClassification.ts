import type { Deal, DealPriority } from "@shared/schema";

// Updated 3-Tier Deal Classification System
// 1. Stage Status (workflow states) - in deal.status
// 2. Priority (seller-defined) - in deal.priority  
// 3. Flow Intelligence (timing-based) - calculated here

// Ultra-Simplified Flow Intelligence: 2-status system for streamlined logic
export type FlowIntelligence = 'on_track' | 'needs_attention';

export interface DealFlowClassification {
  flowStatus: FlowIntelligence;
  reason: string;
  daysInStatus: number;
  actionRequired: boolean;
  urgencyLevel: 'normal' | 'attention' | 'urgent';
}

// Flow Intelligence timing thresholds
// Revised Flow Intelligence: Simplified thresholds for 3-status system
const FLOW_THRESHOLDS = {
  scoping: { normal: 3, needsAttention: 4 }, // Simplified: on_track vs needs_attention
  submitted: { normal: 1, needsAttention: 2 }, // 0-1 days (on_track), 2+ days (needs_attention)  
  under_review: { normal: 2, needsAttention: 3 }, // 0-2 days (on_track), 3+ days (needs_attention)
  revision_requested: { normal: 2, needsAttention: 3 }, // 0-2 days (on_track), 3+ days (needs_attention)
  approved: { normal: 3, needsAttention: 4 }, // 0-3 days (on_track), 4+ days (needs_attention)
  negotiating: { normal: 3, needsAttention: 4 }, // Using consistent pattern
  contract_drafting: { normal: 2, needsAttention: 3 }, // Using consistent pattern
} as const;

export function classifyDealFlow(deal: Deal): DealFlowClassification {
  const now = new Date();
  const lastUpdate = deal.lastStatusChange ? new Date(deal.lastStatusChange) : new Date(deal.createdAt || now);
  const daysInStatus = Math.floor((now.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24));
  
  // Skip classification for terminal states
  if (['signed', 'lost', 'canceled', 'draft'].includes(deal.status)) {
    return {
      flowStatus: 'on_track',
      reason: `Deal is ${deal.status}`,
      daysInStatus,
      actionRequired: false,
      urgencyLevel: 'normal'
    };
  }

  // Enhanced Flow Intelligence: Check business risk criteria first
  const businessRiskCheck = checkBusinessRisk(deal, now, daysInStatus);
  if (businessRiskCheck) {
    return businessRiskCheck;
  }

  // Standard timing-based flow intelligence
  const thresholds = FLOW_THRESHOLDS[deal.status as keyof typeof FLOW_THRESHOLDS];
  if (!thresholds) {
    return {
      flowStatus: 'on_track',
      reason: 'Status not tracked for flow intelligence',
      daysInStatus,
      actionRequired: false,
      urgencyLevel: 'normal'
    };
  }

  // Timing-based decision logic
  if (daysInStatus >= thresholds.needsAttention) {
    return {
      flowStatus: 'needs_attention',
      reason: `Deal needs attention after ${daysInStatus} days in ${deal.status} (expected: ${thresholds.normal} days)`,
      daysInStatus,
      actionRequired: true,
      urgencyLevel: 'attention'
    };
  }

  return {
    flowStatus: 'on_track',
    reason: `Deal progressing normally in ${deal.status} (${daysInStatus}/${thresholds.normal} days)`,
    daysInStatus,
    actionRequired: false,
    urgencyLevel: 'normal'
  };
}

// Comprehensive business risk detection logic - unified source for all components
function checkBusinessRisk(deal: Deal, now: Date, daysInStatus: number): DealFlowClassification | null {
  // 1. Revision requested - always needs seller attention
  if (deal.status === 'revision_requested') {
    return {
      flowStatus: 'needs_attention',
      reason: 'Revision requested - seller action required to address feedback and resubmit',
      daysInStatus,
      actionRequired: true,
      urgencyLevel: 'attention'
    };
  }

  // 2. Extended negotiations (>7 days) - business concern  
  if (deal.status === 'negotiating' && daysInStatus > 7) {
    return {
      flowStatus: 'needs_attention',
      reason: `Negotiation extended beyond normal timeframe (${daysInStatus} days) - client follow-up needed`,
      daysInStatus,
      actionRequired: true,
      urgencyLevel: 'attention'
    };
  }

  // 3. High revision count - quality/process concern
  if (deal.revisionCount && deal.revisionCount >= 2) {
    return {
      flowStatus: 'needs_attention',
      reason: `Deal has ${deal.revisionCount} revisions - review strategy and approach`,
      daysInStatus,
      actionRequired: true,
      urgencyLevel: 'attention'
    };
  }

  // 4. Expiring draft - deadline urgency
  if (deal.draftExpiresAt) {
    const timeToExpiry = new Date(deal.draftExpiresAt).getTime() - now.getTime();
    const daysToExpiry = Math.floor(timeToExpiry / (1000 * 60 * 60 * 24));
    if (daysToExpiry < 3) {
      return {
        flowStatus: 'needs_attention',
        reason: daysToExpiry <= 0 
          ? 'Draft has expired - immediate action required'
          : `Draft expires in ${daysToExpiry} day${daysToExpiry === 1 ? '' : 's'} - urgent attention needed`,
        daysInStatus,
        actionRequired: true,
        urgencyLevel: 'urgent'
      };
    }
  }

  // 5. Priority escalation - critical/high priority deals stuck too long
  if ((deal.priority === 'critical' || deal.priority === 'high') && daysInStatus > 1) {
    // High priority deals get shorter tolerance regardless of status
    return {
      flowStatus: 'needs_attention',
      reason: `${deal.priority.charAt(0).toUpperCase() + deal.priority.slice(1)} priority deal delayed ${daysInStatus} days - escalation needed`,
      daysInStatus,
      actionRequired: true,
      urgencyLevel: 'urgent'
    };
  }

  // 6. Stalled submissions - submitted deals not moving to review
  if (deal.status === 'submitted' && daysInStatus > 3) {
    return {
      flowStatus: 'needs_attention',
      reason: `Deal submitted ${daysInStatus} days ago but not yet under review - internal follow-up needed`,
      daysInStatus,
      actionRequired: true,
      urgencyLevel: 'attention'
    };
  }

  // 7. Extended approvals - approved deals not moving to execution
  if (deal.status === 'approved' && daysInStatus > 5) {
    return {
      flowStatus: 'needs_attention',
      reason: `Deal approved ${daysInStatus} days ago but not progressing - execution follow-up needed`,
      daysInStatus,
      actionRequired: true,
      urgencyLevel: 'attention'
    };
  }

  // 8. Contract drafting delays - legal bottleneck detection
  if (deal.status === 'contract_drafting' && daysInStatus > 4) {
    return {
      flowStatus: 'needs_attention',
      reason: `Contract drafting delayed ${daysInStatus} days - legal team follow-up needed`,
      daysInStatus,
      actionRequired: true,
      urgencyLevel: 'attention'
    };
  }

  // 9. Client review timeout - external dependency management
  if (deal.status === 'client_review' && daysInStatus > 7) {
    return {
      flowStatus: 'needs_attention',
      reason: `Deal in client review for ${daysInStatus} days - client follow-up needed`,
      daysInStatus,
      actionRequired: true,
      urgencyLevel: 'attention'
    };
  }

  // 10. High-value deal monitoring - deals over threshold need special attention
  if (deal.annualRevenue && deal.annualRevenue > 5000000 && daysInStatus > 2) {
    return {
      flowStatus: 'needs_attention',
      reason: `High-value deal ($${(deal.annualRevenue / 1000000).toFixed(1)}M) delayed ${daysInStatus} days - executive attention needed`,
      daysInStatus,
      actionRequired: true,
      urgencyLevel: 'urgent'
    };
  }

  return null; // No business risk detected
}

// Legacy function for compatibility - finds delayed deals using old logic
export function getDelayedDeals(deals: Deal[]): Deal[] {
  return deals.filter(deal => {
    const flow = classifyDealFlow(deal);
    return flow.flowStatus === 'needs_attention';
  });
}

// Badge styling info for flow intelligence
export function getFlowBadgeInfo(deal: Deal) {
  const flow = classifyDealFlow(deal);
  
  switch (flow.flowStatus) {
    case 'needs_attention':
      return {
        variant: 'destructive' as const,
        label: 'Needs Attention',
        className: 'bg-orange-100 text-orange-800 border-orange-200'
      };
    case 'on_track':
    default:
      return {
        variant: 'secondary' as const,
        label: 'On Track',
        className: 'bg-green-100 text-green-800 border-green-200'
      };
  }
}