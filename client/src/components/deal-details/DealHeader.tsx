import { Badge } from "@/components/ui/badge";
import { DealStatusBadge } from "@/components/deal-status/DealStatusBadge";
import { formatCurrency, formatPercentage } from "@/lib/utils";
import { TierDataAccess } from "@/utils/tier-data-access";
import { DollarSign, TrendingUp, Award, AlertTriangle } from "lucide-react";
import { DealTier } from "@/hooks/useDealTiers";
import { Deal } from "@shared/schema";

interface DealHeaderProps {
  deal: Deal;
  tiers: DealTier[];
  aiScore?: number;
  bottleneckCount?: number;
}

export function DealHeader({ deal, tiers, aiScore, bottleneckCount }: DealHeaderProps) {
  // Calculate key financial metrics using existing TierDataAccess
  const annualRevenue = TierDataAccess.getExpectedRevenue(tiers);
  const adjustedGrossMargin = TierDataAccess.getExpectedGrossMargin(tiers);
  const adjustedGrossProfit = TierDataAccess.getExpectedGrossProfit(tiers);

  const getScoreColor = (score: number) => {
    if (score >= 8) return "text-green-600";
    if (score >= 6) return "text-blue-600";
    if (score >= 4) return "text-yellow-600";
    return "text-red-600";
  };

  const getAIRecommendation = (score: number) => {
    if (score >= 8) return { text: "Strongly Approve", color: "bg-green-100 text-green-800" };
    if (score >= 6) return { text: "Approve", color: "bg-blue-100 text-blue-800" };
    if (score >= 4) return { text: "Review", color: "bg-yellow-100 text-yellow-800" };
    return { text: "Needs Work", color: "bg-red-100 text-red-800" };
  };

  const aiRec = aiScore ? getAIRecommendation(aiScore) : null;

  return (
    <div className="bg-white border-b border-gray-200">
      {/* Deal Title & Status */}
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{deal.dealName}</h1>
            <p className="text-sm text-gray-500 mt-1">#{deal.referenceNumber}</p>
          </div>
          <DealStatusBadge status={deal.status as any} />
        </div>
      </div>

      {/* KPI Strip */}
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Annual Revenue */}
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <DollarSign className="h-4 w-4 text-green-600" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Revenue</p>
              <p className="text-lg font-bold text-gray-900">
                {annualRevenue ? formatCurrency(annualRevenue) : 'N/A'}
              </p>
            </div>
          </div>

          {/* Adjusted Gross Margin */}
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <TrendingUp className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Margin</p>
              <p className="text-lg font-bold text-gray-900">
                {adjustedGrossMargin ? formatPercentage(adjustedGrossMargin) : 'N/A'}
              </p>
            </div>
          </div>

          {/* Adjusted Gross Profit */}
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <TrendingUp className="h-4 w-4 text-purple-600" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Profit</p>
              <p className="text-lg font-bold text-gray-900">
                {adjustedGrossProfit ? formatCurrency(adjustedGrossProfit) : 'N/A'}
              </p>
            </div>
          </div>

          {/* AI Score & Bottlenecks */}
          <div className="flex items-center gap-3">
            <div className="flex flex-col gap-1">
              {/* AI Score */}
              {aiScore && aiRec && (
                <div className="flex items-center gap-2">
                  <Award className="h-3 w-3 text-purple-500" />
                  <span className="text-xs font-medium text-gray-500">AI:</span>
                  <Badge className={`text-xs px-2 py-0.5 ${aiRec.color}`}>
                    {aiRec.text}
                  </Badge>
                </div>
              )}
              
              {/* Bottlenecks */}
              {bottleneckCount && bottleneckCount > 0 && (
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-3 w-3 text-red-500" />
                  <span className="text-xs font-medium text-red-600">
                    {bottleneckCount} Bottleneck{bottleneckCount > 1 ? 's' : ''}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}