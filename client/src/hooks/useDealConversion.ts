import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

interface ConversionResponse {
  message: string;
  dealId: number;
  scopingRequestId: number;
  deal: any;
}

export function useDealConversion() {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();

  const convertScopingToDeal = useMutation({
    mutationFn: async (scopingRequestId: number): Promise<ConversionResponse> => {
      const response = await fetch(`/api/deal-scoping-requests/${scopingRequestId}/convert`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to convert scoping request');
      }

      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Conversion Successful",
        description: `Scoping request converted to deal submission. Ready to complete the deal details.`,
      });

      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['/api/deal-scoping-requests'] });
      queryClient.invalidateQueries({ queryKey: ['/api/deals'] });

      // Navigate to deal submission form with pre-filled data
      navigate(`/submit-deal?from-scoping=${data.deal.id}`);
    },
    onError: (error: Error) => {
      toast({
        title: "Conversion Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    convertScopingToDeal,
    isConverting: convertScopingToDeal.isPending,
  };
}