// Consolidated Dashboard - Single source of truth for all dashboard functionality
import { useUserPermissions } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { usePriorityItems } from "@/hooks/usePriorityItems";
import { useSellerMetrics, useSellerDealCategories, useSellerDeals } from "@/hooks/useSellerMetrics";
import { DataTable } from "@/components/ui/data-table";
import { DealStatusBadge } from "@/components/deal-status/DealStatusBadge";
import { DealRow } from "./DealRow";
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
  const { data: approvalData } = useQuery({
    queryKey: [`/api/approvals/pending?department=${currentUser?.department}`],
    enabled: (currentUser?.role === 'department_reviewer' || currentUser?.role === 'approver') && !!currentUser?.department,
    staleTime: 30000
  });
  
  const approvalItems = (approvalData as any)?.items || [];

  // Get priority items for current user
  const { 
    priorityItems, 
    priorityStats, 
    isLoading: priorityLoading 
  } = usePriorityItems(currentUser?.role as UserRole);

  // Always call hooks before any early returns to maintain hook order
  // Helper function to format currency in shortened format
  const formatShortCurrency = (amount: number): string => {
    if (amount === 0) return "$0";
    if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `$${(amount / 1000).toFixed(1)}K`;
    return `$${amount.toLocaleString()}`;
  };

  // Use centralized hooks for seller data (always call hooks)
  const sellerDeals = useSellerDeals(deals, currentUser?.role === 'seller' ? currentUser?.email : undefined);
  const sellerMetrics = useSellerMetrics({ 
    deals, 
    userEmail: currentUser?.role === 'seller' ? currentUser?.email : undefined 
  });
  const sellerDealCategories = useSellerDealCategories(deals, currentUser?.role === 'seller' ? currentUser?.email : undefined);

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

  // Role-specific metrics configuration
  const getRoleSpecificMetrics = () => {
    const totalDeals = stats?.totalDeals || 0;
    const activeDeals = stats?.activeDeals || 0;
    const completedDeals = stats?.completedDeals || 0;
    const closeRate = totalDeals > 0 ? Math.round((completedDeals / totalDeals) * 100) : 0;

    switch (userRole) {
      case 'seller':
        return [
          { 
            label: "Pipeline Value", 
            value: formatShortCurrency(sellerMetrics.pipelineValue), 
            description: "Active deals total",
            percentage: 100, // Always show full bar for pipeline value
            icon: DollarSign,
            color: "text-green-600",
            bgColor: "bg-green-100",
            progressColor: "bg-green-400"
          },
          { 
            label: "Close Rate", 
            value: `${sellerMetrics.closeRate}%`, 
            description: "Submission to signed",
            percentage: sellerMetrics.closeRate,
            icon: Target,
            color: "text-blue-600",
            bgColor: "bg-blue-100",
            progressColor: "bg-blue-400"
          },
          { 
            label: "Deals at Risk", 
            value: sellerMetrics.dealsAtRisk.toString(), 
            description: "Need attention",
            percentage: sellerMetrics.activeDeals > 0 ? Math.round((sellerMetrics.dealsAtRisk / sellerMetrics.activeDeals) * 100) : 0,
            icon: AlertTriangle,
            color: "text-red-600",
            bgColor: "bg-red-100",
            progressColor: "bg-red-400"
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
      accessorKey: "advertiserName",
      header: "Client",
      cell: ({ row }) => (
        <div className="text-slate-700">{row.original.advertiserName || row.original.agencyName || "N/A"}</div>
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
      accessorKey: "totalDealValue",
      header: "Value",
      cell: ({ row }) => {
        // Calculate total value from annualRevenue if available, fallback to default
        const deal = row.original as any;
        const value = deal.annualRevenue || deal.totalValue || 0;
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

  // Filter deals based on role - use centralized logic
  const getFilteredDeals = () => {
    if (userRole === 'seller') {
      return sellerDeals; // Already filtered by email and non-draft
    }
    // Other roles see all non-draft deals
    return deals.filter(deal => deal.status !== 'draft');
  };


  return (
    <div className="min-h-screen">
      <div className="space-y-8">
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

        {/* My Pipeline Section - Consolidated for Sellers */}
        {userRole === 'seller' ? (
          <Card className="border border-slate-200 shadow-sm bg-white">
            <CardHeader className="pb-6">
              <div className="flex items-center gap-3">
                <div className="w-1 h-6 bg-[#3e0075] rounded-full"></div>
                <div className="flex-1">
                  <CardTitle className="text-xl font-semibold text-slate-900 flex items-center gap-3">
                    My Pipeline
                    {sellerDealCategories.dealsNeedingAction.length > 0 && (
                      <Badge variant="outline" className="border-orange-200 text-orange-700 bg-orange-50">
                        {sellerDealCategories.dealsNeedingAction.length}
                      </Badge>
                    )} 
                  </CardTitle>
                  <CardDescription className="text-slate-500">
                    Your deals, actions, and performance
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {(() => {
                  const { dealsNeedingAction, activeDeals, signedThisMonth } = sellerDealCategories;
                  const pipelineValue = sellerMetrics.pipelineValue;

                  return (
                    <>
                      {/* Action Required Section */}
                      {dealsNeedingAction.length > 0 && (
                        <div className="space-y-3">
                          <h4 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4 text-red-500" />
                            Action Required ({dealsNeedingAction.length})
                          </h4>
                          {dealsNeedingAction.slice(0, 3).map((deal) => (
                            <DealRow
                              key={deal.id}
                              deal={deal}
                              variant="action"
                              onClick={() => navigate(`/deals/${deal.id}`)}
                              actionButton={{
                                label: "Fix Now",
                                onClick: () => navigate(`/deals/${deal.id}`)
                              }}
                              showValue={false}
                            />
                          ))}
                        </div>
                      )}

                      {/* Active Deals Section */}
                      <div className="space-y-3">
                        <h4 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          Active Deals ({activeDeals.length})
                        </h4>
                        {activeDeals.length > 0 ? (
                          <>
                            {activeDeals.slice(0, 5).map((deal) => (
                              <DealRow
                                key={deal.id}
                                deal={deal}
                                variant="default"
                                onClick={() => navigate(`/deals/${deal.id}`)}
                                showValue={true}
                              />
                            ))}
                            {activeDeals.length > 5 && (
                              <div className="pt-2">
                                <Button asChild variant="ghost" className="w-full text-[#3e0075] hover:bg-[#f8f5ff]">
                                  <Link to="/analytics">
                                    View {activeDeals.length - 5} more active deals →
                                  </Link>
                                </Button>
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="text-center py-8 border border-slate-200 rounded-lg">
                            <Briefcase className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                            <p className="text-slate-500 text-sm">No active deals in your pipeline</p>
                          </div>
                        )}
                      </div>

                      {/* Recent Performance Section */}
                      <div className="space-y-3">
                        <h4 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                          <TrendingUp className="h-4 w-4" />
                          Recent Performance
                        </h4>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-center">
                            <div className="text-lg font-semibold text-green-700">{signedThisMonth.length}</div>
                            <div className="text-xs text-green-600">Signed This Month</div>
                          </div>
                          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-center">
                            <div className="text-lg font-semibold text-blue-700">{formatShortCurrency(pipelineValue)}</div>
                            <div className="text-xs text-blue-600">Pipeline Value</div>
                          </div>
                        </div>
                        <Button asChild className="w-full bg-[#3e0075] hover:bg-[#2d0055] text-white">
                          <Link to="/request/proposal">
                            <PlusCircle className="h-4 w-4 mr-2" />
                            Create New Deal
                          </Link>
                        </Button>
                      </div>
                    </>
                  );
                })()} 
              </div>
            </CardContent>
          </Card>
        ) : (
          /* Non-Seller Roles - Keep existing Action Items and Recent Deals structure */
          <>
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
                      {approvalItems.slice(0, 5).map((item: any, index: number) => (
                        <div key={index} className="flex items-center justify-between p-3 border border-slate-200 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="p-1 rounded-full bg-blue-100">
                              <FileText className="h-4 w-4 text-blue-600" />
                            </div>
                            <div>
                              <p className="font-medium text-slate-900">{item.dealName}</p>
                              <p className="text-sm text-slate-500">{item.advertiserName || item.agencyName || "N/A"} • {formatShortCurrency(item.annualRevenue || item.totalValue || 0)}</p>
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
                      {userRole === 'department_reviewer' && "Review Actions"}
                      {userRole === 'approver' && "Approval Actions"}
                      {userRole === 'admin' && "Admin Actions"}
                    </h4>
                    
                    <div className="grid grid-cols-2 gap-4">
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

            {/* Recent Deals Preview - Dashboard Summary */}
            <Card className="border border-slate-200 shadow-sm bg-white">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-1 h-6 bg-[#3e0075] rounded-full"></div>
                    <div>
                      <CardTitle className="text-xl font-semibold text-slate-900 flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        Recent Deals
                      </CardTitle>
                      <CardDescription className="text-slate-500">
                        Latest activity and deal updates
                      </CardDescription>
                    </div>
                  </div>
                  <Button asChild variant="outline" className="border-[#3e0075] text-[#3e0075] hover:bg-[#3e0075] hover:text-white">
                    <Link to="/analytics">
                      View All Deals
                    </Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {getFilteredDeals().length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <FileText className="h-6 w-6 text-slate-400" />
                    </div>
                    <h3 className="text-base font-medium text-slate-700 mb-2">No deals yet</h3>
                    <p className="text-slate-500 text-sm mb-4">Ready to review some deals?</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {getFilteredDeals().slice(0, 5).map((deal) => (
                      <DealRow
                        key={deal.id}
                        deal={deal}
                        variant="compact"
                        onClick={() => navigate(`/deals/${deal.id}`)}
                        showValue={true}
                      />
                    ))}
                    {getFilteredDeals().length > 5 && (
                      <div className="pt-3 border-t border-slate-200">
                        <Button asChild variant="ghost" className="w-full text-[#3e0075] hover:bg-[#f8f5ff]">
                          <Link to="/analytics">
                            View {getFilteredDeals().length - 5} more deals →
                          </Link>
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}