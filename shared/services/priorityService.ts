import { Deal, type DealStatus, type UserRole } from "@shared/schema";
import { classifyDealFlow } from "../utils/dealClassification";

export interface PriorityItem {
  id: string;
  deal: Deal;
  title: string;
  description: string;
  urgencyLevel: 'high' | 'medium' | 'low';
  actionLabel: string;
  actionType: 'convert' | 'review' | 'approve' | 'legal_review' | 'contract' | 'nudge' | 'draft' | 'resume_draft';
  daysOverdue: number;
}

// Calculate how many days a deal has been in its current status
export const getDaysInCurrentStatus = (deal: Deal): number => {
  try {
    const updatedAt = deal.updatedAt ? new Date(deal.updatedAt) : new Date();
    const now = new Date();
    return Math.floor((now.getTime() - updatedAt.getTime()) / (1000 * 60 * 60 * 24));
  } catch {
    return 0;
  }
};

// Calculate deal value for priority scoring (consistent with dealClassification)
export const getDealValue = (deal: Deal): number => {
  // For scoping deals, prioritize growth ambition
  if (deal.status === 'scoping' && deal.growthAmbition) {
    return deal.growthAmbition;
  }
  
  // For other deals, use consistent fallback logic: annualRevenue > growthAmbition > 0
  // Note: This will be updated to use tier data aggregation in future migration
  return deal.annualRevenue || deal.growthAmbition || 0;
};

// Determine if a deal needs attention based on role and status
export const needsAttention = (deal: Deal, userRole: UserRole): boolean => {
  switch (userRole) {
    case 'seller':
      return deal.status === 'scoping' || 
             deal.status === 'draft' ||  // Include drafts for sellers
             ['under_review', 'contract_drafting', 'negotiating'].includes(deal.status);
    
    case 'approver':
      return deal.status === 'under_review' || deal.status === 'revision_requested';
    
    case 'department_reviewer':
      return deal.status === 'under_review' || deal.status === 'revision_requested';
    
    case 'admin':
      return deal.status === 'draft' || deal.status !== 'draft'; // Admin can see all including drafts
    
    default:
      return false;
  }
};

// Calculate urgency level using Flow Intelligence + deal value
export const calculateUrgency = (deal: Deal, daysInStatus: number): 'high' | 'medium' | 'low' => {
  const dealValue = getDealValue(deal);
  const flowClassification = classifyDealFlow(deal);
  
  // High urgency: Flow Intelligence flags as needs_attention OR high value deals
  if (flowClassification.flowStatus === 'needs_attention' || dealValue >= 1000000) {
    return 'high';
  }
  
  // Medium urgency: Approaching threshold or medium value deals
  if (dealValue >= 500000) {
    return 'medium';
  }
  
  return 'low';
};

// Get action type and label based on deal status and user role
export const getActionTypeAndLabel = (deal: Deal, userRole: UserRole): { actionType: PriorityItem['actionType'], actionLabel: string } => {
  // Seller actions
  if (userRole === 'seller') {
    if (deal.status === 'draft') {
      return { actionType: 'resume_draft', actionLabel: 'Resume Draft' };
    }
    if (deal.status === 'scoping') {
      return { actionType: 'convert', actionLabel: 'Convert to Deal' };
    }
    if (['under_review', 'legal_review', 'negotiating'].includes(deal.status)) {
      return { actionType: 'nudge', actionLabel: 'Send Nudge' };
    }
  }
  
  // Approver actions
  if (userRole === 'approver') {
    if (deal.status === 'under_review') {
      return { actionType: 'approve', actionLabel: 'Review & Approve' };
    }
    if (deal.status === 'legal_review') {
      return { actionType: 'nudge', actionLabel: 'Nudge Legal' };
    }
  }
  
  // Department Reviewer actions
  if (userRole === 'department_reviewer') {
    if (deal.status === 'under_review') {
      return { actionType: 'review', actionLabel: 'Review Deal' };
    }
    if (deal.status === 'revision_requested') {
      return { actionType: 'review', actionLabel: 'Re-review Changes' };
    }
  }
  
  // Admin actions
  if (userRole === 'admin') {
    if (deal.status === 'draft') {
      return { actionType: 'resume_draft', actionLabel: 'Resume Draft' };
    }
  }
  
  // Default
  return { actionType: 'review', actionLabel: 'Review' };
};



// Main function to calculate priority items for a user
export const calculatePriorityItems = (deals: Deal[], userRole: UserRole): PriorityItem[] => {
  const items: PriorityItem[] = [];

  // Add regular priority deals (excluding drafts to prevent duplicates)
  deals.filter(deal => needsAttention(deal, userRole) && deal.status !== 'draft').forEach(deal => {
    const daysInStatus = getDaysInCurrentStatus(deal);
    const urgencyLevel = calculateUrgency(deal, daysInStatus);
    const { actionType, actionLabel } = getActionTypeAndLabel(deal, userRole);
    const clientName = deal.advertiserName || deal.agencyName || "Unknown Client";
    
    items.push({
      id: `deal-${deal.id}`,
      deal,
      title: `${actionLabel}: ${deal.dealName}`,
      description: `${clientName} - ${daysInStatus} days in ${deal.status.replace('_', ' ')} status`,
      urgencyLevel,
      actionLabel,
      actionType,
      daysOverdue: daysInStatus
    });
  });

  // Add drafts separately with proper deduplication - for sellers and admins only
  if (userRole === 'seller' || userRole === 'admin') {
    const drafts = deals.filter(deal => deal.status === 'draft');
    drafts.forEach(deal => {
      const daysInStatus = getDaysInCurrentStatus(deal);
      // Use 'low' urgency for drafts since they're not time-critical
      const urgencyLevel = 'low' as const;
      
      items.push({
        id: `draft-${deal.id}`,
        deal,
        title: `Resume Draft: ${deal.dealName || deal.advertiserName || deal.agencyName || 'New Client'}`,
        description: `Continue working on draft deal for ${deal.advertiserName || deal.agencyName || 'client'}.`,
        urgencyLevel,
        actionLabel: 'Resume Draft',
        actionType: 'resume_draft' as const,
        daysOverdue: daysInStatus
      });
    });
  }

  // Sort by priority: drafts first for sellers, then by urgency
  return items.sort((a, b) => {
    // Drafts get priority for sellers
    if (userRole === 'seller' && a.actionType === 'draft' && b.actionType !== 'draft') return -1;
    if (userRole === 'seller' && a.actionType !== 'draft' && b.actionType === 'draft') return 1;
    
    const urgencyOrder = { high: 3, medium: 2, low: 1 };
    if (a.urgencyLevel !== b.urgencyLevel) {
      return urgencyOrder[b.urgencyLevel] - urgencyOrder[a.urgencyLevel];
    }
    return b.daysOverdue - a.daysOverdue;
  }).slice(0, 10);
};