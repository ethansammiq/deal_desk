import { Deal, type DealStatus, type UserRole } from "@shared/schema";

export interface PriorityItem {
  dealId: number;
  dealName: string;
  clientName: string;
  urgencyLevel: 'high' | 'medium' | 'low';
  actionType: 'convert' | 'review' | 'approve' | 'legal_review' | 'contract' | 'nudge';
  actionLabel: string;
  daysInStatus: number;
  dealValue: number;
  status: DealStatus;
  urgencyScore: number;
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

// Calculate deal value for priority scoring
export const getDealValue = (deal: Deal): number => {
  // For scoping deals, use growth ambition
  if (deal.status === 'scoping' && deal.growthAmbition) {
    return deal.growthAmbition;
  }
  
  // For other deals, use annual revenue or growth ambition as fallback
  return deal.annualRevenue || deal.growthAmbition || 0;
};

// Determine if a deal needs attention based on role and status
export const needsAttention = (deal: Deal, userRole: UserRole): boolean => {
  switch (userRole) {
    case 'seller':
      return deal.status === 'scoping' || 
             ['under_review', 'legal_review', 'negotiating'].includes(deal.status);
    
    case 'approver':
      return deal.status === 'under_review' || deal.status === 'legal_review';
    
    case 'legal':
      return deal.status === 'legal_review' || deal.status === 'approved';
    
    case 'admin':
      return true; // Admin can see all priority items
    
    default:
      return false;
  }
};

// Calculate urgency level based on days in status and deal characteristics
export const calculateUrgency = (deal: Deal, daysInStatus: number): 'high' | 'medium' | 'low' => {
  const dealValue = getDealValue(deal);
  
  // High urgency criteria
  if (daysInStatus >= 7 || dealValue >= 1000000) {
    return 'high';
  }
  
  // Medium urgency criteria
  if (daysInStatus >= 3 || dealValue >= 500000) {
    return 'medium';
  }
  
  return 'low';
};

// Get action type and label based on deal status and user role
export const getActionTypeAndLabel = (deal: Deal, userRole: UserRole): { actionType: PriorityItem['actionType'], actionLabel: string } => {
  // Seller actions
  if (userRole === 'seller') {
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
  
  // Legal actions
  if (userRole === 'legal') {
    if (deal.status === 'legal_review') {
      return { actionType: 'legal_review', actionLabel: 'Legal Review' };
    }
    if (deal.status === 'approved') {
      return { actionType: 'contract', actionLabel: 'Send Contract' };
    }
  }
  
  // Default
  return { actionType: 'review', actionLabel: 'Review' };
};

// Calculate urgency score for sorting (higher = more urgent)
export const getUrgencyScore = (priorityItem: PriorityItem): number => {
  let score = 0;
  
  // Days in status weight
  score += priorityItem.daysInStatus * 10;
  
  // Deal value weight (normalize to 0-50 range)
  score += Math.min(priorityItem.dealValue / 20000, 50);
  
  // Urgency level weight
  switch (priorityItem.urgencyLevel) {
    case 'high':
      score += 100;
      break;
    case 'medium':
      score += 50;
      break;
    case 'low':
      score += 25;
      break;
  }
  
  // Status-specific weights
  switch (priorityItem.status) {
    case 'under_review':
    case 'legal_review':
      score += 30; // These need immediate attention
      break;
    case 'scoping':
      score += 20; // Converting scoping to deals is important
      break;
    case 'negotiating':
      score += 15; // Active negotiations need monitoring
      break;
  }
  
  return score;
};

// Main function to calculate priority items for a user
export const calculatePriorityItems = (deals: Deal[], userRole: UserRole): PriorityItem[] => {
  return deals
    .filter(deal => needsAttention(deal, userRole))
    .map(deal => {
      const daysInStatus = getDaysInCurrentStatus(deal);
      const urgencyLevel = calculateUrgency(deal, daysInStatus);
      const { actionType, actionLabel } = getActionTypeAndLabel(deal, userRole);
      const dealValue = getDealValue(deal);
      const clientName = deal.advertiserName || deal.agencyName || "Unknown Client";
      
      const priorityItem: PriorityItem = {
        dealId: deal.id,
        dealName: deal.dealName,
        clientName,
        urgencyLevel,
        actionType,
        actionLabel,
        daysInStatus,
        dealValue,
        status: deal.status as DealStatus,
        urgencyScore: 0 // Will be calculated below
      };
      
      // Calculate urgency score
      priorityItem.urgencyScore = getUrgencyScore(priorityItem);
      
      return priorityItem;
    })
    .sort((a, b) => b.urgencyScore - a.urgencyScore) // Sort by urgency score (highest first)
    .slice(0, 10); // Limit to top 10 priority items
};