import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

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

interface DealData {
  dealType?: string;
  salesChannel?: string;
  region?: string;
  advertiserName?: string;
  agencyName?: string;
  dealStructure?: string;
  annualRevenue?: number;
  contractTermMonths?: string;
  termStartDate?: string;
  termEndDate?: string;
  businessSummary?: string;
}

export function useAIAnalysis() {
  const [analysisData, setAnalysisData] = useState<DealData | null>(null);
  const [manualTrigger, setManualTrigger] = useState(0);

  // Query for AI analysis
  const {
    data: analysis,
    isLoading,
    error,
    refetch
  } = useQuery<AIAnalysis>({
    queryKey: ['/api/ai/analyze-deal', analysisData, manualTrigger],
    queryFn: () => apiRequest('/api/ai/analyze-deal', {
      method: 'POST',
      body: JSON.stringify(analysisData),
      headers: {
        'Content-Type': 'application/json',
      },
    }),
    enabled: !!analysisData,
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Trigger analysis with deal data
  const triggerAnalysis = useCallback((data: DealData) => {
    setAnalysisData(data);
    setManualTrigger(prev => prev + 1);
  }, []);

  // Retry analysis
  const retryAnalysis = useCallback(() => {
    if (analysisData) {
      setManualTrigger(prev => prev + 1);
      refetch();
    }
  }, [analysisData, refetch]);

  return {
    analysis,
    isLoading,
    error: error?.message || null,
    triggerAnalysis,
    retryAnalysis,
    hasData: !!analysisData
  };
}