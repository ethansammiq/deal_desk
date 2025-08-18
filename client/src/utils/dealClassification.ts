import type { Deal, DealPriority } from "@shared/schema";

// Updated 3-Tier Deal Classification System
// 1. Stage Status (workflow states) - in deal.status
// 2. Priority (seller-defined) - in deal.priority  
// 3. Flow Intelligence (timing-based) - calculated here

export type FlowIntelligence = 'on_track' | 'at_risk' | 'delayed' | 'stalled';

export interface DealFlowClassification {
  flowStatus: FlowIntelligence;
  reason: string;
  daysInStatus: number;
  actionRequired: boolean;
  urgencyLevel: 'normal' | 'attention' | 'urgent';
}

// Flow Intelligence timing thresholds
const FLOW_THRESHOLDS = {
  scoping: { normal: 5, atRisk: 4, delayed: 6, stalled: 10 },
  submitted: { normal: 3, atRisk: 2, delayed: 4, stalled: 7 },
  under_review: { normal: 3, atRisk: 2, delayed: 4, stalled: 7 },
  revision_requested: { normal: 3, atRisk: 2, delayed: 4, stalled: 7 },
  approved: { normal: 3, atRisk: 2, delayed: 4, stalled: 7 },
  negotiating: { normal: 7, atRisk: 5, delayed: 8, stalled: 14 },
  contract_drafting: { normal: 5, atRisk: 4, delayed: 6, stalled: 10 },
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

  if (daysInStatus >= thresholds.atRisk) {
    return {
      flowStatus: 'at_risk',
      reason: `Deal approaching delay in ${deal.status} (${daysInStatus}/${thresholds.normal} days)`,
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

// Filter functions for Flow Intelligence views
export function getDelayedDeals(deals: Deal[]): Deal[] {
  return deals.filter(deal => {
    const flow = classifyDealFlow(deal);
    return flow.flowStatus === 'delayed' || flow.flowStatus === 'stalled';
  });
}

export function getAtRiskDeals(deals: Deal[]): Deal[] {
  return deals.filter(deal => classifyDealFlow(deal).flowStatus === 'at_risk');
}

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
    case 'at_risk':
      return {
        text: 'At Risk',
        variant: 'secondary' as const,
        color: 'border-orange-400'
      };
    default:
      return null;
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

// Filter categories for Flow Intelligence
export const FLOW_FILTER_CATEGORIES = [
  { value: 'all', label: 'All Deals', count: (deals: Deal[]) => deals.length },
  { value: 'delayed', label: 'Delayed + Stalled', count: getDelayedDeals },
  { value: 'at_risk', label: 'At Risk', count: getAtRiskDeals },
  { value: 'stalled', label: 'Stalled', count: getStalledDeals },
] as const;

// Filter categories for Priority
export const PRIORITY_FILTER_CATEGORIES = [
  { value: 'all', label: 'All Priorities', count: (deals: Deal[]) => deals.length },
  { value: 'critical', label: 'Critical', count: (deals: Deal[]) => getDealsByPriority(deals, 'critical') },
  { value: 'high', label: 'High', count: (deals: Deal[]) => getDealsByPriority(deals, 'high') },
  { value: 'medium', label: 'Medium', count: (deals: Deal[]) => getDealsByPriority(deals, 'medium') },
  { value: 'low', label: 'Low', count: (deals: Deal[]) => getDealsByPriority(deals, 'low') },
] as const;