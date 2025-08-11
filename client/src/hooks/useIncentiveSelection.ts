import { useState, useCallback } from 'react';
import { INCENTIVE_CONSTANTS } from '@/config/businessConstants';

export interface SelectedIncentive {
  id?: string;
  option: string;
  tierIds: number[];
  notes?: string;
  category?: string;
  subCategory?: string;
}

export interface TierIncentive {
  id?: string;
  tierNumber: number;
  incentiveType: string;
  incentiveValue: number;
  incentiveNotes?: string;
}

export interface UseIncentiveSelectionOptions {
  initialSelectedIncentives?: SelectedIncentive[];
  initialTierIncentives?: TierIncentive[];
}

export function useIncentiveSelection(options: UseIncentiveSelectionOptions = {}) {
  const { 
    initialSelectedIncentives = [], 
    initialTierIncentives = [] 
  } = options;

  // ✅ Phase 2.2: Migrated from manual state management
  const [selectedIncentives, setSelectedIncentives] = useState<SelectedIncentive[]>(initialSelectedIncentives);
  const [tierIncentives, setTierIncentives] = useState<TierIncentive[]>(initialTierIncentives);
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

  // Add tier incentive
  const addTierIncentive = useCallback((tierIncentive: TierIncentive) => {
    setTierIncentives(prev => [...prev, tierIncentive]);
  }, []);

  // Remove tier incentive
  const removeTierIncentive = useCallback((index: number) => {
    setTierIncentives(prev => prev.filter((_, i) => i !== index));
  }, []);

  // Update tier incentive
  const updateTierIncentive = useCallback((index: number, updates: Partial<TierIncentive>) => {
    setTierIncentives(prev =>
      prev.map((incentive, i) =>
        i === index ? { ...incentive, ...updates } : incentive
      )
    );
  }, []);

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