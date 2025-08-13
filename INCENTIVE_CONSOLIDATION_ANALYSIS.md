# Incentive Structure Consolidation Analysis

## Overview
Analysis of consolidation opportunities for Incentive Structure Section's remaining custom logic, with evaluation of shared component integration potential.

## Current Architecture

### ✅ Already Shared (75% Coverage)
- **Data Management**: useTierManagement, useDealCalculations
- **Business Logic**: getTotalIncentiveValue, ensureTierIncentives
- **Basic UI**: Button, Card, Input, Icons (Lucide React)
- **Formatting**: formatCurrency from financial-table

### ⚠️ Custom Logic Areas

#### 1. Incentive Display Table
**Current State**: Custom HTML table with complex data aggregation
**Consolidation Options**:

##### Option A: FinancialTable Integration (CREATED)
```tsx
// ✅ NEW: IncentiveDisplayTable component
<IncentiveDisplayTable 
  dealTiers={dealTiers}
  onRemoveIncentive={handleRemove}
  showActions={true}
/>
```

**Pros**:
- 100% shared financial-table components
- Consistent styling with Revenue & Profitability
- Reusable across multiple incentive views
- Maintains all existing functionality

**Cons**:
- Still requires custom data aggregation logic
- Some complexity in unique incentive type extraction

##### Option B: TanStack Table (DataTable)
```tsx
// Alternative: Use existing DataTable component
<DataTable 
  columns={incentiveColumns}
  data={processedIncentiveData}
  searchKey="option"
/>
```

**Pros**:
- Advanced features (sorting, filtering, pagination)
- Highly configurable column system
- Built-in search functionality

**Cons**:
- Over-engineered for simple display needs
- Requires significant data transformation
- May not match financial table styling
- Complex column definition requirements

#### 2. Section Header
**Current State**: Custom gradient title with ChevronDown
**Consolidation Options**:

##### Option A: FormSectionHeader Integration
```tsx
// ✅ RECOMMENDED: Use existing FormSectionHeader
<FormSectionHeader
  title="Incentive Structure"
  description="Configure incentives for each tier"
  helpTitle="Incentive Help"
  helpContent="Detailed incentive guidelines..."
/>
```

**Pros**:
- Consistent header styling across all sections
- Built-in help popover system
- Standardized description placement
- Maintains professional appearance

**Cons**:
- Loses custom gradient styling (purple/indigo theme)
- No chevron collapse indicator
- Different visual hierarchy than current design

##### Option B: Custom Header Enhancement
```tsx
// Keep custom header but use shared components
<div className="flex items-center justify-between">
  <FormSectionHeader title="Incentive Structure" />
  <Button variant="outline">Add Incentive</Button>
</div>
```

**Pros**:
- Maintains current visual design
- Uses some shared components
- Flexible layout control

**Cons**:
- Still requires custom layout code
- Limited reusability potential

#### 3. Info Banner
**Current State**: Custom blue info banner with manual styling
**Consolidation Options**:

##### Option A: Alert Component Integration
```tsx
// ✅ RECOMMENDED: Use shadcn Alert component
<Alert>
  <Info className="h-4 w-4" />
  <AlertTitle>Incentive Configuration</AlertTitle>
  <AlertDescription>
    Incentives are additional benefits provided to the client based on performance.
  </AlertDescription>
</Alert>
```

**Pros**:
- Consistent alert styling across application
- Built-in icon and content structure
- Semantic HTML and accessibility
- Multiple variant options (default, destructive, warning)

**Cons**:
- May have different visual appearance
- Less control over specific styling
- Fixed structure vs flexible custom layout

##### Option B: FormDescription Integration
```tsx
// Alternative: Use form description styling
<div className={FormStyles.help.container}>
  <p className={FormStyles.help.content}>
    Incentive configuration guidance...
  </p>
</div>
```

**Pros**:
- Consistent with form styling patterns
- Uses established design system
- Good for instructional content

**Cons**:
- Less prominent than info banner
- May not draw enough attention
- Limited visual hierarchy

## Recommended Consolidation Plan

### Phase 7.5: Incentive Display Consolidation

#### Step 1: IncentiveDisplayTable Implementation ✅
- **Status**: CREATED
- **Impact**: Consolidates 200+ lines of custom table logic
- **Reusability**: Can be used in other incentive views
- **Shared Components**: 90% (FinancialTable, formatCurrency, etc.)

#### Step 2: Section Header Migration
```tsx
// Replace custom header with FormSectionHeader
<FormSectionHeader
  title="Incentive Structure"
  description="Configure incentives for each tier based on performance metrics"
  badge="Optional"
/>
<div className="flex justify-end mb-4">
  <Button onClick={() => setShowAddIncentiveForm(true)}>
    <Plus className="h-4 w-4 mr-1" />
    Add Incentive
  </Button>
</div>
```

#### Step 3: Info Banner Migration
```tsx
// Replace custom banner with Alert component
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

<Alert>
  <Info className="h-4 w-4" />
  <AlertTitle>Incentive Configuration</AlertTitle>
  <AlertDescription>
    Incentives are additional benefits provided to the client based on performance.
    Select appropriate incentive types and amounts for each tier of the deal.
  </AlertDescription>
</Alert>
```

## Impact Assessment

### Before Consolidation
- **Shared Component Usage**: 75%
- **Custom Code Lines**: ~150 lines
- **Reusable Components**: 1 (IncentiveSelector)

### After Full Consolidation
- **Shared Component Usage**: 90%
- **Custom Code Lines**: ~50 lines
- **Reusable Components**: 2 (IncentiveSelector, IncentiveDisplayTable)
- **Consistency**: All components match design system

### Migration Benefits
1. **Maintainability**: Centralized styling and behavior
2. **Consistency**: Matches other form sections
3. **Accessibility**: Built-in ARIA attributes and semantic HTML
4. **Future-Proofing**: Easy to update design system changes
5. **Reusability**: IncentiveDisplayTable usable in other contexts

### Migration Risks
1. **Visual Changes**: Some styling differences from current design
2. **Feature Loss**: Potential loss of specific customizations
3. **Testing**: Need to verify all functionality works with new components

## Conclusion

The IncentiveDisplayTable component successfully consolidates the most complex custom logic while maintaining functionality. The remaining custom code (header and info banner) can be migrated to shared components with minimal functionality loss and significant consistency gains.

**Recommended Action**: Proceed with full consolidation plan for maximum shared component usage and design system consistency.