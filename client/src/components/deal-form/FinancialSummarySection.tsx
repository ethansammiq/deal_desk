import { DealTier } from "../../../shared/schema";

interface FinancialSummarySectionProps {
  dealTiers: DealTier[];
}

export function FinancialSummarySection({ dealTiers }: FinancialSummarySectionProps) {
  return (
    <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
      {/* Header matching the legacy design */}
      <div className="px-4 py-3 bg-slate-50 border-b border-slate-200">
        <h3 className="text-sm font-medium text-purple-600">Financial Summary</h3>
      </div>
      
      <div className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <colgroup>
              <col className="w-[40%]" />
              <col className="w-[15%]" />
              {dealTiers.map((tier) => (
                <col key={`fs-col-${tier.tierNumber}`} className="w-[15%]" />
              ))}
            </colgroup>
            
            <thead>
              <tr className="bg-slate-50">
                <th className="text-left px-4 py-3 border-b border-slate-200 font-medium text-slate-700"></th>
                <th className="text-center px-4 py-3 border-b border-slate-200 font-medium text-slate-700">
                  Last Year
                </th>
                {dealTiers.map((tier) => (
                  <th key={`fs-header-${tier.tierNumber}`} className="text-center px-4 py-3 border-b border-slate-200 font-medium text-slate-700">
                    Tier {tier.tierNumber}
                  </th>
                ))}
              </tr>
            </thead>
              
            <tbody>
              {/* Adjusted Gross Margin */}
              <tr className="border-b border-slate-200">
                <td className="px-4 py-3 bg-white">
                  <div className="font-medium text-slate-900">Adjusted Gross Margin</div>
                  <div className="text-xs text-slate-500">Gross margin after incentives</div>
                </td>
                <td className="px-4 py-3 text-center font-medium bg-white text-slate-900">
                  26.8%
                </td>
                {dealTiers.map((tier) => {
                  // Calculate adjusted margin: (revenue - incentive cost) / revenue
                  const revenue = tier.annualRevenue || 0;
                  const incentiveCost = tier.incentiveValue || 0;
                  const adjustedMargin = revenue > 0 
                    ? ((revenue - incentiveCost) / revenue) * 100 
                    : 0;
                  return (
                    <td key={`adj-margin-${tier.tierNumber}`} className="px-4 py-3 text-center font-medium bg-white text-slate-900">
                      {adjustedMargin.toFixed(1)}%
                    </td>
                  );
                })}
              </tr>
              
              {/* Adjusted Gross Profit */}
              <tr className="border-b border-slate-200">
                <td className="px-4 py-3 bg-white">
                  <div className="font-medium text-slate-900">Adjusted Gross Profit</div>
                  <div className="text-xs text-slate-500">Gross profit after incentive costs</div>
                </td>
                <td className="px-4 py-3 text-center font-medium bg-white text-slate-900">
                  $1,879,600
                </td>
                {dealTiers.map((tier) => {
                  // Calculate: original gross profit - incentive costs
                  const revenue = tier.annualRevenue || 0;
                  const grossMargin = tier.annualGrossMargin || 0;
                  const incentiveCost = tier.incentiveValue || 0;
                  const grossProfit = revenue * grossMargin;
                  const adjustedProfit = grossProfit - incentiveCost;
                  return (
                    <td key={`adj-profit-${tier.tierNumber}`} className="px-4 py-3 text-center font-medium bg-white text-slate-900">
                      ${adjustedProfit.toLocaleString()}
                    </td>
                  );
                })}
              </tr>
              
              {/* Adjusted Gross Margin Growth Rate */}
              <tr className="border-b border-slate-200">
                <td className="px-4 py-3 bg-white">
                  <div className="font-medium text-slate-900">Adjusted Gross Margin Growth Rate</div>
                  <div className="text-xs text-slate-500">Percentage change in adjusted margin</div>
                </td>
                <td className="px-4 py-3 text-center font-medium text-slate-500 bg-white">
                  —
                </td>
                {dealTiers.map((tier) => {
                  const revenue = tier.annualRevenue || 0;
                  const incentiveCost = tier.incentiveValue || 0;
                  const currentMargin = revenue > 0 
                    ? ((revenue - incentiveCost) / revenue) * 100 
                    : 0;
                  const lastYearMargin = 26.8;
                  const growthRate = lastYearMargin > 0 
                    ? ((currentMargin - lastYearMargin) / lastYearMargin) * 100 
                    : 0;
                  const isNegative = growthRate < 0;
                  return (
                    <td key={`margin-growth-${tier.tierNumber}`} className={`px-4 py-3 text-center font-medium bg-white ${isNegative ? 'text-red-600' : 'text-green-600'}`}>
                      {isNegative ? '' : '+'}{growthRate.toFixed(1)}%
                    </td>
                  );
                })}
              </tr>
              
              {/* Adjusted Gross Profit Growth Rate */}
              <tr>
                <td className="px-4 py-3 bg-white">
                  <div className="font-medium text-slate-900">Adjusted Gross Profit Growth Rate</div>
                  <div className="text-xs text-slate-500">Percentage increase in adjusted profit vs last year</div>
                </td>
                <td className="px-4 py-3 text-center font-medium text-slate-500 bg-white">
                  —
                </td>
                {dealTiers.map((tier) => {
                  const revenue = tier.annualRevenue || 0;
                  const grossMargin = tier.annualGrossMargin || 0;
                  const incentiveCost = tier.incentiveValue || 0;
                  const grossProfit = revenue * grossMargin;
                  const currentProfit = grossProfit - incentiveCost;
                  const lastYearProfit = 1879600;
                  const growthRate = lastYearProfit > 0 
                    ? ((currentProfit - lastYearProfit) / lastYearProfit) * 100 
                    : 0;
                  const isNegative = growthRate < 0;
                  return (
                    <td key={`profit-growth-${tier.tierNumber}`} className={`px-4 py-3 text-center font-medium bg-white ${isNegative ? 'text-red-600' : 'text-green-600'}`}>
                      {isNegative ? '' : '+'}{growthRate.toFixed(1)}%
                    </td>
                  );
                })}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}