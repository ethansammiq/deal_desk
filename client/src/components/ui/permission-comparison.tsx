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

const permissionDescriptions = {
  canViewDeals: "Basic permission to see deal information",
  canCreateDeals: "Can create new deals and scoping requests", 
  canEditDeals: "Can directly modify deal details",
  canDeleteDeals: "Can permanently remove deals from system",
  canApproveDeals: "Can approve deals in workflow",
  canAccessLegalReview: "Can access legal review functions",
  canManageContracts: "Can create and manage contracts",
  canViewAllDeals: "Can see deals beyond own/department scope"
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
      <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
        <h3 className="font-semibold text-amber-900 mb-2">Key Permission Distinctions</h3>
        <div className="text-sm text-amber-800 space-y-1">
          <p>• <strong>View Deals vs View All Deals</strong>: Basic viewing vs cross-department/system-wide access</p>
          <p>• <strong>Edit Deals</strong>: Approvers cannot edit directly - they must request revisions instead</p>
          <p>• <strong>Department Reviewer</strong>: Technical validation role with limited scope</p>
          <p>• <strong>Approver</strong>: Business decision-maker with approval authority but no direct editing</p>
        </div>
      </div>
      
      <div className="text-sm text-gray-600">
        Compare permissions across all user roles - hover over permissions for descriptions
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
                <TableCell className="font-medium" title={permissionDescriptions[permission as keyof typeof permissionDescriptions]}>
                  {label}
                  {permission === 'canEditDeals' && (
                    <div className="text-xs text-amber-600 mt-1">
                      ⚠️ Approvers use revision requests instead
                    </div>
                  )}
                  {permission === 'canViewAllDeals' && (
                    <div className="text-xs text-blue-600 mt-1">
                      ℹ️ Beyond own/department scope
                    </div>
                  )}
                </TableCell>
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