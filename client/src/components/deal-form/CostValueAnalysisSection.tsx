import React from "react";
import { DealTier } from "@/hooks/useDealTiers";
import { useDealCalculations } from "@/hooks/useDealCalculations";
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
  salesChannel?: string;
  advertiserName?: string;
  agencyName?: string;
}

export function CostValueAnalysisSection({
  dealTiers,
  salesChannel = "independent_agency",
  advertiserName,
  agencyName
}: CostValueAnalysisSectionProps) {
  // Use shared calculation service for all calculations
  const { calculationService } = useDealCalculations();
  
  // Get consistent baseline values from shared service with dynamic data
  const lastYearIncentiveCost = calculationService.getPreviousYearIncentiveCost(salesChannel, advertiserName, agencyName);
  const lastYearClientValue = calculationService.getPreviousYearClientValue(salesChannel, advertiserName, agencyName);

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
                {formatCurrency(calculationService.calculateTierIncentiveCost(tier))}
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
              const growthRate = calculationService.calculateIncentiveCostGrowthRate(tier, salesChannel, advertiserName, agencyName);
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
              {formatCurrency(lastYearClientValue)}
            </FinancialDataCell>
            {dealTiers.map((tier) => {
              const expectedValue = calculationService.calculateClientValueFromIncentives(tier);
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
              const valueGrowthRate = calculationService.calculateClientValueGrowthRateFromIncentives(tier, salesChannel, advertiserName, agencyName);
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