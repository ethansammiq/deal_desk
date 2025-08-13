import React from "react";
import { UseFormReturn } from "react-hook-form";
import { Card, CardContent } from "@/components/ui/card";
import { FormSectionHeader } from "@/components/ui/form-style-guide";
import { Button } from "@/components/ui/button";
import { Plus, ChevronDown, Info, Trash2 } from "lucide-react";
import { useDealCalculations } from "@/hooks/useDealCalculations";
import { useTierManagement } from "@/hooks/useTierManagement";
import { FinancialTierTable } from "./FinancialTierTable";
import { IncentiveSelector } from "@/components/IncentiveSelector";
import { IncentiveDisplayTable } from "@/components/ui/incentive-display-table";
import { DEAL_CONSTANTS } from "@/config/businessConstants";
import { DealTier, getTotalIncentiveValue } from "@/hooks/useDealTiers";
import {
  FinancialSection,
  FinancialTable,
  FinancialTableHeader,
  FinancialHeaderCell,
  FinancialTableBody,
  FinancialDataCell,
  FinancialMetricLabel,
  GrowthIndicator,
  FinancialTableColGroup,
  formatCurrency
} from "@/components/ui/financial-table";

// Type this component to accept any valid form structure
type IncentiveStructureFormValues = any;

interface IncentiveStructureSectionProps {
  form: UseFormReturn<IncentiveStructureFormValues>;
  dealStructureType: "tiered" | "flat_commit" | "";
  dealTiers: DealTier[];
  setDealTiers: (tiers: DealTier[]) => void;
  showAddIncentiveForm: boolean;
  setShowAddIncentiveForm: (show: boolean) => void;
}

export function IncentiveStructureSection({
  form,
  dealStructureType,
  dealTiers,
  setDealTiers,
  showAddIncentiveForm,
  setShowAddIncentiveForm,
}: IncentiveStructureSectionProps) {
  const { calculationService } = useDealCalculations();

  // ✅ MIGRATED: Using centralized useTierManagement hook
  const tierManager = useTierManagement({
    dealTiers,
    setDealTiers,
    isFlat: dealStructureType === "flat_commit"
  });
  
  // Destructure for backward compatibility
  const { addTier, removeTier, updateTier } = tierManager;

  // Calculate incentive cost using the new getTotalIncentiveValue function
  const calculateTierIncentiveCost = (tierNumber: number): number => {
    const tier = dealTiers.find(t => t.tierNumber === tierNumber);
    if (!tier) return 0;
    return calculationService.calculateTierIncentiveCost(tier);
  };

  // Calculate last year incentive cost (using default)
  const lastYearIncentiveCost = 50000;

  return (
    <div className="space-y-8">
      {/* Incentive Structure Section */}
      <Card>
        <CardContent className="p-6">
          {/* Header with collapsible control */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <h3 className="text-lg font-medium text-slate-900 bg-gradient-to-r from-purple-700 to-indigo-500 bg-clip-text text-transparent">
                Incentive Structure
              </h3>
              <ChevronDown className="ml-2 h-5 w-5 text-slate-500" />
            </div>
            <Button
              type="button"
              onClick={() => setShowAddIncentiveForm(true)}
              variant="outline"
              size="sm"
              className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white border-0 hover:from-purple-700 hover:to-indigo-700"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Incentive
            </Button>
          </div>

          {/* Info banner */}
          <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg mb-6">
            <Info className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-700">
              <p className="font-medium mb-1">Incentive Configuration</p>
              <p>
                Incentives are additional benefits provided to the client based on performance.
                Select appropriate incentive types and amounts for each tier of the deal.
              </p>
            </div>
          </div>

          {/* Add Incentive Form */}
          {showAddIncentiveForm && (
            <div className="mb-6 p-4 border border-slate-200 rounded-lg bg-slate-50">
              <IncentiveSelector
                dealTiers={dealTiers}
                setDealTiers={setDealTiers}
                onClose={() => setShowAddIncentiveForm(false)}
              />
              <div className="flex justify-end gap-2 mt-4">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setShowAddIncentiveForm(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* Current Incentive Display - using shared IncentiveDisplayTable */}
          {dealTiers.some(tier => getTotalIncentiveValue(tier) > 0) && (
            <div className="space-y-4 mb-6">
              <h4 className="text-lg font-semibold">Current Incentive Configuration</h4>
              <IncentiveDisplayTable
                dealTiers={dealTiers}
                onRemoveIncentive={(incentiveType) => {
                  // Remove specific incentive type from all tiers
                  const updatedTiers = dealTiers.map(tier => ({
                    ...tier,
                    incentives: tier.incentives?.filter(inc => 
                      !(inc.category === incentiveType.category && 
                        inc.subCategory === incentiveType.subCategory && 
                        inc.option === incentiveType.option)
                    ) || []
                  }));
                  setDealTiers(updatedTiers);
                }}
                showActions={true}
              />
            </div>
          )}

        </CardContent>
      </Card>
    </div>
  );
}