import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, TrendingUp, DollarSign } from "lucide-react";
import {
  FormFieldWithTooltip,
  FinancialInputGroup,
  INCENTIVE_TYPE_OPTIONS,
} from "@/components/ui/form-components";
import {
  formatCurrency,
  formatPercentage,
} from "@/lib/utils";

interface DealTierData {
  tierNumber: number;
  annualRevenue?: number;
  annualGrossMargin?: number;
  annualGrossMarginPercent?: number;
  incentivePercentage?: number;
  incentiveNotes?: string;
  incentiveType?: "rebate" | "discount" | "bonus" | "other";
  incentiveThreshold?: number;
  incentiveAmount?: number;
}

interface TierConfigurationPanelProps {
  dealTiers: DealTierData[];
  setDealTiers: (tiers: DealTierData[]) => void;
  calculateTierIncentiveCost: (tierNumber: number) => number;
  calculateGrossMarginGrowthRate: (tier: DealTierData) => number;
  calculateTierGrossProfit: (tier: DealTierData) => number;
  calculateTierNetValue: (tier: DealTierData) => number;
}

export function TierConfigurationPanel({
  dealTiers,
  setDealTiers,
  calculateTierIncentiveCost,
  calculateGrossMarginGrowthRate,
  calculateTierGrossProfit,
  calculateTierNetValue,
}: TierConfigurationPanelProps) {
  // Helper function to add a new tier
  const addTier = () => {
    const newTierNumber = dealTiers.length + 1;
    const newTier: DealTierData = {
      tierNumber: newTierNumber,
      annualRevenue: undefined,
      annualGrossMargin: undefined,
      annualGrossMarginPercent: undefined,
      incentivePercentage: undefined,
      incentiveNotes: "",
      incentiveType: "rebate",
      incentiveThreshold: undefined,
      incentiveAmount: undefined,
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

  return (
    <div className="space-y-6">
      {/* Header with Add Tier Button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-semibold">Deal Tier Configuration</h3>
        </div>
        <Button
          type="button"
          onClick={addTier}
          variant="outline"
          size="sm"
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Tier
        </Button>
      </div>

      {/* Render each tier */}
      <div className="space-y-4">
        {dealTiers.map((tier) => {
          const incentiveCost = calculateTierIncentiveCost(tier.tierNumber);
          const growthRate = calculateGrossMarginGrowthRate(tier);
          const grossProfit = calculateTierGrossProfit(tier);
          const netValue = calculateTierNetValue(tier);

          return (
            <Card key={tier.tierNumber} className="border-l-4 border-l-blue-500">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="text-sm">
                      Tier {tier.tierNumber}
                    </Badge>
                    {tier.annualRevenue && (
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <DollarSign className="h-4 w-4" />
                        {formatCurrency(tier.annualRevenue)}
                      </div>
                    )}
                  </div>
                  {dealTiers.length > 1 && (
                    <Button
                      type="button"
                      onClick={() => removeTier(tier.tierNumber)}
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* Financial Information */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      Annual Revenue <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="number"
                      placeholder="Enter tier revenue"
                      value={tier.annualRevenue || ""}
                      onChange={(e) => {
                        const value = e.target.value === "" ? undefined : parseFloat(e.target.value);
                        updateTier(tier.tierNumber, { annualRevenue: value });
                      }}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Expected revenue for this tier
                    </p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      Gross Margin % <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      placeholder="Enter margin %"
                      value={tier.annualGrossMarginPercent || ""}
                      onChange={(e) => {
                        const value = e.target.value === "" ? undefined : parseFloat(e.target.value);
                        updateTier(tier.tierNumber, { 
                          annualGrossMarginPercent: value,
                          annualGrossMargin: tier.annualRevenue ? (tier.annualRevenue * (value || 0)) / 100 : undefined
                        });
                      }}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Gross margin percentage
                    </p>
                  </div>
                </div>

                {/* Incentive Configuration */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
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
                        {INCENTIVE_TYPE_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
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

                {/* Tier Notes */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Tier Notes
                  </label>
                  <Textarea
                    placeholder="Notes about this tier's structure, targets, or special conditions..."
                    value={tier.incentiveNotes || ""}
                    onChange={(e) => {
                      updateTier(tier.tierNumber, { incentiveNotes: e.target.value });
                    }}
                    className="min-h-[80px]"
                  />
                </div>

                {/* Calculated Metrics */}
                {(tier.annualRevenue && tier.annualGrossMarginPercent) && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">
                      Tier Performance Metrics
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center">
                        <div className="text-lg font-bold text-green-600">
                          {formatCurrency(grossProfit)}
                        </div>
                        <div className="text-xs text-gray-600">Gross Profit</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-orange-600">
                          {formatCurrency(incentiveCost)}
                        </div>
                        <div className="text-xs text-gray-600">Incentive Cost</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-blue-600">
                          {formatCurrency(netValue)}
                        </div>
                        <div className="text-xs text-gray-600">Net Value</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-purple-600">
                          {formatPercentage(growthRate)}
                        </div>
                        <div className="text-xs text-gray-600">YoY Growth</div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Tier Summary */}
      {dealTiers.length > 1 && (
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-base text-blue-800">
              Multi-Tier Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-xl font-bold text-blue-600">
                  {dealTiers.length}
                </div>
                <div className="text-sm text-blue-700">Total Tiers</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-green-600">
                  {formatCurrency(
                    dealTiers.reduce((sum, tier) => sum + (tier.annualRevenue || 0), 0)
                  )}
                </div>
                <div className="text-sm text-green-700">Total Revenue</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-orange-600">
                  {formatCurrency(
                    dealTiers.reduce((sum, tier) => sum + calculateTierIncentiveCost(tier.tierNumber), 0)
                  )}
                </div>
                <div className="text-sm text-orange-700">Total Incentives</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-purple-600">
                  {formatCurrency(
                    dealTiers.reduce((sum, tier) => sum + calculateTierNetValue(tier), 0)
                  )}
                </div>
                <div className="text-sm text-purple-700">Total Net Value</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}