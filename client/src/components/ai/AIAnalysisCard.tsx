import React from 'react';
import { AlertCircle, CheckCircle, TrendingUp, AlertTriangle, Lightbulb, DollarSign } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

interface AIAnalysis {
  riskLevel: 'low' | 'medium' | 'high';
  riskFactors: string[];
  recommendations: string[];
  dealScore: number;
  marketInsights: string[];
  competitiveAdvantages: string[];
  potentialConcerns: string[];
  strategicRecommendations: string[];
}

interface AIAnalysisCardProps {
  analysis: AIAnalysis | null;
  isLoading: boolean;
  error?: string | null;
  onRetry?: () => void;
}

export function AIAnalysisCard({ analysis, isLoading, error, onRetry }: AIAnalysisCardProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5" />
            AI Analysis
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <AlertCircle className="h-5 w-5" />
            AI Analysis Error
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertDescription>
              {error}
              {onRetry && (
                <button 
                  onClick={onRetry}
                  className="ml-2 underline text-sm"
                >
                  Retry Analysis
                </button>
              )}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (!analysis) return null;

  const getRiskIcon = (riskLevel: string) => {
    switch (riskLevel) {
      case 'low': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'medium': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'high': return <AlertCircle className="h-4 w-4 text-red-500" />;
      default: return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'low': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-blue-600" />
          AI Deal Analysis
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Deal Score & Risk Overview */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {getRiskIcon(analysis.riskLevel)}
            <div>
              <p className="font-medium">Risk Level</p>
              <Badge className={getRiskColor(analysis.riskLevel)}>
                {analysis.riskLevel.toUpperCase()}
              </Badge>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">Deal Score</p>
            <div className="flex items-center gap-1">
              <DollarSign className="h-4 w-4 text-green-600" />
              <span className="text-2xl font-bold">{analysis.dealScore}/100</span>
            </div>
          </div>
        </div>

        {/* Risk Factors */}
        {analysis.riskFactors.length > 0 && (
          <div>
            <h4 className="font-semibold mb-2 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-orange-500" />
              Risk Factors
            </h4>
            <ul className="space-y-1 text-sm">
              {analysis.riskFactors.map((risk, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-orange-500 mt-1">•</span>
                  <span>{risk}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Strategic Recommendations */}
        {analysis.strategicRecommendations.length > 0 && (
          <div>
            <h4 className="font-semibold mb-2 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-blue-500" />
              Strategic Recommendations
            </h4>
            <ul className="space-y-1 text-sm">
              {analysis.strategicRecommendations.map((rec, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-blue-500 mt-1">•</span>
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Market Insights */}
        {analysis.marketInsights.length > 0 && (
          <div>
            <h4 className="font-semibold mb-2 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-purple-500" />
              Market Insights
            </h4>
            <ul className="space-y-1 text-sm">
              {analysis.marketInsights.map((insight, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-purple-500 mt-1">•</span>
                  <span>{insight}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Competitive Advantages */}
        {analysis.competitiveAdvantages.length > 0 && (
          <div>
            <h4 className="font-semibold mb-2 flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              Competitive Advantages
            </h4>
            <ul className="space-y-1 text-sm">
              {analysis.competitiveAdvantages.map((advantage, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-green-500 mt-1">•</span>
                  <span>{advantage}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Potential Concerns */}
        {analysis.potentialConcerns.length > 0 && (
          <div>
            <h4 className="font-semibold mb-2 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-500" />
              Potential Concerns
            </h4>
            <ul className="space-y-1 text-sm">
              {analysis.potentialConcerns.map((concern, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-red-500 mt-1">•</span>
                  <span>{concern}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}