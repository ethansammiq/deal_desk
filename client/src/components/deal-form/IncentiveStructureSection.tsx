import React from "react";
import { UseFormReturn } from "react-hook-form";
import { Card, CardContent } from "@/components/ui/card";
import { FormSectionHeader } from "@/components/ui/form-style-guide";
import { type TierIncentive } from "@/components/TierSpecificIncentives";
import { type SelectedIncentive } from "@/lib/incentive-data";
import { Button } from "@/components/ui/button";
import { Plus, ChevronDown, Info, Trash2 } from "lucide-react";
import { useDealCalculations } from "@/hooks/useDealCalculations";
import { FinancialTierTable } from "./FinancialTierTable";
import { IncentiveSelector } from "@/components/IncentiveSelector";
import TierSpecificIncentives from "@/components/TierSpecificIncentives";
import { DEAL_CONSTANTS, INCENTIVE_CONSTANTS } from "@/config/businessConstants";

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

  // ✅ Phase 2.5: Migrated tier management from ValueStructureSection
  const addTier = () => {
    const newTierNumber = dealTiers.length + 1;
    const newTier: DealTier = {
      tierNumber: newTierNumber,
      annualRevenue: DEAL_CONSTANTS.DEFAULT_ANNUAL_REVENUE,
      annualGrossMargin: DEAL_CONSTANTS.DEFAULT_GROSS_MARGIN,
      incentiveCategory: INCENTIVE_CONSTANTS.DEFAULT_CATEGORY,
      incentiveSubCategory: INCENTIVE_CONSTANTS.DEFAULT_SUB_CATEGORY,
      specificIncentive: INCENTIVE_CONSTANTS.DEFAULT_SPECIFIC_INCENTIVE,
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



  // Helper to calculate incentive costs for a tier
  const calculateTierIncentiveCost = (tierNumber: number): number => {
    return calculationService.calculateTierIncentiveCost(tierNumber, selectedIncentives, tierIncentives);
  };

  // Calculate last year incentive cost (using default)
  const lastYearIncentiveCost = 50000;

  return (
    <div className="space-y-8">
      {/* ✅ Revenue & Profitability - Clean single section */}
      <FinancialTierTable
        dealTiers={dealTiers}
        setDealTiers={setDealTiers}
        lastYearRevenue={850000}
        lastYearGrossMargin={35.0}
        isFlat={dealStructureType === "flat_commit"}
      />

      {/* ✅ Phase 2.5: Incentive Structure Section */}
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
            Incentives are additional benefits provided to the client based on performance. Select appropriate incentive types and amounts for each tier of the deal.
          </div>

          {/* Add Incentive Form - ABOVE Cost & Value Analysis */}
          {showAddIncentiveForm && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg border">
              <IncentiveSelector
                selectedIncentives={selectedIncentives}
                dealTiers={dealTiers}
                onChange={setSelectedIncentives}
                showAddForm={showAddIncentiveForm}
              />
              <Button
                type="button"
                onClick={() => setShowAddIncentiveForm(false)}
                variant="outline"
                size="sm"
                className="mt-2"
              >
                Cancel
              </Button>
            </div>
          )}

          {/* Selected Incentives Table - Shows applied incentives */}
          {selectedIncentives && selectedIncentives.length > 0 && (
            <div className="mb-6">
              <h4 className="text-lg font-semibold mb-4">Selected Incentives</h4>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse bg-white rounded-lg border">
                  <colgroup>
                    <col className="w-[30%]" />
                    <col className="w-[15%]" />
                    {dealTiers.map((tier) => (
                      <col key={`incentive-col-${tier.tierNumber}`} className="w-[15%]" />
                    ))}
                  </colgroup>
                  
                  <thead>
                    <tr>
                      <th className="text-left p-3 bg-slate-100 border border-slate-200 font-medium">Incentive Details</th>
                      <th className="text-center p-3 bg-slate-100 border border-slate-200 font-medium">Actions</th>
                      {dealTiers.map((tier) => (
                        <th key={`incentive-th-${tier.tierNumber}`} className="text-center p-3 bg-slate-100 border border-slate-200 font-medium text-slate-700">
                          Tier {tier.tierNumber}
                        </th>
                      ))}
                    </tr>
                  </thead>

                  <tbody>
                    {selectedIncentives.map((incentive, index) => (
                      <tr key={index}>
                        <td className="p-3 border border-slate-200">
                          <div>
                            <div className="font-medium text-purple-600 flex items-center">
                              <span className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center mr-2 text-sm">
                                $
                              </span>
                              {incentive.option || 'Discount'}
                            </div>
                            <div className="text-xs text-slate-500">
                              {incentive.category || 'Financial'} → {incentive.subCategory || 'Discount'}
                            </div>
                          </div>
                        </td>
                        <td className="p-3 border border-slate-200 text-center">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const updated = selectedIncentives.filter((_, i) => i !== index);
                              setSelectedIncentives(updated);
                            }}
                            className="text-red-500 hover:text-red-700"
                          >
                            🗑️
                          </Button>
                        </td>
                        {dealTiers.map((tier) => {
                          const tierIncentive = tierIncentives.find(ti => 
                            ti.tierId === tier.tierNumber && 
                            ti.type === incentive.subCategory
                          );
                          const value = tierIncentive ? tierIncentive.value : tier.incentiveValue;
                          return (
                            <td key={`incentive-value-${tier.tierNumber}`} className="p-3 border border-slate-200 text-center font-medium">
                              ${(value || 0).toLocaleString()}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Cost & Value Analysis Table - BELOW incentives */}
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
                        annualGrossMargin: tier.annualGrossMargin
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
                        annualGrossMargin: tier.annualGrossMargin
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

        </CardContent>
      </Card>

      {/* ✅ Financial Summary Section - Restored */}
      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-medium mb-6">Financial Summary</h3>
          
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <colgroup>
                <col className="w-[40%]" />
                <col className="w-[15%]" />
                {dealTiers.map((tier) => (
                  <col key={`summary-col-${tier.tierNumber}`} className="w-[15%]" />
                ))}
              </colgroup>
              
              <thead>
                <tr>
                  <th className="text-left p-3 bg-slate-100 border border-slate-200"></th>
                  <th className="text-center p-3 bg-slate-100 border border-slate-200 font-medium text-slate-700">
                    Last Year
                  </th>
                  {dealTiers.map((tier) => (
                    <th key={`summary-th-${tier.tierNumber}`} className="text-center p-3 bg-slate-100 border border-slate-200 font-medium text-slate-700">
                      Tier {tier.tierNumber}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {/* Adjusted Gross Margin */}
                <tr>
                  <td className="p-3 border border-slate-200 bg-slate-50">
                    <div>
                      <div className="font-medium text-slate-900">Adjusted Gross Margin</div>
                      <div className="text-xs text-slate-500">Gross margin after incentives</div>
                    </div>
                  </td>
                  <td className="p-3 border border-slate-200 text-center font-medium text-slate-700">
                    35.0%
                  </td>
                  {dealTiers.map((tier) => {
                    const adjustedMargin = tier.annualGrossMargin - (calculateTierIncentiveCost(tier.tierNumber) / (tier.annualRevenue || 1)) * 100;
                    return (
                      <td key={`adj-margin-${tier.tierNumber}`} className="p-3 border border-slate-200 text-center font-medium text-slate-700">
                        {adjustedMargin.toFixed(1)}%
                      </td>
                    );
                  })}
                </tr>

                {/* Adjusted Gross Profit */}
                <tr>
                  <td className="p-3 border border-slate-200 bg-slate-50">
                    <div>
                      <div className="font-medium text-slate-900">Adjusted Gross Profit</div>
                      <div className="text-xs text-slate-500">Gross profit after incentive costs</div>
                    </div>
                  </td>
                  <td className="p-3 border border-slate-200 text-center font-medium text-slate-700">
                    $297,500
                  </td>
                  {dealTiers.map((tier) => {
                    const grossProfit = (tier.annualRevenue * tier.annualGrossMargin) / 100;
                    const adjustedProfit = grossProfit - calculateTierIncentiveCost(tier.tierNumber);
                    return (
                      <td key={`adj-profit-${tier.tierNumber}`} className="p-3 border border-slate-200 text-center font-medium text-slate-700">
                        ${adjustedProfit.toLocaleString()}
                      </td>
                    );
                  })}
                </tr>

                {/* Adjusted Gross Margin Growth Rate */}
                <tr>
                  <td className="p-3 border border-slate-200 bg-slate-50">
                    <div>
                      <div className="font-medium text-slate-900">Adjusted Gross Margin Growth Rate</div>
                      <div className="text-xs text-slate-500">Percentage change in adjusted margin</div>
                    </div>
                  </td>
                  <td className="p-3 border border-slate-200 text-center font-medium text-slate-700">
                    —
                  </td>
                  {dealTiers.map((tier) => {
                    const adjustedMargin = tier.annualGrossMargin - (calculateTierIncentiveCost(tier.tierNumber) / (tier.annualRevenue || 1)) * 100;
                    const growthRate = ((adjustedMargin - 35.0) / 35.0) * 100;
                    const isNegative = growthRate < 0;
                    return (
                      <td 
                        key={`adj-margin-growth-${tier.tierNumber}`} 
                        className={`p-3 border border-slate-200 text-center font-medium ${
                          isNegative ? 'text-red-500' : 'text-green-600'
                        }`}
                      >
                        {growthRate.toFixed(1)}%
                      </td>
                    );
                  })}
                </tr>

                {/* Adjusted Gross Profit Growth Rate */}
                <tr>
                  <td className="p-3 border border-slate-200 bg-slate-50">
                    <div>
                      <div className="font-medium text-slate-900">Adjusted Gross Profit Growth Rate</div>
                      <div className="text-xs text-slate-500">Percentage increase in adjusted profit vs last year</div>
                    </div>
                  </td>
                  <td className="p-3 border border-slate-200 text-center font-medium text-slate-700">
                    —
                  </td>
                  {dealTiers.map((tier) => {
                    const grossProfit = (tier.annualRevenue * tier.annualGrossMargin) / 100;
                    const adjustedProfit = grossProfit - calculateTierIncentiveCost(tier.tierNumber);
                    const lastYearProfit = 297500; // $850k * 35% = $297,500
                    const growthRate = lastYearProfit > 0 ? ((adjustedProfit - lastYearProfit) / lastYearProfit) * 100 : -100;
                    const isNegative = growthRate < 0;
                    return (
                      <td 
                        key={`adj-profit-growth-${tier.tierNumber}`} 
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
        </CardContent>
      </Card>
    </div>
  );
}