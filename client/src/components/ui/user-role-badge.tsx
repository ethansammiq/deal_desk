import React from 'react';
import { Badge } from '@/components/ui/badge';
import { UserRole } from '@shared/schema';

interface UserRoleBadgeProps {
  role: UserRole;
  className?: string;
}

export function UserRoleBadge({ role, className = '' }: UserRoleBadgeProps) {
  const getRoleColor = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'approver':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'department_reviewer':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'legal':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'seller':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getRoleLabel = (role: UserRole) => {
    switch (role) {
      case 'department_reviewer':
        return 'Department Reviewer';
      default:
        return role.charAt(0).toUpperCase() + role.slice(1);
    }
  };

  return (
    <Badge 
      variant="outline" 
      className={`${getRoleColor(role)} ${className}`}
    >
      {getRoleLabel(role)}
    </Badge>
  );
}