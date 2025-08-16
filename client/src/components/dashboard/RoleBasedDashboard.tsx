// Phase 1: Streamlined Role-Based Dashboard - Lean & Focused
import { useUserPermissions } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { usePriorityItems } from "@/hooks/usePriorityItems";
import { UniversalApprovalQueue } from "@/components/approval/UniversalApprovalQueue";
import type { Deal, UserRole } from "@shared/schema";
import { Link } from "wouter";
import { 
  Briefcase, 
  TrendingUp, 
  FileText, 
  Scale, 
  Users, 
  BarChart3,
  PlusCircle,
  CheckCircle,
  AlertTriangle,
  Clock
} from "lucide-react";

export function RoleBasedDashboard() {
  const { currentUser, canCreateDeals, canViewAllDeals, canApproveDeals, canAccessLegalReview } = useUserPermissions();
  
  // Fetch core data
  const { data: stats } = useQuery({
    queryKey: ["/api/stats"],
    queryFn: () => apiRequest("/api/stats"),
  });
  
  const { data: deals = [] } = useQuery({
    queryKey: ["/api/deals"],
    queryFn: () => apiRequest("/api/deals") as Promise<Deal[]>,
  });

  const { data: departments = [] } = useQuery<{ department: string; displayName: string }[]>({
    queryKey: ['/api/approval-departments'],
    staleTime: 300000 // 5 minutes
  });

  // Get priority items for current user
  const { 
    priorityItems, 
    priorityStats, 
    isLoading: priorityLoading 
  } = usePriorityItems(currentUser?.role as UserRole);

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <Clock className="h-8 w-8 animate-spin mx-auto mb-4 text-slate-400" />
          <p className="text-slate-500">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Helper to get user's name for personalization
  const userName = currentUser?.firstName || currentUser?.username || "User";
  const userRole = currentUser?.role as UserRole;
  const userDepartment = currentUser?.department;

  // Get role-specific metrics (streamlined to 3-4 key items only)
  const getRoleSpecificMetrics = () => {
    const relevantDeals = canViewAllDeals ? deals : deals; // Future: filter by user
    
    switch (userRole) {
      case "seller":
        return {
          title: "My Pipeline",
          description: "Your personal deal performance",
          metrics: [
            { 
              label: "My Deals", 
              value: relevantDeals.length, 
              icon: Briefcase,
              color: "text-blue-600",
              bgColor: "bg-blue-100"
            },
            { 
              label: "Active Pipeline", 
              value: relevantDeals.filter(d => ["scoping", "submitted", "under_review", "negotiating", "approved"].includes(d.status)).length, 
              icon: TrendingUp,
              color: "text-orange-600", 
              bgColor: "bg-orange-100"
            },
            { 
              label: "Win Rate", 
              value: `${stats?.closeRate || 0}%`, 
              icon: BarChart3,
              color: "text-green-600",
              bgColor: "bg-green-100"
            }
          ]
        };
        
      case "approver":
        return {
          title: "Business Decisions",
          description: "Strategic approvals awaiting your decision", 
          metrics: [
            { 
              label: "Pending Approval", 
              value: relevantDeals.filter(d => d.status === "under_review").length, 
              icon: FileText,
              color: "text-red-600",
              bgColor: "bg-red-100"
            },
            { 
              label: "In Negotiation", 
              value: relevantDeals.filter(d => d.status === "negotiating").length, 
              icon: TrendingUp,
              color: "text-amber-600",
              bgColor: "bg-amber-100"
            },
            { 
              label: "Pipeline Value", 
              value: `$${Math.round(relevantDeals.filter(d => d.status === "under_review").reduce((sum, deal) => sum + (deal.annualRevenue || 0), 0) / 1000)}k`, 
              icon: BarChart3,
              color: "text-green-600",
              bgColor: "bg-green-100"
            }
          ]
        };
        
      case "department_reviewer":
        const deptDisplayName = departments.find(d => d.department === userDepartment)?.displayName || userDepartment;
        return {
          title: `${deptDisplayName} Review Queue`,
          description: "Technical validation for your department",
          metrics: [
            { 
              label: "Pending Review", 
              value: relevantDeals.filter(d => d.status === "under_review").length, 
              icon: FileText,
              color: "text-purple-600",
              bgColor: "bg-purple-100"
            },
            { 
              label: "Review Capacity", 
              value: "75%", // Future: calculate actual capacity
              icon: Users,
              color: "text-blue-600",
              bgColor: "bg-blue-100"
            },
            { 
              label: "Avg Review Time", 
              value: "2.1 days", // Future: calculate from data
              icon: Clock,
              color: "text-green-600",
              bgColor: "bg-green-100"
            }
          ]
        };
        
      case "admin":
        return {
          title: "System Overview",
          description: "Platform health and user activity",
          metrics: [
            { 
              label: "Total Deals", 
              value: stats?.totalDeals || 0, 
              icon: Briefcase,
              color: "text-slate-600",
              bgColor: "bg-slate-100"
            },
            { 
              label: "Active Users", 
              value: "12", // Future: get from user activity API
              icon: Users,
              color: "text-blue-600",
              bgColor: "bg-blue-100"
            },
            { 
              label: "System Health", 
              value: "98%", // Future: get from monitoring
              icon: CheckCircle,
              color: "text-green-600",
              bgColor: "bg-green-100"
            }
          ]
        };
        
      default:
        return {
          title: "Dashboard",
          description: "Your overview",
          metrics: []
        };
    }
  };

  // Get the role-specific metrics for display
  const roleMetrics = getRoleSpecificMetrics();

  return (
    <div className="p-6 space-y-8">
      {/* Welcome Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Welcome back, {userName}</h1>
          <p className="mt-1 text-slate-500">Here's what's happening with your commercial deals</p>
        </div>
        <Badge variant="outline" className="capitalize">
          {userRole.replace('_', ' ')}
          {userDepartment && ` - ${userDepartment}`}
        </Badge>
      </div>

      {/* Role-Specific Key Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>{roleMetrics.title}</CardTitle>
          <CardDescription>{roleMetrics.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {roleMetrics.metrics.map((metric, index) => {
              const IconComponent = metric.icon;
              return (
                <div key={index} className="flex items-center p-4 border border-slate-200 rounded-lg hover:shadow-md transition-shadow">
                  <div className={`p-3 ${metric.bgColor} rounded-full mr-4`}>
                    <IconComponent className={`h-6 w-6 ${metric.color}`} />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-slate-900">{metric.value}</div>
                    <p className="text-sm text-slate-500">{metric.label}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Priority Action Items */}
      {priorityItems.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Action Items
              <Badge variant="secondary">{priorityItems.length}</Badge>
            </CardTitle>
            <CardDescription>Items requiring your immediate attention</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {priorityItems.slice(0, 3).map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 border border-slate-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`p-1 rounded-full ${
                      item.urgencyLevel === 'high' ? 'bg-red-100' : 
                      item.urgencyLevel === 'medium' ? 'bg-amber-100' : 'bg-blue-100'
                    }`}>
                      {item.urgencyLevel === 'high' ? 
                        <AlertTriangle className="h-4 w-4 text-red-600" /> :
                        item.urgencyLevel === 'medium' ? 
                        <Clock className="h-4 w-4 text-amber-600" /> :
                        <CheckCircle className="h-4 w-4 text-blue-600" />
                      }
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">{item.title}</p>
                      <p className="text-sm text-slate-500">{item.description}</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    {item.actionType === 'convert' ? 'Convert' :
                     item.actionType === 'approve' ? 'Review' :
                     item.actionType === 'nudge' ? 'Follow Up' : 'View'}
                  </Button>
                </div>
              ))}
              {priorityItems.length > 3 && (
                <p className="text-sm text-slate-500 text-center pt-2">
                  +{priorityItems.length - 3} more items
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Universal Approval Queue */}
      <UniversalApprovalQueue 
        userRole={userRole} 
        userDepartment={userDepartment} 
        departmentDisplayName={departments.find(d => d.department === userDepartment)?.displayName}
      />

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common tasks for your role</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {canCreateDeals && (
              <Button asChild className="h-auto p-4 flex-col gap-2">
                <Link to="/submit-deal">
                  <PlusCircle className="h-5 w-5" />
                  <span className="text-sm">Create Deal</span>
                </Link>
              </Button>
            )}
            {canViewAllDeals && (
              <Button variant="outline" className="h-auto p-4 flex-col gap-2">
                <FileText className="h-5 w-5" />
                <span className="text-sm">View All Deals</span>
              </Button>
            )}
            {canApproveDeals && (
              <Button variant="outline" className="h-auto p-4 flex-col gap-2">
                <CheckCircle className="h-5 w-5" />
                <span className="text-sm">Approve Deals</span>
              </Button>
            )}
            {userRole === 'admin' && (
              <Button asChild variant="outline" className="h-auto p-4 flex-col gap-2">
                <Link to="/admin">
                  <Users className="h-5 w-5" />
                  <span className="text-sm">Admin Panel</span>
                </Link>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}