// Consolidated Dashboard - Single source of truth for all dashboard functionality
import { useUserPermissions } from "@/hooks/useAuth";
import { usePendingBusinessApprovals } from "@/hooks/usePendingBusinessApprovals";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { usePriorityItems } from "@/hooks/usePriorityItems";
import { useSellerMetrics, useSellerDealCategories, useSellerDeals, useSellerPipelineDeals } from "@/hooks/useSellerMetrics";
import { DataTable } from "@/components/ui/data-table";
import { DealStatusBadge } from "@/components/deal-status/DealStatusBadge";
import { DealRow } from "./DealRow";
import { StrategicInsights } from "./StrategicInsights";
import { classifyDealFlow } from "@/utils/dealClassification";
import type { Deal, UserRole, DealStatus } from "@shared/schema";
import { Link, useLocation } from "wouter";
import { getSalesChannelDisplayName, getRegionDisplayName } from "@shared/constants";
import { ColumnDef } from "@tanstack/react-table";
import { useDealTiers } from "@/hooks/useDealTiers";
import { TierDataAccess } from "@/utils/tier-data-access";
import { useMemo } from "react";
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
  Target,
  Play,
  ArrowRight
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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

  // Get tier data for all deals and calculate expected revenues
  const dealIds = deals.map(d => d.id);
  const { data: allTierData } = useQuery({
    queryKey: ['deal-tiers-bulk', dealIds],
    queryFn: async () => {
      const tierData = await Promise.all(
        dealIds.map(async (id) => {
          try {
            const response = await fetch(`/api/deals/${id}/tiers`);
            if (!response.ok) return { dealId: id, tiers: [] };
            const data = await response.json();
            let tiers = data.tiers || [];
            
            // Enhanced fallback: If no tiers, create one from migratedFinancials or deal data
            if (tiers.length === 0) {
              console.log(`Deal ${id}: No tiers found, applying fallback`);
              const dealResponse = await fetch(`/api/deals/${id}`);
              if (dealResponse.ok) {
                const deal = await dealResponse.json();
                // Use migratedFinancials.previousYearRevenue for Tesla-type deals
                const revenue = deal.migratedFinancials?.annualRevenue || 
                               deal.migratedFinancials?.previousYearRevenue || 
                               deal.previousYearRevenue || 0;
                const margin = deal.migratedFinancials?.annualGrossMargin || 
                              deal.migratedFinancials?.previousYearMargin ||
                              deal.previousYearMargin || 0.25; // Default 25% margin
                
                console.log(`Deal ${id} fallback data:`, {
                  dealName: deal.dealName,
                  annualRevenue: deal.migratedFinancials?.annualRevenue,
                  previousYearRevenue: deal.migratedFinancials?.previousYearRevenue,
                  calculatedRevenue: revenue,
                  calculatedMargin: margin
                });
                
                if (revenue > 0) {
                  tiers = [{
                    tierNumber: 1,
                    annualRevenue: revenue,
                    annualGrossMargin: margin,
                    incentives: []
                  }];
                  console.log(`Deal ${id}: Created fallback tier with revenue ${revenue}`);
                } else {
                  console.log(`Deal ${id}: No revenue found for fallback`);
                }
              }
            }
            
            return { dealId: id, tiers };
          } catch {
            return { dealId: id, tiers: [] };
          }
        })
      );
      return tierData;
    },
    enabled: dealIds.length > 0
  });
  
  // Calculate tier revenues using TierDataAccess utility
  const tierRevenues = useMemo(() => {
    if (!allTierData) return {};
    
    return allTierData.reduce((acc, { dealId, tiers }) => {
      const expectedRevenue = TierDataAccess.getExpectedRevenue(tiers);
      acc[dealId] = expectedRevenue;
      return acc;
    }, {} as Record<number, number>);
  }, [allTierData]);

  const { data: departments = [] } = useQuery<{ department: string; displayName: string }[]>({
    queryKey: ['/api/approval-departments'],
    staleTime: 300000 // 5 minutes
  });

  // Fetch approval queue items for reviewers/approvers
  const { data: approvalData } = useQuery({
    queryKey: [`/api/approvals/pending?role=${currentUser?.role}&department=${currentUser?.department}`],
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

  // Get pending business approvals for accurate Stage 2 metrics
  const { data: pendingBusinessData } = usePendingBusinessApprovals(currentUser?.role, currentUser?.department);

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
    userEmail: currentUser?.role === 'seller' ? currentUser?.email : undefined,
    tierRevenues 
  });
  const sellerDealCategories = useSellerDealCategories(deals, currentUser?.role === 'seller' ? currentUser?.email : undefined);
  const sellerPipelineDeals = useSellerPipelineDeals(deals, currentUser?.role === 'seller' ? currentUser?.email : undefined);

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
        // Department-aware metrics using approval queue data
        const pendingReviews = currentUser?.role === 'department_reviewer' 
          ? approvalItems?.filter((item: any) => item.type === 'department_approval').length || 0
          : approvalItems?.filter((item: any) => item.type === 'business_approval').length || 0;
        
        // Use new API endpoint for accurate Stage 2 pending approval counts
        const pendingApprovals = pendingBusinessData?.count || 0;
        
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
        <div className="text-slate-600">{getSalesChannelDisplayName(row.original.salesChannel)}</div>
      ),
    },
    {
      accessorKey: "region",
      header: "Region",
      cell: ({ row }) => (
        <div className="text-slate-600">{getRegionDisplayName(row.original.region)}</div>
      ),
    },
    {
      accessorKey: "totalDealValue",
      header: "Value",
      cell: ({ row }) => {
        // Use tier revenue aggregation instead of base deal annualRevenue  
        const deal = row.original as any;
        const tierRevenue = tierRevenues?.[deal.id] || 0;
        const value = tierRevenue || deal.totalValue || deal.growthAmbition || 0;
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

        {/* Role-Specific Dashboard Sections */}
        {userRole === 'seller' ? (
          <>
            {/* My Pipeline Section - Consolidated for Sellers */}
            <Card className="border border-slate-200 shadow-sm bg-white">
            <CardHeader className="pb-6">
              <div className="flex items-center gap-3">
                <div className="w-1 h-6 bg-[#3e0075] rounded-full"></div>
                <div className="flex-1">
                  <CardTitle className="text-xl font-semibold text-slate-900 flex items-center gap-3">
                    My Pipeline
                  </CardTitle>
                  <CardDescription className="text-slate-500">
                    Quick snapshot of your pipeline and actions needed
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {(() => {
                const { dealsNeedingAction, activeDeals, signedThisMonth } = sellerDealCategories;
                
                // Get upcoming deals (draft + scoping) from pipeline deals
                const upcomingDeals = sellerPipelineDeals.filter(deal => 
                  deal.status === 'draft' || deal.status === 'scoping'
                );
                
                // Get true active deals (submitted but not signed/lost)
                const trueActiveDeals = sellerPipelineDeals.filter(deal => 
                  !['draft', 'scoping', 'signed', 'lost', 'canceled'].includes(deal.status)
                );

                return (
                  <Tabs defaultValue="active" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 mb-6">
                      <TabsTrigger value="active" className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Active Deals ({trueActiveDeals.length})
                      </TabsTrigger>
                      <TabsTrigger value="upcoming" className="flex items-center gap-2">
                        <Play className="h-4 w-4" />
                        Upcoming Deals ({upcomingDeals.length})
                      </TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="active" className="space-y-3">
                      {trueActiveDeals.length > 0 ? (
                        <>
                          {trueActiveDeals.slice(0, 5).map((deal) => (
                            <div key={deal.id}>
                              <DealRow
                                deal={deal}
                                variant="default"
                                onClick={() => navigate(`/deals/${deal.id}`)}
                                showValue={true}
                              />
                            </div>
                          ))}
                          {trueActiveDeals.length > 5 && (
                            <div className="pt-2">
                              <Button asChild variant="ghost" className="w-full text-[#3e0075] hover:bg-[#f8f5ff]">
                                <Link to="/analytics">
                                  View {trueActiveDeals.length - 5} more active deals →
                                </Link>
                              </Button>
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="text-center py-12 text-slate-500">
                          <Clock className="h-12 w-12 mx-auto mb-3 text-slate-400" />
                          <p className="text-sm font-medium">No active deals</p>
                          <p className="text-xs text-slate-400 mt-1">Deals you've submitted will appear here</p>
                        </div>
                      )}
                    </TabsContent>
                    
                    <TabsContent value="upcoming" className="space-y-3">
                      {upcomingDeals.length > 0 ? (
                        <>
                          {upcomingDeals.map((deal) => {
                            const isDraft = deal.status === 'draft';
                            const actionLabel = isDraft ? 'Resume Draft' : 'Convert Deal';
                            const actionIcon = isDraft ? Play : ArrowRight;
                            const ActionIcon = actionIcon;
                            
                            return (
                              <div key={deal.id} className="border rounded-lg p-4 hover:bg-slate-50 transition-colors">
                                <div className="flex items-center justify-between">
                                  <div className="flex-1">
                                    <div className="font-medium text-slate-900">{deal.dealName || deal.advertiserName || 'New Deal'}</div>
                                    <div className="text-sm text-slate-600">
                                      {deal.advertiserName || deal.agencyName || 'Client TBD'} • {isDraft ? 'Draft' : 'Scoping'}
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    {deal.growthAmbition && (
                                      <div className="text-sm font-medium text-slate-700">
                                        {formatShortCurrency(deal.growthAmbition)}
                                      </div>
                                    )}
                                    <Button 
                                      size="sm"
                                      onClick={() => navigate(isDraft ? `/deals/${deal.id}` : `/request/proposal?from-scoping=${deal.id}`)}
                                      className="bg-[#3e0075] hover:bg-[#2d0055] text-white"
                                    >
                                      <ActionIcon className="h-4 w-4 mr-2" />
                                      {actionLabel}
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </>
                      ) : (
                        <div className="text-center py-12 text-slate-500">
                          <Play className="h-12 w-12 mx-auto mb-3 text-slate-400" />
                          <p className="text-sm font-medium">No upcoming deals</p>
                          <p className="text-xs text-slate-400 mt-1">Drafts and scoping deals will appear here</p>
                        </div>
                      )}
                    </TabsContent>
                  </Tabs>
                );
              })()}
            </CardContent>
          </Card>

            {/* Strategic Insights Section - Phase 1 Implementation for Sellers */}
            <StrategicInsights 
              userRole={userRole}
              deals={deals}
              userEmail={currentUser?.email}
              userDepartment={currentUser?.department}
              approvalItems={approvalItems}
            />
          </>
        ) : (
          /* Non-Seller Roles - Strategic Insights Focus */
          <>
            {/* Strategic Insights Section - Workflow Efficiency Intelligence */}
            <StrategicInsights 
              userRole={userRole}
              deals={deals}
              userEmail={currentUser?.email}
              userDepartment={currentUser?.department}
              approvalItems={approvalItems}
            />
          </>
        )}
      </div>
    </div>
  );
}