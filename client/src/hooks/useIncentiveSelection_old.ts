import { useState, useCallback } from 'react';
import { INCENTIVE_CONSTANTS } from '@/config/businessConstants';

// ✅ ALIGNED: SelectedIncentive now matches incentive-data.tsx structure
export interface SelectedIncentive {
  categoryId: string;        // Maps to incentiveCategory in DealTier
  subCategoryId: string;     // Maps to incentiveSubCategory in DealTier  
  option: string;            // Maps to specificIncentive in DealTier
  tierValues: { [tierId: number]: number }; // Maps to incentiveValue in DealTier
  notes: string;             // Maps to incentiveNotes in DealTier
  tierIds: number[];         // Array of tier IDs this incentive applies to
}

// ❌ ELIMINATED: TierIncentive interface - use DealTier directly

export interface UseIncentiveSelectionOptions {
  initialSelectedIncentives?: SelectedIncentive[];
  // initialTierIncentives?: TierIncentive[]; // REMOVED
}

export function useIncentiveSelection(options: UseIncentiveSelectionOptions = {}) {
  const { 
    initialSelectedIncentives = []
  } = options;

  // ✅ Phase 2.2: Migrated from manual state management  
  const [selectedIncentives, setSelectedIncentives] = useState<SelectedIncentive[]>(initialSelectedIncentives);
  // const [tierIncentives, setTierIncentives] = useState<TierIncentive[]>(initialTierIncentives); // ELIMINATED
  const [showAddIncentiveForm, setShowAddIncentiveForm] = useState<boolean>(false);

  // Add selected incentive
  const addSelectedIncentive = useCallback((incentive: SelectedIncentive) => {
    setSelectedIncentives(prev => [...prev, incentive]);
  }, []);

  // Remove selected incentive
  const removeSelectedIncentive = useCallback((index: number) => {
    setSelectedIncentives(prev => prev.filter((_, i) => i !== index));
  }, []);

  // Update selected incentive
  const updateSelectedIncentive = useCallback((index: number, updates: Partial<SelectedIncentive>) => {
    setSelectedIncentives(prev => 
      prev.map((incentive, i) => 
        i === index ? { ...incentive, ...updates } : incentive
      )
    );
  }, []);

  // ❌ ELIMINATED: TierIncentive management functions - use DealTier directly

  // Clear all incentives
  const clearAllIncentives = useCallback(() => {
    setSelectedIncentives([]);
    setTierIncentives([]);
    setShowAddIncentiveForm(false);
  }, []);

  // Get incentives by tier
  const getIncentivesByTier = useCallback((tierNumber: number) => {
    return tierIncentives.filter(incentive => incentive.tierNumber === tierNumber);
  }, [tierIncentives]);

  // Calculate total incentive value
  const calculateTotalIncentiveValue = useCallback(() => {
    return tierIncentives.reduce((total, incentive) => total + incentive.incentiveValue, 0);
  }, [tierIncentives]);

  // Toggle add incentive form
  const toggleAddIncentiveForm = useCallback(() => {
    setShowAddIncentiveForm(prev => !prev);
  }, []);

  return {
    // State
    selectedIncentives,
    tierIncentives,
    showAddIncentiveForm,
    
    // Actions
    addSelectedIncentive,
    removeSelectedIncentive,
    updateSelectedIncentive,
    addTierIncentive,
    removeTierIncentive,
    updateTierIncentive,
    clearAllIncentives,
    toggleAddIncentiveForm,
    
    // Derived state
    getIncentivesByTier,
    calculateTotalIncentiveValue,
    totalIncentiveCount: selectedIncentives.length + tierIncentives.length,
    hasIncentives: selectedIncentives.length > 0 || tierIncentives.length > 0,
  };
}