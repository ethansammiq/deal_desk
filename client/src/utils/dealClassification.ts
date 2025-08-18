import type { Deal, DealPriority } from "@shared/schema";

// Updated 3-Tier Deal Classification System
// 1. Stage Status (workflow states) - in deal.status
// 2. Priority (seller-defined) - in deal.priority  
// 3. Flow Intelligence (timing-based) - calculated here

// Phase 1 Flow Intelligence: Core types from proposal  
export type FlowIntelligence = 'on_track' | 'accelerated' | 'delayed' | 'stalled';

export interface DealFlowClassification {
  flowStatus: FlowIntelligence;
  reason: string;
  daysInStatus: number;
  actionRequired: boolean;
  urgencyLevel: 'normal' | 'attention' | 'urgent';
}

// Flow Intelligence timing thresholds
// Phase 1 Flow Intelligence: Exact thresholds from proposal
const FLOW_THRESHOLDS = {
  scoping: { normal: 5, delayed: 6, stalled: 10 }, // Not in proposal, keeping current
  submitted: { normal: 2, delayed: 3, stalled: 6 }, // Proposal: 0-2 (on_track), 3-5 (delayed), 6+ (stalled)  
  under_review: { normal: 5, delayed: 6, stalled: 11 }, // Proposal: 0-5 (on_track), 6-10 (delayed), 11+ (stalled)
  revision_requested: { normal: 3, delayed: 4, stalled: 8 }, // Proposal: 0-3 (on_track), 4-7 (delayed), 8+ (stalled)
  approved: { normal: 7, delayed: 8, stalled: 15 }, // Proposal: 0-7 (on_track), 8-14 (delayed), 15+ (stalled)
  negotiating: { normal: 7, delayed: 8, stalled: 14 }, // Using reasonable thresholds
  contract_drafting: { normal: 5, delayed: 6, stalled: 10 }, // Using reasonable thresholds
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

  // Determine flow status based on timing
  if (daysInStatus >= thresholds.stalled) {
    return {
      flowStatus: 'stalled',
      reason: `Deal stalled for ${daysInStatus} days in ${deal.status} (expected: ${thresholds.normal} days)`,
      daysInStatus,
      actionRequired: true,
      urgencyLevel: 'urgent'
    };
  }
  
  if (daysInStatus >= thresholds.delayed) {
    return {
      flowStatus: 'delayed',
      reason: `Deal delayed ${daysInStatus} days in ${deal.status} (expected: ${thresholds.normal} days)`,
      daysInStatus,
      actionRequired: true,
      urgencyLevel: 'urgent'
    };
  }

  // Phase 1: Remove at_risk classification, use simple on_track for now
  // Phase 3 will implement accelerated detection

  return {
    flowStatus: 'on_track',
    reason: `Deal progressing normally in ${deal.status} (${daysInStatus}/${thresholds.normal} days)`,
    daysInStatus,
    actionRequired: false,
    urgencyLevel: 'normal'
  };
}

// Filter functions for Flow Intelligence views
export function getDelayedDeals(deals: Deal[]): Deal[] {
  return deals.filter(deal => {
    const flow = classifyDealFlow(deal);
    return flow.flowStatus === 'delayed' || flow.flowStatus === 'stalled';
  });
}

// Phase 1: Removed at_risk classification - will be replaced with accelerated in Phase 3

export function getStalledDeals(deals: Deal[]): Deal[] {
  return deals.filter(deal => classifyDealFlow(deal).flowStatus === 'stalled');
}

export function getDealsByPriority(deals: Deal[], priority: DealPriority): Deal[] {
  return deals.filter(deal => deal.priority === priority);
}

// Check if a deal matches the delayed filter criteria
export function isDealDelayed(deal: Deal): boolean {
  const flow = classifyDealFlow(deal);
  return flow.flowStatus === 'delayed' || flow.flowStatus === 'stalled';
}

// UI helpers for Flow Intelligence
// Phase 1 Flow Intelligence: Badge info for the 4 core statuses
export function getFlowBadgeInfo(deal: Deal) {
  const flow = classifyDealFlow(deal);
  
  switch (flow.flowStatus) {
    case 'stalled':
      return {
        text: 'Stalled',
        variant: 'destructive' as const,
        color: 'border-red-600'
      };
    case 'delayed':
      return {
        text: 'Delayed',
        variant: 'destructive' as const,
        color: 'border-red-400'
      };
    case 'accelerated':
      return {
        text: 'Accelerated',
        variant: 'secondary' as const,
        color: 'border-blue-500'
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

// Phase 1 Flow Intelligence: Filter categories for the new system
export const FLOW_FILTER_CATEGORIES = [
  { value: 'all', label: 'All Deals', count: (deals: Deal[]) => deals.length },
  { value: 'delayed', label: 'Delayed + Stalled', count: (deals: Deal[]) => getDelayedDeals(deals).length + getStalledDeals(deals).length },
  { value: 'stalled', label: 'Stalled Only', count: (deals: Deal[]) => getStalledDeals(deals).length },
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