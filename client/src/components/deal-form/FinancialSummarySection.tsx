import { DealTier } from "@shared/schema";
import { useDealCalculations } from "../../hooks/useDealCalculations";
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
import { QueryStateHandler, SectionLoading } from "@/components/ui/loading-states";

interface FinancialSummarySectionProps {
  dealTiers: DealTier[];
  salesChannel?: string;
  advertiserName?: string;
  agencyName?: string;
}

export function FinancialSummarySection({ 
  dealTiers, 
  salesChannel = "independent_agency",
  advertiserName,
  agencyName 
}: FinancialSummarySectionProps) {
  // Fetch agencies and advertisers for calculation service with error handling
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
  
  // Use shared calculation service with query data
  const { calculationService } = useDealCalculations(advertisersQuery.data || [], agenciesQuery.data || []);

  // Use shared service for all calculations (no duplicate logic)

  // Get consistent baseline values from shared service
  const lastYearIncentiveCost = calculationService.getPreviousYearIncentiveCost();
  const lastYearGrossProfit = calculationService.getPreviousYearGrossProfit(salesChannel, advertiserName, agencyName);
  const lastYearGrossMargin = calculationService.getPreviousYearMargin(salesChannel, advertiserName, agencyName);

  // Show loading or error states for data dependencies
  if (agenciesQuery.isLoading || advertisersQuery.isLoading) {
    return <SectionLoading title="Loading Financial Data..." rows={5} />;
  }

  if (agenciesQuery.error || advertisersQuery.error) {
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
              {lastYearGrossMargin.toFixed(1)}%
            </FinancialDataCell>
            {dealTiers.map((tier) => {
              // Direct use of DealTier with adjusted calculation service method
              const adjustedMargin = calculationService.calculateAdjustedGrossMargin(
                {
                  tierNumber: tier.tierNumber,
                  annualRevenue: tier.annualRevenue,
                  annualGrossMarginPercent: (tier.annualGrossMargin || 0) * 100 // Convert from decimal to percentage
                } as any,
                [], // No selected incentives from DealTier yet
                []  // No tier incentives from DealTier yet
              );
              
              return (
                <FinancialDataCell key={`adj-margin-${tier.tierNumber}`}>
                  {(adjustedMargin * 100).toFixed(1)}%
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
              {formatCurrency(lastYearGrossProfit)}
            </FinancialDataCell>
            {dealTiers.map((tier) => {
              // Use shared service for adjusted gross profit calculation
              const adjustedProfit = calculationService.calculateAdjustedGrossProfit(
                {
                  tierNumber: tier.tierNumber,
                  annualRevenue: tier.annualRevenue,
                  annualGrossMarginPercent: (tier.annualGrossMargin || 0) * 100 // Convert from decimal to percentage
                } as any,
                [], // No selected incentives from DealTier yet
                []  // No tier incentives from DealTier yet
              );
              
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
              // Use shared service to calculate adjusted gross margin growth rate
              const growthRate = calculationService.calculateAdjustedGrossMarginGrowthRate(
                {
                  tierNumber: tier.tierNumber,
                  annualRevenue: tier.annualRevenue,
                  annualGrossMarginPercent: (tier.annualGrossMargin || 0) * 100 // Convert from decimal to percentage
                } as any,
                [], // No selected incentives from DealTier yet
                [], // No tier incentives from DealTier yet
                salesChannel,
                advertiserName,
                agencyName
              );
              
              return (
                <FinancialDataCell key={`margin-growth-${tier.tierNumber}`}>
                  <GrowthIndicator value={growthRate} />
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
              // Use shared service to calculate adjusted gross profit growth rate
              const growthRate = calculationService.calculateAdjustedGrossProfitGrowthRate(
                {
                  tierNumber: tier.tierNumber,
                  annualRevenue: tier.annualRevenue,
                  annualGrossMarginPercent: (tier.annualGrossMargin || 0) * 100 // Convert from decimal to percentage
                } as any,
                [], // No selected incentives from DealTier yet
                [], // No tier incentives from DealTier yet
                salesChannel,
                advertiserName,
                agencyName
              );
              
              return (
                <FinancialDataCell key={`profit-growth-${tier.tierNumber}`}>
                  <GrowthIndicator value={growthRate} />
                </FinancialDataCell>
              );
            })}
          </tr>
        </FinancialTableBody>
      </FinancialTable>
    </FinancialSection>
  );
}