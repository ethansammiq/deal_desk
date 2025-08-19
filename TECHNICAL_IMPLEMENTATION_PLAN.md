# Technical Implementation Plan: Department Routing & Intelligence System

## Overview
This plan implements the revised department routing approach that assigns departments based on incentive categories, with Finance/Trading always reviewing all deals, and other departments triggered by specific incentive types.

## Current State Analysis

### ✅ Existing Components We Can Leverage

#### 1. **Schema & Data Structures** (90% Ready)
- `dealApprovals` table with `department` field
- `incentiveValues` table with `category` field 
- `departmentTypes` enum matching our target departments
- `approvalStages` with Stage 1 parallel processing
- `stage1Departments` array for all reviewing departments

#### 2. **Storage Interface** (80% Ready)
- `getPendingApprovals()` with department filtering
- `createDealApproval()` for assignment
- `updateDealApproval()` for completion tracking
- Basic approval queue management

#### 3. **Frontend Components** (70% Ready)
- `ConsolidatedDashboard` with role-based sections
- `StrategicInsights` framework for generating alerts
- Approval queue display components
- Department switching and testing infrastructure

#### 4. **API Routes** (85% Ready)
- `/api/approvals/pending` with filtering
- `/api/deals` with full deal data including incentives
- Deal creation/update workflows

### 🔍 Critical Discovery: Current Approval System
Our existing system at `/deals/:dealId/initiate-approval` (lines 1527-1541) assigns ALL 6 departments to every deal regardless of incentive types. This is exactly what we need to change:

**Current Logic:**
```typescript
const stage1Departments: DepartmentType[] = ['trading', 'finance', 'creative', 'marketing', 'product', 'solutions'];
// Creates approvals for ALL departments for EVERY deal
```

**New Logic Needed:**
```typescript
// Finance/Trading: Always review (margin responsibility)
const requiredDepts = ["finance", "trading"];

// Other departments: Only if relevant incentives exist
const incentiveMapping = {
  "financial": "finance", "resources": "finance",
  "product-innovation": "creative", "technology": "product", 
  "analytics": "solutions", "marketing": "marketing"
};
```

### 🔨 Components Requiring Major Changes

#### 1. **Department Assignment Logic** (Build from Scratch)
**Location**: `server/storage.ts` - new function
**What**: Systematic assignment based on incentive categories
**Complexity**: Medium

#### 2. **Strategic Insights Filtering** (Major Refactor)
**Location**: `client/src/components/dashboard/StrategicInsights.tsx`
**What**: Department-specific "needs attention" logic
**Complexity**: Medium-High

#### 3. **Approval Queue Creation** (Moderate Changes)
**Location**: Deal submission workflow in routes
**What**: Auto-create approvals based on incentive mapping
**Complexity**: Medium

## Implementation Plan

### Phase 1: Backend Department Assignment Logic (1-2 Days)

#### 1.1 Create Incentive-to-Department Mapping Function
```typescript
// server/storage.ts - ADD NEW FUNCTION
async determineRequiredDepartments(incentives: IncentiveValue[]): Promise<{
  departments: string[],
  reasons: Record<string, string[]>
}> {
  const required = ["finance", "trading"]; // Always required
  const reasons = {
    finance: ["margin_profitability_review"],
    trading: ["margin_profitability_review"]
  };

  const incentiveMapping = {
    "financial": "finance",
    "resources": "finance", 
    "product-innovation": "creative",
    "technology": "product",
    "analytics": "solutions",
    "marketing": "marketing"
  };

  incentives.forEach(incentive => {
    const dept = incentiveMapping[incentive.category];
    if (dept && !required.includes(dept)) {
      required.push(dept);
      if (!reasons[dept]) reasons[dept] = [];
      reasons[dept].push(`${incentive.category}_incentive_review`);
    }
  });

  return { departments: required, reasons };
}
```

#### 1.2 Update Approval Workflow Initiation
```typescript
// server/routes.ts - MODIFY EXISTING initiate-approval endpoint (lines 1527-1541)
// Replace the current ALL departments approach with incentive-based assignment

// Get deal incentives to determine departments
const incentives = await storage.getIncentiveValues(dealId);
const { departments, reasons } = await storage.determineRequiredDepartments(incentives);

// Stage 1: Department Review (Incentive-based + Finance/Trading always)
for (const dept of departments) {
  approvalRequirements.push({
    dealId,
    approvalStage: 1,
    department: dept,
    requiredRole: 'department_reviewer',
    status: 'pending' as const,
    priority: 'normal' as const,
    dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
  });
}

// Legal only for contract_drafting status (Stage 1.5)
if (deal.status === 'contract_drafting') {
  approvalRequirements.push({
    dealId,
    approvalStage: 1, // Parallel but separate
    department: 'legal',
    requiredRole: 'department_reviewer',
    status: 'pending' as const,
    priority: 'normal' as const,
    dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
  });
}
```

#### 1.3 Enhance Approval Queue Filtering
```typescript
// server/storage.ts - MODIFY EXISTING getPendingApprovals
// Add department-specific filtering to ensure reviewers only see relevant assignments
async getPendingApprovals(userDepartment?: string, userId?: number): Promise<PendingApproval[]> {
  let approvals = Array.from(this.dealApprovals.values())
    .filter(approval => approval.status === 'pending');
  
  // Filter by department if specified
  if (userDepartment) {
    approvals = approvals.filter(approval => approval.department === userDepartment);
  }
  
  // Rest of existing logic...
}
```

### Phase 2: Strategic Insights Refinement (1 Day)

#### 2.1 Department-Specific Insights Logic
```typescript
// client/src/components/dashboard/StrategicInsights.tsx - MAJOR REFACTOR
const generateDepartmentSpecificInsights = (
  user: User, 
  deals: Deal[], 
  approvals: DealApproval[]
) => {
  const insights: InsightItem[] = [];
  
  // Filter deals assigned to this user's department
  const departmentApprovals = approvals.filter(approval => 
    approval.department === user.department && 
    approval.status === 'pending'
  );
  
  // Find delayed approvals (>3 days) for this department only
  const delayedApprovals = departmentApprovals.filter(approval => {
    const daysSinceCreated = Math.floor(
      (Date.now() - new Date(approval.createdAt).getTime()) / (1000 * 60 * 60 * 24)
    );
    return daysSinceCreated > 3;
  });
  
  if (delayedApprovals.length > 0) {
    insights.push({
      title: `${user.department} Review Bottleneck`,
      description: `${delayedApprovals.length} deals pending ${user.department} review >3 days`,
      urgency: delayedApprovals.length > 2 ? 'high' : 'medium',
      action: 'Review',
      dealIds: delayedApprovals.map(a => a.dealId)
    });
  }
  
  return insights;
};
```

#### 2.2 Role-Specific Insight Generation
```typescript
// Add department-specific context to insights
const getDepartmentReviewContext = (department: string, incentiveCategories: string[]) => {
  const contextMap = {
    finance: "margin analysis and financial incentives",
    trading: "margin validation and trading implications", 
    creative: "product innovation incentive validation",
    marketing: "marketing incentive assessment",
    product: "technology incentive evaluation",
    solutions: "analytics incentive review"
  };
  
  return contextMap[department] || "department review";
};
```

### Phase 3: Frontend Integration (1 Day)

#### 3.1 Update Dashboard Metrics
```typescript
// client/src/hooks/useDashboardMetrics.ts - MODIFY EXISTING
// Update pending approvals count to be department-specific
const { data: pendingApprovals } = useQuery({
  queryKey: ['/api/approvals/pending', user?.department],
  queryFn: () => apiRequest(`/api/approvals/pending?department=${user?.department}`)
});
```

#### 3.2 Enhance Approval Queue Display
```typescript
// Add reasoning display to approval queue items
const ApprovalQueueItem = ({ approval, deal }) => {
  const getReviewReason = (department: string, incentives: IncentiveValue[]) => {
    if (department === 'finance' || department === 'trading') {
      return 'Margin/Profitability Review';
    }
    
    const incentiveReasons = incentives
      .filter(i => departmentMapping[i.category] === department)
      .map(i => `${i.category} incentive`);
      
    return incentiveReasons.join(', ') || 'Department Review';
  };
  
  return (
    <div className="approval-item">
      <h3>{deal.dealName}</h3>
      <p>Reason: {getReviewReason(approval.department, deal.incentives)}</p>
      {/* Rest of component */}
    </div>
  );
};
```

## Testing Strategy

### Phase 4: Validation & Testing (1 Day)

#### 4.1 Data Validation Tests
- [ ] Finance department sees ALL deals in under_review status
- [ ] Trading department sees ALL deals in under_review status  
- [ ] Creative department sees ONLY deals with product-innovation incentives
- [ ] Marketing department sees ONLY deals with marketing incentives
- [ ] Legal department sees ONLY deals in contract_drafting status

#### 4.2 Strategic Insights Tests
- [ ] Finance insights show delays in margin review + financial incentives
- [ ] Creative insights show delays in product-innovation deals only
- [ ] Solutions insights show delays in analytics deals only
- [ ] Insights don't show deals from other departments

#### 4.3 Workflow Tests
- [ ] Deal submission creates correct department assignments
- [ ] Department completion removes deal from that department's queue only
- [ ] Parallel processing allows multiple departments to work simultaneously

## Technical Debt & Improvements

### Immediate Benefits
1. **Eliminate False Alerts**: Departments only see relevant delays
2. **Clear Accountability**: Each department knows why they're reviewing
3. **Accurate Workload**: Queue sizes reflect actual department responsibility

### Future Enhancements
1. **Department-Specific SLAs**: Different timing thresholds per department
2. **Escalation Logic**: Auto-escalate based on department capacity
3. **Workload Balancing**: Distribute assignments within departments

## Risk Mitigation

### Potential Issues
1. **Data Migration**: Existing approvals may not have department assignments
2. **Missing Incentives**: Deals without incentives still need Finance/Trading review
3. **Legal Separation**: Ensure Legal doesn't appear in parallel review stage

### Solutions
1. **Backfill Script**: Assign existing approvals based on current deal incentives
2. **Fallback Logic**: Default to Finance/Trading for deals without incentives
3. **Status Guards**: Legal approvals only created for contract_drafting status

## Implementation Timeline

- **Day 1**: Backend department assignment logic + API updates
- **Day 2**: Strategic insights refactoring + department filtering
- **Day 3**: Frontend integration + testing
- **Day 4**: Validation + bug fixes

**Total Estimated Effort**: 3-4 days for complete implementation

## Key Implementation Points

### Exact Changes Required

#### 1. **Replace Universal Department Assignment** (server/routes.ts line 1529)
**Current:**
```typescript
const stage1Departments: DepartmentType[] = ['trading', 'finance', 'creative', 'marketing', 'product', 'solutions'];
```

**Replace with:**
```typescript
const incentives = await storage.getIncentiveValues(dealId);
const requiredDepartments = await storage.determineRequiredDepartments(incentives);
```

#### 2. **Add Department Assignment Function** (server/storage.ts)
New function that implements incentive-to-department mapping

#### 3. **Update Strategic Insights Filtering** (client/src/components/dashboard/StrategicInsights.tsx)
Filter "needs attention" alerts by user's department assignments only

#### 4. **Enhance Approval Queue API** (server/routes.ts line 1664)
Add department parameter to `/api/approvals/pending` for filtering

This plan leverages 80-85% of our existing infrastructure while delivering targeted department-specific intelligence that eliminates noise and improves workflow efficiency.