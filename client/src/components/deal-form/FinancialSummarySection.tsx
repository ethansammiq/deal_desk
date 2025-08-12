import { DealTier } from "@/shared/schema";
import { Card, CardContent } from "@/components/ui/card";

interface FinancialSummarySectionProps {
  dealTiers: DealTier[];
}

export function FinancialSummarySection({ dealTiers }: FinancialSummarySectionProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-slate-900 bg-gradient-to-r from-purple-700 to-indigo-500 bg-clip-text text-transparent">
            Financial Summary
          </h3>
          
          <div className="overflow-x-auto bg-gray-50 rounded-lg p-4">
            <table className="w-full border-collapse">
              <colgroup>
                <col className="w-[40%]" />
                <col className="w-[15%]" />
                {dealTiers.map((tier) => (
                  <col key={`fs-col-${tier.tierNumber}`} className="w-[15%]" />
                ))}
              </colgroup>
              
              <thead>
                <tr>
                  <th className="text-left p-3 bg-white border border-gray-200"></th>
                  <th className="text-center p-3 bg-white border border-gray-200 font-medium text-gray-700">
                    Last Year
                  </th>
                  {dealTiers.map((tier) => (
                    <th key={`fs-header-${tier.tierNumber}`} className="text-center p-3 bg-white border border-gray-200 font-medium text-gray-700">
                      Tier {tier.tierNumber}
                    </th>
                  ))}
                </tr>
              </thead>
              
              <tbody>
                {/* Adjusted Gross Margin */}
                <tr>
                  <td className="p-3 border border-gray-200 bg-white">
                    <div>
                      <div className="font-medium text-gray-900">Adjusted Gross Margin</div>
                      <div className="text-sm text-blue-500">Gross margin after incentives</div>
                    </div>
                  </td>
                  <td className="p-3 border border-gray-200 text-center font-medium bg-white">
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
                      <td key={`adj-margin-${tier.tierNumber}`} className="p-3 border border-gray-200 text-center font-medium bg-white">
                        {adjustedMargin.toFixed(1)}%
                      </td>
                    );
                  })}
                </tr>
                
                {/* Adjusted Gross Profit */}
                <tr>
                  <td className="p-3 border border-gray-200 bg-white">
                    <div>
                      <div className="font-medium text-gray-900">Adjusted Gross Profit</div>
                      <div className="text-sm text-blue-500">Gross profit after incentive costs</div>
                    </div>
                  </td>
                  <td className="p-3 border border-gray-200 text-center font-medium bg-white">
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
                      <td key={`adj-profit-${tier.tierNumber}`} className="p-3 border border-gray-200 text-center font-medium bg-white">
                        ${adjustedProfit.toLocaleString()}
                      </td>
                    );
                  })}
                </tr>
                
                {/* Adjusted Gross Margin Growth Rate */}
                <tr>
                  <td className="p-3 border border-gray-200 bg-white">
                    <div>
                      <div className="font-medium text-gray-900">Adjusted Gross Margin Growth Rate</div>
                      <div className="text-sm text-blue-500">Percentage change in adjusted margin</div>
                    </div>
                  </td>
                  <td className="p-3 border border-gray-200 text-center font-medium text-gray-500 bg-white">
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
                      <td key={`margin-growth-${tier.tierNumber}`} className={`p-3 border border-gray-200 text-center font-medium bg-white ${isNegative ? 'text-red-600' : 'text-green-600'}`}>
                        {growthRate.toFixed(1)}%
                      </td>
                    );
                  })}
                </tr>
                
                {/* Adjusted Gross Profit Growth Rate */}
                <tr>
                  <td className="p-3 border border-gray-200 bg-white">
                    <div>
                      <div className="font-medium text-gray-900">Adjusted Gross Profit Growth Rate</div>
                      <div className="text-sm text-blue-500">Percentage increase in adjusted profit vs last year</div>
                    </div>
                  </td>
                  <td className="p-3 border border-gray-200 text-center font-medium text-gray-500 bg-white">
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
                      <td key={`profit-growth-${tier.tierNumber}`} className={`p-3 border border-gray-200 text-center font-medium bg-white ${isNegative ? 'text-red-600' : 'text-green-600'}`}>
                        {growthRate.toFixed(1)}%
                      </td>
                    );
                  })}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}