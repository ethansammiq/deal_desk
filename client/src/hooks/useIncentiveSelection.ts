import { useState, useCallback } from 'react';
import { INCENTIVE_CONSTANTS } from '@/config/businessConstants';

// ❌ ELIMINATED: SelectedIncentive interface - using DealTier as single source of truth
// ❌ ELIMINATED: TierIncentive interface - use DealTier directly

import { DealTier } from '@/hooks/useDealTiers';

export interface UseIncentiveSelectionOptions {
  initialDealTiers?: DealTier[];
}

export function useIncentiveSelection(options: UseIncentiveSelectionOptions = {}) {
  const { 
    initialDealTiers = []
  } = options;

  // ✅ Phase 5: Using DealTier as single source of truth - SelectedIncentive eliminated
  const [showAddIncentiveForm, setShowAddIncentiveForm] = useState<boolean>(false);

  // ✅ Phase 5: DealTier operations now handled by useTierManagement hook
  // These functions are no longer needed as incentive data is managed directly in DealTier

  // Toggle add incentive form
  const toggleAddIncentiveForm = useCallback(() => {
    setShowAddIncentiveForm(prev => !prev);
  }, []);

  return {
    // ✅ Phase 5: Simplified to UI state only - data management moved to DealTier
    showAddIncentiveForm,
    setShowAddIncentiveForm,
    toggleAddIncentiveForm,
  };
}