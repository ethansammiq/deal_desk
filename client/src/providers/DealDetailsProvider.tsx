import React, { createContext, useContext, ReactNode } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useDealCalculations } from "@/hooks/useDealCalculations";
import { TierDataAccess } from "@/utils/tier-data-access";
import { Deal } from "@shared/schema";
import { DealTier } from "@/hooks/useDealTiers";

interface FinancialMetrics {
  annualRevenue: number;
  annualGrossMargin: number;
  adjustedGrossMargin: number;
  adjustedGrossProfit: number;
  totalIncentiveCosts: number;
  displayTier?: number;
}

interface ConsolidatedDealData {
  // Core deal data
  deal: Deal | null;
  tiers: DealTier[];
  financialMetrics: FinancialMetrics | null;
  
  // Approval data
  approvalStatus: any;
  approvalState: any;
  
  // AI analysis data
  aiScore?: number;
  aiRecommendation?: string;
  
  // Loading states
  isLoading: boolean;
  isLoadingTiers: boolean;
  isLoadingApprovals: boolean;
  
  // Error states
  error: Error | null;
  tiersError: Error | null;
  approvalsError: Error | null;
  
  // Actions
  refetchDeal: () => void;
  refetchTiers: () => void;
  refetchApprovals: () => void;
  resubmitDeal: () => Promise<void>;
}

const DealDetailsContext = createContext<ConsolidatedDealData | null>(null);

interface DealDetailsProviderProps {
  dealId: number;
  children: ReactNode;
}

export function DealDetailsProvider({ dealId, children }: DealDetailsProviderProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { calculateFinancialSummary } = useDealCalculations();
  
  // Core deal data query
  const dealQuery = useQuery({
    queryKey: ['/api/deals', dealId],
    queryFn: async (): Promise<Deal> => {
      const response = await fetch(`/api/deals/${dealId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch deal details');
      }
      return response.json();
    },
    enabled: !!dealId && dealId > 0,
    staleTime: 30000, // Cache for 30 seconds
  });

  // Deal tiers query with enhanced fallback
  const tiersQuery = useQuery({
    queryKey: ['/api/deals', dealId, 'tiers'],
    queryFn: async (): Promise<DealTier[]> => {
      const response = await fetch(`/api/deals/${dealId}/tiers`);
      if (!response.ok) {
        throw new Error('Failed to fetch deal tiers');
      }
      const data = await response.json();
      
      // Extract tiers array from API response
      const tiersArray = data.tiers || [];
      
      // Apply enhanced fallback logic if no tiers found
      if (tiersArray.length === 0) {
        // For now, return empty array - fallback logic will be implemented later
        return [];
      }
      
      return tiersArray;
    },
    enabled: !!dealId && dealId > 0,
    staleTime: 30000,
  });

  // Consolidated approval data query
  const approvalQuery = useQuery({
    queryKey: ['/api/deals', dealId, 'consolidated-approvals'],
    queryFn: async () => {
      const [statusResponse, stateResponse] = await Promise.all([
        fetch(`/api/deals/${dealId}/approval-status`),
        fetch(`/api/deals/${dealId}/approval-state`)
      ]);
      
      const approvalStatus = statusResponse.ok ? await statusResponse.json() : { approvals: [] };
      const approvalState = stateResponse.ok ? await stateResponse.json() : {};
      
      return { approvalStatus, approvalState };
    },
    enabled: !!dealId && dealId > 0,
    refetchInterval: 30000, // Auto-refresh approvals
    staleTime: 10000, // Shorter cache for real-time approval updates
  });

  // AI analysis query (optional)
  const aiAnalysisQuery = useQuery({
    queryKey: ['/api/deals', dealId, 'ai-analysis'],
    queryFn: async () => {
      const response = await fetch(`/api/ai/analyze-deal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dealId,
          dealData: dealQuery.data,
          tierData: tiersQuery.data
        })
      });
      
      if (!response.ok) {
        // Don't throw error for AI analysis failures
        return null;
      }
      
      return response.json();
    },
    enabled: !!(dealQuery.data && tiersQuery.data && dealId > 0),
    staleTime: 300000, // Cache AI analysis for 5 minutes
    retry: 1, // Only retry once for AI failures
  });

  // Resubmit deal mutation
  const resubmitMutation = useMutation({
    mutationFn: async (dealId: number) => {
      const response = await fetch(`/api/deals/${dealId}/resubmit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to resubmit deal');
      }
      
      return response.json();
    },
    onSuccess: () => {
      // Invalidate all related queries
      queryClient.invalidateQueries({ queryKey: ['/api/deals'] });
      queryClient.invalidateQueries({ queryKey: ['/api/deals', dealId] });
      queryClient.invalidateQueries({ queryKey: ['/api/deals', dealId, 'consolidated-approvals'] });
      
      toast({
        title: "Deal Resubmitted",
        description: "Your deal has been resubmitted for review.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to Resubmit",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    }
  });

  // Calculate financial metrics using TierDataAccess
  const calculateFinancialMetrics = (): FinancialMetrics | null => {
    const deal = dealQuery.data;
    const tiers = tiersQuery.data || [];
    
    if (!deal || !tiers) return null;

    // Use TierDataAccess for consistent tier-first calculations
    const expectedRevenue = TierDataAccess.getExpectedRevenue(tiers);
    const expectedGrossMargin = TierDataAccess.getExpectedGrossMargin(tiers);
    const expectedIncentiveCost = TierDataAccess.getExpectedIncentiveCost(tiers);
    const expectedGrossProfit = TierDataAccess.getExpectedGrossProfit(tiers);

    return {
      annualRevenue: expectedRevenue,
      annualGrossMargin: expectedGrossMargin,
      adjustedGrossMargin: expectedGrossMargin,
      adjustedGrossProfit: expectedGrossProfit,
      totalIncentiveCosts: expectedIncentiveCost,
      displayTier: tiers.length > 0 ? TierDataAccess.getExpectedTier(tiers)?.tierNumber : undefined
    };
  };

  // Consolidate all data and state
  const consolidatedData: ConsolidatedDealData = {
    // Core data
    deal: dealQuery.data || null,
    tiers: tiersQuery.data || [],
    financialMetrics: calculateFinancialMetrics(),
    
    // Approval data
    approvalStatus: approvalQuery.data?.approvalStatus || { approvals: [] },
    approvalState: approvalQuery.data?.approvalState || {},
    
    // AI analysis data
    aiScore: aiAnalysisQuery.data?.overallScore,
    aiRecommendation: aiAnalysisQuery.data?.recommendation,
    
    // Loading states
    isLoading: dealQuery.isLoading,
    isLoadingTiers: tiersQuery.isLoading,
    isLoadingApprovals: approvalQuery.isLoading,
    
    // Error states
    error: dealQuery.error,
    tiersError: tiersQuery.error,
    approvalsError: approvalQuery.error,
    
    // Actions
    refetchDeal: dealQuery.refetch,
    refetchTiers: tiersQuery.refetch,
    refetchApprovals: approvalQuery.refetch,
    resubmitDeal: () => resubmitMutation.mutateAsync(dealId),
  };

  return (
    <DealDetailsContext.Provider value={consolidatedData}>
      {children}
    </DealDetailsContext.Provider>
  );
}

// Custom hook to use the consolidated deal data
export function useDealDetails(): ConsolidatedDealData {
  const context = useContext(DealDetailsContext);
  if (!context) {
    throw new Error('useDealDetails must be used within a DealDetailsProvider');
  }
  return context;
}

// Additional utility hooks for specific data access
export function useDealFinancials() {
  const { financialMetrics, tiers, isLoadingTiers, tiersError } = useDealDetails();
  return { financialMetrics, tiers, isLoading: isLoadingTiers, error: tiersError };
}

export function useDealApprovals() {
  const { approvalStatus, approvalState, isLoadingApprovals, approvalsError, refetchApprovals } = useDealDetails();
  return { 
    approvalStatus, 
    approvalState, 
    isLoading: isLoadingApprovals, 
    error: approvalsError,
    refetch: refetchApprovals 
  };
}

export function useDealAI() {
  const { aiScore, aiRecommendation } = useDealDetails();
  return { aiScore, aiRecommendation };
}