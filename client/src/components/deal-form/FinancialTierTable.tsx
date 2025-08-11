import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, ChevronDown, Info } from "lucide-react";
import { useDealCalculations } from "@/hooks/useDealCalculations";

interface DealTierData {
  tierNumber: number;
  annualRevenue?: number;
  annualGrossMarginPercent?: number;
  incentivePercentage?: number;
  incentiveNotes?: string;
  incentiveType?: "rebate" | "discount" | "bonus" | "other";
}

interface FinancialTierTableProps {
  dealTiers: DealTierData[];
  setDealTiers: (tiers: DealTierData[]) => void;
  lastYearRevenue?: number;
  lastYearGrossMargin?: number;
  isFlat?: boolean;
}

export function FinancialTierTable({
  dealTiers,
  setDealTiers,
  lastYearRevenue = 850000,
  lastYearGrossMargin = 35.0,
  isFlat = false,
}: FinancialTierTableProps) {
  const { 
    calculationService 
  } = useDealCalculations();

  // Helper function to add a new tier
  const addTier = () => {
    const newTierNumber = dealTiers.length + 1;
    const newTier: DealTierData = {
      tierNumber: newTierNumber,
      annualRevenue: undefined,
      annualGrossMarginPercent: undefined,
      incentivePercentage: undefined,
      incentiveNotes: "",
      incentiveType: "rebate",
    };
    setDealTiers([...dealTiers, newTier]);
  };

  // Helper function to remove a tier
  const removeTier = (tierNumber: number) => {
    if (dealTiers.length > 1) {
      const updatedTiers = dealTiers
        .filter((tier) => tier.tierNumber !== tierNumber)
        .map((tier, index) => ({ ...tier, tierNumber: index + 1 }));
      setDealTiers(updatedTiers);
    }
  };

  // Helper function to update a tier
  const updateTier = (tierNumber: number, updates: Partial<DealTierData>) => {
    const updatedTiers = dealTiers.map((tier) =>
      tier.tierNumber === tierNumber ? { ...tier, ...updates } : tier
    );
    setDealTiers(updatedTiers);
  };

  // Calculate last year's gross profit
  const lastYearGrossProfit = lastYearRevenue * (lastYearGrossMargin / 100);

  return (
    <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
      {/* Revenue section header with collapsible control */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <h3 className="text-lg font-medium text-slate-900 bg-gradient-to-r from-purple-700 to-indigo-500 bg-clip-text text-transparent">
            Revenue & Profitability
          </h3>
          <ChevronDown className="ml-2 h-5 w-5 text-slate-500" />
        </div>
        <Button
          type="button"
          onClick={addTier}
          variant="outline"
          size="sm"
          disabled={isFlat}
          className={`${
            isFlat 
              ? "bg-gray-300 text-gray-500 cursor-not-allowed border-gray-300" 
              : "bg-gradient-to-r from-purple-600 to-indigo-600 text-white border-0 hover:from-purple-700 hover:to-indigo-700"
          }`}
          title={isFlat ? "Add Tier is disabled for Flat Commit deals" : "Add a new tier"}
        >
          <Plus className="h-4 w-4 mr-1" />
          Add Tier
        </Button>
      </div>

      {/* Info banner */}
      <div className="p-3 bg-blue-50 border border-blue-100 rounded text-sm text-blue-800 mb-4">
        <Info className="h-4 w-4 inline mr-2" />
        {isFlat 
          ? "This section shows revenue targets and profitability metrics for your flat commit deal. Add Tier is disabled for flat commit structures."
          : "This section details revenue targets, gross margin percentages, and calculated profitability metrics for each tier. Key metrics include Revenue Growth Rate and Gross Margin Growth Rate compared to last year's performance."
        }
      </div>

      {/* Financial metrics table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <colgroup>
            <col className="w-[30%]" />
            <col className="w-[14%]" />
            {dealTiers.map((tier) => (
              <col key={`col-${tier.tierNumber}`} className="w-[14%]" />
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
                <th key={`th-${tier.tierNumber}`} className="text-center p-3 bg-slate-100 border border-slate-200">
                  <div className="flex justify-between items-center">
                    <span className="flex-1 font-medium text-slate-700">Tier {tier.tierNumber}</span>
                    {dealTiers.length > 1 && (
                      <Button
                        type="button"
                        onClick={() => removeTier(tier.tierNumber)}
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {/* Annual Revenue Row */}
            <tr>
              <td className="p-3 border border-slate-200 bg-slate-50">
                <div>
                  <div className="font-medium text-slate-900">Annual Revenue</div>
                  <div className="text-xs text-slate-500">Total revenue expected for the fiscal year</div>
                </div>
              </td>
              <td className="p-3 border border-slate-200 text-center font-medium text-slate-700">
                ${lastYearRevenue.toLocaleString()}
              </td>
              {dealTiers.map((tier) => (
                <td key={`revenue-${tier.tierNumber}`} className="p-3 border border-slate-200">
                  <div className="flex items-center">
                    <span className="text-sm text-slate-500 mr-1">$</span>
                    <Input
                      type="number"
                      placeholder="0.00"
                      value={tier.annualRevenue || ""}
                      onChange={(e) => {
                        const value = e.target.value === "" ? undefined : parseFloat(e.target.value);
                        updateTier(tier.tierNumber, { annualRevenue: value });
                      }}
                      className="text-center border-0 bg-transparent p-1 text-sm"
                    />
                  </div>
                </td>
              ))}
            </tr>

            {/* Gross Margin Row */}
            <tr>
              <td className="p-3 border border-slate-200 bg-slate-50">
                <div>
                  <div className="font-medium text-slate-900">Gross Margin</div>
                  <div className="text-xs text-slate-500">Percentage of revenue retained after direct costs</div>
                </div>
              </td>
              <td className="p-3 border border-slate-200 text-center font-medium text-slate-700">
                {lastYearGrossMargin}%
              </td>
              {dealTiers.map((tier) => (
                <td key={`margin-${tier.tierNumber}`} className="p-3 border border-slate-200">
                  <div className="flex items-center">
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      placeholder="0.00"
                      value={tier.annualGrossMarginPercent || ""}
                      onChange={(e) => {
                        const value = e.target.value === "" ? undefined : parseFloat(e.target.value);
                        updateTier(tier.tierNumber, { annualGrossMarginPercent: value });
                      }}
                      className="text-center border-0 bg-transparent p-1 text-sm"
                    />
                    <span className="text-sm text-slate-500 ml-1">%</span>
                  </div>
                </td>
              ))}
            </tr>

            {/* Gross Profit Row */}
            <tr>
              <td className="p-3 border border-slate-200 bg-slate-50">
                <div>
                  <div className="font-medium text-slate-900">Gross Profit</div>
                  <div className="text-xs text-slate-500">Actual dollar amount retained after direct costs</div>
                </div>
              </td>
              <td className="p-3 border border-slate-200 text-center font-medium text-slate-700">
                ${lastYearGrossProfit.toLocaleString()}
              </td>
              {dealTiers.map((tier) => {
                const grossProfit = (tier.annualRevenue || 0) * ((tier.annualGrossMarginPercent || 0) / 100);
                return (
                  <td key={`profit-${tier.tierNumber}`} className="p-3 border border-slate-200 text-center text-slate-700">
                    ${grossProfit.toLocaleString()}
                  </td>
                );
              })}
            </tr>

            {/* Revenue Growth Rate Row */}
            <tr>
              <td className="p-3 border border-slate-200 bg-slate-50">
                <div>
                  <div className="font-medium text-slate-900">Revenue Growth Rate</div>
                  <div className="text-xs text-slate-500">Percentage increase compared to last year</div>
                </div>
              </td>
              <td className="p-3 border border-slate-200 text-center font-medium text-slate-700">
                -
              </td>
              {dealTiers.map((tier) => {
                const serviceTier = {
                  tierNumber: tier.tierNumber,
                  annualRevenue: tier.annualRevenue,
                  annualGrossMarginPercent: tier.annualGrossMarginPercent
                };
                const growthRate = calculationService.calculateRevenueGrowthRate(
                  serviceTier,
                  "independent_agency"
                ) * 100; // Convert to percentage
                const isNegative = growthRate < 0;
                return (
                  <td 
                    key={`rev-growth-${tier.tierNumber}`} 
                    className={`p-3 border border-slate-200 text-center font-medium ${
                      isNegative ? 'text-red-500' : 'text-green-600'
                    }`}
                  >
                    {growthRate.toFixed(1)}%
                  </td>
                );
              })}
            </tr>

            {/* Gross Margin Growth Rate Row */}
            <tr>
              <td className="p-3 border border-slate-200 bg-slate-50">
                <div>
                  <div className="font-medium text-slate-900">Gross Margin Growth Rate</div>
                  <div className="text-xs text-slate-500">Change in margin percentage vs last year</div>
                </div>
              </td>
              <td className="p-3 border border-slate-200 text-center font-medium text-slate-700">
                -
              </td>
              {dealTiers.map((tier) => {
                const serviceTier = {
                  tierNumber: tier.tierNumber,
                  annualRevenue: tier.annualRevenue,
                  annualGrossMarginPercent: tier.annualGrossMarginPercent
                };
                const marginGrowthRate = calculationService.calculateGrossMarginGrowthRate(
                  serviceTier,
                  "independent_agency"
                ) * 100; // Convert to percentage
                const isNegative = marginGrowthRate < 0;
                return (
                  <td 
                    key={`margin-growth-${tier.tierNumber}`} 
                    className={`p-3 border border-slate-200 text-center font-medium ${
                      isNegative ? 'text-red-500' : 'text-green-600'
                    }`}
                  >
                    {marginGrowthRate.toFixed(1)}%
                  </td>
                );
              })}
            </tr>

            {/* Gross Profit Growth Rate Row */}
            <tr>
              <td className="p-3 border border-slate-200 bg-slate-50">
                <div>
                  <div className="font-medium text-slate-900">Gross Profit Growth Rate</div>
                  <div className="text-xs text-slate-500">Change in dollar profit amount vs last year</div>
                </div>
              </td>
              <td className="p-3 border border-slate-200 text-center font-medium text-slate-700">
                -
              </td>
              {dealTiers.map((tier) => {
                const serviceTier = {
                  tierNumber: tier.tierNumber,
                  annualRevenue: tier.annualRevenue,
                  annualGrossMarginPercent: tier.annualGrossMarginPercent
                };
                const profitGrowthRate = calculationService.calculateProfitGrowthRate(
                  serviceTier,
                  "independent_agency"
                ) * 100; // Convert to percentage
                const isNegative = profitGrowthRate < 0;
                return (
                  <td 
                    key={`profit-growth-${tier.tierNumber}`} 
                    className={`p-3 border border-slate-200 text-center font-medium ${
                      isNegative ? 'text-red-500' : 'text-green-600'
                    }`}
                  >
                    {profitGrowthRate.toFixed(1)}%
                  </td>
                );
              })}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}