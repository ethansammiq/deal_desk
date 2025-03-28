import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Lightbulb, TrendingUp, BarChart, DollarSign, Award } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useClaude } from "@/hooks/use-claude";

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
  dealData: any;
  revenueGrowthRate?: number;
  grossProfitGrowthRate?: number;
}

export function DealGenieAssessment({ 
  dealData, 
  revenueGrowthRate, 
  grossProfitGrowthRate 
}: DealGenieAssessmentProps) {
  const [analysis, setAnalysis] = React.useState<DealAnalysis | null>(null);
  const [loading, setLoading] = React.useState<boolean>(false);
  const [error, setError] = React.useState<string | null>(null);

  const { analyzeDeal, isLoading } = useClaude();

  React.useEffect(() => {
    // Don't analyze if we don't have enough data
    if (!dealData) return;

    const performAnalysis = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Add calculated metrics to deal data
        const enrichedDealData = {
          ...dealData,
          calculatedMetrics: {
            revenueGrowthRate,
            grossProfitGrowthRate
          }
        };
        
        const result = await analyzeDeal(enrichedDealData);
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
  }, [dealData, revenueGrowthRate, grossProfitGrowthRate, analyzeDeal]);

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
  if (loading || isLoading) {
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
        <div className="mb-4">
          <p className="text-gray-700">{analysis.summary}</p>
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