import { useQuery } from "@tanstack/react-query";

/**
 * Shared hook for fetching financial data used across all Value Structure sections.
 * Provides consistent caching, retry logic, and error handling for advertiser/agency data.
 */
export function useFinancialData() {
  const agenciesQuery = useQuery<any[]>({ 
    queryKey: ["/api/agencies"],
    retry: 3,
    staleTime: 60000, // 1 minute
    gcTime: 300000, // 5 minutes cache retention
  });
  
  const advertisersQuery = useQuery<any[]>({ 
    queryKey: ["/api/advertisers"],
    retry: 3,
    staleTime: 60000, // 1 minute
    gcTime: 300000, // 5 minutes cache retention
  });
  
  return { 
    agenciesQuery, 
    advertisersQuery,
    // Computed loading state for convenience
    isLoading: agenciesQuery.isLoading || advertisersQuery.isLoading,
    // Computed error state for convenience
    hasError: agenciesQuery.error || advertisersQuery.error,
    // Combined data arrays with null safety
    agenciesData: Array.isArray(agenciesQuery.data) ? agenciesQuery.data : [],
    advertisersData: Array.isArray(advertisersQuery.data) ? advertisersQuery.data : []
  };
}