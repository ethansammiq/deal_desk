import type { Deal } from "@shared/schema";

// Unified Deal Classification System
// This centralizes all deal categorization logic to avoid confusion

export type DealPriority = 'critical' | 'high' | 'medium' | 'normal';
export type DealCategory = 'delayed' | 'high_value' | 'closing' | 'normal';

export interface DealClassification {
  priority: DealPriority;
  category: DealCategory;
  reason: string;
  daysInStatus: number;
  actionRequired: boolean;
}

// Unified timing thresholds for all delay detection
const DELAY_THRESHOLDS = {
  scoping: 5,           // 5 days to scope
  submitted: 3,         // 3 days for initial review
  under_review: 3,      // 3 days for department review
  revision_requested: 3, // 3 days to address revisions
  approved: 3,          // 3 days to start contracting
  negotiating: 7,       // 7 days for negotiations
  contract_drafting: 5, // 5 days for contract completion
} as const;

// High-value threshold
const HIGH_VALUE_THRESHOLD = 500000;

export function classifyDeal(deal: Deal): DealClassification {
  const now = new Date();
  const lastUpdate = deal.lastStatusChange ? new Date(deal.lastStatusChange) : new Date(deal.createdAt || now);
  const daysInStatus = Math.floor((now.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24));
  
  // Skip classification for terminal states
  if (['signed', 'lost', 'canceled', 'draft'].includes(deal.status)) {
    return {
      priority: 'normal',
      category: 'normal',
      reason: `Deal is ${deal.status}`,
      daysInStatus,
      actionRequired: false
    };
  }

  const dealValue = deal.annualRevenue || 0;
  const isHighValue = dealValue >= HIGH_VALUE_THRESHOLD;
  const threshold = DELAY_THRESHOLDS[deal.status as keyof typeof DELAY_THRESHOLDS];
  const isDelayed = threshold && daysInStatus > threshold;

  // Determine category and priority
  if (isDelayed && isHighValue) {
    return {
      priority: 'critical',
      category: 'delayed',
      reason: `High-value deal delayed ${daysInStatus} days in ${deal.status}`,
      daysInStatus,
      actionRequired: true
    };
  }
  
  if (isDelayed) {
    return {
      priority: 'high',
      category: 'delayed',
      reason: `Deal delayed ${daysInStatus} days in ${deal.status}`,
      daysInStatus,
      actionRequired: true
    };
  }

  if (['approved', 'contract_drafting'].includes(deal.status)) {
    return {
      priority: isHighValue ? 'high' : 'medium',
      category: 'closing',
      reason: `Ready to close${isHighValue ? ' (high-value)' : ''}`,
      daysInStatus,
      actionRequired: true
    };
  }

  if (isHighValue) {
    return {
      priority: 'medium',
      category: 'high_value',
      reason: `High-value deal in progress`,
      daysInStatus,
      actionRequired: false
    };
  }

  return {
    priority: 'normal',
    category: 'normal',
    reason: 'Progressing normally',
    daysInStatus,
    actionRequired: false
  };
}

// Filter functions for different views
export function getDelayedDeals(deals: Deal[]): Deal[] {
  return deals.filter(deal => classifyDeal(deal).category === 'delayed');
}

export function getHighValueDeals(deals: Deal[]): Deal[] {
  return deals.filter(deal => {
    const classification = classifyDeal(deal);
    return classification.category === 'high_value' || 
           (classification.category === 'delayed' && deal.annualRevenue && deal.annualRevenue >= HIGH_VALUE_THRESHOLD);
  });
}

export function getClosingDeals(deals: Deal[]): Deal[] {
  return deals.filter(deal => classifyDeal(deal).category === 'closing');
}

export function getCriticalDeals(deals: Deal[]): Deal[] {
  return deals.filter(deal => classifyDeal(deal).priority === 'critical');
}

// UI helpers
export function getDealBadgeInfo(deal: Deal) {
  const classification = classifyDeal(deal);
  
  switch (classification.category) {
    case 'delayed':
      return {
        text: classification.priority === 'critical' ? 'Critical' : 'Delayed',
        variant: 'destructive' as const,
        color: 'border-red-400'
      };
    case 'closing':
      return {
        text: 'Ready to Close',
        variant: 'default' as const,
        color: 'border-green-500'
      };
    case 'high_value':
      return {
        text: 'High-Value',
        variant: 'secondary' as const,
        color: 'border-blue-500'
      };
    default:
      return null;
  }
}

// Filter categories for dropdown
export const FILTER_CATEGORIES = [
  { value: 'all', label: 'All Deals', count: (deals: Deal[]) => deals.length },
  { value: 'delayed', label: 'Delayed', count: getDelayedDeals },
  { value: 'high_value', label: 'High-Value', count: getHighValueDeals },
  { value: 'closing', label: 'Ready to Close', count: getClosingDeals },
  { value: 'critical', label: 'Critical', count: getCriticalDeals },
] as const;