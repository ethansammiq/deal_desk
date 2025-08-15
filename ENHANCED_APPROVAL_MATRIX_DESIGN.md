# Enhanced Multi-Stage Approval Matrix Design

## Overview
This document outlines the design for a sophisticated multi-layered approval system that supports parallel and sequential approval stages.

## Core Concepts

### 1. Approval Stages (Sequential)
- **Stage 1**: Incentive Reviews (Parallel within stage)
- **Stage 2**: Margin/Profitability Review (Single reviewer)
- **Stage 3**: Overall Deal Structure Review (Single reviewer - MD or Executive)

### 2. Stage Dependencies
- Stage 2 can run parallel with Stage 1
- Stage 3 requires both Stage 1 and Stage 2 to be complete
- All stages must be approved before deal moves to "approved" status

### 3. Approval Types

#### Stage 1: Incentive Reviews (Parallel)
```typescript
interface IncentiveApproval {
  department: 'product' | 'creative' | 'finance' | 'analytics' | 'trading';
  reviewer: string; // User ID or role
  status: 'pending' | 'approved' | 'revision_requested';
  requiredFor: string[]; // Which incentive types this covers
  estimatedTime: string;
}
```

#### Stage 2: Margin/Profitability Review
```typescript
interface MarginApproval {
  department: 'trading' | 'finance';
  reviewer: string;
  status: 'pending' | 'approved' | 'revision_requested';
  focus: 'margin_validation' | 'profitability_assessment';
  estimatedTime: string;
}
```

#### Stage 3: Overall Deal Structure Review
```typescript
interface FinalApproval {
  level: 'MD' | 'Executive';
  reviewer: string;
  status: 'pending' | 'approved' | 'revision_requested';
  threshold: number; // Revenue threshold that triggered this level
  estimatedTime: string;
}
```

## Approval Matrix Logic

### Revenue-Based Thresholds
- **< $500K**: MD approval required
- **≥ $500K**: Executive approval required
- **Non-standard deals**: Always Executive approval

### Department Assignment Logic
```typescript
// Based on deal incentives and structure
if (deal.incentives.includes('product_incentive')) {
  requiredApprovals.push({ department: 'product', ... });
}
if (deal.incentives.includes('creative_incentive')) {
  requiredApprovals.push({ department: 'creative', ... });
}
// Always required
requiredApprovals.push({ department: 'finance', ... });
requiredApprovals.push({ department: 'trading', ... });
```

## Database Schema Requirements

### New Tables Needed
1. `deal_approvals` - Track individual approval requirements
2. `approval_actions` - Log all approval actions/comments
3. `approval_stages` - Define stage dependencies and status

### Enhanced Status Flow
- `submitted` → `incentive_review` → `margin_review` → `final_review` → `approved`
- Allow parallel processing where appropriate
- Track individual approval completion

## UI/UX Design

### Approval Alert Component
- Show approval pipeline progress
- Display pending reviewers by department
- Indicate estimated timeline for each stage
- Provide follow-up action suggestions

### Seller Dashboard Enhancements
- "Approval Status" section showing pipeline progress
- Department contact information for follow-ups
- Automated notifications when reviews complete
- Clear indication of bottlenecks

### Approver Dashboard
- Role-specific views for each department
- Batch approval capabilities where appropriate
- Revision request with structured feedback forms
- Comments and collaboration features

## Implementation Phases

### Phase 1: Enhanced Data Model
- Extend database schema for multi-stage approvals
- Update status constants and workflow logic
- Create approval assignment service

### Phase 2: Approval Pipeline Engine
- Build approval stage management service
- Implement parallel/sequential processing logic
- Create notification and follow-up systems

### Phase 3: UI Components
- Enhanced ApprovalAlert with pipeline visualization
- Department-specific approval dashboards
- Seller follow-up and tracking interfaces

### Phase 4: Integration & Testing
- Connect approval pipeline to existing workflow
- Test parallel and sequential approval scenarios
- Validate notification and escalation logic

## Key Benefits
1. **Parallel Processing**: Incentive reviews can happen simultaneously
2. **Clear Dependencies**: Final approval waits for prerequisite stages
3. **Department Ownership**: Each team manages their approval domain
4. **Transparency**: Sellers can track progress and identify bottlenecks
5. **Flexibility**: System adapts to deal complexity and incentive types
6. **Accountability**: Full audit trail of all approval actions