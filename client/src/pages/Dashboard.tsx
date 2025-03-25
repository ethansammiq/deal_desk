import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { DataTable } from "@/components/ui/data-table";
import { Deal } from "@shared/schema";
import { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { PlusIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency, cn } from "@/lib/utils";

// Status badge mapping
const statusVariantMap: Record<string, any> = {
  pending: "pending",
  approved: "approved",
  rejected: "rejected",
  in_progress: "inProgress",
  completed: "completed",
};

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['/api/stats'],
  });

  const { data: deals, isLoading: dealsLoading } = useQuery({
    queryKey: ['/api/deals'],
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
      accessorKey: "clientName",
      header: "Client",
      cell: ({ row }) => <div>{row.original.clientName}</div>,
    },
    {
      accessorKey: "totalValue",
      header: "Value",
      cell: ({ row }) => <div className="font-medium">{formatCurrency(row.original.totalValue)}</div>,
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
      cell: ({ row }) => <div className="text-sm text-slate-500">{formatRelativeDate(row.original.updatedAt.toString())}</div>,
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
          value={statsLoading ? "..." : stats?.activeDeals || 0}
          change={"+12%"}
          trend="up"
        />
        <StatCard 
          title="Pending Approval" 
          value={statsLoading ? "..." : stats?.pendingApproval || 0}
          change={"+3"}
          changeLabel="new this week"
          trend="warning"
        />
        <StatCard 
          title="Completed Deals" 
          value={statsLoading ? "..." : stats?.completedDeals || 0}
          change={"+8%"}
          trend="up"
        />
        <StatCard 
          title="Deal Success Rate" 
          value={statsLoading ? "..." : `${stats?.successRate || 0}%`}
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

      {/* Recent Deals Table */}
      <div className="mt-2 overflow-hidden bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 border-b border-slate-200 sm:px-6">
          <h3 className="text-lg font-medium leading-6 text-slate-900">Recent Deals</h3>
        </div>
        <DataTable 
          columns={columns} 
          data={deals || []} 
          searchKey="dealName"
          placeholder="Search deals..."
          statusFilter={true}
        />
      </div>
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
