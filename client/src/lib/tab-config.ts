/**
 * Standardized tab configuration for multi-step forms
 * Provides consistent tab IDs and labels across SubmitDeal and RequestSupport
 */

export interface TabConfig {
  id: string;
  label: string;
  stepNumber: number; // For validation mapping
}

export const SUBMIT_DEAL_TABS: TabConfig[] = [
  { id: 'deal-overview', label: 'Deal Overview', stepNumber: 1 },
  { id: 'business-context', label: 'Business Context', stepNumber: 2 },
  { id: 'financial-structure', label: 'Financial Structure', stepNumber: 3 },
  { id: 'review-submit', label: 'Review & Submit', stepNumber: 4 }
];

export const REQUEST_SUPPORT_TABS: TabConfig[] = [
  { id: 'deal-overview', label: 'Deal Overview', stepNumber: 1 },
  { id: 'business-context', label: 'Business Context', stepNumber: 2 }
];

/**
 * Create a mapping from tab ID to step number for validation
 */
export function createTabToStepMap(tabs: TabConfig[]): Record<string, number> {
  return tabs.reduce((map, tab) => {
    map[tab.id] = tab.stepNumber;
    return map;
  }, {} as Record<string, number>);
}

/**
 * Get the next tab ID in sequence
 */
export function getNextTabId(currentTabId: string, tabs: TabConfig[]): string | null {
  const currentIndex = tabs.findIndex(tab => tab.id === currentTabId);
  const nextTab = tabs[currentIndex + 1];
  return nextTab ? nextTab.id : null;
}

/**
 * Get the previous tab ID in sequence
 */
export function getPreviousTabId(currentTabId: string, tabs: TabConfig[]): string | null {
  const currentIndex = tabs.findIndex(tab => tab.id === currentTabId);
  const previousTab = tabs[currentIndex - 1];
  return previousTab ? previousTab.id : null;
}

/**
 * Get tab label by ID
 */
export function getTabLabel(tabId: string, tabs: TabConfig[]): string {
  const tab = tabs.find(t => t.id === tabId);
  return tab ? tab.label : 'Unknown Step';
}