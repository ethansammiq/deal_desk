# DealCalculationService - Complete Formula Documentation

## Historical Data Calculations

### 1. Previous Year Revenue
```typescript
getPreviousYearValue(salesChannel, advertiserName?, agencyName?): number
```
**Formula**: Database lookup with fallback
- If `client_direct` → Find advertiser by name → `advertiser.previousYearRevenue || 850000`
- If `holding_company` or `independent_agency` → Find agency by name → `agency.previousYearRevenue || 850000`
- Default fallback → `850000`

### 2. Previous Year Margin
```typescript
getPreviousYearMargin(salesChannel, advertiserName?, agencyName?): number
```
**Formula**: Database lookup with fallback
- If `client_direct` → Find advertiser by name → `advertiser.previousYearMargin || 35`
- If `holding_company` or `independent_agency` → Find agency by name → `agency.previousYearMargin || 35`
- Default fallback → `35` (35%)

### 3. Previous Year Gross Profit
```typescript
getPreviousYearGrossProfit(salesChannel, advertiserName?, agencyName?): number
```
**Formula**: `previousRevenue × (previousMarginPercent ÷ 100)`
- Example: `850000 × (35 ÷ 100) = 297500`

### 4. Previous Year Incentive Cost
```typescript
getPreviousYearIncentiveCost(): number
```
**Formula**: Fixed value
- Result: `50000`

### 5. Previous Year Adjusted Gross Profit
```typescript
getPreviousYearAdjustedGrossProfit(salesChannel, advertiserName?, agencyName?): number
```
**Formula**: `previousGrossProfit - previousIncentiveCost`
- Example: `297500 - 50000 = 247500`

### 6. Previous Year Adjusted Gross Margin
```typescript
getPreviousYearAdjustedGrossMargin(): number
```
**Formula**: Hard-coded for example
- Result: `0.302` (30.2%)

### 7. Previous Year Client Value
```typescript
getPreviousYearClientValue(salesChannel, advertiserName?, agencyName?): number
```
**Formula**: `previousRevenue × 0.4`
- Example: `850000 × 0.4 = 340000`

## Current Tier Calculations

### 8. Client Value
```typescript
calculateClientValue(tier: DealTier): number
```
**Formula**: `tier.annualRevenue × 0.4`
- Example: If revenue = `1000000` → `1000000 × 0.4 = 400000`

### 9. Basic Gross Profit (⭐ NEWLY ADDED)
```typescript
calculateBasicGrossProfit(tier: DealTier): number
```
**Formula**: `tier.annualRevenue × tier.annualGrossMargin`
- Example: If revenue = `1000000`, margin = `0.35` → `1000000 × 0.35 = 350000`
- Note: `annualGrossMargin` is stored as decimal (0.35 = 35%)

### 10. Tier Gross Profit (Adjusted)
```typescript
calculateTierGrossProfit(tier: DealTier): number
```
**Formula**: `(tier.annualRevenue × tier.annualGrossMargin) - tier.incentiveValue`
- Example: If revenue = `1000000`, margin = `0.35`, incentive = `75000`
- Result: `(1000000 × 0.35) - 75000 = 350000 - 75000 = 275000`

### 11. Tier Incentive Cost
```typescript
calculateTierIncentiveCost(tier: DealTier): number
```
**Formula**: Direct access
- Result: `tier.incentiveValue || 0`

## Growth Rate Calculations

### 12. Gross Margin Growth Rate
```typescript
calculateGrossMarginGrowthRate(tier, salesChannel, advertiserName?, agencyName?): number
```
**Formula**: `(currentMarginPercent - previousMarginPercent) ÷ previousMarginPercent`
- Current: `(tier.annualGrossMargin × 100)` (convert decimal to percentage)
- Previous: `getPreviousYearMargin()` 
- Example: Current = `35%`, Previous = `30%` → `(35 - 30) ÷ 30 = 0.167` (16.7% growth)

### 13. Profit Growth Rate
```typescript
calculateProfitGrowthRate(tier, salesChannel, advertiserName?, agencyName?): number
```
**Formula**: `currentProfit ÷ previousProfit - 1`
- Current: `tier.annualRevenue × tier.annualGrossMargin`
- Previous: `previousRevenue × (previousMargin ÷ 100)`
- Example: Current = `350000`, Previous = `297500` → `350000 ÷ 297500 - 1 = 0.176` (17.6% growth)

### 14. Revenue Growth Rate
```typescript
calculateRevenueGrowthRate(tier, salesChannel, advertiserName?, agencyName?): number
```
**Formula**: `(currentRevenue - previousRevenue) ÷ previousRevenue`
- Current: `tier.annualRevenue`
- Previous: `getPreviousYearValue()`
- Example: Current = `1000000`, Previous = `850000` → `(1000000 - 850000) ÷ 850000 = 0.176` (17.6% growth)

### 15. Gross Profit Growth Rate
```typescript
calculateGrossProfitGrowthRate(tier, salesChannel, advertiserName?, agencyName?): number
```
**Formula**: `currentProfit ÷ previousProfit - 1`
- Current: `tier.annualRevenue × tier.annualGrossMargin` (already decimal)
- Previous: `getPreviousYearGrossProfit()`
- Example: Current = `350000`, Previous = `297500` → `350000 ÷ 297500 - 1 = 0.176` (17.6% growth)

### 16. Adjusted Gross Profit Growth Rate
```typescript
calculateAdjustedGrossProfitGrowthRate(tier, salesChannel, advertiserName?, agencyName?): number
```
**Formula**: `currentAdjustedProfit ÷ previousAdjustedProfit - 1`
- Current: `(tier.annualRevenue × tier.annualGrossMargin) - tier.incentiveValue`
- Previous: `getPreviousYearAdjustedGrossProfit()`
- Example: Current = `275000`, Previous = `247500` → `275000 ÷ 247500 - 1 = 0.111` (11.1% growth)

### 17. Client Value Growth Rate
```typescript
calculateClientValueGrowthRate(tier, salesChannel, advertiserName?, agencyName?): number
```
**Formula**: `currentClientValue ÷ previousClientValue - 1`
- Current: `tier.annualRevenue × 0.4`
- Previous: `getPreviousYearClientValue()`
- Example: Current = `400000`, Previous = `340000` → `400000 ÷ 340000 - 1 = 0.176` (17.6% growth)

### 18. Cost Growth Rate
```typescript
calculateCostGrowthRate(tier: DealTier): number
```
**Formula**: `currentIncentiveCost ÷ previousIncentiveCost - 1`
- Current: `tier.incentiveValue`
- Previous: `50000` (fixed)
- Example: Current = `75000`, Previous = `50000` → `75000 ÷ 50000 - 1 = 0.5` (50% growth)

### 19. Adjusted Gross Margin
```typescript
calculateAdjustedGrossMargin(tier: DealTier): number
```
**Formula**: `adjustedGrossProfit ÷ revenue`
- Adjusted Gross Profit: `(tier.annualRevenue × tier.annualGrossMargin) - tier.incentiveValue`
- Example: Revenue = `1000000`, Margin = `0.35`, Incentive = `75000` → `(350000 - 75000) ÷ 1000000 = 0.275` (27.5%)

### 20. Adjusted Gross Profit
```typescript
calculateAdjustedGrossProfit(tier: DealTier): number
```
**Formula**: `(tier.annualRevenue × tier.annualGrossMargin) - tier.incentiveValue`
- Example: Revenue = `1000000`, Margin = `0.35`, Incentive = `75000` → `350000 - 75000 = 275000`

### 21. Adjusted Gross Margin Growth Rate
```typescript
calculateAdjustedGrossMarginGrowthRate(tier, salesChannel, advertiserName?, agencyName?): number
```
**Formula**: `currentAdjustedMargin - lastYearAdjustedMargin` (percentage point difference)
- Current: `adjustedGrossProfit ÷ revenue`
- Previous: `lastYearAdjustedProfit ÷ lastYearRevenue`
- Example: Current = `0.275`, Previous = `0.291` → `0.275 - 0.291 = -0.016` (-1.6 percentage points)
- Note: Returns percentage point difference, not percentage change

## Deal Summary Calculations

### 22. Deal Financial Summary
```typescript
calculateDealFinancialSummary(dealTiers[], salesChannel, advertiserName?, agencyName?): DealFinancialSummary
```
**Formulas**:
- `totalAnnualRevenue` = `Σ(tier.annualRevenue)`
- `totalGrossMargin` = `Σ(tier.annualRevenue × tier.annualGrossMargin)`
- `totalIncentiveValue` = `Σ(tier.incentiveValue)`
- `averageGrossMarginPercent` = `(totalGrossMargin ÷ totalAnnualRevenue) × 100`
- `effectiveDiscountRate` = `(totalIncentiveValue ÷ totalAnnualRevenue) × 100`
- `monthlyValue` = `totalAnnualRevenue ÷ 12`
- `yearOverYearGrowth` = `((totalAnnualRevenue - previousRevenue) ÷ previousRevenue) × 100`
- `projectedNetValue` = `totalGrossMargin - totalIncentiveValue`

## Key Data Types Used

### DealTier Interface
```typescript
{
  tierNumber: number;
  annualRevenue: number;           // USD amount
  annualGrossMargin: number;       // Decimal (0.35 = 35%)
  categoryName: string;
  subCategoryName: string; 
  incentiveOption: string;
  incentiveValue: number;          // USD amount
  incentiveNotes?: string;
}
```

### Input/Output Formats
- **Revenue**: USD amounts (e.g., `1000000`)
- **Margins**: Decimals in storage (e.g., `0.35` = 35%), percentages in display
- **Growth Rates**: Decimal multipliers (e.g., `0.176` = 17.6% growth)
- **Incentives**: USD amounts (e.g., `75000`)

## Example Complete Calculation
**Given**: 
- Tier 1: Revenue = `$1,000,000`, Margin = `35%` (0.35), Incentive = `$75,000`
- Previous Year: Revenue = `$850,000`, Margin = `35%`, Incentive = `$50,000`

**Results**:
- Basic Gross Profit: `1000000 × 0.35 = $350,000`
- Adjusted Gross Profit: `350000 - 75000 = $275,000`
- Revenue Growth: `(1000000 - 850000) ÷ 850000 = 17.6%`
- Profit Growth: `350000 ÷ 297500 - 1 = 17.6%`
- Cost Growth: `75000 ÷ 50000 - 1 = 50%`

## ⚠️ POTENTIAL CALCULATION ISSUES IDENTIFIED

### Issue 1: Gross Margin Growth Rate Unit Inconsistency
**Location**: `calculateGrossMarginGrowthRate()` line 154
**Problem**: Converts decimal to percentage for current but compares to percentage from database
```typescript
const currentMargin = (tier.annualGrossMargin || 0) * 100; // Convert 0.35 → 35
const previousYearMargin = this.getPreviousYearMargin(); // Already 35
```
**Impact**: Should work correctly, but ensure database stores margins consistently

### Issue 2: Adjusted Gross Margin Growth Returns Different Unit
**Location**: `calculateAdjustedGrossMarginGrowthRate()` line 364
**Problem**: Returns percentage point difference instead of growth rate
```typescript
return currentAdjustedGrossMargin - lastYearAdjustedGrossMargin; // -0.016 (not -5.5%)
```
**Impact**: UI expects growth rate multiplier, but gets percentage point difference

### Issue 3: Hard-coded Previous Year Adjusted Margin
**Location**: `getPreviousYearAdjustedGrossMargin()` line 93
**Problem**: Fixed return value instead of calculated
```typescript
return 0.302; // Hard-coded for this example
```
**Impact**: All adjusted margin calculations use fixed baseline

## ✅ CALCULATION VERIFICATION SUMMARY

### Correctly Implemented:
- ✅ Basic revenue/profit calculations (multiply/divide operations)
- ✅ Growth rates using standard formula: `(current ÷ previous) - 1`
- ✅ Deal summary aggregations and percentages
- ✅ Client value calculations (40% of revenue)
- ✅ Incentive cost tracking from DealTier

### Needs Review:
- ⚠️ Unit consistency across margin calculations
- ⚠️ Hard-coded vs calculated previous year values
- ⚠️ Different return types for similar growth calculations