# Gross Profit Consolidation Analysis

## Current Calculation Patterns

### Pattern 1: Simple Revenue × Margin (FinancialTierTable.tsx)
```typescript
// ❌ CUSTOM CODE - Line 186
const grossProfit = (tier.annualRevenue || 0) * (tier.annualGrossMargin || 0);
```
**Usage**: Direct display in Revenue & Profitability table
**Risk Level**: LOW - Simple multiplication, no business logic

### Pattern 2: DealCalculationService.calculateTierGrossProfit (dealCalculations.ts)  
```typescript
// ✅ SHARED SERVICE - Lines 122-130
calculateTierGrossProfit(tier: DealTier): number {
  const revenue = tier.annualRevenue || 0;
  const marginDecimal = tier.annualGrossMargin || 0;
  const grossProfit = revenue * marginDecimal;
  
  // Subtract incentive cost for this tier
  const incentiveCost = tier.incentiveValue || 0;
  return grossProfit - incentiveCost; // ← This is ADJUSTED gross profit
}
```
**Usage**: Complex financial calculations with incentive adjustments
**Risk Level**: MEDIUM - Includes incentive costs

### Pattern 3: Utils.calculateProfit (lib/utils.ts)
```typescript
// ✅ SHARED UTILITY - Lines 37-41
export function calculateProfit(totalValue: number, discountPercentage: number, costPercentage: number): number {
  if (!totalValue) return 0;
  const netValue = calculateNetValue(totalValue, discountPercentage);
  return netValue * (1 - (costPercentage / 100));
}
```
**Usage**: General profit calculations with discounts and costs
**Risk Level**: HIGH - Different calculation methodology

## Migration Risk Assessment

### ✅ SAFE TO MIGRATE - Pattern 1
**Current**: `(tier.annualRevenue || 0) * (tier.annualGrossMargin || 0)`
**Target**: `calculationService.calculateBasicGrossProfit(tier)`

**Risks**: NONE
- Same exact calculation
- No business logic changes
- Direct mathematical operation

### ⚠️ MODERATE RISK - Pattern 2 Alignment
**Issue**: calculateTierGrossProfit includes incentive costs (adjusted gross profit)
**Solution**: Create separate methods
- `calculateBasicGrossProfit(tier)` - Revenue × Margin only
- `calculateAdjustedGrossProfit(tier)` - Includes incentives (current method)

### ❌ HIGH RISK - Pattern 3 Integration
**Issue**: Completely different calculation methodology
**Recommendation**: Keep separate, different use cases

## Proposed Consolidation Solution

Add to DealCalculationService:
```typescript
/**
 * Calculate basic gross profit (revenue × margin only)
 * Standardizes simple gross profit calculations across components
 */
calculateBasicGrossProfit(tier: DealTier): number {
  return (tier.annualRevenue || 0) * (tier.annualGrossMargin || 0);
}
```

**Benefits**:
- Eliminates remaining 5% custom code
- Centralized calculation logic
- Consistent across all components
- Zero business logic risk

**Migration Impact**: 
- Replace 1 line of custom code with service call
- Maintains exact same calculation
- No functional changes