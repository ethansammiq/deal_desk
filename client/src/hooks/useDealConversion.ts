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
    mutationFn: async (dealId: number): Promise<{ scopingId: number }> => {
      // Mark the scoping deal as converted
      const response = await fetch(`/api/deals/${dealId}/convert-to-deal`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include"
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to convert scoping deal");
      }

      const data = await response.json();
      return { scopingId: data.scopingId };
    },
    onSuccess: (data) => {
      // Invalidate deals query to refresh dashboard
      queryClient.invalidateQueries({ queryKey: ["/api/deals"] });
      
      toast({
        title: "Converting to Deal",
        description: `Opening deal submission form with pre-filled scoping data.`,
      });

      // Navigate to deal submission form with pre-filled data from the scoping deal
      navigate(`/request/proposal?from-scoping=${data.scopingId}`);
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