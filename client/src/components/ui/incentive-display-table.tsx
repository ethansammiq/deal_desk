import React from "react";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { DealTier, TierIncentive } from "@/hooks/useDealTiers";
import { 
  FinancialTable,
  FinancialTableHeader,
  FinancialHeaderCell,
  FinancialTableBody,
  FinancialDataCell,
  FinancialTableColGroup,
  formatCurrency
} from "@/components/ui/financial-table";

export interface IncentiveDisplayTableProps {
  dealTiers: DealTier[];
  onRemoveIncentive: (incentiveType: IncentiveType) => void;
  showActions?: boolean;
}

export interface IncentiveType {
  category: string;
  subCategory: string;
  option: string;
}

/**
 * Shared component for displaying incentive data across tiers
 * Used in IncentiveStructureSection and other incentive views
 * Consolidates complex incentive aggregation and display logic
 */
export function IncentiveDisplayTable({ 
  dealTiers, 
  onRemoveIncentive,
  showActions = true 
}: IncentiveDisplayTableProps) {
  
  // Extract unique incentive types from all tiers (shared logic)
  const getUniqueIncentiveTypes = (): Array<{ key: string; type: IncentiveType }> => {
    const incentiveTypeMap = new Map<string, IncentiveType>();
    
    dealTiers.forEach(tier => {
      if (tier.incentives) {
        tier.incentives.forEach(incentive => {
          const key = `${incentive.category}-${incentive.subCategory}-${incentive.option}`;
          incentiveTypeMap.set(key, {
            category: incentive.category,
            subCategory: incentive.subCategory,
            option: incentive.option
          });
        });
      }
    });

    return Array.from(incentiveTypeMap.entries()).map(([key, type]) => ({ key, type }));
  };

  // Get incentive value for specific tier and type (shared logic)
  const getIncentiveValue = (tier: DealTier, incentiveType: IncentiveType): number => {
    const incentive = tier.incentives?.find(inc => 
      inc.category === incentiveType.category && 
      inc.subCategory === incentiveType.subCategory && 
      inc.option === incentiveType.option
    );
    return incentive?.value || 0;
  };

  const uniqueIncentiveTypes = getUniqueIncentiveTypes();

  // Return empty state if no incentives
  if (uniqueIncentiveTypes.length === 0) {
    return (
      <div className="text-center py-8 text-slate-500">
        No incentives configured yet
      </div>
    );
  }

  return (
    <FinancialTable>
      <FinancialTableColGroup dealTiers={dealTiers} />
      
      <FinancialTableHeader>
        <tr>
          <FinancialHeaderCell isMetricName>
            Incentive Details
          </FinancialHeaderCell>
          {showActions && (
            <FinancialHeaderCell>
              Actions
            </FinancialHeaderCell>
          )}
          {dealTiers.map((tier) => (
            <FinancialHeaderCell key={`header-${tier.tierNumber}`}>
              Tier {tier.tierNumber}
            </FinancialHeaderCell>
          ))}
        </tr>
      </FinancialTableHeader>
      
      <FinancialTableBody>
        {uniqueIncentiveTypes.map(({ key, type }) => (
          <tr key={key} className="hover:bg-slate-50">
            <FinancialDataCell isMetricLabel>
              <div className="space-y-1">
                <div className="font-medium text-purple-600 flex items-center">
                  <span className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center mr-2 text-sm">
                    $
                  </span>
                  {type.option}
                </div>
                <div className="text-xs text-slate-500">
                  {type.category} → {type.subCategory}
                </div>
              </div>
            </FinancialDataCell>
            
            {showActions && (
              <FinancialDataCell>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => onRemoveIncentive(type)}
                  className="text-red-500 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </FinancialDataCell>
            )}
            
            {dealTiers.map((tier) => {
              const value = getIncentiveValue(tier, type);
              return (
                <FinancialDataCell key={`incentive-${tier.tierNumber}-${key}`}>
                  {formatCurrency(value)}
                </FinancialDataCell>
              );
            })}
          </tr>
        ))}
      </FinancialTableBody>
    </FinancialTable>
  );
}

