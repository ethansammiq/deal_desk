import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table";
import { DealStatusBadge } from "@/components/deal-status/DealStatusBadge";
import { QueryStateHandler, SectionLoading, ErrorState } from "@/components/ui/loading-states";
import { useCurrentUser } from "@/hooks/useAuth";
import { useDealConversion } from "@/hooks/useDealConversion";
import { 
  BarChart3, 
  CheckCircle,
  XCircle,
  TrendingUp,
  PlusCircle,
  ArrowUpRight,
  MessageSquare,
  FileCheck,
  Clock
} from "lucide-react";
import { formatCurrency, cn } from "@/lib/utils";
import { Deal, type DealStatus, type UserRole } from "@shared/schema";
import { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";

// Updated stats interface with Close Rate instead of Success Rate
interface DealStats {
  totalDeals: number;
  activeDeals: number; // scoping through contract_sent
  completedDeals: number; // signed
  lostDeals: number; // lost
  closeRate: number; // signed / (signed + lost) * 100
  // Status breakdown for additional calculations
  scopingCount: number;
  submittedCount: number;
  underReviewCount: number;
  negotiatingCount: number;
  approvedCount: number;
  legalReviewCount: number;
  contractSentCount: number;
}

// Action type definition for role-based actions
interface DealAction {
  type: 'convert' | 'nudge' | 'approve' | 'legal_approve' | 'contract' | 'view' | 'override';
  label: string;
  variant: 'default' | 'outline' | 'secondary' | 'destructive';
  icon?: React.ComponentType<{ className?: string }>;
  onClick: (dealId: number) => void;
  visible: boolean;
}

// Action logic based on role and deal status
const getActionForDeal = (deal: Deal, userRole: UserRole, handlers: {
  onConvert: (dealId: number) => void;
  onNudge: (dealId: number, target: string) => void;
  onApprove: (dealId: number) => void;
  onLegalApprove: (dealId: number) => void;
  onSendContract: (dealId: number) => void;
  onView: (dealId: number) => void;
}): DealAction => {
  const { onConvert, onNudge, onApprove, onLegalApprove, onSendContract, onView } = handlers;

  // Seller actions
  if (userRole === 'seller') {
    if (deal.status === 'scoping') {
      return {
        type: 'convert',
        label: 'Convert to Deal',
        variant: 'default',
        icon: ArrowUpRight,
        onClick: onConvert,
        visible: true
      };
    }
    if (['under_review', 'legal_review', 'negotiating'].includes(deal.status)) {
      return {
        type: 'nudge',
        label: 'Send Nudge',
        variant: 'outline',
        icon: MessageSquare,
        onClick: (id) => onNudge(id, 'approver'),
        visible: true
      };
    }
  }
  
  // Approver actions  
  if (userRole === 'approver') {
    if (deal.status === 'under_review') {
      return {
        type: 'approve',
        label: 'Review & Approve',
        variant: 'default',
        icon: FileCheck,
        onClick: onApprove,
        visible: true
      };
    }
    if (deal.status === 'legal_review') {
      return {
        type: 'nudge',
        label: 'Nudge Legal',
        variant: 'outline',
        icon: MessageSquare,
        onClick: (id) => onNudge(id, 'legal'),
        visible: true
      };
    }
  }
  
  // Legal actions
  if (userRole === 'legal') {
    if (deal.status === 'legal_review') {
      return {
        type: 'legal_approve',
        label: 'Legal Review',
        variant: 'default',
        icon: FileCheck,
        onClick: onLegalApprove,
        visible: true
      };
    }
    if (deal.status === 'approved') {
      return {
        type: 'contract',
        label: 'Send Contract',
        variant: 'default',
        icon: ArrowUpRight,
        onClick: onSendContract,
        visible: true
      };
    }
  }
  
  // Admin actions (can override any status)
  if (userRole === 'admin') {
    return {
      type: 'override',
      label: 'Manage',
      variant: 'secondary',
      onClick: onView,
      visible: true
    };
  }
  
  // Default view action
  return {
    type: 'view',
    label: 'View Details',
    variant: 'outline',
    onClick: onView,
    visible: true
  };
};

export default function UnifiedDashboard() {
  const { data: user } = useCurrentUser();
  const { convertScopingToDeal } = useDealConversion();
  const userName = user?.firstName || user?.username || "User";
  const userRole = (user?.role as UserRole) || 'seller';

  // Fetch deal statistics
  const { data: dealStats, isLoading: statsLoading } = useQuery<DealStats>({
    queryKey: ['/api/stats'],
    retry: 3,
    staleTime: 30000, // 30 seconds
  });

  // Fetch deals for the table
  const dealsQuery = useQuery<Deal[]>({
    queryKey: ['/api/deals'],
    retry: 3,
    staleTime: 30000, // 30 seconds
  });

  // Format relative date
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

  // Action handlers
  const handleConvert = (dealId: number) => {
    convertScopingToDeal.mutate(dealId);
  };

  const handleNudge = (dealId: number, target: string) => {
    // TODO: Implement nudge functionality
    console.log(`Nudging ${target} for deal ${dealId}`);
  };

  const handleApprove = (dealId: number) => {
    // TODO: Implement approval functionality
    console.log(`Approving deal ${dealId}`);
  };

  const handleLegalApprove = (dealId: number) => {
    // TODO: Implement legal approval functionality
    console.log(`Legal approving deal ${dealId}`);
  };

  const handleSendContract = (dealId: number) => {
    // TODO: Implement contract sending functionality
    console.log(`Sending contract for deal ${dealId}`);
  };

  const handleView = (dealId: number) => {
    // Navigate to deal details
    window.location.href = `/deals/${dealId}`;
  };

  // Define columns for the deals table with action column
  const columns: ColumnDef<Deal>[] = [
    {
      accessorKey: "dealName",
      header: "Deal Name",
      cell: ({ row }) => (
        <div>
          <div className="font-medium text-slate-900">{row.original.dealName}</div>
          <div className="text-xs text-slate-500">#{row.original.referenceNumber}</div>
        </div>
      ),
    },
    {
      id: "client",
      header: "Client",
      cell: ({ row }) => {
        const deal = row.original;
        const clientName = deal.advertiserName || deal.agencyName || "N/A";
        return <div>{clientName}</div>;
      },
    },
    {
      accessorKey: "annualRevenue",
      header: "Value",
      cell: ({ row }) => <div className="font-medium">{formatCurrency(row.original.annualRevenue || 0)}</div>,
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.original.status as DealStatus;
        return <DealStatusBadge status={status} />;
      },
      filterFn: (row, id, value) => {
        return value === row.getValue(id);
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
    {
      id: "actions",
      header: () => <div className="text-right">Action</div>,
      cell: ({ row }) => {
        const action = getActionForDeal(row.original, userRole as UserRole, {
          onConvert: handleConvert,
          onNudge: handleNudge,
          onApprove: handleApprove,
          onLegalApprove: handleLegalApprove,
          onSendContract: handleSendContract,
          onView: handleView,
        });

        if (!action.visible) return null;

        const Icon = action.icon;

        return (
          <div className="text-right">
            <Button 
              variant={action.variant}
              size="sm"
              onClick={() => action.onClick(row.original.id)}
              className="gap-1"
            >
              {Icon && <Icon className="h-3 w-3" />}
              {action.label}
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="p-6 space-y-8">
      {/* Welcome Banner */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Welcome back, {userName}</h1>
          <p className="mt-1 text-slate-500">Here's what's happening with your commercial deals</p>
        </div>
        <Button asChild>
          <Link to="/submit-deal">
            <PlusCircle className="mr-2 h-4 w-4" />
            New Deal
          </Link>
        </Button>
      </div>
      
      {/* Stats Overview - Updated with Close Rate */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Total Deals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold">{dealStats?.totalDeals || 0}</div>
              <div className="p-2 bg-slate-100 rounded-full">
                <BarChart3 className="h-5 w-5 text-slate-600" />
              </div>
            </div>
            <div className="flex justify-between items-center mt-2">
              <p className="text-xs text-slate-500">All deals</p>
              <p className="text-xs font-semibold">100%</p>
            </div>
            <div className="w-full bg-slate-100 h-1 mt-2 rounded-full overflow-hidden">
              <div className="bg-slate-400 h-1 rounded-full" style={{ width: '100%' }}></div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Active Deals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold">{dealStats?.activeDeals || 0}</div>
              <div className="p-2 bg-amber-100 rounded-full">
                <Clock className="h-5 w-5 text-amber-600" />
              </div>
            </div>
            <div className="flex justify-between items-center mt-2">
              <p className="text-xs text-slate-500">In progress</p>
              <p className="text-xs font-semibold">
                {dealStats?.totalDeals ? Math.round((dealStats.activeDeals / dealStats.totalDeals) * 100) : 0}%
              </p>
            </div>
            <div className="w-full bg-slate-100 h-1 mt-2 rounded-full overflow-hidden">
              <div 
                className="bg-amber-400 h-1 rounded-full" 
                style={{ 
                  width: `${dealStats?.totalDeals ? Math.round((dealStats.activeDeals / dealStats.totalDeals) * 100) : 0}%` 
                }}
              ></div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Closed Deals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold">{dealStats?.completedDeals || 0}</div>
              <div className="p-2 bg-green-100 rounded-full">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
            </div>
            <div className="flex justify-between items-center mt-2">
              <p className="text-xs text-slate-500">Signed deals</p>
              <p className="text-xs font-semibold">
                {dealStats?.totalDeals ? Math.round((dealStats.completedDeals / dealStats.totalDeals) * 100) : 0}%
              </p>
            </div>
            <div className="w-full bg-slate-100 h-1 mt-2 rounded-full overflow-hidden">
              <div 
                className="bg-green-400 h-1 rounded-full" 
                style={{ 
                  width: `${dealStats?.totalDeals ? Math.round((dealStats.completedDeals / dealStats.totalDeals) * 100) : 0}%` 
                }}
              ></div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Close Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold">{dealStats?.closeRate ? `${dealStats.closeRate}%` : "0%"}</div>
              <div className="p-2 bg-blue-100 rounded-full">
                <TrendingUp className="h-5 w-5 text-blue-600" />
              </div>
            </div>
            <div className="flex justify-between items-center mt-2">
              <p className="text-xs text-slate-500">Won vs Lost</p>
              <p className="text-xs font-semibold">{dealStats?.lostDeals || 0} lost</p>
            </div>
            <div className="w-full bg-slate-100 h-1 mt-2 rounded-full overflow-hidden">
              <div 
                className="bg-blue-400 h-1 rounded-full" 
                style={{ width: `${dealStats?.closeRate || 0}%` }}
              ></div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Deals Table */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">All Deals</h2>
          <div className="text-sm text-slate-500">
            Role: <Badge variant="outline" className="ml-1 capitalize">{userRole}</Badge>
          </div>
        </div>
        
        <div className="overflow-hidden bg-white shadow sm:rounded-lg">
          <QueryStateHandler
            query={dealsQuery}
            loadingComponent={<SectionLoading title="Loading deals..." rows={5} />}
            errorComponent={
              <ErrorState
                title="Failed to load deals"
                message="Unable to fetch deal data. Please try refreshing the page."
                onRetry={dealsQuery.refetch}
              />
            }
            emptyComponent={
              <div className="text-center py-12">
                <p className="text-gray-500">No deals found. Create your first deal to get started.</p>
                <Button asChild className="mt-4">
                  <Link to="/submit-deal">Create Deal</Link>
                </Button>
              </div>
            }
            emptyCheck={(data) => data.length === 0}
          >
            {(deals) => (
              <DataTable 
                columns={columns} 
                data={deals} 
                searchKey="dealName"
                placeholder="Search deals..."
                statusFilter={true}
              />
            )}
          </QueryStateHandler>
        </div>
      </div>
    </div>
  );
}