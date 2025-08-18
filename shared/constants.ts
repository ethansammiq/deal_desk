// Shared constants for display names and mappings

export const SALES_CHANNEL_DISPLAY_NAMES: Record<string, string> = {
  'client_direct': 'Client Direct',
  'independent_agency': 'Independent Agency', 
  'holding_company': 'Holding Company',
  'direct': 'Direct',
  'agency': 'Agency'
};

export const REGION_DISPLAY_NAMES: Record<string, string> = {
  'northeast': 'Northeast',
  'midwest': 'Midwest', 
  'midatlantic': 'Mid-Atlantic',
  'west': 'West',
  'south': 'South',
  'us': 'US',
  'national': 'National'
};

export const DEAL_TYPE_DISPLAY_NAMES: Record<string, string> = {
  'grow': 'Growth',
  'protect': 'Protection',
  'custom': 'Custom'
};

// Helper function to get display name with fallback
export function getSalesChannelDisplayName(salesChannel: string | null | undefined): string {
  if (!salesChannel) return 'Direct';
  return SALES_CHANNEL_DISPLAY_NAMES[salesChannel] || salesChannel;
}

export function getRegionDisplayName(region: string | null | undefined): string {
  if (!region) return 'US';
  return REGION_DISPLAY_NAMES[region] || region;
}

export function getDealTypeDisplayName(dealType: string | null | undefined): string {
  if (!dealType) return 'Custom';
  return DEAL_TYPE_DISPLAY_NAMES[dealType] || dealType;
}