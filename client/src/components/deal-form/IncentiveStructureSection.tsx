import React from "react";
import { UseFormReturn } from "react-hook-form";
import { Card, CardContent } from "@/components/ui/card";
import { FormSectionHeader } from "@/components/ui/form-style-guide";
import { IncentiveSelector } from "@/components/IncentiveSelector";
import TierSpecificIncentives, { type TierIncentive } from "@/components/TierSpecificIncentives";
import { type SelectedIncentive } from "@/lib/incentive-data";
import { Button } from "@/components/ui/button";
import { Plus, ChevronDown, Info } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDealCalculations } from "@/hooks/useDealCalculations";

// Type this component to accept any valid form structure
type IncentiveStructureFormValues = any;

interface DealTierData {
  tierNumber: number;
  annualRevenue?: number;
  annualGrossMarginPercent?: number;
  incentivePercentage?: number;
  incentiveNotes?: string;
  incentiveType?: "rebate" | "discount" | "bonus" | "other";
}

interface IncentiveStructureSectionProps {
  form: UseFormReturn<IncentiveStructureFormValues>;
  dealStructureType: "tiered" | "flat_commit" | "";
  dealTiers: DealTierData[];
  setDealTiers: (tiers: DealTierData[]) => void;
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

  // Helper function to update a tier
  const updateTier = (tierNumber: number, updates: Partial<DealTierData>) => {
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

        <div className="space-y-8">
          {/* Tier Configuration Details */}
          {dealStructureType === "tiered" && dealTiers.length > 0 && (
            <div className="space-y-4">
              <h4 className="text-lg font-semibold">Tier Configuration Details</h4>
              <div className="grid gap-4">
                {dealTiers.map((tier) => (
                  <div
                    key={tier.tierNumber}
                    className="border border-slate-200 rounded-lg p-4 bg-slate-50"
                  >
                    <h5 className="font-medium mb-3">Tier {tier.tierNumber} - Additional Settings</h5>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div>
                        <label className="text-sm font-medium text-gray-700">
                          Incentive Type
                        </label>
                        <Select
                          value={tier.incentiveType || "rebate"}
                          onValueChange={(value: "rebate" | "discount" | "bonus" | "other") => {
                            updateTier(tier.tierNumber, { incentiveType: value });
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="rebate">Rebate</SelectItem>
                            <SelectItem value="discount">Discount</SelectItem>
                            <SelectItem value="bonus">Bonus</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <label className="text-sm font-medium text-gray-700">
                          Incentive Percentage
                        </label>
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          step="0.1"
                          placeholder="Enter incentive %"
                          value={tier.incentivePercentage || ""}
                          onChange={(e) => {
                            const value = e.target.value === "" ? undefined : parseFloat(e.target.value);
                            updateTier(tier.tierNumber, { incentivePercentage: value });
                          }}
                        />
                      </div>
                    </div>

                    <div className="mt-4">
                      <label className="text-sm font-medium text-gray-700">
                        Tier Notes
                      </label>
                      <Textarea
                        placeholder="Notes about this tier's structure, targets, or special conditions..."
                        value={tier.incentiveNotes || ""}
                        onChange={(e) => {
                          updateTier(tier.tierNumber, { incentiveNotes: e.target.value });
                        }}
                        className="min-h-[60px] mt-1"
                      />
                    </div>
                  </div>
                ))}
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

          {/* Hierarchical Incentives */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold">Hierarchical Incentives</h4>
            <p className="text-sm text-gray-600">
              Select incentives that apply across multiple tiers
            </p>
            <IncentiveSelector
              selectedIncentives={selectedIncentives}
              dealTiers={dealTiers.map(tier => ({ 
                tierNumber: tier.tierNumber, 
                annualRevenue: tier.annualRevenue || 0 
              }))}
              onChange={setSelectedIncentives}
            />
          </div>

          {/* Tier-Specific Incentives */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold">Tier-Specific Incentives</h4>
            <p className="text-sm text-gray-600">
              Configure specific incentives for individual tiers
            </p>
            <TierSpecificIncentives
              dealTiers={dealTiers.map(tier => ({
                tierNumber: tier.tierNumber,
                annualRevenue: tier.annualRevenue || 0
              }))}
              incentives={tierIncentives}
              onChange={setTierIncentives}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}