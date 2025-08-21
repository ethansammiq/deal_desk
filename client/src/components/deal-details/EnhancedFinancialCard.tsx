import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DollarSign, TrendingUp, TrendingDown, Minus, Target } from "lucide-react";
import { formatCurrency, formatPercentage } from "@/lib/utils";
import { TierDataAccess } from "@/utils/tier-data-access";
import { DealTier } from "@/hooks/useDealTiers";

interface FinancialMetrics {
  annualRevenue: number;
  adjustedGrossMargin: number;
  adjustedGrossProfit: number;
  totalIncentiveCosts: number;
  displayTier?: number;
}

interface EnhancedFinancialCardProps {
  tiers: DealTier[];
  dealStructure: string;
  className?: string;
}

export function EnhancedFinancialCard({ 
  tiers, 
  dealStructure,
  className 
}: EnhancedFinancialCardProps) {
  
  const getFinancialMetrics = (): FinancialMetrics => {
    const expectedRevenue = TierDataAccess.getExpectedRevenue(tiers);
    const expectedMargin = TierDataAccess.getExpectedGrossMargin(tiers);
    const expectedIncentives = TierDataAccess.getExpectedIncentiveCost(tiers);
    const expectedProfit = TierDataAccess.getExpectedGrossProfit(tiers);
    
    const expectedTier = TierDataAccess.getExpectedTier(tiers);
    const displayTier = expectedTier?.tierNumber;

    return {
      annualRevenue: expectedRevenue,
      adjustedGrossMargin: expectedMargin,
      adjustedGrossProfit: expectedProfit,
      totalIncentiveCosts: expectedIncentives,
      displayTier
    };
  };

  const financialMetrics = getFinancialMetrics();

  const getMarginTrendIcon = (margin: number) => {
    if (margin > 0.15) return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (margin > 0.10) return <Minus className="h-4 w-4 text-yellow-500" />;
    return <TrendingDown className="h-4 w-4 text-red-500" />;
  };

  const getMarginDescription = (margin: number, tier?: number) => {
    const base = margin > 0.15 ? 'Strong margin after costs' : 
                 margin > 0.10 ? 'Fair margin after costs' : 'Low margin after costs';
    return tier ? `${base} (Tier ${tier} expected)` : base;
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-green-600" />
            <CardTitle>Financial Performance</CardTitle>
          </div>
          {dealStructure === "tiered" && financialMetrics.displayTier && (
            <Badge variant="outline" className="flex items-center gap-1">
              <Target className="h-3 w-3" />
              Tier {financialMetrics.displayTier}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Revenue & Margin Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg border border-green-200">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-green-800">Annual Revenue</span>
              <DollarSign className="h-4 w-4 text-green-600" />
            </div>
            <p className="text-2xl font-bold text-green-700 mt-1">
              {financialMetrics.annualRevenue ? formatCurrency(financialMetrics.annualRevenue) : 'N/A'}
            </p>
            <p className="text-xs text-green-600 mt-1">
              {dealStructure === "tiered" ? 
                `Expected tier performance${financialMetrics.displayTier ? ` (Tier ${financialMetrics.displayTier})` : ''}` : 
                "Primary revenue target"}
            </p>
          </div>
          
          <div className="bg-gradient-to-r from-blue-50 to-cyan-50 p-4 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-blue-800">Adjusted Gross Margin</span>
              {getMarginTrendIcon(financialMetrics.adjustedGrossMargin)}
            </div>
            <p className="text-2xl font-bold text-blue-700 mt-1">
              {financialMetrics.adjustedGrossMargin ? formatPercentage(financialMetrics.adjustedGrossMargin) : 'N/A'}
            </p>
            <p className="text-xs text-blue-600 mt-1">
              {getMarginDescription(financialMetrics.adjustedGrossMargin, financialMetrics.displayTier)}
            </p>
          </div>
        </div>

        {/* Profit & Incentives Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-gradient-to-r from-purple-50 to-violet-50 p-4 rounded-lg border border-purple-200">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-purple-800">Adjusted Gross Profit</span>
              <TrendingUp className="h-4 w-4 text-purple-600" />
            </div>
            <p className="text-2xl font-bold text-purple-700 mt-1">
              {financialMetrics.adjustedGrossProfit ? formatCurrency(financialMetrics.adjustedGrossProfit) : 'N/A'}
            </p>
            <p className="text-xs text-purple-600 mt-1">
              {financialMetrics.displayTier ? 
                `Tier ${financialMetrics.displayTier} profit after costs` : 
                'Profit after all incentive costs'}
            </p>
          </div>
          
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-4 rounded-lg border border-amber-200">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-amber-800">Total Incentive Costs</span>
              <Target className="h-4 w-4 text-amber-600" />
            </div>
            <p className="text-2xl font-bold text-amber-700 mt-1">
              {financialMetrics.totalIncentiveCosts ? formatCurrency(financialMetrics.totalIncentiveCosts) : '$0'}
            </p>
            <p className="text-xs text-amber-600 mt-1">
              Investment to secure deal
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}