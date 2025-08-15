import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Check, X } from 'lucide-react';
import { UserRole, rolePermissions } from '@shared/schema';

const permissionLabels = {
  canViewDeals: "View Deals",
  canCreateDeals: "Create Deals", 
  canEditDeals: "Edit Deals",
  canDeleteDeals: "Delete Deals",
  canApproveDeals: "Approve Deals",
  canAccessLegalReview: "Legal Review",
  canManageContracts: "Manage Contracts",
  canViewAllDeals: "View All Deals"
};

export function PermissionComparison() {
  const roles: UserRole[] = ['seller', 'department_reviewer', 'approver', 'legal', 'admin'];

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800';
      case 'approver': return 'bg-purple-100 text-purple-800';
      case 'department_reviewer': return 'bg-blue-100 text-blue-800';
      case 'legal': return 'bg-green-100 text-green-800';
      case 'seller': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-4">
      <div className="text-sm text-gray-600">
        Compare permissions across all user roles
      </div>
      
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="font-semibold">Permission</TableHead>
              {roles.map((role) => (
                <TableHead key={role} className="text-center">
                  <Badge className={getRoleBadgeColor(role)}>
                    {role.replace('_', ' ')}
                  </Badge>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {Object.entries(permissionLabels).map(([permission, label]) => (
              <TableRow key={permission}>
                <TableCell className="font-medium">{label}</TableCell>
                {roles.map((role) => {
                  const hasPermission = rolePermissions[role][permission as keyof typeof rolePermissions[UserRole]];
                  return (
                    <TableCell key={`${role}-${permission}`} className="text-center">
                      {typeof hasPermission === 'boolean' ? (
                        hasPermission ? (
                          <Check className="h-4 w-4 text-green-600 mx-auto" />
                        ) : (
                          <X className="h-4 w-4 text-red-600 mx-auto" />
                        )
                      ) : (
                        <span className="text-xs text-gray-500">N/A</span>
                      )}
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
            
            {/* Status Transition Permissions */}
            <TableRow className="border-t-2">
              <TableCell className="font-medium">Status Transitions</TableCell>
              {roles.map((role) => (
                <TableCell key={`${role}-transitions`} className="text-center">
                  <div className="text-xs space-y-1">
                    {rolePermissions[role].canChangeStatus.slice(0, 3).map((status, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {status.replace('_', ' ')}
                      </Badge>
                    ))}
                    {rolePermissions[role].canChangeStatus.length > 3 && (
                      <div className="text-gray-500">+{rolePermissions[role].canChangeStatus.length - 3}</div>
                    )}
                  </div>
                </TableCell>
              ))}
            </TableRow>

            {/* Dashboard Sections */}
            <TableRow>
              <TableCell className="font-medium">Dashboard Access</TableCell>
              {roles.map((role) => (
                <TableCell key={`${role}-dashboard`} className="text-center">
                  <div className="text-xs">
                    {rolePermissions[role].dashboardSections.length} sections
                  </div>
                </TableCell>
              ))}
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </div>
  );
}