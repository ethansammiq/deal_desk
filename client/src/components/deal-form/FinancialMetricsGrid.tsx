import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency, formatPercentage } from "@/lib/utils";
import { DealTier } from "@/hooks/useDealTiers";

// Import the function from the correct location
const getTotalIncentiveValue = (tier: DealTier): number => {
  if (!tier.incentives || tier.incentives.length === 0) return 0;
  return tier.incentives.reduce((total, incentive) => total + (incentive.value || 0), 0);
};

interface FinancialMetricsGridProps {
  dealTiers: DealTier[];
  contractTerm: number;
}

export function FinancialMetricsGrid({ dealTiers, contractTerm }: FinancialMetricsGridProps) {
  // Calculate metrics directly from deal tiers
  const totalAnnualRevenue = dealTiers.reduce((sum, tier) => sum + (tier.annualRevenue || 0), 0);
  const totalGrossMargin = dealTiers.reduce((sum, tier) => sum + ((tier.annualRevenue || 0) * (tier.annualGrossMargin || 0)), 0);
  const totalIncentiveValue = dealTiers.reduce((sum, tier) => sum + getTotalIncentiveValue(tier), 0);
  const projectedNetValue = (totalAnnualRevenue - totalIncentiveValue) * (contractTerm / 12);
  const averageGrossMarginPercent = totalAnnualRevenue > 0 ? (totalGrossMargin / totalAnnualRevenue) * 100 : 0;

  return (
    <Card>
      <CardContent className="p-6">
        {/* Key Financial Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {formatCurrency(totalAnnualRevenue)}
            </div>
            <div className="text-sm text-gray-600">Total Revenue</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(totalGrossMargin)}
            </div>
            <div className="text-sm text-gray-600">Gross Margin</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">
              {formatCurrency(totalIncentiveValue)}
            </div>
            <div className="text-sm text-gray-600">Total Incentives</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {formatCurrency(projectedNetValue)}
            </div>
            <div className="text-sm text-gray-600">Net Value</div>
          </div>
        </div>

        {/* Additional Financial Details - Using meaningful metrics */}
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Gross Margin %</label>
              <p className="text-lg font-semibold">
                {formatPercentage(averageGrossMarginPercent / 100)}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Contract Value</label>
              <p className="text-lg font-semibold">
                {formatCurrency(projectedNetValue)}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Revenue Per Month</label>
              <p className="text-lg font-semibold">
                {formatCurrency(totalAnnualRevenue / 12)}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}