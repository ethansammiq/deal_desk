# Department Routing Data Analysis & Proposal

## Current State Analysis

### Existing Deal Data Fields That Could Inform Department Routing

**Finance Department Triggers:**
- `annualRevenue` - High value deals need finance review
- `annualGrossMargin` - Margin analysis required
- `yearlyRevenueGrowthRate` - Revenue impact assessment
- `forecastedMargin` - Financial projections validation
- `addedValueBenefitsCost` - Cost analysis required

**Trading Department Triggers:**
- `hasTradeAMImplications: boolean` - Explicitly requires trading review
- `annualRevenue` - Large deals affect inventory allocation
- `dealType` ("grow" vs "protect") - Different trading strategies

**Creative Department Triggers:**
- `requiresCustomMarketing: boolean` - Explicitly requires creative review
- `dealType: "grow"` - New business often needs creative assets
- `salesChannel` - Different channels need different creative approaches

**Analytics Department Triggers:**
- `analyticsTier` ("bronze", "silver", "gold", "platinum") - Different tiers need different setup
- High-value deals (>$1M) might need premium analytics

**Legal Department Triggers:**
- Currently only triggered by status (`contract_drafting`)
- No deal characteristics determine legal review need

**Operations Department Triggers:**
- No current data fields indicate operations review needs
- Missing implementation complexity indicators

## Data Gaps Identified

### Missing Department Assignment Logic
We have department approval schemas but no systematic way to determine which departments should review each deal based on deal characteristics.

### Missing Deal Complexity Indicators
- No field for "custom contract terms required"
- No field for "complex implementation requirements"  
- No field for "regulatory compliance needs"
- No field for "integration complexity"

### Missing Review Requirements Calculation
- No function to determine required departments from deal data
- Manual assignment in approval queue vs automated routing
- No way to know WHY a department should review a deal

## Proposed Solution: Department Routing Schema

### 1. Add Department Routing Fields to Deal Schema

```typescript
// Add to deals table in shared/schema.ts
departmentRoutingRules: text("department_routing_rules").array().default([]), 
// e.g., ["finance_high_value", "trading_implications", "creative_custom"]

requiredDepartments: text("required_departments").array().default([]),
// e.g., ["finance", "trading", "creative"]

routingReason: jsonb("routing_reason"), 
// Store WHY each department is required
// e.g., { "finance": "high_value_deal", "trading": "margin_implications" }
```

### 2. Create Department Routing Logic Function

```typescript
function determineRequiredDepartments(deal: Deal): {
  departments: string[],
  reasons: Record<string, string>
} {
  const required = [];
  const reasons = {};

  // Finance Department Rules
  if (deal.annualRevenue > 1000000) {
    required.push("finance");
    reasons.finance = "high_value_deal";
  }
  if (deal.annualGrossMargin < 15) {
    required.push("finance");
    reasons.finance = "low_margin_concern";
  }

  // Trading Department Rules  
  if (deal.hasTradeAMImplications) {
    required.push("trading");
    reasons.trading = "explicit_trading_implications";
  }
  if (deal.annualRevenue > 5000000) {
    required.push("trading");
    reasons.trading = "inventory_impact";
  }

  // Creative Department Rules
  if (deal.requiresCustomMarketing) {
    required.push("creative");
    reasons.creative = "custom_marketing_required";
  }
  if (deal.dealType === "grow" && deal.annualRevenue > 2000000) {
    required.push("creative");
    reasons.creative = "new_business_creative_needs";
  }

  // Analytics Department Rules
  if (deal.analyticsTier === "platinum" || deal.analyticsTier === "gold") {
    required.push("analytics");
    reasons.analytics = "premium_analytics_setup";
  }

  return { departments: [...new Set(required)], reasons };
}
```

### 3. Enhanced Deal Creation with Auto-Routing

When a deal is submitted, automatically:
1. Calculate required departments based on deal characteristics
2. Create approval queue items for each required department
3. Store routing reasons for transparency
4. Enable department reviewers to see WHY they're reviewing

### 4. Department-Specific "Needs Attention" Logic

**Finance Department:**
- Focus on deals assigned to Finance queue taking >3 days
- Trigger: Department assignment + timing delay
- Not triggered by: Business risks they can't control

**Trading Department:**
- Focus on deals with trading implications taking >3 days  
- Trigger: `hasTradeAMImplications` + timing delay
- Not triggered by: General business risks

**Creative Department:**
- Focus on deals requiring custom marketing taking >3 days
- Trigger: `requiresCustomMarketing` + timing delay
- Not triggered by: Generic deal delays

## Implementation Benefits

### 1. Clear Department Accountability
Each department knows exactly why they're reviewing a deal:
- Finance: "High-value deal requiring margin validation"
- Trading: "Deal has explicit trading implications"  
- Creative: "Custom marketing assets required"

### 2. Relevant "Needs Attention" Alerts
Department reviewers only see alerts for:
- Deals assigned to their department
- Delays in their specific review process
- Issues they can actually action

### 3. Improved Strategic Insights
- "3 high-value deals pending finance review >3 days"
- "2 custom marketing deals stalled in creative review"
- "Trading bottleneck affecting 5 deals with inventory implications"

### 4. Data-Driven Workflow Intelligence
Flow intelligence becomes department-specific:
- Finance sees margin analysis delays
- Creative sees asset development bottlenecks  
- Trading sees inventory planning delays

## Next Steps

1. **Extend Deal Schema** with routing fields
2. **Implement Routing Logic** based on deal characteristics
3. **Update Strategic Insights** to use department-specific triggers
4. **Add Routing Transparency** so departments understand their assignments
5. **Test with Real Scenarios** using existing deal data

This approach ensures each department's "needs attention" alerts are actionable and relevant to their actual responsibilities.