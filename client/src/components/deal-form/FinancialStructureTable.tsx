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
  // ✅ FIXED: Step 4 pure display - receive calculation service for consistent metrics
  salesChannel: string;
  advertiserName?: string;
  agencyName?: string;
  calculationService: any; // DealCalculationService instance from Step 3
}

export function FinancialStructureTable({
  dealTiers,
  salesChannel,
  advertiserName,
  agencyName,
  calculationService,
}: FinancialStructureTableProps) {
  // ✅ FIXED: Use same calculation service instance as Step 3

  // Don't render if no tiers for tiered deals, but allow flat commit to show with virtual tier
  if (dealTiers.length === 0) {
    return null;
  }

  // Get previous year values using same calculation service as step 3
  const previousYearValue = calculationService.getPreviousYearValue(salesChannel, advertiserName, agencyName);
  const previousYearGrossProfit = calculationService.getPreviousYearGrossProfit(salesChannel, advertiserName, agencyName);

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
            {/* Annual Revenue Row - EXACT match to Step 3 */}
            <tr>
              <FinancialDataCell isMetricLabel>
                <FinancialMetricLabel 
                  title="Annual Revenue"
                  description="Total revenue expected for the fiscal year"
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
            
            {/* Revenue Growth Rate Row - EXACT match to Step 3 */}
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
                // ✅ FIXED: Use same calculation as Step 3 (returns decimal, not percentage)
                const growthRate = calculationService.calculateRevenueGrowthRate(
                  tier,
                  salesChannel,
                  advertiserName,
                  agencyName
                );
                return (
                  <FinancialDataCell key={`rev-growth-${tier.tierNumber}`}>
                    <GrowthIndicator value={growthRate} />
                  </FinancialDataCell>
                );
              })}
            </tr>
            
            {/* Gross Margin Growth Rate Row - EXACT match to Step 3 */}
            <tr>
              <FinancialDataCell isMetricLabel>
                <FinancialMetricLabel 
                  title="Gross Margin Growth Rate"
                  description="Change in margin percentage vs last year"
                />
              </FinancialDataCell>
              <FinancialDataCell>
                <span className="text-slate-500">—</span>
              </FinancialDataCell>
              {dealTiers.map((tier) => {
                const marginGrowthRate = calculationService.calculateGrossMarginGrowthRate(
                  tier,
                  salesChannel,
                  advertiserName,
                  agencyName
                );
                return (
                  <FinancialDataCell key={`margin-growth-${tier.tierNumber}`}>
                    <GrowthIndicator value={marginGrowthRate} />
                  </FinancialDataCell>
                );
              })}
            </tr>
            
            {/* Gross Profit Growth Rate Row - EXACT match to Step 3 */}
            <tr>
              <FinancialDataCell isMetricLabel>
                <FinancialMetricLabel 
                  title="Gross Profit Growth Rate"
                  description="Change in dollar profit amount vs last year"
                />
              </FinancialDataCell>
              <FinancialDataCell>
                <span className="text-slate-500">—</span>
              </FinancialDataCell>
              {dealTiers.map((tier) => {
                const profitGrowthRate = calculationService.calculateProfitGrowthRate(
                  tier,
                  salesChannel,
                  advertiserName,
                  agencyName
                );
                return (
                  <FinancialDataCell key={`profit-growth-${tier.tierNumber}`}>
                    <GrowthIndicator value={profitGrowthRate} />
                  </FinancialDataCell>
                );
              })}
            </tr>
            
            {/* Total Incentive Cost Row */}
            <tr>
              <FinancialDataCell isMetricLabel>
                <FinancialMetricLabel 
                  title="Total Incentive Cost"
                  description="Total incentive value for this tier"
                />
              </FinancialDataCell>
              <FinancialDataCell>
                {formatCurrency(calculationService.getPreviousYearIncentiveCost(salesChannel, advertiserName, agencyName))}
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
            
            {/* Total Client Value Row */}
            <tr>
              <FinancialDataCell isMetricLabel>
                <FinancialMetricLabel 
                  title="Total Client Value"
                  description="Gross profit minus incentive costs"
                />
              </FinancialDataCell>
              <FinancialDataCell>
                {formatCurrency(previousYearGrossProfit - calculationService.getPreviousYearIncentiveCost(salesChannel, advertiserName, agencyName))}
              </FinancialDataCell>
              {dealTiers.map((tier) => {
                const adjustedGrossProfit = calculationService.calculateAdjustedGrossProfit(tier);
                return (
                  <FinancialDataCell key={`client-value-${tier.tierNumber}`}>
                    {formatCurrency(adjustedGrossProfit)}
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