// Phase 7B: Role-based permissions demo page
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserProfileHeader } from "@/components/ui/user-profile-header";
import { RoleBasedDashboard } from "@/components/dashboard/RoleBasedDashboard";
import { RoleBasedStatusActions } from "@/components/deal-status/RoleBasedStatusActions";
import { useCurrentUser, useUserPermissions } from "@/hooks/useAuth";
import { useAllowedTransitions } from "@/hooks/useAllowedTransitions";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Users, Shield, ChevronRight } from "lucide-react";
import type { Deal, UserRole } from "@shared/schema";

export default function RoleDemo() {
  const [selectedDealId, setSelectedDealId] = useState<number>(1);
  const { data: currentUser } = useCurrentUser();
  const { canCreateDeals, canViewAllDeals, canApproveDeals, canAccessLegalReview } = useUserPermissions();
  
  const { data: deals = [] } = useQuery({
    queryKey: ["/api/deals"],
    queryFn: () => apiRequest("/api/deals") as Promise<Deal[]>,
  });

  const selectedDeal = deals.find(d => d.id === selectedDealId);
  const { data: allowedTransitions = [] } = useAllowedTransitions(
    selectedDealId, 
    selectedDeal?.status as any
  );

  if (!currentUser) {
    return <div className="p-6">Loading user data...</div>;
  }

  const roleConfigs = {
    seller: {
      color: "bg-blue-100 text-blue-800",
      description: "Can create and submit deals for review",
    },
    approver: {
      color: "bg-green-100 text-green-800", 
      description: "Can review, approve, and reject deals",
    },
    legal: {
      color: "bg-purple-100 text-purple-800",
      description: "Can manage legal review and contracts",
    },
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Phase 7B: Role-Based Permissions Demo</h1>
        <p className="text-muted-foreground">
          Demonstrates the 9-status workflow with role-based access control
        </p>
      </div>

      <UserProfileHeader />

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="h-5 w-5" />
              <span>Current User Permissions</span>
            </CardTitle>
            <CardDescription>
              Based on your role: <Badge className={roleConfigs[currentUser.role].color}>
                {currentUser.role.charAt(0).toUpperCase() + currentUser.role.slice(1)}
              </Badge>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-sm text-muted-foreground mb-3">
              {roleConfigs[currentUser.role].description}
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center space-x-2">
                <Badge variant={canCreateDeals ? "default" : "secondary"} className="text-xs">
                  {canCreateDeals ? "✓" : "✗"}
                </Badge>
                <span className="text-sm">Create Deals</span>
              </div>
              
              <div className="flex items-center space-x-2">
                <Badge variant={canViewAllDeals ? "default" : "secondary"} className="text-xs">
                  {canViewAllDeals ? "✓" : "✗"}
                </Badge>
                <span className="text-sm">View All Deals</span>
              </div>
              
              <div className="flex items-center space-x-2">
                <Badge variant={canApproveDeals ? "default" : "secondary"} className="text-xs">
                  {canApproveDeals ? "✓" : "✗"}
                </Badge>
                <span className="text-sm">Approve Deals</span>
              </div>
              
              <div className="flex items-center space-x-2">
                <Badge variant={canAccessLegalReview ? "default" : "secondary"} className="text-xs">
                  {canAccessLegalReview ? "✓" : "✗"}
                </Badge>
                <span className="text-sm">Legal Review</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <ChevronRight className="h-5 w-5" />
              <span>Status Transition Test</span>
            </CardTitle>
            <CardDescription>
              Test role-based status transitions on sample deals
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Deal to Test:</label>
              <Select value={selectedDealId.toString()} onValueChange={(value) => setSelectedDealId(parseInt(value))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {deals.slice(0, 5).map((deal) => (
                    <SelectItem key={deal.id} value={deal.id.toString()}>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline" className="text-xs">
                          {deal.status}
                        </Badge>
                        <span className="truncate">{deal.dealName}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedDeal && (
              <div className="space-y-3">
                <div className="text-sm">
                  <strong>Current Status:</strong> 
                  <Badge variant="outline" className="ml-2 text-xs">
                    {selectedDeal.status}
                  </Badge>
                </div>
                
                <div className="text-sm">
                  <strong>Allowed Transitions:</strong>
                  <div className="mt-1 space-x-1">
                    {allowedTransitions.length > 0 ? (
                      allowedTransitions.map((status) => (
                        <Badge key={status} variant="secondary" className="text-xs">
                          {status}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-muted-foreground text-xs">
                        No transitions allowed for your role
                      </span>
                    )}
                  </div>
                </div>

                <RoleBasedStatusActions
                  dealId={selectedDeal.id}
                  currentStatus={selectedDeal.status as any}
                  className="pt-2"
                />
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>Role-Based Dashboard Preview</span>
          </CardTitle>
          <CardDescription>
            Dashboard content varies based on user role and permissions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RoleBasedDashboard />
        </CardContent>
      </Card>
    </div>
  );
}