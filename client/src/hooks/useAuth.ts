// Phase 7B: Role-based authentication hook
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { UserRole } from "@shared/schema";
import { getCurrentUser, hasPermission, canTransitionToStatus, getUserDisplayName, getRoleDisplayName } from "@shared/auth";
import type { CurrentUser } from "@shared/auth";

export function useCurrentUser() {
  return useQuery({
    queryKey: ["/api/users/current"],
    queryFn: () => apiRequest("/api/users/current") as Promise<CurrentUser>,
  });
}

export function useUsersByRole(role?: UserRole) {
  return useQuery({
    queryKey: ["/api/users", role],
    queryFn: () => {
      const params = role ? `?role=${role}` : "";
      return apiRequest(`/api/users${params}`) as Promise<CurrentUser[]>;
    },
    enabled: !!role,
  });
}

export function useUpdateUserRole() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ userId, role }: { userId: number; role: UserRole }) => {
      return apiRequest(`/api/users/${userId}/role`, {
        method: "PUT",
        body: JSON.stringify({ role }),
        headers: { "Content-Type": "application/json" },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
    },
  });
}

// Phase 7B: Permission checking hooks
export function useUserPermissions() {
  const { data: currentUser } = useCurrentUser();
  
  const checkPermission = (permission: string) => {
    if (!currentUser) return false;
    return hasPermission(currentUser.role, permission as any);
  };

  const canCreateDeals = checkPermission("canCreateDeals");
  const canViewAllDeals = checkPermission("canViewAllDeals");
  const canEditDeals = checkPermission("canEditDeals");
  const canApproveDeals = checkPermission("canApproveDeals");
  const canAccessLegalReview = checkPermission("canAccessLegalReview");
  const canManageContracts = checkPermission("canManageContracts");
  
  return {
    currentUser,
    canCreateDeals,
    canViewAllDeals,
    canEditDeals,
    canApproveDeals,
    canAccessLegalReview,
    canManageContracts,
    checkPermission,
  };
}

// Phase 7B: Deal status transition permissions
export function useDealStatusPermissions(dealStatus?: string) {
  const { data: currentUser } = useCurrentUser();
  
  const canTransitionTo = (targetStatus: string) => {
    if (!currentUser || !dealStatus) return false;
    return canTransitionToStatus(currentUser.role, targetStatus as any);
  };

  return {
    canTransitionTo,
    currentUser,
  };
}

// Phase 7B: Mock authentication helpers (will be replaced with real auth)
export function useMockAuth() {
  const currentUser = getCurrentUser();
  
  return {
    user: currentUser,
    displayName: getUserDisplayName(currentUser),
    roleDisplayName: getRoleDisplayName(currentUser.role),
    isAuthenticated: true, // Mock - always authenticated for demo
  };
}

// Phase 7B: Dashboard sections based on role
export function useDashboardSections() {
  const { currentUser } = useUserPermissions();
  
  if (!currentUser) return [];
  
  const rolePermissions = {
    seller: ["deals", "scoping", "performance"],
    approver: ["deals", "approvals", "analytics", "reports"],
    legal: ["legal-queue", "contracts", "compliance"]
  };
  
  return rolePermissions[currentUser.role] || [];
}