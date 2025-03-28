import { useState, useCallback } from 'react';
import { apiRequest } from '@/lib/queryClient';

interface UseClaudeOptions {
  defaultSystemPrompt?: string;
}

interface ClaudeResponse {
  content: string;
}

interface DealAnalysisScore {
  score: number;
  analysis: string;
}

interface DealAnalysis {
  revenueGrowth: DealAnalysisScore;
  marginImprovement: DealAnalysisScore;
  profitabilityImpact: DealAnalysisScore;
  overallValue: DealAnalysisScore & {
    recommendation: "approve" | "review" | "reject";
  };
  summary: string;
}

interface DealRecommendation {
  optimizations: Array<{
    area: string;
    suggestion: string;
    impact: string;
  }>;
  recommendedIncentives: Array<{
    name: string;
    reason: string;
  }>;
  similarDeals: Array<{
    name: string;
    outcome: string;
    keyLearning: string;
  }>;
  approvalPath: {
    currentCategory: "standard" | "non-standard";
    approver: "Managing Director" | "Executive Committee";
    estimatedTime: string;
  };
}

interface MarketAnalysis {
  marketTrends: Array<{
    trend: string;
    impact: string;
    recommendation: string;
  }>;
  competitiveAnalysis: {
    summary: string;
    keyCompetitors: Array<{
      name: string;
      strategy: string;
    }>;
  };
  risks: Array<{
    type: string;
    description: string;
    mitigationStrategy: string;
  }>;
  approvalConsiderations: {
    marketFactors: string;
    suggestedApprovalPath: "Managing Director" | "Executive Committee";
    reasoning: string;
  };
}

export function useClaude(options: UseClaudeOptions = {}) {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [response, setResponse] = useState<ClaudeResponse | null>(null);

  const query = useCallback(
    async (
      userQuery: string,
      systemPrompt: string = options.defaultSystemPrompt || 'Be precise and concise.'
    ): Promise<ClaudeResponse> => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await apiRequest<ClaudeResponse>('/api/ai/query', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: userQuery, systemPrompt }),
        });

        setResponse(result);
        return result;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
        setError(errorMessage);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [options.defaultSystemPrompt]
  );

  const analyzeDeal = useCallback(async (dealData: any): Promise<DealAnalysis> => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await apiRequest<DealAnalysis>('/api/ai/analyze-deal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dealData),
      });

      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getDealRecommendations = useCallback(async (dealData: any): Promise<DealRecommendation> => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await apiRequest<DealRecommendation>('/api/ai/deal-recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dealData),
      });

      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getMarketAnalysis = useCallback(async (dealData: any): Promise<MarketAnalysis> => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await apiRequest<MarketAnalysis>('/api/ai/market-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dealData),
      });

      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    query,
    analyzeDeal,
    getDealRecommendations,
    getMarketAnalysis,
    isLoading,
    error,
    response,
  };
}