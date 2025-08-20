import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatPercentage } from "@/lib/utils";
import { DealTier, getTotalIncentiveValue } from "@/hooks/useDealTiers";
import {
  FinancialTable,
  FinancialTableColGroup,
  FinancialTableHeader,
  FinancialTableBody,
  FinancialHeaderCell,
  FinancialDataCell,
  FinancialMetricLabel,
  GrowthIndicator,
} from "@/components/ui/financial-table";

interface FinancialStructureTableProps {
  dealTiers: DealTier[];
  // ✅ FIXED: Step 4 pure display - receive pre-calculated data instead of making new calculations
  previousYearValue: number;
  previousYearGrossProfit: number;
  previousYearIncentiveCost: number;
}

export function FinancialStructureTable({
  dealTiers,
  previousYearValue,
  previousYearGrossProfit, 
  previousYearIncentiveCost,
}: FinancialStructureTableProps) {
  // ❌ REMOVED: Data fetching and calculations - this is now pure display

  // Don't render if no tiers for tiered deals, but allow flat commit to show with virtual tier
  if (dealTiers.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Financial Structure</CardTitle>
      </CardHeader>
      <CardContent>
        <FinancialTable>
          <FinancialTableColGroup dealTiers={dealTiers} />
          
          <FinancialTableHeader>
            <tr>
              <FinancialHeaderCell isMetricName />
              <FinancialHeaderCell>Last Year</FinancialHeaderCell>
              {dealTiers.map((tier) => (
                <FinancialHeaderCell key={`header-${tier.tierNumber}`}>
                  Tier {tier.tierNumber}
                </FinancialHeaderCell>
              ))}
            </tr>
          </FinancialTableHeader>
          
          <FinancialTableBody>
            {/* Annual Revenue Row */}
            <tr>
              <FinancialDataCell isMetricLabel>
                <FinancialMetricLabel 
                  title="Annual Revenue"
                  description="Total expected annual revenue"
                />
              </FinancialDataCell>
              <FinancialDataCell>
                {formatCurrency(previousYearValue)}
              </FinancialDataCell>
              {dealTiers.map((tier) => (
                <FinancialDataCell key={`revenue-${tier.tierNumber}`}>
                  {formatCurrency(tier.annualRevenue || 0)}
                </FinancialDataCell>
              ))}
            </tr>
            
            {/* Revenue Growth Rate Row */}
            <tr>
              <FinancialDataCell isMetricLabel>
                <FinancialMetricLabel 
                  title="Revenue Growth Rate"
                  description="Percentage increase compared to last year"
                />
              </FinancialDataCell>
              <FinancialDataCell>
                <span className="text-slate-500">—</span>
              </FinancialDataCell>
              {dealTiers.map((tier) => {
                // Calculate growth rate using tier data and previous year value
                const growthRate = previousYearValue > 0 
                  ? ((tier.annualRevenue || 0) - previousYearValue) / previousYearValue * 100 
                  : 0;
                return (
                  <FinancialDataCell key={`revenue-growth-${tier.tierNumber}`}>
                    <GrowthIndicator value={growthRate} />
                  </FinancialDataCell>
                );
              })}
            </tr>
            
            {/* Gross Margin Row */}
            <tr>
              <FinancialDataCell isMetricLabel>
                <FinancialMetricLabel 
                  title="Gross Margin"
                  description="Annual gross margin amount"
                />
              </FinancialDataCell>
              <FinancialDataCell>
                {formatCurrency(previousYearGrossProfit)}
              </FinancialDataCell>
              {dealTiers.map((tier) => {
                const grossMargin = (tier.annualRevenue || 0) * (tier.annualGrossMargin || 0);
                return (
                  <FinancialDataCell key={`margin-${tier.tierNumber}`}>
                    {formatCurrency(grossMargin)}
                  </FinancialDataCell>
                );
              })}
            </tr>
            
            {/* Incentive Cost Row */}
            <tr>
              <FinancialDataCell isMetricLabel>
                <FinancialMetricLabel 
                  title="Incentive Cost"
                  description="Total incentive value for this tier"
                />
              </FinancialDataCell>
              <FinancialDataCell>
                {formatCurrency(previousYearIncentiveCost)}
              </FinancialDataCell>
              {dealTiers.map((tier) => {
                const incentiveCost = getTotalIncentiveValue(tier);
                return (
                  <FinancialDataCell key={`incentive-${tier.tierNumber}`}>
                    {formatCurrency(incentiveCost)}
                  </FinancialDataCell>
                );
              })}
            </tr>
            
            {/* Net Profit Row */}
            <tr>
              <FinancialDataCell isMetricLabel>
                <FinancialMetricLabel 
                  title="Net Profit"
                  description="Gross margin minus incentive costs"
                />
              </FinancialDataCell>
              <FinancialDataCell>
                {formatCurrency(previousYearGrossProfit - previousYearIncentiveCost)}
              </FinancialDataCell>
              {dealTiers.map((tier) => {
                const grossMargin = (tier.annualRevenue || 0) * (tier.annualGrossMargin || 0);
                const incentiveCost = getTotalIncentiveValue(tier);
                const netProfit = grossMargin - incentiveCost;
                return (
                  <FinancialDataCell key={`profit-${tier.tierNumber}`}>
                    {formatCurrency(netProfit)}
                  </FinancialDataCell>
                );
              })}
            </tr>
          </FinancialTableBody>
        </FinancialTable>
      </CardContent>
    </Card>
  );
}