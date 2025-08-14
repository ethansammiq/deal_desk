import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { DealTier } from "@/hooks/useDealTiers";
import { useDealCalculations } from "@/hooks/useDealCalculations";
import { useFinancialData } from "@/hooks/useFinancialData";
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
  salesChannel: string;
  advertiserName?: string;
  agencyName?: string;
}

export function FinancialStructureTable({
  dealTiers,
  salesChannel,
  advertiserName,
  agencyName,
}: FinancialStructureTableProps) {
  const { agenciesData, advertisersData } = useFinancialData();
  const dealCalculations = useDealCalculations(advertisersData, agenciesData);

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
                {formatCurrency(dealCalculations.getPreviousYearValue(salesChannel, advertiserName, agencyName))}
              </FinancialDataCell>
              {dealTiers.map((tier) => (
                <FinancialDataCell key={`revenue-${tier.tierNumber}`}>
                  {formatCurrency(tier.annualRevenue || 0)}
                </FinancialDataCell>
              ))}
            </tr>
            
            {/* Revenue Growth Rate Row - Match Step 3 exactly */}
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
                const growthRate = dealCalculations.calculationService.calculateRevenueGrowthRate(
                  tier,
                  salesChannel,
                  advertiserName,
                  agencyName
                );
                return (
                  <FinancialDataCell key={`revenue-growth-${tier.tierNumber}`}>
                    <GrowthIndicator value={growthRate} />
                  </FinancialDataCell>
                );
              })}
            </tr>
            
            {/* Adjusted Gross Margin Growth Rate Row */}
            <tr>
              <FinancialDataCell isMetricLabel>
                <FinancialMetricLabel 
                  title="Adjusted Gross Margin Growth Rate"
                  description="Change in margin percentage vs last year"
                />
              </FinancialDataCell>
              <FinancialDataCell>
                <span className="text-slate-500">—</span>
              </FinancialDataCell>
              {dealTiers.map((tier) => {
                const marginGrowthRate = dealCalculations.calculationService.calculateAdjustedGrossMarginGrowthRate(
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
            
            {/* Adjusted Gross Profit Growth Rate Row */}
            <tr>
              <FinancialDataCell isMetricLabel>
                <FinancialMetricLabel 
                  title="Adjusted Gross Profit Growth Rate"
                  description="Change in dollar profit amount vs last year"
                />
              </FinancialDataCell>
              <FinancialDataCell>
                <span className="text-slate-500">—</span>
              </FinancialDataCell>
              {dealTiers.map((tier) => {
                const profitGrowthRate = dealCalculations.calculationService.calculateAdjustedGrossProfitGrowthRate(
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
                  description="All incentives applied to this tier"
                />
              </FinancialDataCell>
              <FinancialDataCell>
                {formatCurrency(dealCalculations.calculationService.getPreviousYearIncentiveCost(salesChannel, advertiserName, agencyName))}
              </FinancialDataCell>
              {dealTiers.map((tier) => (
                <FinancialDataCell key={`cost-${tier.tierNumber}`}>
                  {formatCurrency(dealCalculations.calculationService.calculateTierIncentiveCost(tier))}
                </FinancialDataCell>
              ))}
            </tr>
            
            {/* Total Client Value Row */}
            <tr>
              <FinancialDataCell isMetricLabel>
                <FinancialMetricLabel 
                  title="Total Client Value"
                  description="Expected business value from incentive"
                />
              </FinancialDataCell>
              <FinancialDataCell>
                {formatCurrency(dealCalculations.calculationService.getPreviousYearClientValue(salesChannel, advertiserName, agencyName))}
              </FinancialDataCell>
              {dealTiers.map((tier) => (
                <FinancialDataCell key={`value-${tier.tierNumber}`}>
                  {formatCurrency(dealCalculations.calculationService.calculateClientValueFromIncentives(tier))}
                </FinancialDataCell>
              ))}
            </tr>
            
            {/* Incentive Cost Growth Rate Row - Moved above Client Value Growth Rate */}
            <tr>
              <FinancialDataCell isMetricLabel>
                <FinancialMetricLabel 
                  title="Incentive Cost Growth Rate"
                  description="Change vs. last year"
                />
              </FinancialDataCell>
              <FinancialDataCell>
                <span className="text-slate-500">—</span>
              </FinancialDataCell>
              {dealTiers.map((tier) => {
                const growthRate = dealCalculations.calculationService.calculateIncentiveCostGrowthRate(tier, salesChannel, advertiserName, agencyName);
                return (
                  <FinancialDataCell key={`cost-growth-${tier.tierNumber}`}>
                    <GrowthIndicator value={growthRate} invertColors={true} />
                  </FinancialDataCell>
                );
              })}
            </tr>
            
            {/* Client Value Growth Rate Row */}
            <tr>
              <FinancialDataCell isMetricLabel>
                <FinancialMetricLabel 
                  title="Client Value Growth Rate"
                  description="Change vs. last year"
                />
              </FinancialDataCell>
              <FinancialDataCell>
                <span className="text-slate-500">—</span>
              </FinancialDataCell>
              {dealTiers.map((tier) => {
                const growthRate = dealCalculations.calculationService.calculateClientValueGrowthRateFromIncentives(tier, salesChannel, advertiserName, agencyName);
                return (
                  <FinancialDataCell key={`client-value-growth-${tier.tierNumber}`}>
                    <GrowthIndicator value={growthRate} />
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