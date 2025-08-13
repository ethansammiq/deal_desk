import React from "react";
import { DealTier } from "@/hooks/useDealTiers";
import { useDealCalculations } from "@/hooks/useDealCalculations";
import { useQuery } from "@tanstack/react-query";
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
  // Fetch agencies and advertisers for calculation service
  const agenciesQuery = useQuery({ 
    queryKey: ["/api/agencies"],
    retry: 3,
    staleTime: 60000, // 1 minute
  });
  const advertisersQuery = useQuery({ 
    queryKey: ["/api/advertisers"],
    retry: 3,
    staleTime: 60000, // 1 minute
  });
  
  // Use shared calculation service with actual data
  const { calculationService } = useDealCalculations(advertisersQuery.data || [], agenciesQuery.data || []);
  
  // Get consistent baseline values from shared service with dynamic data
  const lastYearIncentiveCost = calculationService.getPreviousYearIncentiveCost(salesChannel, advertiserName, agencyName);
  const lastYearClientValue = calculationService.getPreviousYearClientValue(salesChannel, advertiserName, agencyName);
  
  // Show loading state while data is being fetched
  if (agenciesQuery.isLoading || advertisersQuery.isLoading) {
    return (
      <FinancialSection title="Cost & Value Analysis">
        <div className="text-center py-8">
          <p className="text-slate-500">Loading financial data...</p>
        </div>
      </FinancialSection>
    );
  }
  
  // Show error state if data fetch fails
  if (agenciesQuery.error || advertisersQuery.error) {
    return (
      <FinancialSection title="Cost & Value Analysis">
        <div className="text-center py-8">
          <p className="text-red-600">Error loading financial data. Please try again.</p>
        </div>
      </FinancialSection>
    );
  }

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