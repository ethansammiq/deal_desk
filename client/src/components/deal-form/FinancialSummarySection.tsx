import { DealTier } from "../../../shared/schema";

interface FinancialSummarySectionProps {
  dealTiers: DealTier[];
}

export function FinancialSummarySection({ dealTiers }: FinancialSummarySectionProps) {
  // Use same calculation logic as Cost & Value Analysis
  const calculateTierIncentiveCost = (tierNumber: number): number => {
    const tier = dealTiers.find(t => t.tierNumber === tierNumber);
    return tier?.incentiveValue || 0;
  };

  // Consistent baseline values with Cost & Value Analysis
  const lastYearIncentiveCost = 50000;
  const lastYearGrossProfit = 1879600;
  const lastYearGrossMargin = 26.8;

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
                // Calculate adjusted margin: (gross profit - incentive cost) / revenue
                const revenue = tier.annualRevenue || 0;
                const grossMargin = tier.annualGrossMargin || 0;
                const incentiveCost = calculateTierIncentiveCost(tier.tierNumber);
                const grossProfit = revenue * grossMargin;
                const adjustedProfit = grossProfit - incentiveCost;
                const adjustedMargin = revenue > 0 ? (adjustedProfit / revenue) * 100 : 0;
                
                return (
                  <td key={`adj-margin-${tier.tierNumber}`} className="p-3 border border-slate-200 text-center font-medium">
                    {adjustedMargin.toFixed(1)}%
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
                // Calculate: original gross profit - incentive costs
                const revenue = tier.annualRevenue || 0;
                const grossMargin = tier.annualGrossMargin || 0;
                const incentiveCost = calculateTierIncentiveCost(tier.tierNumber);
                const grossProfit = revenue * grossMargin;
                const adjustedProfit = grossProfit - incentiveCost;
                
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
                const revenue = tier.annualRevenue || 0;
                const grossMargin = tier.annualGrossMargin || 0;
                const incentiveCost = calculateTierIncentiveCost(tier.tierNumber);
                const grossProfit = revenue * grossMargin;
                const adjustedProfit = grossProfit - incentiveCost;
                const currentMargin = revenue > 0 ? (adjustedProfit / revenue) * 100 : 0;
                
                const growthRate = lastYearGrossMargin > 0 
                  ? ((currentMargin - lastYearGrossMargin) / lastYearGrossMargin) * 100 
                  : 0;
                const isNegative = growthRate < 0;
                
                return (
                  <td key={`margin-growth-${tier.tierNumber}`} className={`p-3 border border-slate-200 text-center font-medium ${isNegative ? 'text-red-600' : 'text-green-600'}`}>
                    {growthRate.toFixed(1)}%
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
                const revenue = tier.annualRevenue || 0;
                const grossMargin = tier.annualGrossMargin || 0;
                const incentiveCost = calculateTierIncentiveCost(tier.tierNumber);
                const grossProfit = revenue * grossMargin;
                const currentProfit = grossProfit - incentiveCost;
                
                const growthRate = lastYearGrossProfit > 0 
                  ? ((currentProfit - lastYearGrossProfit) / lastYearGrossProfit) * 100 
                  : 0;
                const isNegative = growthRate < 0;
                
                return (
                  <td key={`profit-growth-${tier.tierNumber}`} className={`p-3 border border-slate-200 text-center font-medium ${isNegative ? 'text-red-600' : 'text-green-600'}`}>
                    {growthRate.toFixed(1)}%
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