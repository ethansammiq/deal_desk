// Phase 7B: Hook for checking allowed status transitions
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { DealStatus } from "@shared/schema";

export function useAllowedTransitions(dealId?: number, dealStatus?: DealStatus) {
  return useQuery({
    queryKey: ["/api/deals", dealId, "allowed-transitions"],
    queryFn: () => {
      if (!dealId) throw new Error("Deal ID is required");
      return apiRequest(`/api/deals/${dealId}/allowed-transitions`) as Promise<{
        allowedTransitions: DealStatus[];
      }>;
    },
    enabled: !!dealId && !!dealStatus,
    select: (data) => data.allowedTransitions,
  });
}

// Phase 7B: Helper hook to check if current user can transition to specific status
export function useCanTransitionToStatus(dealId?: number, targetStatus?: DealStatus) {
  const { data: allowedTransitions = [] } = useAllowedTransitions(dealId);
  
  return {
    canTransition: targetStatus ? allowedTransitions.includes(targetStatus) : false,
    allowedTransitions,
  };
}