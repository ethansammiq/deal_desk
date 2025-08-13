# Backend Integration & Tier 0 Architecture Plan

## 1. BACKEND DATA STRUCTURE INTEGRATION

### Current Hardcoded Values → Database Tables

**Advertiser Table Structure:**
```typescript
interface Advertiser {
  id: string;
  name: string;
  salesChannel: 'client_direct';
  previousYearRevenue: number;    // USD amount (e.g., 850000)
  previousYearMargin: number;     // Decimal (e.g., 0.35 = 35%)
  previousYearProfit: number;     // Calculated or stored
  industry?: string;
  region?: string;
}
```

**Agency Table Structure:**
```typescript
interface Agency {
  id: string;
  name: string;
  type: 'independent' | 'holding_company';
  salesChannel: 'independent_agency' | 'holding_company';
  previousYearRevenue: number;    // USD amount
  previousYearMargin: number;     // Decimal format (0.35)
  previousYearProfit: number;     // Calculated or stored
  parentCompany?: string;
}
```

### Data Flow Integration Points

**Step 1: Client Selection** → **Step 3: Value Structure**
1. User selects sales channel in Step 1
2. User selects advertiser OR agency based on sales channel
3. System fetches corresponding previous year data
4. Value Structure step displays fetched data as "Previous Year" baseline
5. Calculations automatically use fetched data instead of hardcoded values

## 2. TIER 0 CONCEPT ANALYSIS

### 🎯 TIER 0 = PREVIOUS YEAR DATA

**Benefits of Treating Previous Year as "Tier 0":**

#### ✅ Calculation Simplification
```typescript
// Current Approach (Multiple Methods)
calculateRevenueGrowthRate(tier, salesChannel, advertiserName, agencyName)
calculateProfitGrowthRate(tier, salesChannel, advertiserName, agencyName)
calculateGrossMarginGrowthRate(tier, salesChannel, advertiserName, agencyName)

// Tier 0 Approach (Unified)
calculateGrowthRate(currentTier: DealTier, previousTier: DealTier, metric: 'revenue' | 'profit' | 'margin')
```

#### ✅ Data Structure Consistency
```typescript
// All tiers follow same interface
interface DealTier {
  tierNumber: number;           // 0 = previous year, 1,2,3... = current deal
  annualRevenue: number;
  annualGrossMargin: number;    // Always decimal (0.35)
  incentiveValue: number;
  categoryName: string;
  subCategoryName: string;
  // ... other fields
}

// Tier 0 would be:
const tier0: DealTier = {
  tierNumber: 0,
  annualRevenue: advertiser.previousYearRevenue,
  annualGrossMargin: advertiser.previousYearMargin,
  incentiveValue: 50000, // Historical incentive cost
  categoryName: "Previous Year Baseline",
  subCategoryName: "Historical Data",
  // ...
}
```

#### ✅ UI Display Consistency
```typescript
// Financial tables can treat all tiers uniformly
<tr>
  <FinancialDataCell isMetricLabel>Revenue</FinancialDataCell>
  {[tier0, ...dealTiers].map((tier) => (
    <FinancialDataCell key={tier.tierNumber}>
      {tier.tierNumber === 0 ? (
        <span className="text-slate-600">{formatCurrency(tier.annualRevenue)}</span>
      ) : (
        <Input value={tier.annualRevenue} onChange={...} />
      )}
    </FinancialDataCell>
  ))}
</tr>
```

### ⚠️ TIER 0 CONSIDERATIONS

#### Potential Challenges:
1. **Different Data Sources**: Previous year from database, current tiers from user input
2. **Field Mapping**: Some DealTier fields don't apply to historical data
3. **Validation Logic**: Different validation rules for tier 0 vs active tiers
4. **State Management**: Handling read-only tier 0 vs editable tiers

#### Recommended Approach:
**Hybrid Model** - Keep separate previous year methods but standardize data format

## 3. CALCULATION FIXES REQUIRED

### Fix 1: Gross Margin Growth Rate Formula
**Current (Incorrect Unit Handling):**
```typescript
calculateGrossMarginGrowthRate(tier: DealTier): number {
  const currentMargin = (tier.annualGrossMargin || 0) * 100; // Convert to %
  const previousYearMargin = this.getPreviousYearMargin(); // Already %
  return (currentMargin - previousYearMargin) / previousYearMargin;
}
```

**Fixed (Proper Percentage Display):**
```typescript
calculateGrossMarginGrowthRate(tier: DealTier): number {
  const currentMargin = (tier.annualGrossMargin || 0) * 100; // Convert to %
  const previousYearMargin = this.getPreviousYearMargin() / 100; // Convert to decimal
  const previousMarginPercent = previousYearMargin * 100; // Back to % for calculation
  
  if (previousMarginPercent === 0) return 0;
  return ((currentMargin - previousMarginPercent) / previousMarginPercent) * 100;
}
```

### Fix 2: Unit Consistency - Previous Year Margin
**Update hardcoded values to decimal format:**
```typescript
// Before: return 35; (percentage)
// After: return 0.35; (decimal)
getPreviousYearMargin(): number {
  // ... database lookup logic
  return advertiser?.previousYearMargin || 0.35; // Decimal format
}
```

### Fix 3: Standardize Growth Rate Returns
**All growth rates should return percentage values for UI display:**
```typescript
// Revenue Growth: Return as percentage
calculateRevenueGrowthRate(): number {
  const growthRate = (current - previous) / previous;
  return growthRate * 100; // Return as percentage for display
}

// Profit Growth: Return as percentage  
calculateProfitGrowthRate(): number {
  const growthRate = current / previous - 1;
  return growthRate * 100; // Return as percentage for display
}
```

## 4. IMPLEMENTATION ROADMAP

### Phase 1: Fix Current Calculations ✅ IMMEDIATE
- [ ] Update gross margin growth rate formula
- [ ] Convert hardcoded margins to decimal (0.35)
- [ ] Standardize growth rate return values to percentages

### Phase 2: Backend Table Integration
- [ ] Create advertiser/agency database tables
- [ ] Add API endpoints for client data fetching
- [ ] Update DealCalculationService constructor to accept fetched data
- [ ] Modify form flow: Step 1 selection → Step 3 data fetch

### Phase 3: Tier 0 Evaluation (Optional)
- [ ] Prototype tier 0 implementation
- [ ] Compare complexity vs current approach
- [ ] User experience testing
- [ ] Decision: Implement tier 0 or keep hybrid model

## 5. RECOMMENDED IMMEDIATE ACTIONS

### High Priority (Fix Now):
1. **Gross Margin Growth Rate Formula** - Critical calculation error
2. **Unit Consistency** - Margin storage format standardization  
3. **Return Value Standardization** - UI display consistency

### Medium Priority (Next Sprint):
1. **Backend Integration** - Replace hardcoded values
2. **Data Flow Connection** - Step 1 → Step 3 integration
3. **Error Handling** - Failed API calls, missing data

### Low Priority (Future Consideration):
1. **Tier 0 Architecture** - Evaluate after backend integration
2. **Calculation Performance** - Optimization if needed
3. **Advanced Analytics** - Additional metrics and insights

## 6. TIER 0 FINAL RECOMMENDATION

**VERDICT: Start with Backend Integration, Evaluate Tier 0 Later**

**Reasoning:**
- Backend integration is essential and provides immediate business value
- Tier 0 concept is elegant but adds architectural complexity
- Current calculation methods work well with proper unit fixes
- Can evaluate tier 0 after backend integration is stable

**Hybrid Approach Benefits:**
- Maintains existing proven calculation logic
- Easier to debug and maintain
- Simpler state management
- Lower risk of regression bugs
- Can always refactor to tier 0 later if benefits are clear