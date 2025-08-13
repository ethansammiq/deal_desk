import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { DataTable } from "@/components/ui/data-table";
import { Deal } from "@shared/schema";
import { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { PlusIcon, Users, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, cn } from "@/lib/utils";
import { QueryStateHandler, SectionLoading, ErrorState } from "@/components/ui/loading-states";
import { ScopingRequestsDashboard } from "@/components/ScopingRequestsDashboard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Status badge mapping
const statusVariantMap: Record<string, any> = {
  pending: "pending",
  approved: "approved",
  rejected: "rejected",
  in_progress: "inProgress",
  completed: "completed",
};

// Type for stats API response
interface DealStats {
  activeDeals: number;
  pendingApproval: number;
  completedDeals: number;
  successRate: number;
}

export default function Dashboard() {
  const statsQuery = useQuery<DealStats>({
    queryKey: ['/api/stats'],
    retry: 3,
    staleTime: 30000, // 30 seconds
  });

  const dealsQuery = useQuery<Deal[]>({
    queryKey: ['/api/deals'],
    retry: 3,
    staleTime: 30000, // 30 seconds
  });

  // Format the date from ISO string to relative time (e.g., "2 days ago")
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

  // Define columns for the deals table
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
        const status = row.original.status;
        return (
          <Badge variant={statusVariantMap[status] || "default"}>
            {status.replace("_", " ").replace(/\b\w/g, char => char.toUpperCase())}
          </Badge>
        );
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
      header: () => <div className="text-right">Actions</div>,
      cell: ({ row }) => {
        return (
          <div className="text-right">
            <Link href={`/deals/${row.original.id}`} className="text-[#3e0075] hover:text-[#2d0055] font-medium">
              View
            </Link>
          </div>
        );
      },
    },
  ];

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Deal Dashboard</h1>
        <p className="mt-1 text-sm text-slate-500">Track and manage your commercial deals</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-5 mt-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard 
          title="Active Deals" 
          value={statsQuery.isLoading ? "..." : statsQuery.data?.activeDeals || 0}
          change={"+12%"}
          trend="up"
        />
        <StatCard 
          title="Pending Approval" 
          value={statsQuery.isLoading ? "..." : statsQuery.data?.pendingApproval || 0}
          change={"+3"}
          changeLabel="new this week"
          trend="warning"
        />
        <StatCard 
          title="Completed Deals" 
          value={statsQuery.isLoading ? "..." : statsQuery.data?.completedDeals || 0}
          change={"+8%"}
          trend="up"
        />
        <StatCard 
          title="Deal Success Rate" 
          value={statsQuery.isLoading ? "..." : `${statsQuery.data?.successRate || 0}%`}
          change={"+4%"}
          trend="up"
        />
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center justify-between mt-8 gap-4">
        <div className="flex-1 min-w-[280px]">
          {/* DataTable contains the search */}
        </div>
        <div>
          <Button asChild>
            <Link href="/submit-deal">
              <PlusIcon className="w-5 h-5 mr-2" />
              New Deal
            </Link>
          </Button>
        </div>
      </div>

      {/* Dashboard Tabs */}
      <Tabs defaultValue="deals" className="mt-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="deals" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Deals
          </TabsTrigger>
          <TabsTrigger value="scoping" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Scoping Requests
          </TabsTrigger>
        </TabsList>

        <TabsContent value="deals" className="mt-6">
          {/* Recent Deals Table */}
          <div className="overflow-hidden bg-white shadow sm:rounded-lg">
            <div className="px-4 py-5 border-b border-slate-200 sm:px-6">
              <h3 className="text-lg font-medium leading-6 text-slate-900">Recent Deals</h3>
            </div>
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
                <Link href="/submit-deal">Create Deal</Link>
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
        </TabsContent>

        <TabsContent value="scoping" className="mt-6">
          <ScopingRequestsDashboard />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Stat Card Component
interface StatCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeLabel?: string;
  trend?: "up" | "down" | "warning";
}

function StatCard({ title, value, change, changeLabel = "from last period", trend = "up" }: StatCardProps) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="pt-6">
        <dt className="text-sm font-medium text-slate-500 truncate">{title}</dt>
        <dd className="mt-1 text-3xl font-semibold text-slate-900">{value}</dd>
        {change && (
          <div className="flex items-center mt-3 text-sm">
            <span className={cn(
              "font-medium",
              trend === "up" && "text-green-600",
              trend === "down" && "text-red-600",
              trend === "warning" && "text-amber-600",
            )}>
              {change}
            </span>
            <span className="ml-1 text-slate-500">{changeLabel}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
