// Simplified permissions hook to fix the current issues
import { useCurrentUser } from './useAuth';

export function useUserPermissions() {
  const { data: currentUser, isLoading } = useCurrentUser();
  
  // Always return a valid object structure
  if (isLoading || !currentUser) {
    return {
      currentUser: null,
      canCreateDeals: false,
      canViewAllDeals: false,
      canEditDeals: false,
      canApproveDeals: false,
      canAccessLegalReview: false,
      canManageContracts: false,
      checkPermission: () => false,
    };
  }

  // Determine permissions based on role and department
  const role = currentUser.role;
  const department = currentUser.department;
  
  // Define permissions for each role
  const permissions = {
    seller: {
      canCreateDeals: true,
      canViewAllDeals: false,
      canEditDeals: true,
      canApproveDeals: false,
      canAccessLegalReview: false,
      canManageContracts: false,
    },
    approver: {
      canCreateDeals: false,
      canViewAllDeals: true,
      canEditDeals: false,
      canApproveDeals: true,
      canAccessLegalReview: false,
      canManageContracts: false,
    },
    department_reviewer: {
      canCreateDeals: false,
      canViewAllDeals: true,
      canEditDeals: false,
      canApproveDeals: true,
      canAccessLegalReview: department === 'legal', // Only legal department
      canManageContracts: department === 'legal', // Only legal department
    },
    admin: {
      canCreateDeals: true,
      canViewAllDeals: true,
      canEditDeals: true,
      canApproveDeals: true,
      canAccessLegalReview: true,
      canManageContracts: true,
    },
  };

  const rolePermissions = permissions[role] || permissions.seller;

  return {
    currentUser,
    ...rolePermissions,
    checkPermission: (permission: string) => {
      return (rolePermissions as any)[permission] || false;
    },
    // Additional permissions for comprehensive testing
    canDeleteDeals: role === 'admin',
    canManageUsers: role === 'admin',
    canViewReports: ['approver', 'admin'].includes(role),
    canManageSystem: role === 'admin',
  };
}