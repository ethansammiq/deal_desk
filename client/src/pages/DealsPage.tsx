import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useUserPermissions } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table";
import { DealStatusBadge } from "@/components/deal-status/DealStatusBadge";
import { apiRequest } from "@/lib/queryClient";
import type { Deal, DealStatus } from "@shared/schema";
import { Link, useLocation } from "wouter";
import { ColumnDef } from "@tanstack/react-table";
import { 
  classifyDealFlow, 
  getFlowBadgeInfo, 
  getDelayedDeals
} from "@/utils/dealClassification";
import { getSalesChannelDisplayName, getRegionDisplayName } from "@shared/constants";
import { format } from "date-fns";
import { 
  Briefcase, 
  PlusCircle, 
  Search,
  Filter,
  FileText,
  BarChart3
} from "lucide-react";

export default function DealsPage() {
  const { currentUser, canCreateDeals, canViewAllDeals } = useUserPermissions();
  const [location, navigate] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dealInsightFilter, setDealInsightFilter] = useState<string>("all");
  const [highlightedDeals, setHighlightedDeals] = useState<number[]>([]);
  
  // Helper function for consistent navigation with referrer tracking
  const navigateToDeal = (dealId: number) => {
    // Store current URL with parameters for breadcrumb navigation
    const currentUrl = window.location.pathname + window.location.search;
    sessionStorage.setItem('analyticsReferrer', currentUrl);
    
    navigate(`/deals/${dealId}`);
  };

  // Parse URL parameters on mount and location change
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const filter = params.get('filter');
    const highlight = params.get('highlight');
    
    // Apply filter if provided
    if (filter) {
      // Check if it's a flow intelligence filter (including legacy "delayed" filter)
      if (filter === 'needs_attention' || filter === 'on_track' || filter === 'delayed') {
        // Map legacy "delayed" filter to "needs_attention"
        const mappedFilter = filter === 'delayed' ? 'needs_attention' : filter;
        setDealInsightFilter(mappedFilter);
        setStatusFilter("all"); // Clear status filter when using insight filter
      } else {
        setStatusFilter(filter);
        setDealInsightFilter("all"); // Clear insight filter when using status filter
      }
    }
    
    // Parse highlighted deal IDs
    if (highlight) {
      const dealIds = highlight.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));
      setHighlightedDeals(dealIds);
    }
  }, [location]);
  
  // No longer needed - replaced by unified classification system
  
  // Fetch deals
  const { data: deals = [], isLoading } = useQuery({
    queryKey: ["/api/deals"],
    queryFn: () => apiRequest("/api/deals") as Promise<Deal[]>,
  });

  // Fetch approval queue for department reviewers to filter deals appropriately
  const { data: approvalData } = useQuery({
    queryKey: [`/api/approvals/pending?role=${currentUser?.role}&department=${currentUser?.department}`],
    enabled: currentUser?.role === 'department_reviewer' && !!currentUser?.department,
    staleTime: 30000
  });
  
  const approvalItems = (approvalData as any)?.items || [];
  const departmentDealIds = new Set(approvalItems.map((item: any) => item.dealId));

  // Helper to format currency in shortened format with multi-tier indicator (from UnifiedDashboard)
  const formatShortCurrency = (amount: number, isMultiTier = false): string => {
    if (amount === 0) return "$0";
    
    let suffix = '';
    if (amount >= 1000000) {
      suffix = `$${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000) {
      suffix = `$${(amount / 1000).toFixed(1)}K`;
    } else {
      suffix = `$${amount.toFixed(0)}`;
    }
    
    // Add + indicator for multi-tier deals
    return isMultiTier ? `${suffix}+` : suffix;
  };

  // Get tier revenues for all deals
  const dealIds = deals.map(d => d.id);
  const { data: tierRevenues } = useQuery({
    queryKey: ['deal-tier-revenues', dealIds],
    queryFn: async () => {
      const { DealCalculationService } = await import('@/services/dealCalculations');
      const revenues = await Promise.all(
        dealIds.map(async (id) => {
          try {
            const response = await fetch(`/api/deals/${id}/tiers`);
            if (!response.ok) return { dealId: id, revenue: 0 };
            const tiers = await response.json();
            const calculationService = new DealCalculationService([], []);
            const metrics = calculationService.calculateDealMetrics(tiers);
            return { dealId: id, revenue: metrics.totalAnnualRevenue };
          } catch {
            return { dealId: id, revenue: 0 };
          }
        })
      );
      return revenues.reduce((acc, { dealId, revenue }) => {
        acc[dealId] = revenue;
        return acc;
      }, {} as Record<number, number>);
    },
    enabled: dealIds.length > 0
  });

  // Helper function to get deal value using tier data aggregation
  const getDealValue = (deal: Deal & { tier1Revenue?: number; totalTierRevenue?: number; tiers?: any[] }): { amount: number; isMultiTier: boolean } => {
    // For scoping deals, use growth ambition
    if (deal.status === 'scoping' && deal.growthAmbition) {
      return { amount: deal.growthAmbition, isMultiTier: false };
    }
    
    // Get aggregated tier revenue for this deal
    const tierRevenue = tierRevenues?.[deal.id] || 0;
    
    // For tiered deals, ALWAYS show + sign since they are inherently multi-tier
    if (deal.dealStructure === 'tiered') {
      // Use aggregated tier revenue, fallback to growth ambition if no tiers yet
      const amount = tierRevenue || deal.growthAmbition || 0;
      return { amount, isMultiTier: true }; // Always true for tiered deals
    }
    
    // For flat commit deals, use tier revenue (no + sign)
    if (deal.dealStructure === 'flat_commit' && tierRevenue > 0) {
      return { amount: tierRevenue, isMultiTier: false };
    }
    
    // Fallback to any available revenue value
    const amount = tierRevenue || deal.growthAmbition || 0;
    return { amount, isMultiTier: false };
  };

  // Format relative date (from UnifiedDashboard)
  const formatRelativeDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diff = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
      
      if (diff === 0) return "Today";
      if (diff === 1) return "Yesterday";
      if (diff < 7) return `${diff} days ago`;
      if (diff < 30) return `${Math.floor(diff / 7)} week${Math.floor(diff / 7) !== 1 ? 's' : ''} ago`;
      return format(date, 'MMM d, yyyy');
    } catch (e) {
      return dateString || "Unknown date";
    }
  };

  // Classify deals using unified system - use backend flowIntelligence for consistency
  const classifiedDeals = deals.map(deal => {
    // Use backend flowIntelligence instead of recalculating
    const classification = {
      flowStatus: deal.flowIntelligence || 'on_track',
      reason: deal.flowIntelligence === 'needs_attention' ? 'Needs attention' : 'On track',
      daysInStatus: 0,
      actionRequired: deal.flowIntelligence === 'needs_attention',
      urgencyLevel: deal.flowIntelligence === 'needs_attention' ? 'attention' : 'normal'
    };
    
    return {
      ...deal,
      classification,
      badgeInfo: getFlowBadgeInfo(deal)
    };
  });

  // Deal table columns replicating UnifiedDashboard structure with modifications
  const dealColumns: ColumnDef<Deal>[] = [
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
      accessorKey: "salesChannel",
      header: "Sales Channel",
      cell: ({ row }) => {
        const channelLabels = {
          'holding_company': 'Holding Company',
          'independent_agency': 'Independent Agency', 
          'client_direct': 'Client Direct'
        };
        const channel = row.original.salesChannel;
        const label = channelLabels[channel as keyof typeof channelLabels] || channel;
        return <div className="text-sm text-slate-700">{label}</div>;
      },
    },
    {
      accessorKey: "region",
      header: "Region",
      cell: ({ row }) => {
        const regionLabels = {
          'northeast': 'Northeast',
          'midwest': 'Midwest',
          'midatlantic': 'Mid-Atlantic',
          'west': 'West',
          'south': 'South'
        };
        const region = row.original.region;
        const label = regionLabels[region as keyof typeof regionLabels] || region || "N/A";
        return <div className="text-sm text-slate-700">{label}</div>;
      },
    },
    {
      accessorKey: "dealStructure",
      header: "Deal Type",
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
      id: "dealValue", 
      header: "Deal Value",
      cell: ({ row }) => {
        const { amount, isMultiTier } = getDealValue(row.original);
        return <div className="font-medium">{formatShortCurrency(amount, isMultiTier)}</div>;
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
          </div>
        );
      },
      filterFn: (row, id, value) => {
        return value === row.getValue(id);
      },
    },
    {
      accessorKey: "dealInsight",
      header: "Deal Insight", 
      cell: ({ row }) => {
        const deal = row.original;
        // Use backend-calculated flowIntelligence for consistency
        const flowIntelligence = deal.flowIntelligence || 'on_track';
        
        if (flowIntelligence === 'needs_attention') {
          return (
            <Badge variant="destructive" className="text-xs font-medium">
              Needs Attention
            </Badge>
          );
        }
        
        return (
          <Badge variant="secondary" className="text-xs font-medium text-slate-600 bg-slate-100">
            On Track
          </Badge>
        );
      },
    },
    {
      accessorKey: "updatedAt",
      header: "Updated",
      cell: ({ row }) => {
        const updatedAt = row.original.updatedAt;
        const dateString = updatedAt ? updatedAt.toString() : "";
        return <div className="text-sm text-slate-500">{formatRelativeDate(dateString)}</div>;
      },
    },
  ];

  // No longer needed - using unified classification system

  // Filter deals based on search and status using unified backend flowIntelligence
  const filteredDeals = deals.filter(deal => {
    const matchesSearch = !searchTerm || 
      deal.dealName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      deal.advertiserName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      deal.agencyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      deal.referenceNumber.toLowerCase().includes(searchTerm.toLowerCase());
    
    let matchesStatus = true;
    if (statusFilter !== "all") {
      matchesStatus = deal.status === statusFilter;
    }

    // Deal Insight filtering based on flow intelligence - use backend flowIntelligence field for consistency
    let matchesInsight = true;
    if (dealInsightFilter !== "all") {
      matchesInsight = deal.flowIntelligence === dealInsightFilter;
    }

    // User permission filtering - sellers only see their deals, others see all deals
    let matchesUser = true;
    if (!canViewAllDeals && currentUser) {
      matchesUser = deal.email === currentUser.email;
    }
    
    // Department-specific filtering for department reviewers
    // Department reviewers should only see deals that require their department's review
    let matchesDepartment = true;
    if (currentUser?.role === 'department_reviewer' && currentUser?.department) {
      // Use actual approval queue data to determine which deals this department should see
      matchesDepartment = departmentDealIds.has(deal.id);
    }
    
    // Filter out draft deals, but include scoping deals for partnership team analytics
    return matchesSearch && matchesStatus && matchesInsight && matchesUser && matchesDepartment && deal.status !== 'draft';
  });

  // Get unique statuses for filter - include all statuses except draft
  const uniqueStatuses = Array.from(new Set(deals.map(deal => deal.status).filter(status => status !== 'draft')));
  // Removed categoryCounts - no longer needed after removing Flow Intelligence filters

  const userRole = currentUser?.role;

  return (
    <div className="min-h-screen">
      <div className="bg-white rounded-lg shadow-sm border border-[#f0e6ff] p-4 sm:p-6">
        <div className="space-y-8">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-slate-900 flex items-center gap-3">
              <BarChart3 className="h-8 w-8 text-[#3e0075]" />
              Analytics
            </h1>
            <p className="text-slate-600 mt-2">
              Comprehensive deal analytics and performance insights
            </p>
          </div>
          
          {canCreateDeals && (
            <Button asChild className="bg-[#3e0075] hover:bg-[#2d0055] text-white">
              <Link to="/request/proposal">
                <PlusCircle className="h-4 w-4 mr-2" />
                Create Deal
              </Link>
            </Button>
          )}
        </div>

        {/* Active Filter Banner */}
        {(statusFilter !== "all" || dealInsightFilter !== "all" || highlightedDeals.length > 0) && (
          <Card className="border border-purple-200 bg-purple-50">
            <CardContent className="py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-purple-600" />
                  <span className="text-sm font-medium text-purple-800">
                    {statusFilter !== "all" && `Showing ${statusFilter.replace('_', ' ')} deals`}
                    {dealInsightFilter !== "all" && `Showing ${dealInsightFilter === 'needs_attention' ? 'needs attention' : dealInsightFilter.replace('_', ' ')} deals`}
                    {highlightedDeals.length > 0 && statusFilter === "all" && dealInsightFilter === "all" && 
                      `Highlighting ${highlightedDeals.length} specific deal${highlightedDeals.length === 1 ? '' : 's'}`}
                    {(statusFilter !== "all" || dealInsightFilter !== "all") && highlightedDeals.length > 0 && 
                      " + highlighting specific deals"}
                  </span>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => {
                    setStatusFilter("all");
                    setDealInsightFilter("all");
                    setHighlightedDeals([]);
                    navigate("/analytics");
                  }}
                  className="text-purple-600 hover:text-purple-700"
                >
                  Clear Filters
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Filters and Search */}
        <Card className="border border-slate-200 shadow-sm bg-white">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold text-slate-900 flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search */}
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Search deals by name, client, or reference..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              {/* Status Filter */}
              <div className="lg:w-64">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    {uniqueStatuses.map(status => (
                      <SelectItem key={status} value={status}>
                        {status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Deal Insight Filter */}
              <div className="lg:w-64">
                <Select value={dealInsightFilter} onValueChange={setDealInsightFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by insight" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Insights</SelectItem>
                    <SelectItem value="needs_attention">Needs Attention</SelectItem>
                    <SelectItem value="on_track">On Track</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Deals Table */}
        <Card className="border border-slate-200 shadow-sm bg-white">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl font-semibold text-slate-900 flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Deals Overview
                </CardTitle>
                <CardDescription className="text-slate-500">
                  {filteredDeals.length} of {deals.length} deals shown
                </CardDescription>
              </div>
              
              {/* Summary Stats - Use role-filtered deals for accurate metrics */}
              <div className="hidden lg:flex items-center gap-6 text-sm">
                <div className="text-center">
                  <div className="font-semibold text-slate-900">{filteredDeals.filter(d => d.status === 'signed').length}</div>
                  <div className="text-slate-500">Signed</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold text-slate-900">{filteredDeals.filter(d => d.status === 'under_review' || d.status === 'submitted').length}</div>
                  <div className="text-slate-500">In Review</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold text-slate-900">{filteredDeals.filter(d => d.status === 'approved').length}</div>
                  <div className="text-slate-500">Approved</div>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-16">
                <div className="text-center">
                  <div className="w-8 h-8 border-2 border-[#3e0075] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-slate-500">Loading deals...</p>
                </div>
              </div>
            ) : filteredDeals.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Briefcase className="h-8 w-8 text-slate-400" />
                </div>
                <h3 className="text-lg font-semibold text-slate-700 mb-2">
                  {searchTerm || statusFilter !== "all" ? "No matching deals" : "No deals yet"}
                </h3>
                <p className="text-slate-500 mb-6">
                  {searchTerm || statusFilter !== "all" 
                    ? "Try adjusting your filters to see more results" 
                    : "Ready to create your first deal?"
                  }
                </p>
                {canCreateDeals && !searchTerm && statusFilter === "all" && (
                  <Button asChild className="bg-[#3e0075] hover:bg-[#2d0055] text-white">
                    <Link to="/request/proposal">
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
                  data={filteredDeals}
                  onRowClick={(deal) => navigate(`/deals/${deal.id}`)}
                />
              </div>
            )}
          </CardContent>
        </Card>
        </div>
      </div>
    </div>
  );
}