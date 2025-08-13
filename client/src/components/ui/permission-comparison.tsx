// Phase 7B: Permission comparison component to show role differences
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UserRoleBadge } from "@/components/ui/user-role-badge";
import { rolePermissions, type UserRole } from "@shared/schema";
import { Check, X, Shield } from "lucide-react";

interface PermissionComparisonProps {
  className?: string;
}

export function PermissionComparison({ className }: PermissionComparisonProps) {
  const roles: UserRole[] = ["seller", "approver", "legal"];
  
  const permissionLabels = {
    canViewDeals: "View Deals",
    canCreateDeals: "Create Deals", 
    canEditDeals: "Edit Deals",
    canDeleteDeals: "Delete Deals",
    canViewAllDeals: "View All Deals",
    canApproveDeals: "Approve Deals",
    canAccessLegalReview: "Legal Review",
    canManageContracts: "Manage Contracts",
  };

  const statusTransitionLabels = {
    seller: ["scoping", "submitted"],
    approver: ["under_review", "negotiating", "approved", "lost"],
    legal: ["legal_review", "contract_sent", "signed"],
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Shield className="h-5 w-5" />
          <span>Role Permission Matrix</span>
        </CardTitle>
        <CardDescription>
          Compare permissions and allowed status transitions across all user roles
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Basic Permissions */}
        <div>
          <h4 className="font-medium mb-3">Basic Permissions</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 font-medium">Permission</th>
                  {roles.map((role) => (
                    <th key={role} className="text-center py-2 px-2">
                      <UserRoleBadge role={role} className="text-xs" />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Object.entries(permissionLabels).map(([key, label]) => (
                  <tr key={key} className="border-b">
                    <td className="py-2 font-medium">{label}</td>
                    {roles.map((role) => {
                      const permissions = rolePermissions[role];
                      const hasPermission = permissions[key as keyof typeof permissions];
                      return (
                        <td key={role} className="text-center py-2 px-2">
                          {typeof hasPermission === 'boolean' ? (
                            hasPermission ? (
                              <Check className="h-4 w-4 text-green-600 mx-auto" />
                            ) : (
                              <X className="h-4 w-4 text-red-500 mx-auto" />
                            )
                          ) : (
                            <span className="text-xs text-muted-foreground">N/A</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Status Transitions */}
        <div>
          <h4 className="font-medium mb-3">Allowed Status Transitions</h4>
          <div className="grid md:grid-cols-3 gap-4">
            {roles.map((role) => (
              <Card key={role} className="p-4">
                <div className="flex items-center space-x-2 mb-3">
                  <UserRoleBadge role={role} />
                  <span className="font-medium text-sm">
                    {role.charAt(0).toUpperCase() + role.slice(1)}
                  </span>
                </div>
                <div className="space-y-1">
                  {statusTransitionLabels[role].map((status) => (
                    <Badge key={status} variant="outline" className="text-xs mr-1 mb-1">
                      {status.replace('_', ' ')}
                    </Badge>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Dashboard Sections */}
        <div>
          <h4 className="font-medium mb-3">Dashboard Sections</h4>
          <div className="grid md:grid-cols-3 gap-4">
            {roles.map((role) => (
              <Card key={role} className="p-4">
                <div className="flex items-center space-x-2 mb-3">
                  <UserRoleBadge role={role} />
                  <span className="font-medium text-sm">
                    {role.charAt(0).toUpperCase() + role.slice(1)}
                  </span>
                </div>
                <div className="space-y-1">
                  {rolePermissions[role].dashboardSections.map((section) => (
                    <Badge key={section} variant="secondary" className="text-xs mr-1 mb-1">
                      {section.replace('-', ' ')}
                    </Badge>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}