// Phase 1: Streamlined Role-Based Dashboard - Lean & Focused
import { useUserPermissions } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { usePriorityItems } from "@/hooks/usePriorityItems";
import { UniversalApprovalQueue } from "@/components/approval/UniversalApprovalQueue";
import { DataTable } from "@/components/ui/data-table";
import { DealStatusBadge } from "@/components/deal-status/DealStatusBadge";
import type { Deal, UserRole, DealStatus } from "@shared/schema";
import { Link, useLocation } from "wouter";
import { ColumnDef } from "@tanstack/react-table";
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
  const [, navigate] = useLocation(); // Move hook call to top level to avoid conditional usage
  
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

  // Helper function to format currency in shortened format (from UnifiedDashboard)
  const formatShortCurrency = (amount: number, isMultiTier: boolean = false): string => {
    if (amount === 0) return "$0";
    
    const suffix = isMultiTier ? "+" : "";
    
    if (amount >= 1000000000) {
      return `$${(amount / 1000000000).toFixed(amount % 1000000000 === 0 ? 0 : 1)}B${suffix}`;
    } else if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(amount % 1000000 === 0 ? 0 : 1)}M${suffix}`;
    } else if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(amount % 1000 === 0 ? 0 : 1)}k${suffix}`;
    } else {
      return `$${amount.toFixed(0)}${suffix}`;
    }
  };

  // Helper function to get deal value (from UnifiedDashboard)
  const getDealValue = (deal: Deal & { tier1Revenue?: number; totalTierRevenue?: number; tiers?: any[] }): { amount: number; isMultiTier: boolean } => {
    // For scoping deals, use growth ambition
    if (deal.status === 'scoping' && deal.growthAmbition) {
      return { amount: deal.growthAmbition, isMultiTier: false };
    }
    
    // For tiered deals, ALWAYS show + sign since they are inherently multi-tier
    if (deal.dealStructure === 'tiered') {
      // Use tier1Revenue if available, otherwise use annualRevenue or growthAmbition
      const amount = deal.tier1Revenue || deal.annualRevenue || deal.growthAmbition || 0;
      return { amount, isMultiTier: true }; // Always true for tiered deals
    }
    
    // For flat commit deals, use annual revenue (no + sign)
    if (deal.dealStructure === 'flat_commit' && deal.annualRevenue) {
      return { amount: deal.annualRevenue, isMultiTier: false };
    }
    
    // Fallback to any available revenue value
    const amount = deal.annualRevenue || deal.growthAmbition || 0;
    return { amount, isMultiTier: false };
  };

  // Define columns for seller's recent deals table (simplified version of UnifiedDashboard)
  const sellerDealColumns: ColumnDef<Deal>[] = [
    {
      id: "client",
      header: "Client",
      cell: ({ row }) => {
        const deal = row.original;
        const clientName = deal.advertiserName || deal.agencyName || "N/A";
        return <div className="font-medium text-slate-900">{clientName}</div>;
      },
    },
    {
      id: "dealValue", 
      header: "Deal Value",
      cell: ({ row }) => {
        const { amount, isMultiTier } = getDealValue(row.original);
        return <div className="font-medium">{formatShortCurrency(amount, isMultiTier)}</div>;
      },
    },
    {
      accessorKey: "dealStructure",
      header: "Type",
      cell: ({ row }) => {
        const structure = row.original.dealStructure;
        const typeLabels = {
          'tiered': 'Tiered',
          'flat_commit': 'Flat Commit'
        };
        const label = typeLabels[structure as keyof typeof typeLabels] || structure;
        return <div className="text-sm text-slate-700">{label}</div>;
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const deal = row.original;
        const status = deal.status as DealStatus;
        return (
          <div className="flex items-center gap-2">
            <DealStatusBadge status={status} />
            {deal.revisionCount > 0 && (
              <Badge variant="outline" className="text-xs px-1 py-0">
                Rev {deal.revisionCount}
              </Badge>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "updatedAt",
      header: "Updated",
      cell: ({ row }) => {
        const updatedAt = row.original.updatedAt;
        if (!updatedAt) return <div className="text-sm text-slate-500">N/A</div>;
        
        const date = new Date(updatedAt.toString());
        const now = new Date();
        const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
        
        let timeString;
        if (diffInHours < 1) {
          timeString = "Just now";
        } else if (diffInHours < 24) {
          timeString = `${diffInHours}h ago`;
        } else {
          const diffInDays = Math.floor(diffInHours / 24);
          timeString = `${diffInDays}d ago`;
        }
        
        return <div className="text-sm text-slate-500">{timeString}</div>;
      },
    }
  ];

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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-50">
      <div className="p-8 space-y-8 max-w-7xl mx-auto">
        {/* Enhanced Welcome Header with Brand Gradient */}
        <div className="relative overflow-hidden bg-gradient-to-br from-[#3e0075] via-[#5a0099] to-[#7c2d9e] rounded-2xl p-8 text-white shadow-xl">
          <div className="absolute inset-0 bg-black/5 backdrop-blur-sm"></div>
          <div className="relative z-10 flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-3 text-white">Welcome back, {userName}</h1>
              <p className="text-white/90 text-lg">Here's what's happening with your commercial deals</p>
            </div>
            <div className="text-right">
              <Badge variant="secondary" className="bg-white/20 text-white border-white/30 backdrop-blur-sm px-5 py-2 text-sm font-medium">
                {userRole.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                {userDepartment && (
                  <div className="text-xs opacity-80 mt-1">
                    {userDepartment.charAt(0).toUpperCase() + userDepartment.slice(1)} Team
                  </div>
                )}
              </Badge>
            </div>
          </div>
          {/* Decorative gradient orbs */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-white/10 to-transparent rounded-full blur-3xl transform translate-x-32 -translate-y-32"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tl from-white/10 to-transparent rounded-full blur-2xl transform -translate-x-24 translate-y-24"></div>
        </div>

        {/* Enhanced Key Metrics with Visual Hierarchy */}
        <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="w-3 h-8 bg-gradient-to-b from-[#3e0075] to-[#5a0099] rounded-full"></div>
              <div>
                <CardTitle className="text-2xl text-slate-900">{roleMetrics.title}</CardTitle>
                <CardDescription className="text-slate-600 text-base">{roleMetrics.description}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {roleMetrics.metrics.map((metric, index) => {
                const IconComponent = metric.icon;
                return (
                  <div key={index} className="group relative p-6 bg-white rounded-xl border border-slate-200 hover:border-[#3e0075]/20 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                    <div className="flex items-center justify-between mb-4">
                      <div className={`p-4 ${metric.bgColor} rounded-xl shadow-sm group-hover:shadow-md transition-shadow`}>
                        <IconComponent className={`h-7 w-7 ${metric.color}`} />
                      </div>
                      <div className="w-2 h-2 bg-gradient-to-r from-[#3e0075] to-[#5a0099] rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-3xl font-bold text-slate-900 group-hover:text-[#3e0075] transition-colors">{metric.value}</div>
                      <p className="text-sm font-medium text-slate-600">{metric.label}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Enhanced Action Items + Quick Tools with Visual Grouping */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          <div className="xl:col-span-2">
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${priorityItems.length > 0 ? 'bg-orange-100' : 'bg-blue-100'}`}>
                    {priorityItems.length > 0 ? (
                      <AlertTriangle className="h-6 w-6 text-orange-600" />
                    ) : (
                      <PlusCircle className="h-6 w-6 text-blue-600" />
                    )}
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-xl text-slate-900 flex items-center gap-3">
                      {priorityItems.length > 0 ? 'Action Items' : 'Workflow Actions'}
                      {priorityItems.length > 0 && (
                        <Badge variant="secondary" className="bg-orange-100 text-orange-700 border-orange-200">
                          {priorityItems.length}
                        </Badge>
                      )}
                    </CardTitle>
                    <CardDescription className="text-slate-600">
                      {priorityItems.length > 0 
                        ? "Urgent tasks requiring attention plus essential workflow actions"
                        : "Essential workflow actions for your role"
                      }
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
            {/* Priority Tasks Section (when available) */}
            {priorityItems.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Needs Your Attention
                </h4>
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
            )}

            {/* Essential Actions - Workflow Specific Only */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <PlusCircle className="h-4 w-4" />
                {userRole === 'seller' && "Deal Actions"}
                {userRole === 'department_reviewer' && "Review Actions"}
                {userRole === 'approver' && "Approval Actions"}
                {userRole === 'admin' && "Admin Actions"}
              </h4>
              
              <div className="grid grid-cols-2 gap-4">
                {/* Enhanced Seller Actions with Visual Design */}
                {userRole === 'seller' && (
                  <>
                    <Button asChild className="h-auto p-6 flex-col gap-3 bg-gradient-to-br from-[#3e0075] to-[#5a0099] hover:from-[#2d0055] hover:to-[#4a0088] text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                      <Link to="/submit-deal">
                        <div className="p-2 bg-white/20 rounded-lg">
                          <PlusCircle className="h-6 w-6" />
                        </div>
                        <span className="font-medium">Create New Deal</span>
                      </Link>
                    </Button>
                    <Button asChild variant="outline" className="h-auto p-6 flex-col gap-3 border-2 border-slate-200 hover:border-[#3e0075] hover:bg-[#3e0075]/5 transition-all duration-300 transform hover:-translate-y-1">
                      <Link to="/testing">
                        <div className="p-2 bg-slate-100 rounded-lg group-hover:bg-[#3e0075]/10">
                          <BarChart3 className="h-6 w-6 text-slate-600" />
                        </div>
                        <span className="font-medium text-slate-700">Deal Analytics</span>
                      </Link>
                    </Button>
                  </>
                )}

                {/* Department Reviewer: Focus on review workflow */}
                {userRole === 'department_reviewer' && (
                  <>
                    <Button asChild className="h-auto p-4 flex-col gap-2">
                      <Link to="/deals">
                        <CheckCircle className="h-5 w-5" />
                        <span className="text-sm">Review Queue</span>
                      </Link>
                    </Button>
                    <Button asChild variant="outline" className="h-auto p-4 flex-col gap-2">
                      <Link to="/testing">
                        <Users className="h-5 w-5" />
                        <span className="text-sm">Team Tools</span>
                      </Link>
                    </Button>
                  </>
                )}

                {/* Approver: Focus on business decisions */}
                {userRole === 'approver' && (
                  <>
                    <Button asChild className="h-auto p-4 flex-col gap-2">
                      <Link to="/deals">
                        <CheckCircle className="h-5 w-5" />
                        <span className="text-sm">Approve Deals</span>
                      </Link>
                    </Button>
                    <Button asChild variant="outline" className="h-auto p-4 flex-col gap-2">
                      <Link to="/testing">
                        <BarChart3 className="h-5 w-5" />
                        <span className="text-sm">Performance</span>
                      </Link>
                    </Button>
                  </>
                )}

                {/* Admin: System management only */}
                {userRole === 'admin' && (
                  <>
                    <Button asChild className="h-auto p-4 flex-col gap-2">
                      <Link to="/admin">
                        <Users className="h-5 w-5" />
                        <span className="text-sm">Admin Panel</span>
                      </Link>
                    </Button>
                    <Button asChild variant="outline" className="h-auto p-4 flex-col gap-2">
                      <Link to="/testing">
                        <Users className="h-5 w-5" />
                        <span className="text-sm">System Test</span>
                      </Link>
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      </div>
      </div>

      {/* Role-Specific Workflow Section */}
      {userRole !== 'seller' && (
        <UniversalApprovalQueue 
          userRole={userRole} 
          userDepartment={userDepartment} 
          departmentDisplayName={departments.find(d => d.department === userDepartment)?.displayName}
        />
      )}

      {/* Seller-Specific: Recent Deal Activity with DataTable */}
      {userRole === 'seller' && (
        <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl text-slate-900">
              <FileText className="h-6 w-6" />
              My Recent Deals
            </CardTitle>
            <CardDescription className="text-slate-600">Your latest deal submissions and their current status</CardDescription>
          </CardHeader>
          <CardContent>
            {deals.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-700 mb-2">No deals yet</h3>
                <p className="text-slate-500 mb-4">Ready to create your first deal?</p>
                <Button asChild className="bg-gradient-to-br from-[#3e0075] to-[#5a0099] hover:from-[#2d0055] hover:to-[#4a0088] text-white border-0">
                  <Link to="/submit-deal">
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Create Deal
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="bg-white border border-slate-200 rounded-md">
                <DataTable 
                  columns={sellerDealColumns} 
                  data={deals.slice(0, 10)} // Show last 10 deals
                  searchKey="client"
                  placeholder="Search your deals..."
                  statusFilter={true}
                  onRowClick={(deal) => navigate(`/deals/${deal.id}`)}
                />
              </div>
            )}
          </CardContent>
        </Card>
      )}

      </div>
    </div>
  );
}