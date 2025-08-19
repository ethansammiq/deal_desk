# Flow Intelligence: Department-Specific "Needs Attention" Logic Guide

## Overview
The flow intelligence system uses a unified 2-status approach (`on_track` vs `needs_attention`) but triggers "needs attention" based on different criteria depending on the department and role. This guide explains what triggers alerts for each department.

## Universal Triggers (Apply to All Departments)

### Business Risk Criteria (Immediate Attention)
1. **Revision Requested**: Always needs attention regardless of timing
2. **Extended Negotiations**: >7 days in negotiating status
3. **High Revision Count**: 2+ revisions indicate process/quality issues
4. **Priority Escalation**: Critical/high priority deals stuck >1 day
5. **High-Value Deal Monitoring**: Deals >$5M stuck >2 days

### Standard Timing Thresholds
- **Submitted**: >2 days (initial processing delay)
- **Under Review**: >3 days (review process stalled)
- **Scoping**: >3 days (scoping phase extended)
- **Negotiating**: >4 days (negotiation not progressing)
- **Approved**: >2 days (execution delay)
- **Contract Drafting**: >3 days (legal processing delay)
- **Client Review**: >4 days (external dependency)

## Department-Specific Logic

### Finance Department
**Primary Focus**: Financial validation, margin analysis, budget impact

**Specific Triggers**:
- **Submitted Deals >2 days**: Need initial financial review
- **Under Review >3 days**: Financial analysis bottleneck
- **High-value deals >$5M >2 days**: Priority financial scrutiny
- **Margin concerns**: Deals with <expected margin thresholds
- **Budget impact**: Deals affecting quarterly/annual budget targets

**Strategic Insights Generated**:
- "Review Process Bottleneck" when multiple deals delayed >3 days
- Focus on financial validation and margin protection

### Creative Department  
**Primary Focus**: Creative assets, campaign concepts, brand alignment

**Specific Triggers**:
- **Submitted Deals >2 days**: Need creative review and validation
- **Under Review >3 days**: Creative approval bottleneck
- **Custom marketing required**: Deals flagged for custom creative work
- **Brand alignment**: Complex creative requirements not progressing

**Strategic Insights Generated**:
- "Review Process Bottleneck" for creative validation delays
- Focus on creative asset development and brand compliance

### Trading Department
**Primary Focus**: Media trading, inventory management, yield optimization

**Specific Triggers**:
- **Trade AM implications**: Deals with trading/account management impact
- **Inventory concerns**: Deals affecting available inventory
- **Yield optimization**: Deals not meeting revenue efficiency targets
- **Submitted/Under Review >3 days**: Trading strategy validation needed

**Strategic Insights Generated**:
- "Review Process Bottleneck" for trading strategy delays
- Focus on inventory optimization and yield management

### Legal Department
**Primary Focus**: Contract terms, compliance, risk mitigation

**Specific Triggers**:
- **Contract Drafting >3 days**: Legal processing delay
- **Complex terms**: Non-standard contract requirements
- **Compliance issues**: Regulatory or policy concerns
- **Risk mitigation**: High-risk deals requiring legal review

**Strategic Insights Generated**:
- "Contract Processing Bottleneck" for legal delays
- Focus on contract completion and risk management

### Operations Department
**Primary Focus**: Implementation logistics, resource allocation

**Specific Triggers**:
- **Approved >2 days**: Implementation not starting
- **Resource allocation**: Deals requiring operational planning
- **Client onboarding**: New client setup delays
- **System integration**: Technical implementation requirements

**Strategic Insights Generated**:
- "Implementation Bottleneck" for execution delays
- Focus on operational readiness and resource planning

### Analytics Department
**Primary Focus**: Data requirements, reporting capabilities, measurement setup

**Specific Triggers**:
- **Analytics tier setup**: Silver/Gold/Platinum tier configuration
- **Measurement requirements**: Complex analytics needs
- **Data integration**: Custom reporting setup needed
- **Performance tracking**: KPI and measurement delays

**Strategic Insights Generated**:
- "Analytics Setup Bottleneck" for measurement delays
- Focus on data readiness and reporting capabilities

## Role-Specific Dashboard Views

### Sellers (All Departments)
**Focus**: Pipeline health and deal progression
**Triggers**:
- Deals stalled in any status beyond thresholds
- Revision requests requiring action
- Negotiation delays needing follow-up
- Client review timeouts

### Department Reviewers
**Focus**: Department-specific review bottlenecks
**Triggers**:
- Only sees deals assigned to their department queue
- Uses approval queue data for filtering
- Focused on department-specific validation delays

### Approvers
**Focus**: Business approval bottlenecks across departments
**Triggers**:
- Cross-department view of approval delays
- High-value deal prioritization
- Business risk escalation

## Implementation Details

### Data Flow
1. **Backend Calculation**: `calculateFlowIntelligence()` in `server/storage.ts`
2. **Department Filtering**: Uses approval queue data (`/api/approvals/pending`)
3. **Frontend Display**: Strategic Insights component shows department-specific alerts
4. **Analytics Integration**: Department-filtered analytics views

### Key Functions
- `calculateFlowIntelligence()`: Core logic for needs attention determination
- `generateWorkflowEfficiencyInsights()`: Department-specific insight generation
- Department approval queue filtering ensures consistent metrics

### Testing Scenarios
Each department can be tested with:
- Deals in their approval queue with appropriate delays
- Different deal values and priorities
- Various deal statuses triggering department-specific rules

## Best Practices

### For Department Reviewers
- Focus on deals actually assigned to your department
- Prioritize high-value and high-priority deals first
- Use Strategic Insights for proactive bottleneck management

### For System Administration
- Monitor cross-department flow patterns
- Adjust timing thresholds based on department capacity
- Use approval queue analytics for workflow optimization

This system ensures each department sees relevant, actionable intelligence while maintaining consistent flow monitoring across the entire deal lifecycle.

## Real Examples from Current System

### Current Finance Department Test Data
Our system currently has 3 Finance department deals that trigger "needs attention":

**Deal #1: Coca-Cola Q1 2025 Campaign**
- Status: `submitted` (4 days ago)
- Trigger: Standard timing threshold (>2 days for submitted)
- Why Finance cares: $2.5M deal needs initial financial review
- Action needed: Financial validation and margin analysis

**Deal #2: Publicis Media Portfolio** 
- Status: `under_review` (5 days ago)  
- Trigger: Standard timing threshold (>3 days for under_review)
- Why Finance cares: Complex agency deal with margin implications
- Action needed: Complete financial review to unblock approval

**Deal #3: Nike Digital Transformation**
- Status: `under_review` (5 days ago)
- Trigger: Standard timing threshold (>3 days for under_review)  
- Why Finance cares: High-value deal ($2M+) requiring thorough analysis
- Action needed: Review financial projections and approve/reject

### Example: How Different Departments Would See Same Deal

**Nike Digital Transformation Deal ($2M, under_review for 5 days)**

**Finance Department View:**
- Trigger: "needs_attention" (>3 days in review)
- Focus: Margin analysis, budget impact, financial projections
- Strategic Insight: "Review Process Bottleneck - $2M deal delayed >3 days"
- Action: Complete financial validation

**Creative Department View:** 
- Trigger: "needs_attention" (requires custom marketing = creative review)
- Focus: Brand alignment, creative assets, campaign concepts
- Strategic Insight: "Creative Validation Needed - Custom marketing requirements"
- Action: Review creative requirements and approve assets

**Trading Department View:**
- Trigger: "needs_attention" (has trade AM implications)
- Focus: Trading strategy, inventory impact, yield optimization  
- Strategic Insight: "Trading Strategy Review - Deal affects inventory allocation"
- Action: Validate trading implications and inventory availability

**Legal Department View:**
- Would only see if status was `contract_drafting`
- Focus: Contract terms, compliance, risk mitigation
- Trigger: Legal-specific timing thresholds and complexity

### Analytics Page Filtering Examples

**Finance Team User (demo_dept_reviewer@company.com):**
- Sees: Only 3 deals assigned to Finance department queue
- URL: `/analytics?filter=needs_attention` shows these 3 deals
- Dashboard metrics: "3 Pending Reviews" matches Analytics count

**Creative Team User:**  
- Sees: Only deals in Creative department approval queue
- Different deal set than Finance (department-specific filtering)
- Consistent metrics between dashboard and analytics

This department-specific filtering ensures each team focuses on their actionable work without noise from other departments' responsibilities.