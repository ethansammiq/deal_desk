import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Lightbulb, TrendingUp, BarChart, DollarSign, Award } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useClaude } from "@/hooks/use-claude";
import { useQuery } from "@tanstack/react-query";
import { DealCalculationService } from "@/services/dealCalculations";
import { DealTier } from "@/hooks/useDealTiers";

// Types for the AI analysis
interface AnalysisScore {
  score: number;
  analysis: string;
}

interface DealAnalysis {
  revenueGrowth: AnalysisScore;
  marginImprovement: AnalysisScore;
  profitabilityImpact: AnalysisScore;
  overallValue: AnalysisScore & {
    recommendation: "approve" | "review" | "reject";
  };
  summary: string;
}

interface DealGenieAssessmentProps {
  dealData: any; // Base deal record for metadata
  revenueGrowthRate?: number;
  grossProfitGrowthRate?: number;
  compact?: boolean; // New prop for lightweight Step 4 version
}

export function DealGenieAssessment({ 
  dealData, 
  revenueGrowthRate, 
  grossProfitGrowthRate,
  compact = false
}: DealGenieAssessmentProps) {
  const [analysis, setAnalysis] = React.useState<DealAnalysis | null>(null);
  const [loading, setLoading] = React.useState<boolean>(false);
  const [error, setError] = React.useState<string | null>(null);

  const { analyzeDeal, isLoading } = useClaude();

  // Fetch tier data for this deal
  const dealTiersQuery = useQuery({
    queryKey: ['/api/deals', dealData?.id, 'tiers'],
    queryFn: async (): Promise<DealTier[]> => {
      const response = await fetch(`/api/deals/${dealData?.id}/tiers`);
      if (!response.ok) {
        throw new Error('Failed to fetch deal tiers');
      }
      return response.json();
    },
    enabled: !!dealData?.id,
  });

  React.useEffect(() => {
    // Don't analyze if we don't have enough data
    if (!dealData || !dealTiersQuery.data) return;

    const performAnalysis = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Create AI analysis data from tier records (source of truth)
        const calculationService = new DealCalculationService();
        const aiAnalysisData = calculationService.createAIAnalysisData(
          dealTiersQuery.data,
          dealData.salesChannel,
          dealData.dealType,
          dealData.dealStructure,
          dealData.advertiserName,
          dealData.agencyName,
          dealData.addedValueBenefitsCost
        );
        
        if (!aiAnalysisData) {
          throw new Error('Unable to create analysis data from tier records');
        }
        
        // Add calculated metrics to tier-based data
        const enrichedAnalysisData = {
          ...aiAnalysisData,
          calculatedMetrics: {
            revenueGrowthRate,
            grossProfitGrowthRate
          }
        };
        
        const result = await analyzeDeal(enrichedAnalysisData);
        setAnalysis(result);
      } catch (err) {
        console.error('Error analyzing deal:', err);
        setError('Failed to analyze deal. Please try again later.');
        
        // Set fallback analysis
        setAnalysis({
          revenueGrowth: { 
            score: revenueGrowthRate && revenueGrowthRate > 0.05 ? 7 : 5, 
            analysis: "Based on provided growth rate."
          },
          marginImprovement: { 
            score: grossProfitGrowthRate && grossProfitGrowthRate > 0.03 ? 7 : 5, 
            analysis: "Based on provided margin growth."
          },
          profitabilityImpact: { 
            score: 6, 
            analysis: "Moderate positive impact expected."
          },
          overallValue: { 
            score: 6, 
            analysis: "Deal appears to have positive value, but verification needed.", 
            recommendation: "review" 
          },
          summary: "This deal shows positive indicators but should be reviewed by the team before approval."
        });
      } finally {
        setLoading(false);
      }
    };

    performAnalysis();
  }, [dealData, dealTiersQuery.data, revenueGrowthRate, grossProfitGrowthRate, analyzeDeal]);

  // Calculate color based on score
  const getScoreColor = (score: number) => {
    if (score >= 8) return "text-green-600";
    if (score >= 6) return "text-blue-600";
    if (score >= 4) return "text-yellow-600";
    return "text-red-600";
  };

  // Map recommendation to color and text
  const getRecommendationInfo = (recommendation: string) => {
    switch (recommendation) {
      case "approve":
        return { color: "bg-green-100 text-green-800", text: "Approve" };
      case "review":
        return { color: "bg-yellow-100 text-yellow-800", text: "Review" };
      case "reject":
        return { color: "bg-red-100 text-red-800", text: "Reject" };
      default:
        return { color: "bg-gray-100 text-gray-800", text: "Review" };
    }
  };

  // Return placeholder while loading
  if (loading || isLoading || dealTiersQuery.isLoading) {
    if (compact) {
      return (
        <Card className="border-purple-200 bg-purple-50">
          <CardContent className="p-4">
            <div className="animate-pulse space-y-3">
              <div className="flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-purple-600" />
                <div className="h-4 bg-purple-200 rounded w-32"></div>
              </div>
              <div className="h-3 bg-purple-200 rounded w-3/4"></div>
              <div className="flex justify-between">
                <div className="h-4 bg-purple-200 rounded w-20"></div>
                <div className="h-4 bg-purple-200 rounded w-16"></div>
              </div>
            </div>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card className="mt-6 overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-purple-700 to-indigo-600 text-white">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <Lightbulb className="h-6 w-6" />
              <CardTitle>DealGenie Assessment</CardTitle>
            </div>
            <Badge className="bg-white/20 text-white hover:bg-white/25">
              AI Powered
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-slate-200 rounded w-3/4"></div>
            <div className="space-y-2">
              <div className="h-4 bg-slate-200 rounded"></div>
              <div className="h-4 bg-slate-200 rounded w-5/6"></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="h-4 bg-slate-200 rounded w-1/2"></div>
                <div className="h-4 bg-slate-200 rounded w-3/4"></div>
              </div>
              <div className="space-y-2">
                <div className="h-4 bg-slate-200 rounded w-1/2"></div>
                <div className="h-4 bg-slate-200 rounded w-3/4"></div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Skip rendering if no analysis available
  if (!analysis) return null;
  
  const recInfo = getRecommendationInfo(analysis.overallValue.recommendation);

  // Compact version for Step 4 integration
  if (compact) {
    // Get the top performing metric for quick insight
    const metrics = [
      { name: "Revenue Growth", score: analysis.revenueGrowth.score, icon: TrendingUp },
      { name: "Margin Improvement", score: analysis.marginImprovement.score, icon: BarChart },
      { name: "Profitability", score: analysis.profitabilityImpact.score, icon: DollarSign }
    ];
    const topMetric = metrics.reduce((prev, current) => (prev.score > current.score) ? prev : current);
    const TopIcon = topMetric.icon;

    return (
      <Card className="border-purple-200 bg-purple-50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-purple-600" />
              <span className="text-sm font-medium text-purple-900">DealGenie Insights</span>
            </div>
            <Badge className={`text-xs px-2 py-1 ${recInfo.color}`}>
              {recInfo.text}
            </Badge>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-purple-800">Overall Value Score</span>
              <span className={`text-sm font-semibold ${getScoreColor(analysis.overallValue.score)}`}>
                {analysis.overallValue.score}/10
              </span>
            </div>
            
            <div className="flex items-center gap-2 text-xs text-purple-700">
              <TopIcon className="h-3 w-3" />
              <span>Strongest: {topMetric.name} ({topMetric.score}/10)</span>
            </div>
            
            <p className="text-xs text-purple-700 leading-relaxed">
              {analysis.summary.split('.')[0]}.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Full version (original implementation)
  return (
    <Card className="mt-6 overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-purple-700 to-indigo-600 text-white">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Lightbulb className="h-6 w-6" />
            <CardTitle>DealGenie Assessment</CardTitle>
          </div>
          <Badge className="bg-white/20 text-white hover:bg-white/25">
            AI Powered
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        {/* Executive Summary */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Executive Summary</h3>
          <p className="text-gray-700 leading-relaxed">{analysis.summary}</p>
        </div>

        {/* Overall Value Score */}
        <div className="mb-6 p-4 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg border border-purple-200">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-md font-semibold text-purple-900">Overall Value Assessment</h4>
            <div className="flex items-center gap-2">
              <span className={`text-2xl font-bold ${getScoreColor(analysis.overallValue.score)}`}>
                {analysis.overallValue.score}/10
              </span>
              <Badge className={`${recInfo.color}`}>
                {recInfo.text}
              </Badge>
            </div>
          </div>
          <p className="text-sm text-purple-800">{analysis.overallValue.analysis}</p>
        </div>

        <div className="flex flex-col md:flex-row justify-between mb-6">
          <Badge className={`text-sm px-3 py-1 ${recInfo.color}`}>
            Recommendation: {recInfo.text}
          </Badge>
          <div className="flex items-center mt-2 md:mt-0">
            <Award className="h-5 w-5 text-indigo-500 mr-1" />
            <span className="text-sm font-semibold">
              Overall Value Score: 
              <span className={getScoreColor(analysis.overallValue.score)}>
                {" "}{analysis.overallValue.score}/10
              </span>
            </span>
          </div>
        </div>

        <Separator className="my-4" />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <div className="flex items-center">
              <TrendingUp className="h-5 w-5 text-blue-500 mr-2" />
              <h3 className="font-medium text-gray-900">Revenue Growth</h3>
            </div>
            <p className="text-sm text-gray-600">{analysis.revenueGrowth.analysis}</p>
            <div className="flex items-center">
              <span className={`text-sm font-semibold ${getScoreColor(analysis.revenueGrowth.score)}`}>
                Score: {analysis.revenueGrowth.score}/10
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center">
              <BarChart className="h-5 w-5 text-green-500 mr-2" />
              <h3 className="font-medium text-gray-900">Margin Improvement</h3>
            </div>
            <p className="text-sm text-gray-600">{analysis.marginImprovement.analysis}</p>
            <div className="flex items-center">
              <span className={`text-sm font-semibold ${getScoreColor(analysis.marginImprovement.score)}`}>
                Score: {analysis.marginImprovement.score}/10
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center">
              <DollarSign className="h-5 w-5 text-purple-500 mr-2" />
              <h3 className="font-medium text-gray-900">Profitability Impact</h3>
            </div>
            <p className="text-sm text-gray-600">{analysis.profitabilityImpact.analysis}</p>
            <div className="flex items-center">
              <span className={`text-sm font-semibold ${getScoreColor(analysis.profitabilityImpact.score)}`}>
                Score: {analysis.profitabilityImpact.score}/10
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center">
              <Award className="h-5 w-5 text-indigo-500 mr-2" />
              <h3 className="font-medium text-gray-900">Overall Value</h3>
            </div>
            <p className="text-sm text-gray-600">{analysis.overallValue.analysis}</p>
            <div className="flex items-center">
              <span className={`text-sm font-semibold ${getScoreColor(analysis.overallValue.score)}`}>
                Score: {analysis.overallValue.score}/10
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}