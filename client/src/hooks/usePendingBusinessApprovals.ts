import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface PendingBusinessApprovalsResponse {
  deals: any[];
  count: number;
}

export function usePendingBusinessApprovals(userRole: string | undefined, userDepartment: string | undefined) {
  return useQuery({
    queryKey: [`/api/deals-pending-business-approval?role=${userRole || ''}&department=${userDepartment || ''}`],
    queryFn: () => apiRequest(`/api/deals-pending-business-approval?role=${userRole || ''}&department=${userDepartment || ''}`) as Promise<PendingBusinessApprovalsResponse>,
    enabled: !!userRole && (userRole === 'approver' || userRole === 'department_reviewer'),
    staleTime: 30000, // Cache for 30 seconds
  });
}