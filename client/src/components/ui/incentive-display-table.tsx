import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, Edit, Check, X } from "lucide-react";
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
  onEditIncentive?: (incentiveType: IncentiveType, newValues: { [tierNumber: number]: number }) => void;
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
  onEditIncentive,
  showActions = true 
}: IncentiveDisplayTableProps) {
  // State for editing mode
  const [editingIncentive, setEditingIncentive] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<{ [tierNumber: number]: number }>({});
  
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

  // Handle edit mode start
  const handleStartEdit = (incentiveKey: string, incentiveType: IncentiveType) => {
    setEditingIncentive(incentiveKey);
    // Initialize edit values with current values
    const initialValues: { [tierNumber: number]: number } = {};
    dealTiers.forEach(tier => {
      initialValues[tier.tierNumber] = getIncentiveValue(tier, incentiveType);
    });
    setEditValues(initialValues);
  };

  // Handle save edit
  const handleSaveEdit = (incentiveType: IncentiveType) => {
    if (onEditIncentive) {
      onEditIncentive(incentiveType, editValues);
    }
    setEditingIncentive(null);
    setEditValues({});
  };

  // Handle cancel edit
  const handleCancelEdit = () => {
    setEditingIncentive(null);
    setEditValues({});
  };

  // Handle edit value change
  const handleEditValueChange = (tierNumber: number, value: string) => {
    const numValue = parseFloat(value) || 0;
    setEditValues(prev => ({
      ...prev,
      [tierNumber]: numValue
    }));
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
                <div className="flex gap-1">
                  {editingIncentive === key ? (
                    <>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSaveEdit(type)}
                        className="text-green-500 hover:text-green-700"
                        title="Save changes"
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleCancelEdit}
                        className="text-gray-500 hover:text-gray-700"
                        title="Cancel edit"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleStartEdit(key, type)}
                        className="text-blue-500 hover:text-blue-700"
                        title="Edit incentive values"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => onRemoveIncentive(type)}
                        className="text-red-500 hover:text-red-700"
                        title="Remove incentive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              </FinancialDataCell>
            )}
            
            {dealTiers.map((tier) => {
              const value = getIncentiveValue(tier, type);
              const isEditing = editingIncentive === key;
              
              return (
                <FinancialDataCell key={`incentive-${tier.tierNumber}-${key}`}>
                  {isEditing ? (
                    <Input
                      type="number"
                      value={editValues[tier.tierNumber] || 0}
                      onChange={(e) => handleEditValueChange(tier.tierNumber, e.target.value)}
                      className="w-24 h-8 text-sm"
                      min="0"
                      step="0.01"
                    />
                  ) : (
                    formatCurrency(value)
                  )}
                </FinancialDataCell>
              );
            })}
          </tr>
        ))}
      </FinancialTableBody>
    </FinancialTable>
  );
}

