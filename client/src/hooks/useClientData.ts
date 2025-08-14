import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { AdvertiserData, AgencyData } from "@shared/types";

/**
 * Shared hook for fetching client data (agencies and advertisers)
 * Eliminates duplicate data fetching logic across RequestSupport and SubmitDeal forms
 */
export function useClientData() {
  const { toast } = useToast();
  const [agencies, setAgencies] = useState<AgencyData[]>([]);
  const [advertisers, setAdvertisers] = useState<AdvertiserData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchClientData() {
      setIsLoading(true);
      setError(null);

      try {
        // Fetch agencies and advertisers in parallel
        const [agenciesResponse, advertisersResponse] = await Promise.all([
          fetch("/api/agencies", {
            method: "GET",
            credentials: "include",
          }),
          fetch("/api/advertisers", {
            method: "GET",
            credentials: "include",
          })
        ]);

        if (!agenciesResponse.ok) {
          throw new Error("Failed to fetch agencies");
        }
        if (!advertisersResponse.ok) {
          throw new Error("Failed to fetch advertisers");
        }

        const [agenciesData, advertisersData] = await Promise.all([
          agenciesResponse.json(),
          advertisersResponse.json()
        ]);

        setAgencies(agenciesData as AgencyData[]);
        setAdvertisers(advertisersData as AdvertiserData[]);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
        setError(errorMessage);
        
        toast({
          title: "Error Loading Client Data",
          description: "Could not load agency and advertiser data. Please refresh the page.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    }

    fetchClientData();
  }, [toast]);

  return {
    agencies,
    advertisers,
    isLoading,
    error,
    // Helper methods for easy access
    hasData: agencies.length > 0 || advertisers.length > 0,
    isEmpty: agencies.length === 0 && advertisers.length === 0,
  };
}