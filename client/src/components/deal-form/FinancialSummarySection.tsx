import { DealTier } from "../../../shared/schema";
import { useDealCalculations } from "../../hooks/useDealCalculations";
import { useQuery } from "@tanstack/react-query";

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
  // Fetch agencies and advertisers for calculation service
  const { data: agencies = [] } = useQuery({ queryKey: ["/api/agencies"] });
  const { data: advertisers = [] } = useQuery({ queryKey: ["/api/advertisers"] });
  
  // Use shared calculation service
  const { calculationService } = useDealCalculations(advertisers, agencies);

  // Use shared service for all calculations (no duplicate logic)

  // Get consistent baseline values from shared service
  const lastYearIncentiveCost = calculationService.getPreviousYearIncentiveCost();
  const lastYearGrossProfit = calculationService.getPreviousYearGrossProfit(salesChannel, advertiserName, agencyName);
  const lastYearGrossMargin = calculationService.getPreviousYearMargin(salesChannel, advertiserName, agencyName);

  return (
    <div className="space-y-4">
      <h4 className="text-lg font-semibold text-purple-600">Financial Summary</h4>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <colgroup>
            <col className="w-[40%]" />
            <col className="w-[20%]" />
            {dealTiers.map((tier) => (
              <col key={`fs-col-${tier.tierNumber}`} className="w-[20%]" />
            ))}
          </colgroup>
          
          <thead>
            <tr>
              <th className="text-left p-3 bg-slate-100 border border-slate-200"></th>
              <th className="text-center p-3 bg-slate-100 border border-slate-200 font-medium text-slate-700">
                Last Year
              </th>
              {dealTiers.map((tier) => (
                <th key={`fs-header-${tier.tierNumber}`} className="text-center p-3 bg-slate-100 border border-slate-200 font-medium text-slate-700">
                  Tier {tier.tierNumber}
                </th>
              ))}
            </tr>
          </thead>
              
          <tbody>
            {/* Adjusted Gross Margin */}
            <tr>
              <td className="p-3 border border-slate-200">
                <div>
                  <div className="font-medium text-slate-900">Adjusted Gross Margin</div>
                  <div className="text-sm text-slate-500">Gross margin after incentives</div>
                </div>
              </td>
              <td className="p-3 border border-slate-200 text-center font-medium">
                {lastYearGrossMargin.toFixed(1)}%
              </td>
              {dealTiers.map((tier) => {
                // Transform DealTier to service-compatible format and calculate adjusted margin
                const serviceTier = {
                  tierNumber: tier.tierNumber,
                  annualRevenue: tier.annualRevenue,
                  annualGrossMarginPercent: (tier.annualGrossMargin || 0) * 100 // Convert decimal to percentage
                };
                const adjustedMargin = calculationService.calculateAdjustedGrossMargin(
                  serviceTier as any, 
                  [], // selectedIncentives - empty for now
                  [] // tierIncentives - empty for now
                );
                
                return (
                  <td key={`adj-margin-${tier.tierNumber}`} className="p-3 border border-slate-200 text-center font-medium">
                    {(adjustedMargin * 100).toFixed(1)}%
                  </td>
                );
              })}
            </tr>
            
            {/* Adjusted Gross Profit */}
            <tr>
              <td className="p-3 border border-slate-200">
                <div>
                  <div className="font-medium text-slate-900">Adjusted Gross Profit</div>
                  <div className="text-sm text-slate-500">Gross profit after incentive costs</div>
                </div>
              </td>
              <td className="p-3 border border-slate-200 text-center font-medium">
                ${lastYearGrossProfit.toLocaleString()}
              </td>
              {dealTiers.map((tier) => {
                // Transform DealTier and calculate adjusted gross profit using shared service logic
                const revenue = tier.annualRevenue || 0;
                const serviceTier = {
                  tierNumber: tier.tierNumber,
                  annualRevenue: tier.annualRevenue,
                  annualGrossMarginPercent: (tier.annualGrossMargin || 0) * 100 // Convert decimal to percentage
                };
                const adjustedMargin = calculationService.calculateAdjustedGrossMargin(
                  serviceTier as any,
                  [], // selectedIncentives - empty for now
                  [] // tierIncentives - empty for now
                );
                const adjustedProfit = revenue * adjustedMargin;
                
                return (
                  <td key={`adj-profit-${tier.tierNumber}`} className="p-3 border border-slate-200 text-center font-medium">
                    ${adjustedProfit.toLocaleString()}
                  </td>
                );
              })}
            </tr>
            
            {/* Adjusted Gross Margin Growth Rate */}
            <tr>
              <td className="p-3 border border-slate-200">
                <div>
                  <div className="font-medium text-slate-900">Adjusted Gross Margin Growth Rate</div>
                  <div className="text-sm text-slate-500">Percentage change in adjusted margin</div>
                </div>
              </td>
              <td className="p-3 border border-slate-200 text-center font-medium text-slate-500">
                —
              </td>
              {dealTiers.map((tier) => {
                // Transform DealTier and use shared service to calculate adjusted gross margin growth rate
                const serviceTier = {
                  tierNumber: tier.tierNumber,
                  annualRevenue: tier.annualRevenue,
                  annualGrossMarginPercent: (tier.annualGrossMargin || 0) * 100 // Convert decimal to percentage
                };
                const growthRate = calculationService.calculateAdjustedGrossMarginGrowthRate(
                  serviceTier as any,
                  [], // selectedIncentives - empty for now
                  [], // tierIncentives - empty for now
                  salesChannel,
                  advertiserName,
                  agencyName
                );
                
                const growthRatePercent = growthRate * 100;
                const isNegative = growthRatePercent < 0;
                
                return (
                  <td key={`margin-growth-${tier.tierNumber}`} className={`p-3 border border-slate-200 text-center font-medium ${isNegative ? 'text-red-600' : 'text-green-600'}`}>
                    {growthRatePercent.toFixed(1)}%
                  </td>
                );
              })}
            </tr>
            
            {/* Adjusted Gross Profit Growth Rate */}
            <tr>
              <td className="p-3 border border-slate-200">
                <div>
                  <div className="font-medium text-slate-900">Adjusted Gross Profit Growth Rate</div>
                  <div className="text-sm text-slate-500">Percentage increase in adjusted profit vs last year</div>
                </div>
              </td>
              <td className="p-3 border border-slate-200 text-center font-medium text-slate-500">
                —
              </td>
              {dealTiers.map((tier) => {
                // Transform DealTier and use shared service to calculate adjusted gross profit growth rate
                const serviceTier = {
                  tierNumber: tier.tierNumber,
                  annualRevenue: tier.annualRevenue,
                  annualGrossMarginPercent: (tier.annualGrossMargin || 0) * 100 // Convert decimal to percentage
                };
                const growthRate = calculationService.calculateAdjustedGrossProfitGrowthRate(
                  serviceTier as any,
                  [], // selectedIncentives - empty for now  
                  [], // tierIncentives - empty for now
                  salesChannel,
                  advertiserName,
                  agencyName
                );
                
                const growthRatePercent = growthRate * 100;
                const isNegative = growthRatePercent < 0;
                
                return (
                  <td key={`profit-growth-${tier.tierNumber}`} className={`p-3 border border-slate-200 text-center font-medium ${isNegative ? 'text-red-600' : 'text-green-600'}`}>
                    {growthRatePercent.toFixed(1)}%
                  </td>
                );
              })}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}