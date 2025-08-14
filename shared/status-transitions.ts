// Phase 3: Enhanced Status Transition Logic
// Defines valid status transitions and role-based permissions

export type DealStatus = 
  | 'draft' 
  | 'scoping' 
  | 'submitted' 
  | 'under_review' 
  | 'revision_requested' 
  | 'negotiating' 
  | 'approved' 
  | 'contract_drafting' 
  | 'client_review' 
  | 'signed' 
  | 'lost';

export type UserRole = 'seller' | 'approver' | 'legal' | 'admin';

// Valid status transitions mapping
export const STATUS_TRANSITIONS: Record<DealStatus, DealStatus[]> = {
  draft: ['scoping', 'submitted'],
  scoping: ['submitted'],
  submitted: ['under_review', 'lost'],
  under_review: ['revision_requested', 'negotiating', 'approved', 'lost'],
  revision_requested: ['under_review', 'lost'], // Seller can resubmit or abandon
  negotiating: ['revision_requested', 'approved', 'lost'],
  approved: ['contract_drafting', 'lost'],
  contract_drafting: ['client_review', 'lost'],
  client_review: ['signed', 'negotiating', 'lost'], // Client can request changes
  signed: [], // Terminal success state
  lost: [] // Terminal failure state
};

// Role-based permissions for status transitions
export const ROLE_PERMISSIONS: Record<UserRole, {
  canTransitionFrom: DealStatus[];
  allowedTransitions: Partial<Record<DealStatus, DealStatus[]>>;
}> = {
  seller: {
    canTransitionFrom: ['draft', 'scoping', 'revision_requested'],
    allowedTransitions: {
      draft: ['scoping', 'submitted'],
      scoping: ['submitted'],
      revision_requested: ['under_review', 'lost']
    }
  },
  approver: {
    canTransitionFrom: ['submitted', 'under_review', 'negotiating', 'client_review'],
    allowedTransitions: {
      submitted: ['under_review', 'lost'],
      under_review: ['revision_requested', 'negotiating', 'approved', 'lost'],
      negotiating: ['revision_requested', 'approved', 'lost'],
      client_review: ['signed', 'negotiating', 'lost']
    }
  },
  legal: {
    canTransitionFrom: ['approved', 'contract_drafting'],
    allowedTransitions: {
      approved: ['contract_drafting', 'lost'],
      contract_drafting: ['client_review', 'lost']
    }
  },
  admin: {
    canTransitionFrom: ['draft', 'scoping', 'submitted', 'under_review', 'revision_requested', 'negotiating', 'approved', 'contract_drafting', 'client_review'],
    allowedTransitions: STATUS_TRANSITIONS
  }
};

// Status display information
export const STATUS_INFO: Record<DealStatus, {
  label: string;
  color: string;
  description: string;
  priority: number; // For dashboard sorting
}> = {
  draft: { 
    label: 'Draft', 
    color: 'slate', 
    description: 'Deal is being prepared',
    priority: 1
  },
  scoping: { 
    label: 'Scoping', 
    color: 'blue', 
    description: 'Requirements being defined',
    priority: 2
  },
  submitted: { 
    label: 'Submitted', 
    color: 'indigo', 
    description: 'Awaiting initial review',
    priority: 3
  },
  under_review: { 
    label: 'Under Review', 
    color: 'amber', 
    description: 'Being evaluated by approvers',
    priority: 4
  },
  revision_requested: { 
    label: 'Revision Requested', 
    color: 'orange', 
    description: 'Changes requested by approver',
    priority: 5
  },
  negotiating: { 
    label: 'Negotiating', 
    color: 'purple', 
    description: 'Terms being negotiated',
    priority: 6
  },
  approved: { 
    label: 'Approved', 
    color: 'emerald', 
    description: 'Deal approved, awaiting contract',
    priority: 7
  },
  contract_drafting: { 
    label: 'Contract Drafting', 
    color: 'teal', 
    description: 'Legal team preparing contract',
    priority: 8
  },
  client_review: { 
    label: 'Client Review', 
    color: 'cyan', 
    description: 'Client reviewing contract',
    priority: 9
  },
  signed: { 
    label: 'Signed', 
    color: 'green', 
    description: 'Deal completed successfully',
    priority: 10
  },
  lost: { 
    label: 'Lost', 
    color: 'red', 
    description: 'Deal was not successful',
    priority: 11
  }
};

// Validation functions
export function canTransitionStatus(
  currentStatus: DealStatus, 
  newStatus: DealStatus, 
  userRole: UserRole
): { canTransition: boolean; reason?: string } {
  const rolePermissions = ROLE_PERMISSIONS[userRole];
  
  // Check if user can transition from current status
  if (!rolePermissions.canTransitionFrom.includes(currentStatus)) {
    return {
      canTransition: false,
      reason: `${userRole} cannot modify deals in ${currentStatus} status`
    };
  }
  
  // Check if transition is allowed for this role
  const allowedTransitions = rolePermissions.allowedTransitions[currentStatus];
  if (!allowedTransitions || !allowedTransitions.includes(newStatus)) {
    return {
      canTransition: false,
      reason: `Cannot transition from ${currentStatus} to ${newStatus} as ${userRole}`
    };
  }
  
  return { canTransition: true };
}

export function getAvailableTransitions(currentStatus: DealStatus, userRole: UserRole): DealStatus[] {
  const rolePermissions = ROLE_PERMISSIONS[userRole];
  
  if (!rolePermissions.canTransitionFrom.includes(currentStatus)) {
    return [];
  }
  
  return rolePermissions.allowedTransitions[currentStatus] || [];
}

export function isTerminalStatus(status: DealStatus): boolean {
  return status === 'signed' || status === 'lost';
}

export function getStatusPriority(status: DealStatus): number {
  return STATUS_INFO[status].priority;
}

export function sortDealsByPriority(deals: Array<{ status: DealStatus }>): Array<{ status: DealStatus }> {
  return deals.sort((a, b) => getStatusPriority(a.status) - getStatusPriority(b.status));
}