# Section Header & Banner Component Analysis

## Current Component Availability ✅

### 1. FormSectionHeader Component ✅ EXISTS
**Location**: `client/src/components/ui/form-style-guide.tsx`
**Current Usage**: BusinessContextSection, DealDetailsSection, ReviewSubmitSection

### 2. Alert Component ✅ EXISTS  
**Location**: `client/src/components/ui/alert.tsx`
**Features**: Multiple variants (default, destructive, warning), AlertTitle, AlertDescription

### 3. FinancialSection Component ✅ EXISTS
**Location**: `client/src/components/ui/financial-table.tsx`
**Current Usage**: FinancialTierTable, CostValueAnalysisSection, FinancialSummarySection

## How Each Section Handles Headers & Banners

### ✅ Revenue & Profitability (FinancialTierTable)
```tsx
// Header: Uses FinancialSection
<FinancialSection title="Revenue & Profitability">
  
  // Banner: Custom info banner
  <div className="p-3 bg-blue-50 border border-blue-100 rounded text-sm text-blue-800 mb-4">
    <Info className="h-4 w-4 inline mr-2" />
    {isFlat 
      ? "This section shows revenue targets..."
      : "This section details revenue targets, gross margin percentages..."
    }
  </div>
  
  // Content...
</FinancialSection>
```

**Characteristics**:
- **Header**: Simple title via FinancialSection
- **Banner**: Custom blue info banner with conditional messaging
- **Styling**: Purple title, blue info banner

### ✅ Cost & Value Analysis (CostValueAnalysisSection)  
```tsx
// Header: Uses FinancialSection only
<FinancialSection title="Cost & Value Analysis">
  // No info banner - direct to content
  <FinancialTable>
    // Content...
  </FinancialTable>
</FinancialSection>
```

**Characteristics**:
- **Header**: Simple title via FinancialSection  
- **Banner**: None
- **Styling**: Purple title, no banner

### ✅ Financial Summary (FinancialSummarySection)
```tsx
// Header: Uses FinancialSection only
<FinancialSection title="Financial Summary">
  // No info banner - direct to content
  <FinancialTable>
    // Content...
  </FinancialTable>
</FinancialSection>
```

**Characteristics**:
- **Header**: Simple title via FinancialSection
- **Banner**: None  
- **Styling**: Purple title, no banner

### ⚠️ Incentive Structure (Current Custom)
```tsx
// Header: Custom gradient header with button
<div className="flex items-center justify-between mb-6">
  <div className="flex items-center">
    <h3 className="text-lg font-medium text-slate-900 bg-gradient-to-r from-purple-700 to-indigo-500 bg-clip-text text-transparent">
      Incentive Structure
    </h3>
    <ChevronDown className="ml-2 h-5 w-5 text-slate-500" />
  </div>
  <Button>Add Incentive</Button>
</div>

// Banner: Custom blue info banner
<div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg mb-6">
  <Info className="h-5 w-5 text-blue-500" />
  <div className="text-sm text-blue-700">
    <p className="font-medium mb-1">Incentive Configuration</p>
    <p>Incentives are additional benefits...</p>
  </div>
</div>
```

**Characteristics**:
- **Header**: Custom gradient styling with chevron and action button
- **Banner**: Custom blue info banner with title and description
- **Styling**: Gradient purple/indigo title, blue info banner

### ✅ Other Form Sections (BusinessContext, DealDetails, etc.)
```tsx
// Header: Uses FormSectionHeader
<FormSectionHeader
  title="Growth Opportunity"
  description="Provide detailed information about the growth opportunity..."
/>

// Banner: None or custom as needed
```

**Characteristics**:
- **Header**: StandardFormSectionHeader with title and description
- **Banner**: Varies by section
- **Styling**: Standard form styling

## Migration Options for Incentive Structure

### Option 1: Full FinancialSection Migration (RECOMMENDED)

#### Pros:
- **100% consistency** with other financial sections
- **Minimal changes** required
- **Maintains purple theme** (h4 text-purple-600)
- **Clean, professional appearance**

#### Implementation:
```tsx
// Replace custom header with FinancialSection
<FinancialSection title="Incentive Structure">
  
  // Replace custom banner with Alert component
  <Alert>
    <Info className="h-4 w-4" />
    <AlertTitle>Incentive Configuration</AlertTitle>
    <AlertDescription>
      Incentives are additional benefits provided to the client based on performance.
      Select appropriate incentive types and amounts for each tier of the deal.
    </AlertDescription>
  </Alert>
  
  // Move Add Incentive button to dedicated row
  <div className="flex justify-end mb-4">
    <Button onClick={() => setShowAddIncentiveForm(true)}>
      <Plus className="h-4 w-4 mr-1" />
      Add Incentive
    </Button>
  </div>
  
  // Rest of content...
</FinancialSection>
```

#### Cons:
- **Loses gradient styling** (purple/indigo gradient → solid purple)
- **Loses chevron** (no collapse indicator)
- **Button placement changes** (top-right → separate row)

### Option 2: FormSectionHeader Migration

#### Pros:
- **Consistent with other form sections**
- **Built-in description support**
- **Help popover system available**

#### Implementation:
```tsx
<Card>
  <CardContent className="p-6">
    <FormSectionHeader
      title="Incentive Structure"
      description="Configure incentives for each tier based on performance metrics"
    />
    
    <div className="flex justify-end mb-4">
      <Button>Add Incentive</Button>
    </div>
    
    <Alert>
      <Info className="h-4 w-4" />
      <AlertDescription>
        Select appropriate incentive types and amounts for each tier of the deal.
      </AlertDescription>
    </Alert>
    
    // Content...
  </CardContent>
</Card>
```

#### Cons:
- **Different visual hierarchy** than financial sections
- **More complex structure** (Card + CardContent + FormSectionHeader)
- **Inconsistent with financial sections styling**

### Option 3: Hybrid Approach (Custom Header + Alert)

#### Implementation:
```tsx
// Keep custom header but use Alert for banner
<div className="flex items-center justify-between mb-6">
  <h3 className="text-lg font-medium text-slate-900 bg-gradient-to-r from-purple-700 to-indigo-500 bg-clip-text text-transparent">
    Incentive Structure
  </h3>
  <Button>Add Incentive</Button>
</div>

<Alert>
  <Info className="h-4 w-4" />
  <AlertTitle>Incentive Configuration</AlertTitle>
  <AlertDescription>
    Incentives are additional benefits provided to the client based on performance.
  </AlertDescription>
</Alert>
```

#### Pros:
- **Maintains custom styling** for header
- **Uses shared Alert** component for banner
- **Minimal changes** required

#### Cons:
- **Still has custom header code**
- **Inconsistent with other sections**

## Current Usage Patterns Summary

| Section | Header Component | Banner Component | Action Button Location |
|---------|------------------|------------------|------------------------|
| Revenue & Profitability | FinancialSection | Custom blue banner | Top-right inline |
| Cost & Value Analysis | FinancialSection | None | None |
| Financial Summary | FinancialSection | None | None |
| **Incentive Structure** | **Custom gradient** | **Custom blue banner** | **Top-right inline** |
| Business Context | FormSectionHeader | None | Various |
| Deal Details | FormSectionHeader | None | Various |

## Recommendation: Option 1 (FinancialSection Migration)

### Rationale:
1. **Architectural Consistency**: All financial sections use FinancialSection
2. **Minimal Learning Curve**: Same pattern as Revenue & Profitability  
3. **Visual Consistency**: Purple theme maintained across financial sections
4. **Implementation Simplicity**: Straightforward migration path
5. **Future Maintainability**: Single styling pattern for all financial components

### Impact Assessment:
- **Code Reduction**: ~30 lines of custom header/banner code eliminated
- **Consistency Gain**: 100% alignment with financial section styling
- **Visual Change**: Minimal (purple theme maintained, layout similar)
- **Functionality**: 100% preserved with improved accessibility via Alert component

The migration would achieve the goal of maximum shared component usage while maintaining the professional appearance and functionality of the Incentive Structure section.