import { Button } from "@/components/ui/button";
import { DealStatusBadge } from "@/components/deal-status/DealStatusBadge";
import { AlertTriangle, Clock } from "lucide-react";
import type { Deal, DealStatus } from "@shared/schema";
import { getSalesChannelDisplayName } from "@shared/constants";
import { useQuery } from '@tanstack/react-query';
import { DealCalculationService } from '@/services/dealCalculations';
import { TierDataAccess } from '@/utils/tier-data-access';


interface DealRowProps {
  deal: Deal;
  onClick: () => void;
  variant?: 'default' | 'action' | 'compact';
  actionButton?: {
    label: string;
    onClick: () => void;
  };
  showValue?: boolean;
  className?: string;
}

// Hook to get tier revenue for a single deal using enhanced fallback logic
function useDealTierRevenue(dealId: number) {
  return useQuery({
    queryKey: ['deal-tier-revenue-direct', dealId],
    queryFn: async () => {
      try {
        const response = await fetch(`/api/deals/${dealId}/tiers`);
        if (!response.ok) return 0;
        const data = await response.json();
        let tiers = data.tiers || [];
        
        // Enhanced fallback: If no tiers, create one from migratedFinancials or deal data
        if (tiers.length === 0) {
          const dealResponse = await fetch(`/api/deals/${dealId}`);
          if (dealResponse.ok) {
            const deal = await dealResponse.json();
            const revenue = deal.migratedFinancials?.annualRevenue || 
                           deal.migratedFinancials?.previousYearRevenue || 
                           deal.previousYearRevenue || 0;
            const margin = deal.migratedFinancials?.annualGrossMargin || 
                          deal.migratedFinancials?.previousYearMargin ||
                          deal.previousYearMargin || 0.25;
            
            if (revenue > 0) {
              tiers = [{
                tierNumber: 1,
                annualRevenue: revenue,
                annualGrossMargin: margin,
                incentives: []
              }];
            }
          }
        }
        
        return TierDataAccess.getExpectedRevenue(tiers);
      } catch {
        return 0;
      }
    }
  });
}

export function DealRow({ 
  deal, 
  onClick, 
  variant = 'default',
  actionButton,
  showValue = true,
  className = ""
}: DealRowProps) {
  // Get tier revenue for this deal
  const { data: tierRevenue = 0 } = useDealTierRevenue(deal.id);
  
  // Helper to format currency in shortened format
  const formatShortCurrency = (amount: number): string => {
    if (amount === 0) return "$0";
    if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `$${(amount / 1000).toFixed(1)}K`;
    return `$${amount.toLocaleString()}`;
  };

  // Get appropriate styling based on variant
  const getVariantStyles = () => {
    switch (variant) {
      case 'action':
        return "border-red-200 bg-red-50";
      case 'compact':
        return "border-slate-200 hover:bg-slate-50";
      default:
        return "border-slate-200 hover:bg-slate-50";
    }
  };

  // Get appropriate icon based on variant
  const getIcon = () => {
    switch (variant) {
      case 'action':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'compact':
        return <div className="w-2 h-2 bg-[#3e0075] rounded-full"></div>;
      default:
        return <div className="w-2 h-2 bg-[#3e0075] rounded-full"></div>;
    }
  };

  // Get appropriate icon container styles
  const getIconContainerStyles = () => {
    switch (variant) {
      case 'action':
        return "p-1 rounded-full bg-red-100";
      default:
        return "";
    }
  };

  // Get description text based on variant
  const getDescription = () => {
    if (variant === 'action') {
      return deal.revisionCount && deal.revisionCount >= 2 ? `Multiple revisions (${deal.revisionCount})` :
             deal.flowIntelligence === 'needs_attention' ? 'Needs attention' :
             'Follow up required';
    }
    return getSalesChannelDisplayName(deal.salesChannel);
  };

  return (
    <div 
      className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-colors ${getVariantStyles()} ${className}`}
      onClick={onClick}
    >
      <div className="flex items-center gap-3">
        <div className={getIconContainerStyles()}>
          {getIcon()}
        </div>
        <div>
          <p className="font-medium text-slate-900">{deal.dealName}</p>
          <p className="text-sm text-slate-500">
            {deal.advertiserName || deal.agencyName} • {getDescription()}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        {showValue && (
          <>
            <DealStatusBadge status={deal.status as DealStatus} />
            <div className="text-sm font-medium text-slate-700">
              {formatShortCurrency(tierRevenue)}
            </div>
          </>
        )}

        {actionButton && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={(e) => {
              e.stopPropagation();
              actionButton.onClick();
            }}
          >
            {actionButton.label}
          </Button>
        )}
      </div>
    </div>
  );
}