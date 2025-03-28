import { useState, useCallback } from 'react';
import { apiRequest } from '@/lib/queryClient';

interface UsePerplexityOptions {
  defaultSystemPrompt?: string;
}

interface PerplexityResponse {
  content: string;
  citations?: string[];
}

export function usePerplexity(options: UsePerplexityOptions = {}) {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [response, setResponse] = useState<PerplexityResponse | null>(null);

  const query = useCallback(
    async (
      userQuery: string,
      systemPrompt: string = options.defaultSystemPrompt || 'Be precise and concise.'
    ) => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await apiRequest<PerplexityResponse>('/api/ai/query', {
          method: 'POST',
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

  const analyzeDeal = useCallback(async (dealData: any) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await apiRequest('/api/ai/analyze-deal', {
        method: 'POST',
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

  const getDealRecommendations = useCallback(async (dealData: any) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await apiRequest('/api/ai/deal-recommendations', {
        method: 'POST',
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

  const getMarketAnalysis = useCallback(async (dealData: any) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await apiRequest('/api/ai/market-analysis', {
        method: 'POST',
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