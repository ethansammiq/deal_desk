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
import { Plus, Trash2, TrendingUp, DollarSign, Info } from "lucide-react";
import {
  FormFieldWithTooltip,
  FinancialInputGroup,
  INCENTIVE_TYPE_OPTIONS,
} from "@/components/ui/form-components";
import {
  formatCurrency,
  formatPercentage,
} from "@/lib/utils";

// Import unified interface from hook
import { DealTier, useDealTiers } from "@/hooks/useDealTiers";
import { DEAL_CONSTANTS, INCENTIVE_CONSTANTS } from "@/config/businessConstants";
// ✅ PHASE 2: Removed useTierManagement - functionality absorbed into useDealTiers

// ✅ PHASE 2: Simplified interface - no more external state management
interface TierConfigurationPanelProps {
  initialTiers?: DealTier[];                      // Optional initial tiers
  maxTiers?: number;                              // Maximum tier limit
  minTiers?: number;                              // Minimum tier limit
  dealStructure?: "tiered" | "flat_commit" | ""; // For flat deal support
  calculateTierIncentiveCost: (tierNumber: number) => number;
  calculateGrossMarginGrowthRate: (tier: DealTier) => number;
  calculateTierGrossProfit: (tier: DealTier) => number;
  calculateTierNetValue: (tier: DealTier) => number;
  onTiersChange?: (tiers: DealTier[]) => void;    // Optional callback for tier changes
}

export function TierConfigurationPanel({
  initialTiers = [],
  maxTiers = 5,
  minTiers = 1,
  dealStructure = "tiered",
  calculateTierIncentiveCost,
  calculateGrossMarginGrowthRate,
  calculateTierGrossProfit,
  calculateTierNetValue,
  onTiersChange
}: TierConfigurationPanelProps) {
  // ✅ PHASE 2: Self-contained tier management using enhanced useDealTiers
  const tierManager = useDealTiers({
    initialTiers,
    maxTiers,
    minTiers,
    supportFlatDeals: true,
    dealStructure
  });
  
  // Notify parent of tier changes if callback provided
  React.useEffect(() => {
    if (onTiersChange) {
      onTiersChange(tierManager.tiers);
    }
  }, [tierManager.tiers, onTiersChange]);
  
  const { addTier, removeTier, updateTier } = tierManager;
  const dealTiers = tierManager.tiers;

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
                      value={tier.annualGrossMargin || ""}
                      onChange={(e) => {
                        const value = e.target.value === "" ? undefined : parseFloat(e.target.value);
                        updateTier(tier.tierNumber, { 
                          annualGrossMargin: value
                        });
                      }}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Gross margin percentage
                    </p>
                  </div>
                </div>

                {/* ✅ PHASE 2: Incentive configuration removed - now handled by IncentiveSelector */}
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center gap-2 text-blue-800">
                    <Info className="h-4 w-4" />
                    <span className="text-sm font-medium">Incentive Management</span>
                  </div>
                  <p className="text-sm text-blue-700 mt-1">
                    Incentives for this tier are managed through the Incentive Structure section. 
                    Current incentives: {tier.incentives?.length || 0} configured.
                  </p>
                </div>

                {/* Calculated Metrics */}
                {(tier.annualRevenue && tier.annualGrossMargin) && (
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