# Enhanced Deal Workflow - Technical Specification
*Created: August 14, 2025*

## Executive Summary

This specification outlines the technical implementation for enhancing the deal workflow system to include draft capabilities, revision cycles, improved status management, and consolidated feedback tracking. The implementation follows a phased approach to minimize disruption while delivering comprehensive workflow improvements.

## Current State Analysis

### Existing Status Flow
```
Scoping → Submitted → Under Review → Negotiating → Approved → Legal Review → Contract Sent → Signed → Lost
```

### Existing Role System
- **Seller**: Create deals, view own deals
- **Approver**: Review and approve deals
- **Legal**: Handle contract processes
- **Admin**: Full system access

## Enhanced Workflow Specification

### 1. New Status Flow Architecture

```
Draft → Scoping/Submitted → Under Review ⟷ Revision Requested → Negotiating → Approved → Contract Drafting → Client Review → Signed → Lost
```

#### Status Definitions
- **Draft**: Seller-only visible, editable work-in-progress
- **Scoping**: Information gathering phase, convertible to Submitted
- **Submitted**: Complete submission ready for review
- **Under Review**: Active review by approver
- **Revision Requested**: Requires seller modifications, returns to Under Review
- **Negotiating**: Client discussions phase with seller updates
- **Approved**: Ready for legal processing
- **Contract Drafting**: Legal creating contract documents
- **Client Review**: Contract under client review
- **Signed**: Deal completed successfully
- **Lost**: Deal terminated (possible at any stage)

### 2. Database Schema Changes

#### Enhanced Deal Table
```sql
-- New columns to add to existing deals table
ALTER TABLE deals ADD COLUMN IF NOT EXISTS status_history JSONB DEFAULT '[]';
ALTER TABLE deals ADD COLUMN IF NOT EXISTS revision_count INTEGER DEFAULT 0;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS is_revision BOOLEAN DEFAULT FALSE;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS parent_submission_id INTEGER REFERENCES deals(id);
ALTER TABLE deals ADD COLUMN IF NOT EXISTS revision_reason TEXT;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS last_revised_at TIMESTAMP;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS can_edit BOOLEAN DEFAULT TRUE;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS draft_expires_at TIMESTAMP;
```

#### New Deal Comments Table
```sql
CREATE TABLE deal_comments (
  id SERIAL PRIMARY KEY,
  deal_id INTEGER REFERENCES deals(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id),
  comment_type ENUM('internal', 'revision_request', 'client_feedback', 'status_change') DEFAULT 'internal',
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  is_private BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### Updated Status Enum
```sql
-- Update existing status enum
ALTER TYPE deal_status ADD VALUE IF NOT EXISTS 'draft';
ALTER TYPE deal_status ADD VALUE IF NOT EXISTS 'revision_requested';
-- Rename existing values
UPDATE deals SET status = 'contract_drafting' WHERE status = 'legal_review';
UPDATE deals SET status = 'client_review' WHERE status = 'contract_sent';
```

### 3. Role-Based Permissions Matrix

| Status | Seller Actions | Approver Actions | Legal Actions | Admin Actions |
|--------|---------------|------------------|---------------|---------------|
| Draft | Edit, Submit | View (Admin only) | View (Admin only) | All |
| Scoping | Edit, Convert to Submitted | View, Request Info | View | All |
| Submitted | View | Review, Approve, Request Revision | View | All |
| Under Review | View | Approve, Request Revision | View | All |
| Revision Requested | Edit, Resubmit | View | View | All |
| Negotiating | Edit, Add Updates | Approve | View | All |
| Approved | View | View | Begin Contract Drafting | All |
| Contract Drafting | View | View | Update Status to Client Review | All |
| Client Review | View | View, Add Comments | Update Status to Signed | All |
| Signed | View | View | View | All |
| Lost | View | Mark as Lost | Mark as Lost | All |

### 4. Component Architecture Changes

#### 4.1 Enhanced Data Table
```typescript
// New column for draft visibility
const columns = [
  // ... existing columns
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const deal = row.original;
      const showDraftBadge = deal.status === 'draft' && 
        (userRole === 'seller' || userRole === 'admin');
      return (
        <div className="flex items-center gap-2">
          <DealStatusBadge status={deal.status} />
          {deal.revision_count > 0 && (
            <Badge variant="outline" className="text-xs">
              Rev {deal.revision_count}
            </Badge>
          )}
        </div>
      );
    }
  }
];

// Enhanced filtering logic
const filteredDeals = deals.filter(deal => {
  if (deal.status === 'draft') {
    return userRole === 'admin' || 
      (userRole === 'seller' && deal.createdBy === currentUser.id);
  }
  return true;
});
```

#### 4.2 Deal Form Enhancements
```typescript
interface DealFormProps {
  mode: 'create' | 'edit' | 'revision';
  dealId?: number;
  revisionReason?: string;
}

const DealForm = ({ mode, dealId, revisionReason }: DealFormProps) => {
  const [isDraft, setIsDraft] = useState(mode === 'create');
  
  // Form submission logic
  const handleSubmit = async (data: DealFormData) => {
    if (isDraft) {
      await saveDraft(data);
    } else {
      await submitDeal(data, mode === 'revision');
    }
  };

  // Auto-save for drafts
  useEffect(() => {
    if (isDraft && formData) {
      const timer = setTimeout(() => {
        saveDraft(formData);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [formData, isDraft]);
};
```

#### 4.3 Revision Request Modal
```typescript
const RevisionRequestModal = ({ deal, isOpen, onClose }: RevisionRequestModalProps) => {
  const [reason, setReason] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');

  const handleSubmit = async () => {
    await requestRevision(deal.id, {
      reason,
      priority,
      requestedBy: currentUser.id,
      requestedAt: new Date().toISOString()
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      {/* Modal content for revision requests */}
    </Dialog>
  );
};
```

#### 4.4 Enhanced Deal Details Page
```typescript
const DealDetails = ({ dealId }: { dealId: number }) => {
  const deal = useDeal(dealId);
  const comments = useDealComments(dealId);
  const canEdit = useCanEditDeal(deal, userRole);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Main content */}
      <div className="lg:col-span-2">
        <DealInformation deal={deal} />
        {canEdit && <EditDealButton deal={deal} />}
      </div>
      
      {/* Sidebar */}
      <div>
        <DealTimeline deal={deal} />
        <DealHistory comments={comments} />
        <QuickActions deal={deal} userRole={userRole} />
      </div>
    </div>
  );
};
```

### 5. API Endpoints Specification

#### 5.1 Enhanced Deal Endpoints
```typescript
// POST /api/deals/draft - Save draft
interface SaveDraftRequest {
  dealData: Partial<Deal>;
  autoSave?: boolean;
}

// POST /api/deals/:id/submit - Convert draft to submission
interface SubmitDealRequest {
  submissionType: 'scoping' | 'submitted';
}

// POST /api/deals/:id/request-revision
interface RequestRevisionRequest {
  reason: string;
  priority: 'low' | 'medium' | 'high';
  specificFields?: string[];
}

// POST /api/deals/:id/respond-revision
interface RespondRevisionRequest {
  dealData: Deal;
  response: string;
}

// GET /api/deals/:id/can-edit
interface CanEditResponse {
  canEdit: boolean;
  reason?: string;
  allowedFields?: string[];
}
```

#### 5.2 Comments API
```typescript
// GET /api/deals/:id/comments
// POST /api/deals/:id/comments
interface CreateCommentRequest {
  content: string;
  type: 'internal' | 'revision_request' | 'client_feedback';
  isPrivate?: boolean;
  metadata?: Record<string, any>;
}
```

### 6. Business Logic Implementation

#### 6.1 Status Transition Rules
```typescript
const statusTransitionRules = {
  draft: {
    seller: ['scoping', 'submitted'],
    admin: ['scoping', 'submitted', 'lost']
  },
  scoping: {
    seller: ['submitted'],
    approver: ['under_review', 'revision_requested'],
    admin: ['submitted', 'under_review', 'lost']
  },
  submitted: {
    approver: ['under_review', 'revision_requested'],
    admin: ['under_review', 'lost']
  },
  under_review: {
    approver: ['negotiating', 'revision_requested', 'approved'],
    admin: ['negotiating', 'approved', 'lost']
  },
  revision_requested: {
    seller: ['under_review'], // After revision submission
    admin: ['under_review', 'lost']
  },
  negotiating: {
    approver: ['approved', 'revision_requested'],
    admin: ['approved', 'lost']
  },
  approved: {
    legal: ['contract_drafting'],
    admin: ['contract_drafting', 'lost']
  },
  contract_drafting: {
    legal: ['client_review'],
    admin: ['client_review', 'lost']
  },
  client_review: {
    legal: ['signed'],
    admin: ['signed', 'lost']
  },
  signed: {
    admin: ['lost'] // Rare case
  },
  lost: {} // Terminal state
};
```

#### 6.2 Draft Management
```typescript
class DraftManager {
  async saveDraft(userId: number, dealData: Partial<Deal>): Promise<Deal> {
    // Auto-save logic with conflict resolution
    const existingDraft = await this.findDraft(userId, dealData.id);
    if (existingDraft) {
      return await this.updateDraft(existingDraft.id, dealData);
    }
    return await this.createDraft(userId, dealData);
  }

  async cleanupExpiredDrafts(): Promise<void> {
    // Clean up drafts older than 30 days
    await db.deals.deleteMany({
      where: {
        status: 'draft',
        draft_expires_at: { lt: new Date() }
      }
    });
  }
}
```

#### 6.3 Revision Cycle Management
```typescript
class RevisionManager {
  async requestRevision(dealId: number, request: RequestRevisionRequest): Promise<void> {
    await db.transaction(async (tx) => {
      // Update deal status
      await tx.deals.update({
        where: { id: dealId },
        data: {
          status: 'revision_requested',
          revision_reason: request.reason,
          can_edit: true
        }
      });

      // Create comment for tracking
      await tx.deal_comments.create({
        data: {
          deal_id: dealId,
          user_id: request.requestedBy,
          comment_type: 'revision_request',
          content: request.reason,
          metadata: { priority: request.priority }
        }
      });
    });
  }

  async submitRevision(dealId: number, revisionData: Deal): Promise<void> {
    await db.transaction(async (tx) => {
      await tx.deals.update({
        where: { id: dealId },
        data: {
          ...revisionData,
          status: 'under_review',
          revision_count: { increment: 1 },
          last_revised_at: new Date(),
          can_edit: false
        }
      });
    });
  }
}
```

### 7. Dashboard Priority Logic Enhancement

```typescript
const priorityCalculator = {
  calculatePriority(deal: Deal, userRole: string): number {
    const baseScore = {
      draft: userRole === 'seller' ? 100 : 0,
      revision_requested: userRole === 'seller' ? 95 : 0,
      submitted: userRole === 'approver' ? 90 : 10,
      under_review: userRole === 'approver' ? 85 : 15,
      negotiating: userRole === 'approver' ? 80 : 20,
      approved: userRole === 'legal' ? 90 : 10,
      contract_drafting: userRole === 'legal' ? 85 : 15,
      client_review: userRole === 'legal' ? 80 : 20
    }[deal.status] || 0;

    // Adjust for age and value
    const ageMultiplier = Math.max(0.5, 1 - (deal.daysSinceUpdate / 30));
    const valueMultiplier = Math.min(2, deal.annualRevenue / 1000000);

    return Math.round(baseScore * ageMultiplier * valueMultiplier);
  }
};
```

### 8. Implementation Phases

#### Phase 1: Core Status Flow (Week 1)
- [ ] Database schema updates
- [ ] Add Draft status with visibility rules
- [ ] Implement status transition logic
- [ ] Update dashboard filtering
- [ ] Rename Legal Review → Contract Drafting, Contract Sent → Client Review

#### Phase 2: Revision System (Week 2)
- [ ] Revision request modal and API
- [ ] Edit permission system
- [ ] Revision tracking and history
- [ ] Enhanced deal details page

#### Phase 3: Enhanced Collaboration (Week 3)
- [ ] Comment system integration
- [ ] Rich history view with all feedback types
- [ ] Client feedback tracking during negotiation
- [ ] Lost status with reason tracking

#### Phase 4: Polish & Optimization (Week 4)
- [ ] Auto-save for drafts
- [ ] Advanced filtering and search
- [ ] Notification system for status changes
- [ ] Bulk operations for admins

### 9. Testing Strategy

#### Unit Tests
- Status transition validation
- Permission matrix verification
- Draft auto-save functionality
- Revision cycle completion

#### Integration Tests
- End-to-end deal workflow
- Role-based access control
- Comment threading and history
- Dashboard priority calculations

#### User Acceptance Tests
- Seller draft creation and submission
- Approver revision request flow
- Legal contract processing
- Cross-role collaboration scenarios

### 10. Migration Strategy

#### Data Migration
```sql
-- Safe migration script
BEGIN;

-- Add new columns with defaults
ALTER TABLE deals ADD COLUMN status_history JSONB DEFAULT '[]';
ALTER TABLE deals ADD COLUMN revision_count INTEGER DEFAULT 0;

-- Populate status history for existing deals
UPDATE deals SET status_history = jsonb_build_array(
  jsonb_build_object(
    'status', status,
    'timestamp', COALESCE(updated_at, created_at),
    'user_id', created_by,
    'comment', 'Initial status'
  )
);

-- Rename status values
UPDATE deals SET status = 'contract_drafting' WHERE status = 'legal_review';
UPDATE deals SET status = 'client_review' WHERE status = 'contract_sent';

COMMIT;
```

### 11. Performance Considerations

- **Indexing**: Add indexes on status, revision_count, and draft_expires_at
- **Caching**: Cache permission calculations and status transition rules
- **Pagination**: Enhanced pagination for deal lists with draft filtering
- **Real-time Updates**: WebSocket integration for status changes and comments

### 12. Security Considerations

- **Draft Visibility**: Ensure drafts are only visible to owners and admins
- **Edit Permissions**: Server-side validation of edit capabilities
- **Audit Trail**: Complete tracking of all deal modifications
- **Data Sanitization**: Proper sanitization of user-generated content in comments

## Conclusion

This specification provides a comprehensive roadmap for implementing the enhanced deal workflow while maintaining system stability and user experience. The phased approach allows for iterative development and testing, ensuring each component is thoroughly validated before proceeding to the next phase.

The implementation focuses on real-world usability while avoiding over-engineering, particularly by integrating feedback into the existing history system rather than creating a separate complex commenting architecture.