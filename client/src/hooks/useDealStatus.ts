import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { type DealStatus, type DealStatusHistory } from "@shared/schema";

interface UpdateStatusParams {
  dealId: number;
  status: DealStatus;
  changedBy: string;
  comments?: string;
}

// Phase 7A: Hook for managing deal status operations
export function useDealStatus(dealId?: number) {
  const queryClient = useQueryClient();

  // Query for deal status history
  const statusHistoryQuery = useQuery({
    queryKey: ['/api/deals', dealId, 'history'],
    enabled: !!dealId,
    staleTime: 30000, // 30 seconds
  });

  // Query for available deal statuses
  const statusOptionsQuery = useQuery({
    queryKey: ['/api/deal-statuses'],
    staleTime: 5 * 60 * 1000, // 5 minutes (statuses don't change often)
  });

  // Mutation for updating deal status
  const updateStatusMutation = useMutation({
    mutationFn: async ({ dealId, status, changedBy, comments }: UpdateStatusParams) => {
      return apiRequest(`/api/deals/${dealId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status, changedBy, comments }),
        headers: {
          'Content-Type': 'application/json',
        },
      });
    },
    onSuccess: (data, variables) => {
      // Invalidate and refetch relevant queries
      queryClient.invalidateQueries({ queryKey: ['/api/deals'] });
      queryClient.invalidateQueries({ queryKey: ['/api/deals', variables.dealId] });
      queryClient.invalidateQueries({ queryKey: ['/api/deals', variables.dealId, 'history'] });
      queryClient.invalidateQueries({ queryKey: ['/api/stats'] });
    },
  });

  return {
    // Queries
    statusHistory: statusHistoryQuery.data as DealStatusHistory[] | undefined,
    statusOptions: statusOptionsQuery.data,
    
    // Loading states
    isLoadingHistory: statusHistoryQuery.isLoading,
    isLoadingOptions: statusOptionsQuery.isLoading,
    isUpdatingStatus: updateStatusMutation.isPending,
    
    // Error states  
    historyError: statusHistoryQuery.error,
    optionsError: statusOptionsQuery.error,
    updateError: updateStatusMutation.error,
    
    // Actions
    updateStatus: updateStatusMutation.mutate,
    
    // Utility functions
    refreshHistory: () => {
      if (dealId) {
        queryClient.invalidateQueries({ queryKey: ['/api/deals', dealId, 'history'] });
      }
    },
  };
}