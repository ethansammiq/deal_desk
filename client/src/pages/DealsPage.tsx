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
  classifyDeal, 
  getDealBadgeInfo, 
  getDelayedDeals, 
  getHighValueDeals, 
  getClosingDeals, 
  getCriticalDeals,
  FILTER_CATEGORIES,
  type DealCategory 
} from "@/utils/dealClassification";
import { 
  Briefcase, 
  PlusCircle, 
  Search,
  Filter,
  FileText,
  MoreHorizontal,
  Eye,
  Edit2,
  BarChart3
} from "lucide-react";

export default function DealsPage() {
  const { currentUser, canCreateDeals, canViewAllDeals } = useUserPermissions();
  const [location, navigate] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [highlightedDeals, setHighlightedDeals] = useState<number[]>([]);
  
  // Parse URL parameters on mount and location change
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const filter = params.get('filter');
    const highlight = params.get('highlight');
    
    // Apply filter if provided
    if (filter) {
      setStatusFilter(filter);
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

  // Helper to format currency in shortened format
  const formatShortCurrency = (amount: number): string => {
    if (amount === 0) return "$0";
    if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `$${(amount / 1000).toFixed(1)}K`;
    return `$${amount.toLocaleString()}`;
  };

  // Classify deals using unified system
  const classifiedDeals = deals.map(deal => ({
    ...deal,
    classification: classifyDeal(deal),
    badgeInfo: getDealBadgeInfo(deal)
  }));

  // Deal table columns with comprehensive information
  const dealColumns: ColumnDef<Deal>[] = [
    {
      accessorKey: "dealName",
      header: "Deal Name",
      cell: ({ row }) => {
        const deal = row.original;
        const classifiedDeal = classifiedDeals.find(cd => cd.id === deal.id);
        const isHighlighted = highlightedDeals.includes(deal.id);
        const badgeInfo = classifiedDeal?.badgeInfo;
        
        return (
          <div className={`${
            isHighlighted 
              ? 'pl-3 border-l-4 border-purple-500 bg-purple-50' 
              : badgeInfo?.color 
                ? `pl-3 border-l-4 ${badgeInfo.color}` 
                : ''
          }`}>
            <div className="font-medium text-slate-900 flex items-center gap-2">
              {deal.dealName}
              {isHighlighted && (
                <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-700">
                  Highlighted
                </Badge>
              )}
              {badgeInfo && !isHighlighted && (
                <Badge variant={badgeInfo.variant} className="text-xs">
                  {badgeInfo.text}
                </Badge>
              )}
            </div>
            <div className="text-sm text-slate-500">#{deal.referenceNumber}</div>
          </div>
        );
      },
    },
    {
      accessorKey: "advertiserName",
      header: "Client",
      cell: ({ row }) => (
        <div>
          <div className="font-medium text-slate-700">
            {row.original.advertiserName || row.original.agencyName || "N/A"}
          </div>
          <div className="text-sm text-slate-500">{row.original.dealType}</div>
        </div>
      ),
    },
    {
      accessorKey: "salesChannel",
      header: "Channel",
      cell: ({ row }) => (
        <Badge variant="outline" className="font-normal">
          {row.original.salesChannel || "Direct"}
        </Badge>
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
      accessorKey: "annualRevenue",
      header: "Value",
      cell: ({ row }) => {
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
    {
      id: "actions",
      header: "",
      cell: ({ row }) => {
        const deal = row.original;
        return (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(`/deals/${deal.id}`)}
              className="h-8 w-8 p-0"
            >
              <Eye className="h-4 w-4" />
            </Button>
          </div>
        );
      },
    },
  ];

  // No longer needed - using unified classification system

  // Filter deals based on search and status using unified classification
  const filteredDeals = deals.filter(deal => {
    const classification = classifyDeal(deal);
    
    const matchesSearch = !searchTerm || 
      deal.dealName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      deal.advertiserName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      deal.agencyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      deal.referenceNumber.toLowerCase().includes(searchTerm.toLowerCase());
    
    let matchesStatus = true;
    if (statusFilter === "delayed") {
      matchesStatus = classification.category === 'delayed';
    } else if (statusFilter === "high_value") {
      matchesStatus = classification.category === 'high_value' || 
                    (classification.category === 'delayed' && (deal.annualRevenue || 0) >= 500000);
    } else if (statusFilter === "closing") {
      matchesStatus = classification.category === 'closing';
    } else if (statusFilter === "critical") {
      matchesStatus = classification.priority === 'critical';
    } else if (statusFilter !== "all") {
      matchesStatus = deal.status === statusFilter;
    }
    
    return matchesSearch && matchesStatus && deal.status !== 'draft';
  });

  // Get unique statuses for filter + add unified filter categories
  const uniqueStatuses = Array.from(new Set(deals.map(deal => deal.status).filter(status => status !== 'draft')));
  const categoryCounts = {
    delayed: getDelayedDeals(deals).length,
    high_value: getHighValueDeals(deals).length,
    closing: getClosingDeals(deals).length,
    critical: getCriticalDeals(deals).length,
  };

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
        {(["delayed", "critical", "closing", "high_value"].includes(statusFilter) || highlightedDeals.length > 0) && (
          <Card className="border border-purple-200 bg-purple-50">
            <CardContent className="py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-purple-600" />
                  <span className="text-sm font-medium text-purple-800">
                    {statusFilter === "delayed" && "Showing delayed deals (exceeded normal timing thresholds)"}
                    {statusFilter === "critical" && "Showing critical deals (high-value + delayed)"}
                    {statusFilter === "closing" && "Showing deals ready to close (approved or in contracting)"}
                    {statusFilter === "high_value" && "Showing high-value deals ($500K+)"}
                    {highlightedDeals.length > 0 && !["delayed", "critical", "closing", "high_value"].includes(statusFilter) && 
                      `Highlighting ${highlightedDeals.length} specific deal${highlightedDeals.length === 1 ? '' : 's'}`}
                    {["delayed", "critical", "closing", "high_value"].includes(statusFilter) && highlightedDeals.length > 0 && 
                      " + highlighting specific deals"}
                  </span>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => {
                    setStatusFilter("all");
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
                    {categoryCounts.critical > 0 && (
                      <SelectItem value="critical">
                        🔴 Critical ({categoryCounts.critical})
                      </SelectItem>
                    )}
                    {categoryCounts.delayed > 0 && (
                      <SelectItem value="delayed">
                        ⚠️ Delayed ({categoryCounts.delayed})
                      </SelectItem>
                    )}
                    {categoryCounts.closing > 0 && (
                      <SelectItem value="closing">
                        🎯 Ready to Close ({categoryCounts.closing})
                      </SelectItem>
                    )}
                    {categoryCounts.high_value > 0 && (
                      <SelectItem value="high_value">
                        💰 High-Value ({categoryCounts.high_value})
                      </SelectItem>
                    )}
                    <SelectItem disabled value="divider">—————————</SelectItem>
                    {uniqueStatuses.map(status => (
                      <SelectItem key={status} value={status}>
                        {status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </SelectItem>
                    ))}
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
              
              {/* Summary Stats */}
              <div className="hidden lg:flex items-center gap-6 text-sm">
                <div className="text-center">
                  <div className="font-semibold text-slate-900">{deals.filter(d => d.status === 'signed').length}</div>
                  <div className="text-slate-500">Signed</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold text-slate-900">{deals.filter(d => d.status === 'under_review' || d.status === 'submitted').length}</div>
                  <div className="text-slate-500">In Review</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold text-slate-900">{deals.filter(d => d.status === 'approved').length}</div>
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