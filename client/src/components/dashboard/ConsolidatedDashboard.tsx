// Consolidated Dashboard - Single source of truth for all dashboard functionality
import { useUserPermissions } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { usePriorityItems } from "@/hooks/usePriorityItems";
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
  Clock,
  DollarSign,
  Target
} from "lucide-react";

export function ConsolidatedDashboard() {
  const { currentUser, canCreateDeals, canViewAllDeals, canApproveDeals, canAccessLegalReview } = useUserPermissions();
  const [, navigate] = useLocation();
  
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

  // Fetch approval queue items for reviewers/approvers
  const { data: approvalItems = [] } = useQuery({
    queryKey: [`/api/approvals/pending?department=${currentUser?.department}`],
    enabled: (currentUser?.role === 'department_reviewer' || currentUser?.role === 'approver') && !!currentUser?.department,
    staleTime: 30000
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

  // Helper function to format currency in shortened format
  const formatShortCurrency = (amount: number): string => {
    if (amount === 0) return "$0";
    if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `$${(amount / 1000).toFixed(1)}K`;
    return `$${amount.toLocaleString()}`;
  };

  // Role-specific metrics configuration
  const getRoleSpecificMetrics = () => {
    const totalDeals = stats?.totalDeals || 0;
    const activeDeals = stats?.activeDeals || 0;
    const completedDeals = stats?.completedDeals || 0;
    const closeRate = totalDeals > 0 ? Math.round((completedDeals / totalDeals) * 100) : 0;

    switch (userRole) {
      case 'seller':
        const myDeals = deals.filter(deal => deal.createdBy === currentUser.id).length;
        const myActiveDeals = deals.filter(deal => deal.createdBy === currentUser.id && deal.status !== 'signed' && deal.status !== 'lost').length;
        const myWinRate = myDeals > 0 ? Math.round((deals.filter(deal => deal.createdBy === currentUser.id && deal.status === 'signed').length / myDeals) * 100) : 0;
        
        return [
          { 
            label: "My Deals", 
            value: myDeals.toString(), 
            description: "All deals",
            percentage: 100,
            icon: Briefcase,
            color: "text-slate-600",
            bgColor: "bg-slate-100",
            progressColor: "bg-slate-400"
          },
          { 
            label: "Active Pipeline", 
            value: myActiveDeals.toString(), 
            description: "In progress",
            percentage: myDeals > 0 ? Math.round((myActiveDeals / myDeals) * 100) : 0,
            icon: Clock,
            color: "text-amber-600",
            bgColor: "bg-amber-100",
            progressColor: "bg-amber-400"
          },
          { 
            label: "Win Rate", 
            value: `${myWinRate}%`, 
            description: "Won vs Lost",
            percentage: myWinRate,
            icon: Target,
            color: "text-green-600",
            bgColor: "bg-green-100",
            progressColor: "bg-green-400"
          }
        ];

      case 'department_reviewer':
      case 'approver':
        // Shared metrics for both reviewer and approver roles
        const pendingReviews = deals.filter(deal => deal.status === 'under_review' || deal.status === 'submitted').length;
        const pendingApprovals = deals.filter(deal => deal.status === 'approved').length;
        
        return [
          { 
            label: "Active Pipeline", 
            value: activeDeals.toString(), 
            description: "In progress",
            percentage: totalDeals > 0 ? Math.round((activeDeals / totalDeals) * 100) : 0,
            icon: Clock,
            color: "text-amber-600",
            bgColor: "bg-amber-100",
            progressColor: "bg-amber-400"
          },
          { 
            label: "Pending Reviews", 
            value: pendingReviews.toString(), 
            description: "Awaiting review",
            percentage: activeDeals > 0 ? Math.round((pendingReviews / activeDeals) * 100) : 0,
            icon: FileText,
            color: "text-blue-600",
            bgColor: "bg-blue-100",
            progressColor: "bg-blue-400"
          },
          { 
            label: "Pending Approvals", 
            value: pendingApprovals.toString(), 
            description: "Ready for approval",
            percentage: activeDeals > 0 ? Math.round((pendingApprovals / activeDeals) * 100) : 0,
            icon: CheckCircle,
            color: "text-green-600",
            bgColor: "bg-green-100",
            progressColor: "bg-green-400"
          }
        ];

      case 'admin':
        return [
          { 
            label: "Total Deals", 
            value: totalDeals.toString(), 
            description: "All deals",
            percentage: 100,
            icon: BarChart3,
            color: "text-slate-600",
            bgColor: "bg-slate-100",
            progressColor: "bg-slate-400"
          },
          { 
            label: "Active Users", 
            value: "12", // Future: get from user activity API
            description: "Currently active",
            percentage: 75,
            icon: Users,
            color: "text-blue-600",
            bgColor: "bg-blue-100",
            progressColor: "bg-blue-400"
          },
          { 
            label: "System Health", 
            value: "98%", // Future: get from monitoring
            description: "Operational status",
            percentage: 98,
            icon: CheckCircle,
            color: "text-green-600",
            bgColor: "bg-green-100",
            progressColor: "bg-green-400"
          }
        ];
        
      default:
        return [];
    }
  };

  const metrics = getRoleSpecificMetrics();

  // Smart deal table columns with Sales Channel and Region
  const dealColumns: ColumnDef<Deal>[] = [
    {
      accessorKey: "dealName",
      header: "Deal Name",
      cell: ({ row }) => {
        const deal = row.original;
        return (
          <div className="font-medium text-slate-900">
            {deal.dealName}
          </div>
        );
      },
    },
    {
      accessorKey: "client",
      header: "Client",
      cell: ({ row }) => (
        <div className="text-slate-700">{row.original.client}</div>
      ),
    },
    {
      accessorKey: "salesChannel",
      header: "Channel",
      cell: ({ row }) => (
        <div className="text-slate-600">{row.original.salesChannel || "Direct"}</div>
      ),
    },
    {
      accessorKey: "region",
      header: "Region",
      cell: ({ row }) => (
        <div className="text-slate-600">{row.original.region || "US"}</div>
      ),
    },
    {
      accessorKey: "dealValue",
      header: "Value",
      cell: ({ row }) => {
        const value = row.original.dealValue;
        return (
          <div className="font-medium text-slate-900">
            {formatShortCurrency(value)}
          </div>
        );
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.original.status as DealStatus;
        return <DealStatusBadge status={status} />;
      },
    },
    {
      accessorKey: "updatedAt",
      header: "Updated",
      cell: ({ row }) => {
        const updatedAt = row.original.updatedAt;
        const dateString = updatedAt ? new Date(updatedAt).toLocaleDateString() : "";
        return <div className="text-sm text-slate-500">{dateString}</div>;
      },
    },
  ];

  // Filter deals based on role
  const getFilteredDeals = () => {
    const nonDraftDeals = deals.filter(deal => deal.status !== 'draft');
    
    if (userRole === 'seller') {
      // Sellers see only their own deals
      return nonDraftDeals.filter(deal => deal.createdBy === currentUser.id);
    }
    
    // Other roles see all non-draft deals
    return nonDraftDeals;
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="p-8 space-y-8 max-w-7xl mx-auto">
        {/* Clean Professional Header */}
        <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-semibold text-slate-900 mb-2">Welcome back, {userName}</h1>
              <p className="text-slate-600 text-lg">Here's what's happening with your commercial deals</p>
            </div>
            <div className="text-right">
              <Badge variant="outline" className="border-[#3e0075]/20 text-[#3e0075] bg-[#3e0075]/5 px-4 py-2 text-sm font-medium">
                {userRole.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                {userDepartment && (
                  <div className="text-xs text-slate-500 mt-1 font-normal">
                    {userDepartment.charAt(0).toUpperCase() + userDepartment.slice(1)} Team
                  </div>
                )}
              </Badge>
            </div>
          </div>
        </div>

        {/* Enhanced Metrics Section - Inspired by provided design */}
        <div className="grid gap-6 md:grid-cols-3">
          {metrics.map((metric, index) => {
            const IconComponent = metric.icon;
            return (
              <Card key={index} className="border border-slate-200 shadow-sm bg-white">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-slate-500">{metric.label}</CardTitle>
                    <div className={`p-2 ${metric.bgColor} rounded-full`}>
                      <IconComponent className={`h-5 w-5 ${metric.color}`} />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="text-3xl font-bold text-slate-900">{metric.value}</div>
                    <div className="flex justify-between items-center">
                      <p className="text-xs text-slate-500">{metric.description}</p>
                      <p className="text-xs font-semibold text-slate-700">{metric.percentage}%</p>
                    </div>
                    <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden">
                      <div 
                        className={`${metric.progressColor} h-1 rounded-full transition-all duration-300`}
                        style={{ width: `${metric.percentage}%` }}
                      ></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Consolidated Action Items Section */}
        <Card className="border border-slate-200 shadow-sm bg-white">
          <CardHeader className="pb-6">
            <div className="flex items-center gap-3">
              <div className="w-1 h-6 bg-[#3e0075] rounded-full"></div>
              <div className="flex-1">
                <CardTitle className="text-xl font-semibold text-slate-900 flex items-center gap-3">
                  Action Items
                  {(priorityItems.length > 0 || approvalItems.length > 0) && (
                    <Badge variant="outline" className="border-orange-200 text-orange-700 bg-orange-50">
                      {priorityItems.length + approvalItems.length}
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription className="text-slate-500">
                  Urgent tasks and essential workflow actions for your role
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Priority Items */}
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
                </div>
              )}

              {/* Approval Queue Items (for reviewers/approvers) */}
              {approvalItems.length > 0 && (userRole === 'department_reviewer' || userRole === 'approver') && (
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    {userRole === 'department_reviewer' ? 'Review Queue' : 'Approval Queue'}
                  </h4>
                  {approvalItems.slice(0, 5).map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border border-slate-200 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="p-1 rounded-full bg-blue-100">
                          <FileText className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">{item.dealName}</p>
                          <p className="text-sm text-slate-500">{item.client} • {formatShortCurrency(item.dealValue)}</p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => navigate(`/deals/${item.dealId}`)}>
                        Review
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {/* Essential Workflow Actions */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                  <PlusCircle className="h-4 w-4" />
                  {userRole === 'seller' && "Deal Actions"}
                  {userRole === 'department_reviewer' && "Review Actions"}
                  {userRole === 'approver' && "Approval Actions"}
                  {userRole === 'admin' && "Admin Actions"}
                </h4>
                
                <div className="grid grid-cols-2 gap-4">
                  {/* Professional Seller Actions */}
                  {userRole === 'seller' && (
                    <>
                      <Button asChild className="h-auto p-6 flex-col gap-3 bg-[#3e0075] hover:bg-[#2d0055] text-white border-0 shadow-sm hover:shadow transition-all duration-200">
                        <Link to="/submit-deal">
                          <div className="p-2 bg-white/15 rounded-lg">
                            <PlusCircle className="h-5 w-5" />
                          </div>
                          <span className="font-medium text-sm">Create New Deal</span>
                        </Link>
                      </Button>
                      <Button asChild variant="outline" className="h-auto p-6 flex-col gap-3 border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all duration-200">
                        <Link to="/testing">
                          <div className="p-2 bg-slate-100 rounded-lg">
                            <BarChart3 className="h-5 w-5 text-slate-600" />
                          </div>
                          <span className="font-medium text-sm text-slate-700">Deal Analytics</span>
                        </Link>
                      </Button>
                    </>
                  )}

                  {/* Department Reviewer Actions */}
                  {userRole === 'department_reviewer' && (
                    <>
                      <Button asChild className="h-auto p-4 flex-col gap-2 bg-[#3e0075] hover:bg-[#2d0055] text-white">
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

                  {/* Approver Actions */}
                  {userRole === 'approver' && (
                    <>
                      <Button asChild className="h-auto p-4 flex-col gap-2 bg-[#3e0075] hover:bg-[#2d0055] text-white">
                        <Link to="/deals">
                          <Scale className="h-5 w-5" />
                          <span className="text-sm">Approval Queue</span>
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

                  {/* Admin Actions */}
                  {userRole === 'admin' && (
                    <>
                      <Button asChild className="h-auto p-4 flex-col gap-2 bg-[#3e0075] hover:bg-[#2d0055] text-white">
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

        {/* Smart Deal Table - No Action Column */}
        <Card className="border border-slate-200 shadow-sm bg-white">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-1 h-6 bg-[#3e0075] rounded-full"></div>
              <div>
                <CardTitle className="text-xl font-semibold text-slate-900 flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  {userRole === 'seller' ? 'My Deals' : 'All Deals'}
                </CardTitle>
                <CardDescription className="text-slate-500">
                  {userRole === 'seller' ? 'Your latest deal submissions and their current status' : 'Overview of all deals in the system'}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {getFilteredDeals().length === 0 ? (
              <div className="text-center py-16">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FileText className="h-8 w-8 text-slate-400" />
                </div>
                <h3 className="text-lg font-semibold text-slate-700 mb-2">No deals yet</h3>
                <p className="text-slate-500 mb-6">Ready to create your first deal?</p>
                {userRole === 'seller' && (
                  <Button asChild className="bg-[#3e0075] hover:bg-[#2d0055] text-white">
                    <Link to="/submit-deal">
                      <PlusCircle className="h-4 w-4 mr-2" />
                      Create Deal
                    </Link>
                  </Button>
                )}
              </div>
            ) : (
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <DataTable 
                  columns={dealColumns} 
                  data={getFilteredDeals()} 
                  searchKey="client"
                  placeholder="Search by client name..."
                  statusFilter={true}
                  onRowClick={(deal) => navigate(`/deals/${deal.id}`)}
                />
              </div>
            )}
          </CardContent>
        </Card>

      </div>
    </div>
  );
}