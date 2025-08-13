import React from "react";
import { DealTier, getTotalIncentiveValue } from "@/hooks/useDealTiers";
import {
  FinancialSection,
  FinancialTable,
  FinancialTableHeader,
  FinancialHeaderCell,
  FinancialTableBody,
  FinancialDataCell,
  FinancialMetricLabel,
  GrowthIndicator,
  FinancialTableColGroup,
  formatCurrency
} from "@/components/ui/financial-table";

interface CostValueAnalysisSectionProps {
  dealTiers: DealTier[];
}

export function CostValueAnalysisSection({
  dealTiers
}: CostValueAnalysisSectionProps) {
  // Calculate incentive cost using the new getTotalIncentiveValue function
  const calculateTierIncentiveCost = (tierNumber: number): number => {
    const tier = dealTiers.find(t => t.tierNumber === tierNumber);
    return tier ? getTotalIncentiveValue(tier) : 0;
  };

  // Calculate last year incentive cost (using default)
  const lastYearIncentiveCost = 50000;

  return (
    <FinancialSection title="Cost & Value Analysis">
      <FinancialTable>
        <FinancialTableColGroup dealTiers={dealTiers} />
        
        <FinancialTableHeader>
          <tr>
            <FinancialHeaderCell isMetricName />
            <FinancialHeaderCell>Last Year</FinancialHeaderCell>
            {dealTiers.map((tier) => (
              <FinancialHeaderCell key={`cost-header-${tier.tierNumber}`}>
                Tier {tier.tierNumber}
              </FinancialHeaderCell>
            ))}
          </tr>
        </FinancialTableHeader>
        
        <FinancialTableBody>
          <tr>
            <FinancialDataCell isMetricLabel>
              <FinancialMetricLabel 
                title="Total Incentive Cost"
                description="All incentives applied to this tier"
              />
            </FinancialDataCell>
            <FinancialDataCell>
              {formatCurrency(lastYearIncentiveCost)}
            </FinancialDataCell>
            {dealTiers.map((tier) => (
              <FinancialDataCell key={`cost-${tier.tierNumber}`}>
                {formatCurrency(calculateTierIncentiveCost(tier.tierNumber))}
              </FinancialDataCell>
            ))}
          </tr>
          
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
              const currentCost = calculateTierIncentiveCost(tier.tierNumber);
              const growthRate = lastYearIncentiveCost > 0 
                ? ((currentCost - lastYearIncentiveCost) / lastYearIncentiveCost) 
                : 0;
              return (
                <FinancialDataCell key={`growth-${tier.tierNumber}`}>
                  <GrowthIndicator value={growthRate} invertColors={true} />
                </FinancialDataCell>
              );
            })}
          </tr>
          
          <tr>
            <FinancialDataCell isMetricLabel>
              <FinancialMetricLabel 
                title="Total Client Value"
                description="Expected business value from incentive"
              />
            </FinancialDataCell>
            <FinancialDataCell>
              {formatCurrency(340000)}
            </FinancialDataCell>
            {dealTiers.map((tier) => {
              // Calculate expected value (3.5x multiplier - more realistic ROI)
              const incentiveCost = calculateTierIncentiveCost(tier.tierNumber);
              const expectedValue = incentiveCost * 3.5;
              return (
                <FinancialDataCell key={`value-${tier.tierNumber}`}>
                  {formatCurrency(expectedValue)}
                </FinancialDataCell>
              );
            })}
          </tr>
          
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
              const incentiveCost = calculateTierIncentiveCost(tier.tierNumber);
              const expectedValue = incentiveCost * 3.5;
              const lastYearValue = 340000;
              const valueGrowthRate = lastYearValue > 0 
                ? ((expectedValue - lastYearValue) / lastYearValue) 
                : 0;
              return (
                <FinancialDataCell key={`value-growth-${tier.tierNumber}`}>
                  <GrowthIndicator value={valueGrowthRate} />
                </FinancialDataCell>
              );
            })}
          </tr>
        </FinancialTableBody>
      </FinancialTable>
    </FinancialSection>
  );
}