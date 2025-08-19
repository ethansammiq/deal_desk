# Revised Department Routing & Intelligence Proposal

## Core Principles Based on Feedback

### 1. **Universal Finance & Trading Review**
- **Finance**: Always reviews margin/profitability for all deals (original and adjusted)
- **Trading**: Always reviews margin/profitability for all deals (original and adjusted)
- These are mandatory reviews, not optional based on deal characteristics

### 2. **Incentive Category → Department Mapping**
Clear mapping of our existing incentive categories to responsible departments:
- **financial** → Finance Department
- **resources** → Finance Department  
- **product-innovation** → Creative Department
- **technology** → Product Department
- **analytics** → Solutions Department
- **marketing** → Marketing Department

### 3. **Legal Department Trigger**
- **Legal**: Only triggered by `contract_drafting` status
- Not part of the "under_review" stage parallel processing

### 4. **Parallel Review Process**
- All departments (except Legal) review simultaneously during "under_review" status
- Multiple departments can see the same deal in their pending queue
- Each department's review completion removes the deal from their specific queue only

## Revised Data Structure

### Department Assignment Logic

```typescript
function determineRequiredDepartments(deal: Deal, incentives: IncentiveValue[]): {
  departments: string[],
  reasons: Record<string, string[]>
} {
  const required = ["finance", "trading"]; // Always required
  const reasons: Record<string, string[]> = {
    finance: ["margin_profitability_review"],
    trading: ["margin_profitability_review"]
  };

  // Map incentive categories to departments (using actual category IDs from our schema)
  const incentiveDepartmentMap = {
    "financial": "finance",
    "resources": "finance", 
    "product-innovation": "creative",
    "technology": "product",
    "analytics": "solutions",
    "marketing": "marketing"
  };

  // Add departments based on incentive categories
  incentives.forEach(incentive => {
    const dept = incentiveDepartmentMap[incentive.category];
    if (dept && !required.includes(dept)) {
      required.push(dept);
      if (!reasons[dept]) reasons[dept] = [];
      reasons[dept].push(`${incentive.category}_incentive_review`);
    }
  });

  return { departments: required, reasons };
}
```

### Deal Review Requirements Schema

```typescript
// Add to deals table
requiredDepartmentReviews: jsonb("required_department_reviews"),
// e.g., {
//   "finance": ["margin_review", "financial_incentive_review"],
//   "trading": ["margin_review"], 
//   "creative": ["product_innovation_incentive_review"],
//   "marketing": ["marketing_incentive_review"]
// }

completedDepartmentReviews: text("completed_department_reviews").array().default([]),
// e.g., ["finance", "creative"] - tracks which departments have completed review
```

## Department-Specific "Needs Attention" Logic

### Finance Department
**Triggers:**
- Deals in "under_review" status assigned to Finance taking >3 days
- Focus: Financial incentive review delays + mandatory margin analysis delays

**Strategic Insight Example:**
- "Finance Review Bottleneck: 3 deals pending margin analysis >3 days"
- "Financial Incentive Review: 2 deals with financial incentives delayed"

### Trading Department  
**Triggers:**
- Deals in "under_review" status assigned to Trading taking >3 days
- Focus: Mandatory margin/profitability analysis delays

**Strategic Insight Example:**
- "Trading Review Bottleneck: 3 deals pending margin validation >3 days"

### Creative Department
**Triggers:**
- Deals in "under_review" status with "Product & Innovation" incentives taking >3 days
- Focus: Creative incentive review delays (not all deals)

**Strategic Insight Example:**
- "Creative Incentive Review: 2 deals with product-innovation incentives delayed >3 days"

### Marketing Department
**Triggers:**
- Deals in "under_review" status with "Marketing & L&D" incentives taking >3 days  
- Focus: Marketing incentive review delays (not all deals)

**Strategic Insight Example:**
- "Marketing Incentive Review: 1 deal with marketing incentives delayed >3 days"

### Product Department
**Triggers:**
- Deals in "under_review" status with "Technology" incentives taking >3 days
- Focus: Technology incentive review delays (not all deals)

### Solutions Department
**Triggers:**
- Deals in "under_review" status with "Analytics" incentives taking >3 days
- Focus: Analytics incentive review delays (not all deals)

### Legal Department
**Triggers:**
- Deals in "contract_drafting" status taking >3 days
- Focus: Contract drafting process delays

**Strategic Insight Example:**
- "Contract Drafting Bottleneck: 2 deals delayed >3 days in legal review"

## Implementation Benefits

### 1. **Clear Mandatory vs Optional Reviews**
- Finance & Trading: Always see all deals (margin review responsibility)
- Other Departments: Only see deals with relevant incentive categories
- Legal: Only sees deals that reach contract drafting stage

### 2. **Incentive-Driven Routing**
Each department knows exactly why they're reviewing:
- Finance: "Margin analysis + Financial incentive review"
- Creative: "Product & Innovation incentive requires creative approval"
- Marketing: "Marketing & L&D incentive requires marketing approval"

### 3. **Parallel Processing Visibility**
- Multiple departments can work simultaneously on the same deal
- Each sees their specific pending review responsibilities
- Progress tracking shows which departments have completed their reviews

### 4. **Accurate "Needs Attention" Alerts**
- Finance sees delays in their mandatory margin reviews + financial incentive reviews
- Creative only sees delays in deals they're actually responsible for (product innovation incentives)
- No irrelevant alerts about deals they don't need to review

## Current Data Mapping

Based on our existing schema, we already have:
- `IncentiveValue.category` - maps to departments per your specification
- Deal status workflow - "under_review" for parallel processing, "contract_drafting" for legal

## Practical Implementation with Current System

### Current Schema Alignment
Our existing system already supports this approach:
- ✅ **Incentive Categories**: `financial`, `resources`, `product-innovation`, `technology`, `analytics`, `marketing`
- ✅ **Department Types**: `finance`, `trading`, `creative`, `marketing`, `product`, `solutions`  
- ✅ **Parallel Review Stage**: `under_review` status with `stage1Departments` array
- ✅ **Legal Separation**: `contract_drafting` status for legal-only reviews

### Implementation Steps

#### Phase 1: Department Assignment Logic (1-2 days)
```typescript
// Add to deal creation/update logic
async function assignDealToReviewDepartments(deal: Deal, incentives: IncentiveValue[]) {
  const requiredDepts = ["finance", "trading"]; // Always required
  
  // Add departments based on incentive categories
  const incentiveMapping = {
    "financial": "finance", "resources": "finance",
    "product-innovation": "creative", "technology": "product", 
    "analytics": "solutions", "marketing": "marketing"
  };
  
  incentives.forEach(incentive => {
    const dept = incentiveMapping[incentive.category];
    if (dept && !requiredDepts.includes(dept)) {
      requiredDepts.push(dept);
    }
  });
  
  // Create approval queue items for each required department
  for (const dept of requiredDepts) {
    await createDealApproval({
      dealId: deal.id,
      department: dept,
      status: "pending",
      approvalStage: 1 // All in stage 1 parallel review
    });
  }
}
```

#### Phase 2: Strategic Insights Refinement (1 day)
Update `generateWorkflowEfficiencyInsights()` to:
- Filter by actual department assignment (approval queue data)
- Show only delays in deals assigned to each specific department
- Use department-specific reasoning for alerts

#### Phase 3: Testing & Validation (1 day)  
- Test with current deal data to ensure proper department filtering
- Validate that Finance/Trading see all deals, others see only incentive-driven assignments
- Confirm Legal only appears for `contract_drafting` status

### Expected Results

**Finance Team Dashboard:**
- Shows ALL deals in under_review (margin responsibility)
- Shows deals with financial/resources incentives  
- Strategic Insight: "Finance Review Bottleneck: 5 deals pending >3 days"

**Creative Team Dashboard:**
- Shows ONLY deals with product-innovation incentives
- Strategic Insight: "Creative Incentive Review: 2 product innovation deals delayed"

**Solutions Team Dashboard:**  
- Shows ONLY deals with analytics incentives
- Strategic Insight: "Analytics Setup Delayed: 1 deal with analytics incentives >3 days"

**Legal Team Dashboard:**
- Shows ONLY deals in contract_drafting status
- Strategic Insight: "Contract Drafting Bottleneck: 3 deals delayed >3 days"

This refined approach ensures each department's "needs attention" alerts are highly relevant to their actual responsibilities and workload, eliminating noise while maintaining accountability.