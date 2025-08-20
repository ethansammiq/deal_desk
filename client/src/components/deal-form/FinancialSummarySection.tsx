import { DealTier } from "@/hooks/useDealTiers";
import { useDealCalculations } from "../../hooks/useDealCalculations";
import { useFinancialData } from "@/hooks/useFinancialData";
import { memo } from "react";
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
import { QueryStateHandler, SectionLoading } from "@/components/ui/loading-states";

interface FinancialSummarySectionProps {
  dealTiers: DealTier[];
  salesChannel?: string;
  advertiserName?: string;
  agencyName?: string;
}

function FinancialSummarySection({ 
  dealTiers, 
  salesChannel = "independent_agency",
  advertiserName,
  agencyName 
}: FinancialSummarySectionProps) {
  // ✅ MIGRATED: Use shared financial data hook
  const { agenciesQuery, advertisersQuery, isLoading, hasError, agenciesData, advertisersData } = useFinancialData();
  
  // Use shared calculation service with clean data arrays
  const { calculationService } = useDealCalculations(advertisersData, agenciesData);

  // Use shared service for all calculations (no duplicate logic)

  // Get consistent baseline values from shared service
  const lastYearIncentiveCost = calculationService.getPreviousYearIncentiveCost(salesChannel, advertiserName, agencyName);
  const lastYearGrossProfit = calculationService.getPreviousYearGrossProfit(salesChannel, advertiserName, agencyName);
  const lastYearGrossMargin = calculationService.getPreviousYearMargin(salesChannel, advertiserName, agencyName);
  const lastYearRevenue = calculationService.getPreviousYearValue(salesChannel, advertiserName, agencyName);

  // ✅ SIMPLIFIED: Use shared loading/error states  
  if (isLoading) {
    return <SectionLoading title="Loading Financial Data..." rows={5} />;
  }

  if (hasError) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">Error loading financial data. Please try again.</p>
      </div>
    );
  }

  return (
    <FinancialSection title="Financial Summary">
      <FinancialTable>
        <FinancialTableColGroup dealTiers={dealTiers} />
        
        <FinancialTableHeader>
          <tr>
            <FinancialHeaderCell isMetricName />
            <FinancialHeaderCell>Last Year</FinancialHeaderCell>
            {dealTiers.map((tier) => (
              <FinancialHeaderCell key={`fs-header-${tier.tierNumber}`}>
                Tier {tier.tierNumber}
              </FinancialHeaderCell>
            ))}
          </tr>
        </FinancialTableHeader>
              
        <FinancialTableBody>
          {/* Adjusted Gross Margin */}
          <tr>
            <FinancialDataCell isMetricLabel>
              <FinancialMetricLabel 
                title="Adjusted Gross Margin"
                description="Gross margin after incentives"
              />
            </FinancialDataCell>
            <FinancialDataCell>
              {/* Display last year adjusted gross margin - not raw gross margin */}
              {(() => {
                const lastYearAdjustedMargin = calculationService.getPreviousYearAdjustedGrossMargin(salesChannel, advertiserName, agencyName);
                return `${(lastYearAdjustedMargin * 100).toFixed(1)}%`;
              })()}
            </FinancialDataCell>
            {dealTiers.map((tier) => {
              // Use new consolidated approach: calculate adjusted margin from tier data
              const revenue = tier.annualRevenue || 0;
              const grossMarginDecimal = tier.annualGrossMargin || 0; // Already in decimal format (0.38 = 38%)
              const grossProfit = revenue * grossMarginDecimal;
              const incentiveCost = calculationService.calculateTierIncentiveCost(tier);
              const adjustedProfit = grossProfit - incentiveCost;
              const adjustedMarginDecimal = revenue > 0 ? adjustedProfit / revenue : 0;
              
              return (
                <FinancialDataCell key={`adj-margin-${tier.tierNumber}`}>
                  {(adjustedMarginDecimal * 100).toFixed(1)}%
                </FinancialDataCell>
              );
            })}
          </tr>
          
          {/* Adjusted Gross Profit */}
          <tr>
            <FinancialDataCell isMetricLabel>
              <FinancialMetricLabel 
                title="Adjusted Gross Profit"
                description="Gross profit after incentive costs"
              />
            </FinancialDataCell>
            <FinancialDataCell>
              {formatCurrency(calculationService.getPreviousYearAdjustedGrossProfit(salesChannel, advertiserName, agencyName))}
            </FinancialDataCell>
            {dealTiers.map((tier) => {
              // Use new consolidated approach: calculate adjusted profit directly from tier data
              const revenue = tier.annualRevenue || 0;
              const grossMarginDecimal = tier.annualGrossMargin || 0; // Already in decimal format
              const grossProfit = revenue * grossMarginDecimal;
              const incentiveCost = calculationService.calculateTierIncentiveCost(tier);
              const adjustedProfit = grossProfit - incentiveCost;
              
              return (
                <FinancialDataCell key={`adj-profit-${tier.tierNumber}`}>
                  {formatCurrency(adjustedProfit)}
                </FinancialDataCell>
              );
            })}
          </tr>
          
          {/* Adjusted Gross Margin Growth Rate */}
          <tr>
            <FinancialDataCell isMetricLabel>
              <FinancialMetricLabel 
                title="Adjusted Gross Margin Growth Rate"
                description="Percentage change in adjusted margin"
              />
            </FinancialDataCell>
            <FinancialDataCell>
              <span className="text-slate-500">—</span>
            </FinancialDataCell>
            {dealTiers.map((tier) => {
              // Use the calculation service method for consistency
              const marginGrowthRate = calculationService.calculateAdjustedGrossMarginGrowthRate(
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
          
          {/* Adjusted Gross Profit Growth Rate */}
          <tr>
            <FinancialDataCell isMetricLabel>
              <FinancialMetricLabel 
                title="Adjusted Gross Profit Growth Rate"
                description="Percentage increase in adjusted profit vs last year"
              />
            </FinancialDataCell>
            <FinancialDataCell>
              <span className="text-slate-500">—</span>
            </FinancialDataCell>
            {dealTiers.map((tier) => {
              // Use the calculation service method for consistency
              const profitGrowthRate = calculationService.calculateAdjustedGrossProfitGrowthRate(
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
        </FinancialTableBody>
      </FinancialTable>
    </FinancialSection>
  );
}

// Export memoized version for performance optimization
export default memo(FinancialSummarySection);

// Also export named version for backwards compatibility
export { FinancialSummarySection };