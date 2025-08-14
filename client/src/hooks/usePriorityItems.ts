import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Deal, type UserRole } from "@shared/schema";
import { calculatePriorityItems, type PriorityItem } from "@shared/services/priorityService";

export const usePriorityItems = (userRole: UserRole) => {
  // Fetch deals data
  const dealsQuery = useQuery<Deal[]>({
    queryKey: ['/api/deals'],
    staleTime: 30000, // 30 seconds
  });

  // Calculate priority items based on fetched deals
  const priorityItems = useMemo(() => {
    if (!dealsQuery.data || !userRole) {
      return [];
    }
    
    return calculatePriorityItems(dealsQuery.data, userRole);
  }, [dealsQuery.data, userRole]);

  // Get summary statistics
  const priorityStats = useMemo(() => {
    const totalPriority = priorityItems.length;
    const highUrgency = priorityItems.filter(item => item.urgencyLevel === 'high').length;
    const mediumUrgency = priorityItems.filter(item => item.urgencyLevel === 'medium').length;
    const lowUrgency = priorityItems.filter(item => item.urgencyLevel === 'low').length;
    
    return {
      total: totalPriority,
      high: highUrgency,
      medium: mediumUrgency,
      low: lowUrgency,
      hasUrgentItems: highUrgency > 0
    };
  }, [priorityItems]);

  return {
    priorityItems,
    priorityStats,
    isLoading: dealsQuery.isLoading,
    error: dealsQuery.error,
    refetch: dealsQuery.refetch
  };
};