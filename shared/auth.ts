// Phase 7B: Authentication and authorization utilities
import { UserRole, rolePermissions, RolePermissions, DealStatus, statusTransitionRules } from "./schema";

// Phase 7B: Check if user has permission to perform action
export function hasPermission(userRole: UserRole, permission: keyof RolePermissions): boolean {
  return rolePermissions[userRole][permission] as boolean;
}

// Phase 7B: Check if user can transition deal to specific status
export function canTransitionToStatus(userRole: UserRole, targetStatus: DealStatus): boolean {
  const allowedStatuses = rolePermissions[userRole].canChangeStatus;
  return allowedStatuses.includes(targetStatus);
}

// Phase 7B: Check if status transition is valid according to workflow rules
export function isValidStatusTransition(currentStatus: DealStatus, targetStatus: DealStatus): boolean {
  const allowedTransitions = statusTransitionRules[currentStatus] || [];
  return allowedTransitions.includes(targetStatus);
}

// Phase 7B: Get all statuses user can transition to from current status
export function getAllowedTransitions(userRole: UserRole, currentStatus: DealStatus): DealStatus[] {
  const workflowAllowed = statusTransitionRules[currentStatus] || [];
  const roleAllowed = rolePermissions[userRole].canChangeStatus;
  
  // Return intersection of workflow rules and role permissions
  return workflowAllowed.filter(status => roleAllowed.includes(status)) as DealStatus[];
}

// Phase 7B: Check if user can access dashboard section
export function canAccessDashboardSection(userRole: UserRole, section: string): boolean {
  return rolePermissions[userRole].dashboardSections.includes(section);
}

// Phase 7B: Mock current user (will be replaced with real auth later)
export interface CurrentUser {
  id: number;
  username: string;
  email: string;
  role: UserRole;
  firstName?: string;
  lastName?: string;
  department?: string;
}

// Phase 7B: Mock current user for development (will be replaced with real session management)
export function getCurrentUser(): CurrentUser {
  // This will be replaced with real authentication
  return {
    id: 1,
    username: "demo_seller",
    email: "seller@company.com",
    role: "seller",
    firstName: "Demo",
    lastName: "Seller",
    department: "Sales"
  };
}

// Phase 7B: Get user display name
export function getUserDisplayName(user: CurrentUser): string {
  if (user.firstName && user.lastName) {
    return `${user.firstName} ${user.lastName}`;
  }
  return user.username;
}

// Phase 7B: Get role display name
export function getRoleDisplayName(role: UserRole): string {
  const roleNames = {
    seller: "Sales Representative",
    approver: "Deal Approver",
    legal: "Legal Team"
  };
  return roleNames[role];
}