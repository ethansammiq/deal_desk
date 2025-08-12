# Incentive Architecture Consolidation Proposal

## Current State Issues

### Three Overlapping Data Structures:
1. **SelectedIncentive** (UI abstraction layer)
2. **TierIncentive** (Calculation intermediary)  
3. **DealTier** (Database schema - actual source of truth)

### Problems:
- $50k/$75k values stored in `dealTiers` but mapped incorrectly in UI
- Complex cross-referencing between structures
- Data synchronization overhead
- Developer confusion about source of truth

## Proposed Solution

### **Option A: Eliminate Redundancy (Recommended)**

**Keep Only**: `DealTier` interface from `shared/schema.ts`

**Eliminate**: 
- `SelectedIncentive` (replace with direct DealTier manipulation)
- `TierIncentive` (replace with direct DealTier calculations)

**Benefits**:
- Single source of truth
- Direct database alignment
- Simplified data flow
- Eliminated mapping errors

### **Implementation Plan**

#### Phase 5.1: Component Migration
```typescript
// BEFORE (Complex)
const selectedIncentives: SelectedIncentive[]
const tierIncentives: TierIncentive[]
const dealTiers: DealTier[]

// AFTER (Simple)
const dealTiers: DealTier[] // Single source of truth
```

#### Phase 5.2: UI Component Updates
- **IncentiveStructureSection**: Read/write directly to dealTiers
- **FinancialTierTable**: Already uses dealTiers ✅
- **Cost & Value Analysis**: Already uses dealTiers ✅

#### Phase 5.3: Hook Simplification
- **useDealTiers**: Already primary interface ✅
- **useIncentiveSelection**: Eliminate or refactor to DealTier CRUD
- **useDealCalculations**: Already uses dealTiers ✅

### **Migration Steps**

1. **Audit Current Usage**: Map all SelectedIncentive/TierIncentive references
2. **Create Migration Plan**: Component-by-component conversion strategy
3. **Implement Gradually**: One component at a time to maintain stability
4. **Remove Dead Code**: Clean up unused interfaces and utilities

### **Alternative: Option B - Clear Separation**

If we keep current structure:
- **SelectedIncentive**: Ephemeral UI state only (form selection)
- **DealTier**: Persistent storage (database)
- **TierIncentive**: Eliminate entirely

But Option A is recommended for architectural simplicity.

## Next Steps

1. User approval for Phase 5 consolidation
2. Begin component audit and migration planning
3. Implement incremental changes with testing
4. Update documentation and type definitions

## Impact Assessment

**Risk**: Low - existing data flow already primarily uses DealTier
**Effort**: Medium - requires careful component migration  
**Benefit**: High - eliminates architectural debt and future confusion