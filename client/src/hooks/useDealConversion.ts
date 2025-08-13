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
    mutationFn: async (dealId: number): Promise<{ dealId: number }> => {
      // Since scoping requests are deals with "scoping" status,
      // we just need to redirect to the form with the deal ID
      return { dealId };
    },
    onSuccess: (data) => {
      toast({
        title: "Redirecting to Deal Form",
        description: `Opening deal submission form with pre-filled scoping data.`,
      });

      // Navigate to deal submission form with pre-filled data from the scoping deal
      navigate(`/submit-deal?from-scoping=${data.dealId}`);
    },
    onError: (error: Error) => {
      toast({
        title: "Navigation Failed",
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