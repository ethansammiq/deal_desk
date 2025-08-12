import React from "react";
import { UseFormReturn } from "react-hook-form";
import { Card, CardContent } from "@/components/ui/card";
import { FormSectionHeader } from "@/components/ui/form-style-guide";
import { Button } from "@/components/ui/button";
import { Plus, ChevronDown, Info, Trash2 } from "lucide-react";
import { useDealCalculations } from "@/hooks/useDealCalculations";
import { FinancialTierTable } from "./FinancialTierTable";
import { IncentiveSelector } from "@/components/IncentiveSelector";
import { DEAL_CONSTANTS } from "@/config/businessConstants";
import { DealTier } from "@/hooks/useDealTiers";

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

  // Add new tier
  const addTier = () => {
    const newTierNumber = dealTiers.length + 1;
    const newTier: DealTier = {
      tierNumber: newTierNumber,
      annualRevenue: DEAL_CONSTANTS.DEFAULT_ANNUAL_REVENUE,
      annualGrossMargin: DEAL_CONSTANTS.DEFAULT_GROSS_MARGIN,
      categoryName: "Financial",
      subCategoryName: "Discounts", 
      incentiveOption: "Volume Discount",
      incentiveValue: 0,
      incentiveNotes: "",
    };
    setDealTiers([...dealTiers, newTier]);
  };

  const removeTier = (tierNumber: number) => {
    if (dealTiers.length > 1) {
      const updatedTiers = dealTiers
        .filter((tier) => tier.tierNumber !== tierNumber)
        .map((tier, index) => ({ ...tier, tierNumber: index + 1 }));
      setDealTiers(updatedTiers);
    }
  };

  const updateTier = (tierNumber: number, updates: Partial<DealTier>) => {
    const updatedTiers = dealTiers.map((tier) =>
      tier.tierNumber === tierNumber ? { ...tier, ...updates } : tier
    );
    setDealTiers(updatedTiers);
  };

  // Calculate incentive cost directly from DealTier
  const calculateTierIncentiveCost = (tierNumber: number): number => {
    const tier = dealTiers.find(t => t.tierNumber === tierNumber);
    return tier?.incentiveValue || 0;
  };

  // Calculate last year incentive cost (using default)
  const lastYearIncentiveCost = 50000;

  return (
    <div className="space-y-8">
      {/* Revenue & Profitability Table */}
      <FinancialTierTable
        dealTiers={dealTiers}
        setDealTiers={setDealTiers}
        lastYearRevenue={850000}
        lastYearGrossMargin={35.0}
        isFlat={dealStructureType === "flat_commit"}
      />

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
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
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

          {/* Current Incentive Display - reads directly from DealTier */}
          {dealTiers.some(tier => tier.incentiveValue > 0) && (
            <div className="space-y-4 mb-6">
              <h4 className="text-lg font-semibold">Current Incentive Configuration</h4>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <colgroup>
                    <col className="w-[40%]" />
                    <col className="w-[20%]" />
                    {dealTiers.map((tier) => (
                      <col key={`col-${tier.tierNumber}`} className="w-[20%]" />
                    ))}
                  </colgroup>
                  
                  <thead>
                    <tr>
                      <th className="text-left p-3 bg-slate-100 border border-slate-200 font-medium text-slate-700">
                        Incentive Details
                      </th>
                      <th className="text-center p-3 bg-slate-100 border border-slate-200 font-medium text-slate-700">
                        Actions
                      </th>
                      {dealTiers.map((tier) => (
                        <th key={`header-${tier.tierNumber}`} className="text-center p-3 bg-slate-100 border border-slate-200 font-medium text-slate-700">
                          Tier {tier.tierNumber}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  
                  <tbody>
                    <tr className="hover:bg-slate-50">
                      <td className="p-3 border border-slate-200">
                        <div className="space-y-1">
                          <div className="font-medium text-purple-600 flex items-center">
                            <span className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center mr-2 text-sm">
                              $
                            </span>
                            {dealTiers[0]?.incentiveOption || 'Volume Discount'}
                          </div>
                          <div className="text-xs text-slate-500">
                            {dealTiers[0]?.categoryName || 'Financial'} → {dealTiers[0]?.subCategoryName || 'Discounts'}
                          </div>
                        </div>
                      </td>
                      <td className="p-3 border border-slate-200 text-center">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            // Reset all tier incentive values to 0
                            const resetTiers = dealTiers.map(tier => ({ ...tier, incentiveValue: 0 }));
                            setDealTiers(resetTiers);
                          }}
                          className="text-red-500 hover:text-red-700"
                        >
                          🗑️
                        </Button>
                      </td>
                      {dealTiers.map((tier) => {
                        const value = tier.incentiveValue || 0;
                        return (
                          <td key={`incentive-value-${tier.tierNumber}`} className="p-3 border border-slate-200 text-center font-medium">
                            ${value.toLocaleString()}
                          </td>
                        );
                      })}
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Cost & Value Analysis Table */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold">Cost & Value Analysis</h4>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <colgroup>
                  <col className="w-[40%]" />
                  <col className="w-[20%]" />
                  {dealTiers.map((tier) => (
                    <col key={`col-${tier.tierNumber}`} className="w-[20%]" />
                  ))}
                </colgroup>
                
                <thead>
                  <tr>
                    <th className="text-left p-3 bg-slate-100 border border-slate-200"></th>
                    <th className="text-center p-3 bg-slate-100 border border-slate-200 font-medium text-slate-700">
                      Last Year
                    </th>
                    {dealTiers.map((tier) => (
                      <th key={`cost-header-${tier.tierNumber}`} className="text-center p-3 bg-slate-100 border border-slate-200 font-medium text-slate-700">
                        Tier {tier.tierNumber}
                      </th>
                    ))}
                  </tr>
                </thead>
                
                <tbody>
                  <tr>
                    <td className="p-3 border border-slate-200">
                      <div>
                        <div className="font-medium text-slate-900">Total Incentive Cost</div>
                        <div className="text-sm text-slate-500">All incentives applied to this tier</div>
                      </div>
                    </td>
                    <td className="p-3 border border-slate-200 text-center font-medium">
                      ${lastYearIncentiveCost.toLocaleString()}
                    </td>
                    {dealTiers.map((tier) => (
                      <td key={`cost-${tier.tierNumber}`} className="p-3 border border-slate-200 text-center font-medium">
                        ${calculateTierIncentiveCost(tier.tierNumber).toLocaleString()}
                      </td>
                    ))}
                  </tr>
                  
                  <tr>
                    <td className="p-3 border border-slate-200">
                      <div>
                        <div className="font-medium text-slate-900">Incentive Cost Growth Rate</div>
                        <div className="text-sm text-slate-500">Change vs. last year</div>
                      </div>
                    </td>
                    <td className="p-3 border border-slate-200 text-center font-medium text-slate-500">
                      —
                    </td>
                    {dealTiers.map((tier) => {
                      const currentCost = calculateTierIncentiveCost(tier.tierNumber);
                      const growthRate = lastYearIncentiveCost > 0 
                        ? ((currentCost - lastYearIncentiveCost) / lastYearIncentiveCost) * 100 
                        : 0;
                      const isPositive = growthRate > 0;
                      return (
                        <td key={`growth-${tier.tierNumber}`} className={`p-3 border border-slate-200 text-center font-medium ${isPositive ? 'text-red-600' : 'text-green-600'}`}>
                          {growthRate.toFixed(1)}%
                        </td>
                      );
                    })}
                  </tr>
                  
                  <tr>
                    <td className="p-3 border border-slate-200">
                      <div>
                        <div className="font-medium text-slate-900">Total Client Value</div>
                        <div className="text-sm text-slate-500">Expected business value from incentive</div>
                      </div>
                    </td>
                    <td className="p-3 border border-slate-200 text-center font-medium">
                      $340,000
                    </td>
                    {dealTiers.map((tier) => {
                      // Calculate expected value (simple 12x multiplier)
                      const incentiveCost = calculateTierIncentiveCost(tier.tierNumber);
                      const expectedValue = incentiveCost * 12;
                      return (
                        <td key={`value-${tier.tierNumber}`} className="p-3 border border-slate-200 text-center font-medium">
                          ${expectedValue.toLocaleString()}
                        </td>
                      );
                    })}
                  </tr>
                  
                  <tr>
                    <td className="p-3 border border-slate-200">
                      <div>
                        <div className="font-medium text-slate-900">Client Value Growth Rate</div>
                        <div className="text-sm text-slate-500">Change vs. last year</div>
                      </div>
                    </td>
                    <td className="p-3 border border-slate-200 text-center font-medium text-slate-500">
                      —
                    </td>
                    {dealTiers.map((tier) => {
                      const incentiveCost = calculateTierIncentiveCost(tier.tierNumber);
                      const expectedValue = incentiveCost * 12;
                      const lastYearValue = 340000;
                      const valueGrowthRate = lastYearValue > 0 
                        ? ((expectedValue - lastYearValue) / lastYearValue) * 100 
                        : 0;
                      const isPositive = valueGrowthRate > 0;
                      return (
                        <td key={`value-growth-${tier.tierNumber}`} className={`p-3 border border-slate-200 text-center font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                          {valueGrowthRate.toFixed(1)}%
                        </td>
                      );
                    })}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>


        </CardContent>
      </Card>
    </div>
  );
}