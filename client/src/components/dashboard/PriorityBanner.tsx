import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { 
  ChevronDown, 
  ChevronUp, 
  AlertTriangle, 
  Clock, 
  ArrowUpRight, 
  MessageSquare, 
  FileCheck,
  AlertCircle
} from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import { type PriorityItem } from "@shared/services/priorityService";
import { type UserRole } from "@shared/schema";

interface PriorityBannerProps {
  priorityItems: PriorityItem[];
  priorityStats: {
    total: number;
    high: number;
    medium: number;
    low: number;
    hasUrgentItems: boolean;
  };
  userRole: UserRole;
  onAction: (dealId: number, actionType: PriorityItem['actionType']) => void;
  isLoading?: boolean;
}

// Get icon for action type
const getActionIcon = (actionType: PriorityItem['actionType']) => {
  switch (actionType) {
    case 'convert':
      return ArrowUpRight;
    case 'nudge':
      return MessageSquare;
    case 'approve':
    case 'legal_review':
      return FileCheck;
    case 'contract':
      return ArrowUpRight;
    default:
      return FileCheck;
  }
};

// Get urgency styling
const getUrgencyStyle = (urgencyLevel: PriorityItem['urgencyLevel']) => {
  switch (urgencyLevel) {
    case 'high':
      return {
        badgeVariant: 'destructive' as const,
        cardBorder: 'border-red-200 bg-red-50',
        icon: AlertTriangle,
        iconColor: 'text-red-600'
      };
    case 'medium':
      return {
        badgeVariant: 'secondary' as const,
        cardBorder: 'border-amber-200 bg-amber-50',
        icon: AlertCircle,
        iconColor: 'text-amber-600'
      };
    case 'low':
      return {
        badgeVariant: 'outline' as const,
        cardBorder: 'border-blue-200 bg-blue-50',
        icon: Clock,
        iconColor: 'text-blue-600'
      };
  }
};

export function PriorityBanner({ 
  priorityItems, 
  priorityStats, 
  userRole, 
  onAction, 
  isLoading = false 
}: PriorityBannerProps) {
  const [isExpanded, setIsExpanded] = useState(priorityStats.hasUrgentItems);

  // Don't show banner if no priority items
  if (!isLoading && priorityStats.total === 0) {
    return null;
  }

  // Loading state
  if (isLoading) {
    return (
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="h-4 w-4 bg-slate-200 rounded animate-pulse" />
            <div className="h-4 w-32 bg-slate-200 rounded animate-pulse" />
            <div className="ml-auto h-6 w-16 bg-slate-200 rounded animate-pulse" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const displayItems = isExpanded ? priorityItems : priorityItems.slice(0, 3);

  return (
    <Card className={cn(
      "mb-6 border-l-4",
      priorityStats.hasUrgentItems ? "border-l-red-500" : "border-l-amber-500"
    )}>
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CollapsibleTrigger asChild>
          <CardContent className="p-4 cursor-pointer hover:bg-slate-50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {priorityStats.hasUrgentItems ? (
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                ) : (
                  <Clock className="h-5 w-5 text-amber-600" />
                )}
                <div>
                  <h3 className="font-semibold text-slate-900">
                    {priorityStats.total} {priorityStats.total === 1 ? 'Item' : 'Items'} Need Your Attention
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    {priorityStats.high > 0 && (
                      <Badge variant="destructive" className="text-xs">
                        {priorityStats.high} High
                      </Badge>
                    )}
                    {priorityStats.medium > 0 && (
                      <Badge variant="secondary" className="text-xs">
                        {priorityStats.medium} Medium
                      </Badge>
                    )}
                    {priorityStats.low > 0 && (
                      <Badge variant="outline" className="text-xs">
                        {priorityStats.low} Low
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-500">
                  {isExpanded ? 'Collapse' : 'Expand'}
                </span>
                {isExpanded ? (
                  <ChevronUp className="h-4 w-4 text-slate-500" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-slate-500" />
                )}
              </div>
            </div>
          </CardContent>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <div className="px-4 pb-4 space-y-3">
            {displayItems.map((item) => {
              const urgencyStyle = getUrgencyStyle(item.urgencyLevel);
              const ActionIcon = getActionIcon(item.actionType);
              const UrgencyIcon = urgencyStyle.icon;
              
              return (
                <div
                  key={item.dealId}
                  className={cn(
                    "flex items-center justify-between p-3 rounded-lg border",
                    urgencyStyle.cardBorder
                  )}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <UrgencyIcon className={cn("h-4 w-4 flex-shrink-0", urgencyStyle.iconColor)} />
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-slate-900 truncate">
                          {item.dealName}
                        </h4>
                        <Badge variant={urgencyStyle.badgeVariant} className="text-xs flex-shrink-0">
                          {item.urgencyLevel}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-sm text-slate-600">
                        <span className="truncate">{item.clientName}</span>
                        <span className="flex-shrink-0">{formatCurrency(item.dealValue)}</span>
                        <span className="flex-shrink-0">
                          {item.daysInStatus} {item.daysInStatus === 1 ? 'day' : 'days'} in status
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <Button
                    size="sm"
                    variant={item.urgencyLevel === 'high' ? 'default' : 'outline'}
                    onClick={(e) => {
                      e.stopPropagation();
                      onAction(item.dealId, item.actionType);
                    }}
                    className="flex-shrink-0 ml-3 gap-1"
                  >
                    <ActionIcon className="h-3 w-3" />
                    {item.actionLabel}
                  </Button>
                </div>
              );
            })}
            
            {!isExpanded && priorityItems.length > 3 && (
              <div className="text-center pt-2">
                <span className="text-sm text-slate-500">
                  +{priorityItems.length - 3} more items
                </span>
              </div>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}