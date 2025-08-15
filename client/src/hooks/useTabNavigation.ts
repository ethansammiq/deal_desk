import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export interface TabConfig {
  id: string;
  label: string;
  stepNumber: number;
}

/**
 * Shared hook for tab navigation logic
 * Eliminates duplicate navigation functions across forms
 */
export function useTabNavigation(
  tabs: TabConfig[],
  initialTab?: string,
  validationFn?: (targetStep: number) => boolean
) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState(initialTab || tabs[0]?.id || "");

  const goToNextTab = () => {
    const currentIndex = tabs.findIndex(tab => tab.id === activeTab);
    const nextTab = tabs[currentIndex + 1];
    
    if (nextTab) {
      if (validationFn) {
        const canAdvance = validationFn(nextTab.stepNumber);
        if (!canAdvance) {
          toast({
            title: "Complete Current Step",
            description: "Please fill out the required fields before proceeding.",
            variant: "destructive",
          });
          return;
        }
      }
      setActiveTab(nextTab.id);
    }
  };

  const goToPrevTab = () => {
    const currentIndex = tabs.findIndex(tab => tab.id === activeTab);
    const prevTab = tabs[currentIndex - 1];
    
    if (prevTab) {
      setActiveTab(prevTab.id);
    }
  };

  const goToTab = (tabId: string) => {
    const targetTab = tabs.find(tab => tab.id === tabId);
    
    if (targetTab) {
      if (validationFn) {
        const canAdvance = validationFn(targetTab.stepNumber);
        if (!canAdvance) {
          toast({
            title: "Complete Current Step",
            description: "Please fill out the required fields before proceeding.",
            variant: "destructive",
          });
          return;
        }
      }
      setActiveTab(tabId);
    }
  };

  const getCurrentTabIndex = () => {
    return tabs.findIndex(tab => tab.id === activeTab);
  };

  const isFirstTab = () => {
    return getCurrentTabIndex() === 0;
  };

  const isLastTab = () => {
    return getCurrentTabIndex() === tabs.length - 1;
  };

  const getNextTabLabel = () => {
    const currentIndex = getCurrentTabIndex();
    const nextTab = tabs[currentIndex + 1];
    return nextTab ? `Next: ${nextTab.label}` : "Next";
  };

  const getPreviousTabLabel = () => {
    const currentIndex = getCurrentTabIndex();
    const prevTab = tabs[currentIndex - 1];
    return prevTab ? `Previous: ${prevTab.label}` : "Previous";
  };

  return {
    activeTab,
    setActiveTab,
    goToNextTab,
    goToPrevTab,
    goToTab,
    getCurrentTabIndex,
    isFirstTab,
    isLastTab,
    getNextTabLabel,
    getPreviousTabLabel,
    // Helper getters
    currentTab: tabs.find(tab => tab.id === activeTab),
    totalTabs: tabs.length,
  };
}