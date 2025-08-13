// Phase 7B: Role-based dashboard component
import { useDashboardSections, useUserPermissions } from "@/hooks/useAuth";
import { UserProfileHeader } from "@/components/ui/user-profile-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { Deal } from "@shared/schema";
import { Briefcase, TrendingUp, FileText, Scale, Users, BarChart3 } from "lucide-react";

export function RoleBasedDashboard() {
  const { currentUser, canCreateDeals, canViewAllDeals, canApproveDeals, canAccessLegalReview } = useUserPermissions();
  const dashboardSections = useDashboardSections();
  const { data: stats } = useQuery({
    queryKey: ["/api/stats"],
    queryFn: () => apiRequest("/api/stats"),
  });
  
  const { data: deals = [] } = useQuery({
    queryKey: ["/api/deals"],
    queryFn: () => apiRequest("/api/deals") as Promise<Deal[]>,
  });

  if (!currentUser) {
    return <div>Loading...</div>;
  }

  const getRelevantDeals = () => {
    if (canViewAllDeals) {
      return deals;
    }
    // In a real implementation, filter by user ID
    return deals;
  };

  const relevantDeals = getRelevantDeals();

  const getRoleSpecificStats = () => {
    switch (currentUser.role) {
      case "seller":
        return {
          title: "Sales Performance",
          sections: [
            { label: "My Deals", value: relevantDeals.length, icon: Briefcase },
            { label: "In Progress", value: relevantDeals.filter(d => ["scoping", "submitted", "under_review", "negotiating"].includes(d.status)).length, icon: TrendingUp },
            { label: "Conversion Rate", value: `${stats ? Math.round(stats.successRate * 100) : 0}%`, icon: BarChart3 },
          ]
        };
      case "approver":
        return {
          title: "Approval Queue",
          sections: [
            { label: "Pending Review", value: relevantDeals.filter(d => d.status === "under_review").length, icon: FileText },
            { label: "Negotiating", value: relevantDeals.filter(d => d.status === "negotiating").length, icon: TrendingUp },
            { label: "Approved", value: relevantDeals.filter(d => d.status === "approved").length, icon: Briefcase },
          ]
        };
      case "legal":
        return {
          title: "Legal Review",
          sections: [
            { label: "Legal Review", value: relevantDeals.filter(d => d.status === "legal_review").length, icon: Scale },
            { label: "Contract Sent", value: relevantDeals.filter(d => d.status === "contract_sent").length, icon: FileText },
            { label: "Signed", value: relevantDeals.filter(d => d.status === "signed").length, icon: Users },
          ]
        };
      default:
        return { title: "Dashboard", sections: [] };
    }
  };

  const roleStats = getRoleSpecificStats();

  return (
    <div className="space-y-6">
      <UserProfileHeader />
      
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              {roleStats.title}
              <Badge variant="outline" className="text-sm">
                {currentUser.role.charAt(0).toUpperCase() + currentUser.role.slice(1)} View
              </Badge>
            </CardTitle>
            <CardDescription>
              {currentUser.role === "seller" && "Track your deal progress and performance metrics"}
              {currentUser.role === "approver" && "Manage deal approvals and review queue"}
              {currentUser.role === "legal" && "Handle legal reviews and contract management"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {roleStats.sections.map((section, index) => {
                const Icon = section.icon;
                return (
                  <div key={index} className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
                    <Icon className="h-8 w-8 text-primary" />
                    <div>
                      <p className="text-2xl font-bold">{section.value}</p>
                      <p className="text-sm text-muted-foreground">{section.label}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Available Actions</CardTitle>
            <CardDescription>Actions available based on your role permissions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {canCreateDeals && (
                <div className="flex items-center space-x-2">
                  <Badge variant="default" className="text-xs">✓</Badge>
                  <span className="text-sm">Create and submit new deals</span>
                </div>
              )}
              {canViewAllDeals && (
                <div className="flex items-center space-x-2">
                  <Badge variant="default" className="text-xs">✓</Badge>
                  <span className="text-sm">View all deals in the system</span>
                </div>
              )}
              {canApproveDeals && (
                <div className="flex items-center space-x-2">
                  <Badge variant="default" className="text-xs">✓</Badge>
                  <span className="text-sm">Approve and reject deals</span>
                </div>
              )}
              {canAccessLegalReview && (
                <div className="flex items-center space-x-2">
                  <Badge variant="default" className="text-xs">✓</Badge>
                  <span className="text-sm">Access legal review and contract management</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}