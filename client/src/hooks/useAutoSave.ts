import { useEffect, useRef, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

interface AutoSaveConfig {
  data: any;
  save: (data: any) => Promise<void>;
  delay?: number;
  enabled?: boolean;
  storageKey: string;
}

export function useAutoSave({ data, save, delay = 3000, enabled = true, storageKey }: AutoSaveConfig) {
  const { toast } = useToast();
  const timeoutRef = useRef<NodeJS.Timeout>();
  const lastSavedData = useRef<string>('');
  const isSaving = useRef(false);

  // Load saved data from localStorage on mount
  const loadSavedData = useCallback(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      return saved ? JSON.parse(saved) : null;
    } catch (error) {
      console.error('Error loading auto-saved data:', error);
      return null;
    }
  }, [storageKey]);

  // Save data to localStorage
  const saveToStorage = useCallback((dataToSave: any) => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(dataToSave));
    } catch (error) {
      console.error('Error saving data to storage:', error);
    }
  }, [storageKey]);

  // Clear saved data from localStorage
  const clearSavedData = useCallback(() => {
    try {
      localStorage.removeItem(storageKey);
    } catch (error) {
      console.error('Error clearing saved data:', error);
    }
  }, [storageKey]);

  // Auto-save effect
  useEffect(() => {
    if (!enabled || !data) return;

    const currentDataString = JSON.stringify(data);
    
    // Skip if data hasn't changed
    if (currentDataString === lastSavedData.current) {
      return;
    }

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout for auto-save
    timeoutRef.current = setTimeout(async () => {
      if (isSaving.current) return;
      
      try {
        isSaving.current = true;
        
        // Save to localStorage first (immediate)
        saveToStorage(data);
        
        // Optional server save
        if (save) {
          await save(data);
        }
        
        lastSavedData.current = currentDataString;
        
        // Show subtle success indicator
        toast({
          title: "Draft Auto-saved",
          description: "Your progress has been saved",
          duration: 2000,
        });
      } catch (error) {
        console.error('Auto-save failed:', error);
        toast({
          title: "Auto-save Failed",
          description: "Your progress was saved locally",
          variant: "destructive",
          duration: 3000,
        });
      } finally {
        isSaving.current = false;
      }
    }, delay);

    // Cleanup timeout on unmount
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [data, save, delay, enabled, toast, saveToStorage]);

  // Save immediately before page unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (data && enabled) {
        saveToStorage(data);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [data, enabled, saveToStorage]);

  return {
    loadSavedData,
    clearSavedData,
    isSaving: isSaving.current
  };
}