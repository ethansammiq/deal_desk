import type { Deal, DealPriority } from "@shared/schema";

// Updated 3-Tier Deal Classification System
// 1. Stage Status (workflow states) - in deal.status
// 2. Priority (seller-defined) - in deal.priority  
// 3. Flow Intelligence (timing-based) - calculated here

// Revised Flow Intelligence: Simplified 3-status system based on user feedback
export type FlowIntelligence = 'on_track' | 'needs_attention' | 'accelerated';

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

  // TODO Phase 3: Implement accelerated detection for deals moving unusually fast
  
  return {
    flowStatus: 'on_track',
    reason: `Deal progressing normally in ${deal.status} (${daysInStatus}/${thresholds.normal} days)`,
    daysInStatus,
    actionRequired: false,
    urgencyLevel: 'normal'
  };
}

// Filter functions for Revised Flow Intelligence
export function getDelayedDeals(deals: Deal[]): Deal[] {
  return deals.filter(deal => {
    const flow = classifyDealFlow(deal);
    return flow.flowStatus === 'needs_attention';
  });
}

// Revised: Combined delayed/stalled into needs_attention
export function getStalledDeals(deals: Deal[]): Deal[] {
  return deals.filter(deal => classifyDealFlow(deal).flowStatus === 'needs_attention');
}

export function getDealsByPriority(deals: Deal[], priority: DealPriority): Deal[] {
  return deals.filter(deal => deal.priority === priority);
}

// Revised: Check if a deal needs attention (previously delayed/stalled)
export function isDealDelayed(deal: Deal): boolean {
  const flow = classifyDealFlow(deal);
  return flow.flowStatus === 'needs_attention';
}

// UI helpers for Flow Intelligence
// Phase 1 Flow Intelligence: Badge info for the 4 core statuses
export function getFlowBadgeInfo(deal: Deal) {
  const flow = classifyDealFlow(deal);
  
  switch (flow.flowStatus) {
    case 'needs_attention':
      return {
        text: 'Needs Attention',
        variant: 'destructive' as const,
        color: 'border-orange-500'
      };
    case 'accelerated':
      return {
        text: 'Accelerated',
        variant: 'secondary' as const,
        color: 'border-green-500'
      };
    case 'on_track':
    default:
      return null; // Don't show badge for on_track deals
  }
}

// UI helpers for Priority
export function getPriorityBadgeInfo(priority: DealPriority) {
  switch (priority) {
    case 'critical':
      return {
        text: 'Critical',
        variant: 'destructive' as const,
        color: 'border-red-600'
      };
    case 'high':
      return {
        text: 'High',
        variant: 'secondary' as const,
        color: 'border-orange-500'
      };
    case 'medium':
      return {
        text: 'Medium',
        variant: 'outline' as const,
        color: 'border-blue-400'
      };
    case 'low':
      return {
        text: 'Low',
        variant: 'outline' as const,
        color: 'border-gray-400'
      };
  }
}

// Revised Flow Intelligence: Simplified filter categories 
export const FLOW_FILTER_CATEGORIES = [
  { value: 'all', label: 'All Deals', count: (deals: Deal[]) => deals.length },
  { value: 'needs_attention', label: 'Need Attention', count: (deals: Deal[]) => getDelayedDeals(deals).length },
  { value: 'on_track', label: 'On Track', count: getOnTrackDeals },
] as const;

// Helper functions for Flow Intelligence filtering
function getOnTrackDeals(deals: Deal[]): number {
  return deals.filter(deal => {
    if (['signed', 'lost', 'draft'].includes(deal.status)) return false;
    const flow = classifyDealFlow(deal);
    return flow.flowStatus === 'on_track';
  }).length;
}

// Filter categories for Priority
export const PRIORITY_FILTER_CATEGORIES = [
  { value: 'all', label: 'All Priorities', count: (deals: Deal[]) => deals.length },
  { value: 'critical', label: 'Critical', count: (deals: Deal[]) => getDealsByPriority(deals, 'critical') },
  { value: 'high', label: 'High', count: (deals: Deal[]) => getDealsByPriority(deals, 'high') },
  { value: 'medium', label: 'Medium', count: (deals: Deal[]) => getDealsByPriority(deals, 'medium') },
  { value: 'low', label: 'Low', count: (deals: Deal[]) => getDealsByPriority(deals, 'low') },
] as const;