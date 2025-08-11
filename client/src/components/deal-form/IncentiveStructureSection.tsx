import React from "react";
import { UseFormReturn } from "react-hook-form";
import { Card, CardContent } from "@/components/ui/card";
import { FormSectionHeader } from "@/components/ui/form-style-guide";
import { type TierIncentive } from "@/components/TierSpecificIncentives";
import { type SelectedIncentive } from "@/lib/incentive-data";
import { Button } from "@/components/ui/button";
import { Plus, ChevronDown, Info } from "lucide-react";
import { useDealCalculations } from "@/hooks/useDealCalculations";

// Type this component to accept any valid form structure
type IncentiveStructureFormValues = any;

// Import unified interface from hook
import { DealTier } from "@/hooks/useDealTiers";

interface IncentiveStructureSectionProps {
  form: UseFormReturn<IncentiveStructureFormValues>;
  dealStructureType: "tiered" | "flat_commit" | "";
  dealTiers: DealTier[];
  setDealTiers: (tiers: DealTier[]) => void;
  selectedIncentives: SelectedIncentive[];
  setSelectedIncentives: (incentives: SelectedIncentive[]) => void;
  tierIncentives: TierIncentive[];
  setTierIncentives: (incentives: TierIncentive[]) => void;
  showAddIncentiveForm: boolean;
  setShowAddIncentiveForm: (show: boolean) => void;
}

export function IncentiveStructureSection({
  form,
  dealStructureType,
  dealTiers,
  setDealTiers,
  selectedIncentives,
  setSelectedIncentives,
  tierIncentives,
  setTierIncentives,
  showAddIncentiveForm,
  setShowAddIncentiveForm,
}: IncentiveStructureSectionProps) {
  const { calculationService } = useDealCalculations();



  // Helper to calculate incentive costs for a tier
  const calculateTierIncentiveCost = (tierNumber: number): number => {
    return calculationService.calculateTierIncentiveCost(tierNumber, selectedIncentives, tierIncentives);
  };

  // Calculate last year incentive cost (using default)
  const lastYearIncentiveCost = 50000;

  return (
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
        <div className="p-3 bg-blue-50 border border-blue-100 rounded text-sm text-blue-800 mb-6">
          <Info className="h-4 w-4 inline mr-2" />
          Incentives are additional benefits provided to the client based on performance.
          Select appropriate incentive types and amounts for each tier of the deal.
        </div>

        <div className="space-y-6">
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
                
                {/* Table header */}
                <thead>
                  <tr>
                    <th className="text-left p-3 bg-slate-100 border border-slate-200"></th>
                    <th className="text-center p-3 bg-slate-100 border border-slate-200 font-medium text-slate-700">
                      Last Year
                    </th>
                    {dealTiers.map((tier) => (
                      <th key={`th-${tier.tierNumber}`} className="text-center p-3 bg-slate-100 border border-slate-200 font-medium text-slate-700">
                        Tier {tier.tierNumber}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {/* Total Incentive Cost Row */}
                  <tr>
                    <td className="p-3 border border-slate-200 bg-slate-50">
                      <div>
                        <div className="font-medium text-slate-900">Total Incentive Cost</div>
                        <div className="text-xs text-slate-500">All incentives applied to this tier</div>
                      </div>
                    </td>
                    <td className="p-3 border border-slate-200 text-center font-medium text-slate-700">
                      ${lastYearIncentiveCost.toLocaleString()}
                    </td>
                    {dealTiers.map((tier) => {
                      const incentiveCost = calculateTierIncentiveCost(tier.tierNumber);
                      return (
                        <td key={`cost-${tier.tierNumber}`} className="p-3 border border-slate-200 text-center text-slate-700">
                          ${incentiveCost.toLocaleString()}
                        </td>
                      );
                    })}
                  </tr>

                  {/* Incentive Cost Growth Rate Row */}
                  <tr>
                    <td className="p-3 border border-slate-200 bg-slate-50">
                      <div>
                        <div className="font-medium text-slate-900">Incentive Cost Growth Rate</div>
                        <div className="text-xs text-slate-500">Change vs. last year</div>
                      </div>
                    </td>
                    <td className="p-3 border border-slate-200 text-center font-medium text-slate-700">
                      —
                    </td>
                    {dealTiers.map((tier) => {
                      const currentCost = calculateTierIncentiveCost(tier.tierNumber);
                      const growthRate = lastYearIncentiveCost > 0 ? 
                        ((currentCost - lastYearIncentiveCost) / lastYearIncentiveCost) * 100 : 0;
                      const isNegative = growthRate < 0;
                      return (
                        <td 
                          key={`cost-growth-${tier.tierNumber}`} 
                          className={`p-3 border border-slate-200 text-center font-medium ${
                            isNegative ? 'text-red-500' : 'text-green-600'
                          }`}
                        >
                          {growthRate.toFixed(1)}%
                        </td>
                      );
                    })}
                  </tr>

                  {/* Total Client Value Row */}
                  <tr>
                    <td className="p-3 border border-slate-200 bg-slate-50">
                      <div>
                        <div className="font-medium text-slate-900">Total Client Value</div>
                        <div className="text-xs text-slate-500">Expected business value from incentive</div>
                      </div>
                    </td>
                    <td className="p-3 border border-slate-200 text-center font-medium text-slate-700">
                      $340,000
                    </td>
                    {dealTiers.map((tier) => {
                      const serviceTier = {
                        tierNumber: tier.tierNumber,
                        annualRevenue: tier.annualRevenue,
                        annualGrossMarginPercent: tier.annualGrossMarginPercent
                      };
                      const clientValue = calculationService.calculateClientValue(serviceTier);
                      return (
                        <td key={`value-${tier.tierNumber}`} className="p-3 border border-slate-200 text-center text-slate-700">
                          ${clientValue.toLocaleString()}
                        </td>
                      );
                    })}
                  </tr>

                  {/* Client Value Growth Rate Row */}
                  <tr>
                    <td className="p-3 border border-slate-200 bg-slate-50">
                      <div>
                        <div className="font-medium text-slate-900">Client Value Growth Rate</div>
                        <div className="text-xs text-slate-500">Change vs. last year</div>
                      </div>
                    </td>
                    <td className="p-3 border border-slate-200 text-center font-medium text-slate-700">
                      —
                    </td>
                    {dealTiers.map((tier) => {
                      const serviceTier = {
                        tierNumber: tier.tierNumber,
                        annualRevenue: tier.annualRevenue,
                        annualGrossMarginPercent: tier.annualGrossMarginPercent
                      };
                      const growthRate = calculationService.calculateClientValueGrowthRate(
                        serviceTier,
                        "independent_agency"
                      ) * 100; // Convert to percentage
                      const isNegative = growthRate < 0;
                      return (
                        <td 
                          key={`client-growth-${tier.tierNumber}`} 
                          className={`p-3 border border-slate-200 text-center font-medium ${
                            isNegative ? 'text-red-500' : 'text-green-600'
                          }`}
                        >
                          {growthRate.toFixed(1)}%
                        </td>
                      );
                    })}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}