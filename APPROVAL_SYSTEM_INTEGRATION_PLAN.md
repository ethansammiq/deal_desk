# Multi-Layered Approval System Integration Plan

## Current Architecture Analysis

### Existing User Management Structure
Based on the current schema and system:

1. **User Roles**: seller, approver, legal, admin
2. **Deal Status Flow**: 11-status workflow (draft → scoping → submitted → under_review → revision_requested → negotiating → approved → contract_drafting → client_review → signed → lost)
3. **Status History**: Comprehensive audit trail with dealStatusHistory table
4. **Comments System**: Deal-level comments for collaboration

### Integration Strategy

## Phase 1: Database Schema Enhancement

### New Tables Required

```sql
-- Approval requirements for each deal
CREATE TABLE deal_approvals (
  id SERIAL PRIMARY KEY,
  deal_id INTEGER NOT NULL REFERENCES deals(id),
  stage VARCHAR(50) NOT NULL, -- 'incentive_review', 'margin_review', 'final_review'
  department VARCHAR(50) NOT NULL, -- 'finance', 'trading', 'product', etc.
  required_for TEXT[], -- Array of what this approval covers
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'approved', 'revision_requested', 'rejected'
  assigned_to INTEGER REFERENCES users(id), -- Specific user assigned
  estimated_time VARCHAR(50),
  dependencies TEXT[], -- Array of approval IDs that must complete first
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  comments TEXT
);

-- Individual approval actions/history
CREATE TABLE approval_actions (
  id SERIAL PRIMARY KEY,
  approval_id INTEGER NOT NULL REFERENCES deal_approvals(id),
  action_type VARCHAR(50) NOT NULL, -- 'approve', 'reject', 'request_revision', 'comment'
  action_by INTEGER NOT NULL REFERENCES users(id),
  comments TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Department configurations and assignments
CREATE TABLE approval_departments (
  id SERIAL PRIMARY KEY,
  department_name VARCHAR(50) UNIQUE NOT NULL,
  display_name VARCHAR(100) NOT NULL,
  description TEXT,
  contact_email VARCHAR(255),
  default_assignee INTEGER REFERENCES users(id),
  incentive_types TEXT[], -- Which incentive types this dept handles
  is_active BOOLEAN DEFAULT true
);
```

## Phase 2: Status Flow Integration

### Enhanced Status Mapping
Map multi-layered approvals to existing status flow:

```typescript
// Current: submitted → under_review → approved
// Enhanced: submitted → incentive_review → margin_review → final_review → approved

const APPROVAL_STATUS_MAPPING = {
  'submitted': 'pending_approval_assignment',
  'incentive_review': 'under_review', 
  'margin_review': 'under_review',
  'final_review': 'under_review',
  'all_approved': 'approved'
};
```

### Status Transition Logic
- Deal moves through approval stages automatically
- `under_review` status encompasses all approval stages
- Individual approval completion tracked separately
- Deal status only changes when ALL approvals in a stage complete

## Phase 3: User Role Enhancement

### Extended User Roles
```typescript
type UserRole = 
  | 'seller' 
  | 'approver' 
  | 'legal' 
  | 'admin'
  | 'finance_reviewer'     // Finance team approver
  | 'trading_reviewer'     // Trading team approver  
  | 'product_reviewer'     // Product team approver
  | 'creative_reviewer'    // Creative team approver
  | 'analytics_reviewer';  // Analytics team approver
```

### Department-Specific Permissions
```typescript
const DEPARTMENT_PERMISSIONS = {
  finance_reviewer: {
    canApprove: ['incentive_review', 'final_review'],
    canView: ['all_deals'],
    dashboardSections: ['pending_finance_approvals', 'deal_pipeline']
  },
  trading_reviewer: {
    canApprove: ['margin_review'],
    canView: ['submitted_deals', 'margin_analysis'],
    dashboardSections: ['pending_margin_reviews', 'trading_capacity']
  }
  // ... etc for other roles
};
```

## Phase 4: Dashboard Integration

### Enhanced UnifiedDashboard
Current dashboard shows deals by status. Enhanced version shows:

1. **For Sellers**: 
   - Deal approval pipeline progress
   - Bottleneck identification 
   - Follow-up recommendations

2. **For Department Reviewers**:
   - Pending approvals by department
   - Batch approval capabilities
   - Cross-department collaboration tools

3. **For Admins**:
   - System-wide approval metrics
   - Bottleneck analysis
   - Department performance tracking

### New Dashboard Sections
```typescript
// Add to existing UnifiedDashboard
const APPROVAL_DASHBOARD_SECTIONS = {
  pending_approvals: {
    title: "Pending Your Approval",
    filter: (deals, userRole) => deals.filter(deal => 
      hasUserPendingApproval(deal, userRole)
    )
  },
  approval_pipeline: {
    title: "Approval Pipeline Status", 
    component: ApprovalPipelineWidget
  },
  department_workload: {
    title: "Department Workload",
    component: DepartmentWorkloadChart
  }
};
```

## Phase 5: API Integration

### Enhanced API Endpoints

```typescript
// New approval-specific endpoints
POST /api/deals/:id/approvals/assign     // Auto-assign approvals based on deal
GET  /api/deals/:id/approvals            // Get all approvals for deal
POST /api/approvals/:id/action           // Take approval action (approve/reject/etc)
GET  /api/approvals/pending              // Get user's pending approvals
GET  /api/approvals/department/:dept     // Get department workload

// Enhanced existing endpoints
GET  /api/deals/:id                      // Include approval pipeline status
PUT  /api/deals/:id/status               // Auto-manage approval transitions
```

### Integration with Existing Status System
```typescript
// Enhanced status update logic
async function updateDealStatus(dealId: number, action: ApprovalAction) {
  // 1. Update individual approval
  await updateApprovalStatus(dealId, action);
  
  // 2. Check if stage is complete
  const stageComplete = await checkStageCompletion(dealId);
  
  // 3. Update deal status if stage transitions
  if (stageComplete) {
    const nextStatus = determineNextDealStatus(dealId);
    await updateDealStatusHistory(dealId, nextStatus, action.userId);
  }
  
  // 4. Auto-assign next stage approvals
  await assignNextStageApprovals(dealId);
}
```

## Phase 6: Migration Strategy

### Backward Compatibility
1. **Existing Deals**: Continue using current approval flow
2. **New Deals**: Use enhanced multi-layered system
3. **Gradual Migration**: Optional opt-in for existing deals

### Data Migration
```sql
-- Migrate existing 'approver' role users to specific departments
UPDATE users 
SET role = 'finance_reviewer' 
WHERE role = 'approver' AND department = 'finance';

-- Create default approval department configs
INSERT INTO approval_departments (department_name, display_name, description)
VALUES 
  ('finance', 'Finance Team', 'Reviews financial incentives and overall deal viability'),
  ('trading', 'Trading Team', 'Reviews margin implications and trading viability');
```

## Implementation Priority

### High Priority (Phase 1)
1. Database schema additions
2. Basic approval assignment logic
3. Enhanced status tracking

### Medium Priority (Phase 2) 
1. Department-specific dashboards
2. Batch approval interfaces
3. Advanced notification system

### Low Priority (Phase 3)
1. Analytics and reporting
2. Automated approval routing
3. Integration with external approval systems

## Key Benefits

1. **Parallel Processing**: Incentive reviews happen simultaneously
2. **Clear Dependencies**: Margin review waits for incentives
3. **Accountability**: Each department owns their review domain
4. **Transparency**: Sellers see exactly where deals are stuck
5. **Efficiency**: Automated routing and assignment
6. **Audit Trail**: Complete history of all approval actions

## Technical Considerations

1. **Performance**: Approval queries should be optimized with proper indexing
2. **Scalability**: System should handle hundreds of concurrent approvals
3. **Reliability**: Approval state changes must be atomic and consistent
4. **Security**: Department-based access controls must be enforced
5. **Integration**: Must work seamlessly with existing deal workflow