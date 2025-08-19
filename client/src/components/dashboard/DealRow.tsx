import { Button } from "@/components/ui/button";
import { DealStatusBadge } from "@/components/deal-status/DealStatusBadge";
import { AlertTriangle, Clock } from "lucide-react";
import type { Deal, DealStatus } from "@shared/schema";
import { getSalesChannelDisplayName } from "@shared/constants";


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

export function DealRow({ 
  deal, 
  onClick, 
  variant = 'default',
  actionButton,
  showValue = true,
  className = ""
}: DealRowProps) {
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
              {formatShortCurrency((deal as any).annualRevenue || 0)}
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