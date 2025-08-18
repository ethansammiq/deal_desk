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
  scoping: { normal: 5, needsAttention: 6 }, // Simplified: on_track vs needs_attention
  submitted: { normal: 2, needsAttention: 3 }, // 0-2 days (on_track), 3+ days (needs_attention)  
  under_review: { normal: 5, needsAttention: 6 }, // 0-5 days (on_track), 6+ days (needs_attention)
  revision_requested: { normal: 3, needsAttention: 4 }, // 0-3 days (on_track), 4+ days (needs_attention)
  approved: { normal: 7, needsAttention: 8 }, // 0-7 days (on_track), 8+ days (needs_attention)
  negotiating: { normal: 7, needsAttention: 8 }, // Using consistent pattern
  contract_drafting: { normal: 5, needsAttention: 6 }, // Using consistent pattern
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

  // Revised Flow Intelligence: Simplified decision logic
  if (daysInStatus >= thresholds.needsAttention) {
    return {
      flowStatus: 'needs_attention',
      reason: `Deal needs follow-up after ${daysInStatus} days in ${deal.status} (expected: ${thresholds.normal} days)`,
      daysInStatus,
      actionRequired: true,
      urgencyLevel: 'attention'
    };
  }

  // Ultra-Simplified: All normal progression is "on_track"
  
  return {
    flowStatus: 'on_track',
    reason: `Deal progressing normally in ${deal.status} (${daysInStatus}/${thresholds.normal} days)`,
    daysInStatus,
    actionRequired: false,
    urgencyLevel: 'normal'
  };
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
        label: 'Needs Follow-up',
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