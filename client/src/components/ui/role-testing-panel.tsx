// Phase 7B: Comprehensive role testing panel
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserRoleBadge } from "@/components/ui/user-role-badge";
import { RoleSwitcher } from "@/components/ui/role-switcher";
import { PermissionComparison } from "@/components/ui/permission-comparison";
import { useCurrentUser, useUserPermissions } from "@/hooks/useAuth";
import { useAllowedTransitions } from "@/hooks/useAllowedTransitions";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { TestTube2, Activity, Settings } from "lucide-react";
import type { Deal, DealStatus } from "@shared/schema";

export function RoleTestingPanel() {
  const { data: currentUser } = useCurrentUser();
  const { canCreateDeals, canViewAllDeals, canApproveDeals, canAccessLegalReview } = useUserPermissions();
  
  const { data: deals = [] } = useQuery({
    queryKey: ["/api/deals"],
    queryFn: () => apiRequest("/api/deals") as Promise<Deal[]>,
  });

  const testStatuses: DealStatus[] = ["scoping", "submitted", "under_review", "negotiating", "approved"];
  
  // Always call hooks before any early returns - fixed approach
  const testTransitions = [
    useAllowedTransitions(1, "scoping"),
    useAllowedTransitions(1, "submitted"), 
    useAllowedTransitions(1, "under_review"),
    useAllowedTransitions(1, "negotiating"),
    useAllowedTransitions(1, "approved")
  ];
  
  if (!currentUser) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold flex items-center justify-center space-x-2">
          <TestTube2 className="h-6 w-6" />
          <span>Role-Based Permission Testing</span>
        </h2>
        <p className="text-muted-foreground">
          Test different user roles and their permissions with real functionality
        </p>
      </div>

      <Tabs defaultValue="switcher" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="switcher" className="flex items-center space-x-2">
            <Settings className="h-4 w-4" />
            <span>Role Switcher</span>
          </TabsTrigger>
          <TabsTrigger value="testing" className="flex items-center space-x-2">
            <Activity className="h-4 w-4" />
            <span>Live Testing</span>
          </TabsTrigger>
          <TabsTrigger value="comparison" className="flex items-center space-x-2">
            <TestTube2 className="h-4 w-4" />
            <span>Permission Matrix</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="switcher" className="space-y-4">
          <div className="grid lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Current User Status</CardTitle>
                <CardDescription>Your active role and permissions</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <UserRoleBadge role={currentUser.role} />
                  <span className="text-sm text-gray-600">
                    {currentUser.username}
                  </span>
                </div>
                
                {currentUser.department && (
                  <div className="flex items-center gap-2 text-sm">
                    <Badge variant="outline">Department</Badge>
                    <span className="capitalize">{currentUser.department}</span>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center gap-1">
                    {canCreateDeals ? '✓' : '✗'} Create Deals
                  </div>
                  <div className="flex items-center gap-1">
                    {canViewAllDeals ? '✓' : '✗'} View All Deals
                  </div>
                  <div className="flex items-center gap-1">
                    {canApproveDeals ? '✓' : '✗'} Approve Deals
                  </div>
                  <div className="flex items-center gap-1">
                    {canAccessLegalReview ? '✓' : '✗'} Legal Review
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Role Switcher</CardTitle>
                <CardDescription>Test different roles and permissions</CardDescription>
              </CardHeader>
              <CardContent>
                <RoleSwitcher 
                  currentRole={currentUser.role}
                  onRoleChange={(role, department) => {
                    // In production: API call to switch role
                    console.log('Switching to role:', role, department);
                  }}
                />
              </CardContent>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-3">
                  <UserRoleBadge role={currentUser.role} />
                  <div>
                    <p className="font-medium">{currentUser.firstName} {currentUser.lastName}</p>
                    <p className="text-sm text-muted-foreground">{currentUser.department}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center space-x-2">
                    <Badge variant={canCreateDeals ? "default" : "secondary"} className="text-xs">
                      {canCreateDeals ? "✓" : "✗"}
                    </Badge>
                    <span>Create Deals</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant={canViewAllDeals ? "default" : "secondary"} className="text-xs">
                      {canViewAllDeals ? "✓" : "✗"}
                    </Badge>
                    <span>View All Deals</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant={canApproveDeals ? "default" : "secondary"} className="text-xs">
                      {canApproveDeals ? "✓" : "✗"}
                    </Badge>
                    <span>Approve Deals</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant={canAccessLegalReview ? "default" : "secondary"} className="text-xs">
                      {canAccessLegalReview ? "✓" : "✗"}
                    </Badge>
                    <span>Legal Review</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <RoleSwitcher 
              currentRole={currentUser.role}
              onRoleChange={(newRole) => {
                console.log("Role will switch to:", newRole);
              }}
            />
          </div>
        </TabsContent>

        <TabsContent value="testing" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Status Transition Testing</CardTitle>
                <CardDescription>
                  Test which status transitions are allowed for your current role
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {testStatuses.map((status, index) => {
                  const allowedTransitions = testTransitions[index];
                  return (
                    <div key={status} className="border rounded p-3">
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="outline">{status}</Badge>
                        <span className="text-sm text-muted-foreground">
                          {allowedTransitions.data?.length || 0} transitions
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {allowedTransitions.data?.length ? (
                          allowedTransitions.data.map((transition) => (
                            <Badge key={transition} variant="secondary" className="text-xs">
                              → {transition}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-xs text-muted-foreground">No transitions allowed</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>API Access Testing</CardTitle>
                <CardDescription>
                  Test which API endpoints you can access with your current role
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">GET /api/deals</span>
                    <Badge variant={canViewAllDeals ? "default" : "secondary"} className="text-xs">
                      {canViewAllDeals ? "Allowed" : "Restricted"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">POST /api/deals</span>
                    <Badge variant={canCreateDeals ? "default" : "secondary"} className="text-xs">
                      {canCreateDeals ? "Allowed" : "Restricted"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">PUT /api/deals/:id/status</span>
                    <Badge variant={canApproveDeals ? "default" : "secondary"} className="text-xs">
                      {canApproveDeals ? "Allowed" : "Restricted"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">GET /api/legal/contracts</span>
                    <Badge variant={canAccessLegalReview ? "default" : "secondary"} className="text-xs">
                      {canAccessLegalReview ? "Allowed" : "Restricted"}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="comparison">
          <PermissionComparison />
        </TabsContent>
      </Tabs>
    </div>
  );
}