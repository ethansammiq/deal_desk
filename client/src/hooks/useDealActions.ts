import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useCurrentUser } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";

interface DealStatusUpdateRequest {
  status: string;
  changedBy: string;
  comments?: string;
}

interface NudgeRequest {
  dealId: number;
  targetRole: string;
  message: string;
  sender: string;
}

export function useDealActions() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: currentUser } = useCurrentUser();
  const userIdentifier = currentUser?.email || currentUser?.username || "Unknown User";

  // Update deal status mutation
  const updateDealStatus = useMutation({
    mutationFn: async ({ dealId, status, comments }: { dealId: number; status: string; comments?: string }) => {
      const payload: DealStatusUpdateRequest = {
        status,
        changedBy: userIdentifier,
        comments
      };
      
      return apiRequest(`/api/deals/${dealId}/status`, {
        method: 'PUT',
        body: JSON.stringify(payload),
        headers: {
          'Content-Type': 'application/json',
        },
      });
    },
    onSuccess: (data, variables) => {
      toast({
        title: "Status Updated",
        description: `Deal status updated to ${variables.status.replace('_', ' ')}`,
      });
      
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['/api/deals'] });
      queryClient.invalidateQueries({ queryKey: ['/api/stats'] });
      queryClient.invalidateQueries({ queryKey: [`/api/deals/${variables.dealId}`] });
    },
    onError: (error: Error) => {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Send nudge mutation (creates a status history entry with nudge comment)
  const sendNudge = useMutation({
    mutationFn: async ({ dealId, targetRole, message }: { dealId: number; targetRole: string; message: string }) => {
      const nudgeComment = `NUDGE from ${currentUser?.role} to ${targetRole}: ${message}`;
      
      // For now, we'll use the status update endpoint with a comment to track nudges
      // In a real system, this might be a separate notifications service
      const payload: DealStatusUpdateRequest = {
        status: "current", // Special flag to keep current status but add comment
        changedBy: userIdentifier,
        comments: nudgeComment
      };
      
      return apiRequest(`/api/deals/${dealId}/nudge`, {
        method: 'POST',
        body: JSON.stringify({
          targetRole,
          message,
          sender: userIdentifier
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });
    },
    onSuccess: (data, variables) => {
      toast({
        title: "Nudge Sent",
        description: `Reminder sent to ${variables.targetRole} team`,
      });
      
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['/api/deals'] });
      queryClient.invalidateQueries({ queryKey: [`/api/deals/${variables.dealId}/history`] });
    },
    onError: (error: Error) => {
      toast({
        title: "Nudge Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Approve deal (move to approved status)
  const approveDeal = useMutation({
    mutationFn: async ({ dealId, comments }: { dealId: number; comments?: string }) => {
      return updateDealStatus.mutateAsync({
        dealId,
        status: 'approved',
        comments: comments || 'Deal approved'
      });
    }
  });

  // Legal approve deal (move to contract_sent status)
  const legalApproveDeal = useMutation({
    mutationFn: async ({ dealId, comments }: { dealId: number; comments?: string }) => {
      return updateDealStatus.mutateAsync({
        dealId,
        status: 'contract_sent',
        comments: comments || 'Legal review completed, contract ready'
      });
    }
  });

  // Send contract (move to contract_sent status)
  const sendContract = useMutation({
    mutationFn: async ({ dealId, comments }: { dealId: number; comments?: string }) => {
      return updateDealStatus.mutateAsync({
        dealId,
        status: 'contract_sent',
        comments: comments || 'Contract sent to client'
      });
    }
  });

  return {
    // Mutations
    updateDealStatus,
    sendNudge,
    approveDeal,
    legalApproveDeal,
    sendContract,
    
    // Loading states
    isUpdatingStatus: updateDealStatus.isPending,
    isSendingNudge: sendNudge.isPending,
    isApproving: approveDeal.isPending,
    isLegalApproving: legalApproveDeal.isPending,
    isSendingContract: sendContract.isPending,
    
    // Helper function to get appropriate nudge targets
    getNudgeTargets: (currentStatus: string) => {
      switch (currentStatus) {
        case 'under_review':
          return ['approver'];
        case 'legal_review':
          return ['legal'];
        case 'negotiating':
          return ['seller', 'approver'];
        default:
          return ['admin'];
      }
    }
  };
}