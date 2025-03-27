import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  BarChart3, 
  ClipboardList, 
  FileQuestion, 
  FileText, 
  LifeBuoy, 
  PieChart, 
  PlusCircle, 
  Users2,
  TrendingUp,
  LucideIcon
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface DealStats {
  totalDeals: number;
  pendingDeals: number;
  approvedDeals: number;
  rejectedDeals: number;
  totalValue: number;
}

interface Deal {
  id: number;
  referenceNumber: string;
  dealType: string;
  advertiserName?: string;
  agencyName?: string;
  annualRevenue: number;
  status: string;
}

interface QuickLinkCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  linkTo: string;
  buttonText: string;
  color: string;
}

const QuickLinkCard = ({ title, description, icon: Icon, linkTo, buttonText, color }: QuickLinkCardProps) => (
  <Card className="h-full">
    <CardHeader className="pb-2">
      <div className="flex items-center space-x-2">
        <div className={`p-2 rounded-md ${color}`}>
          <Icon className="h-5 w-5 text-white" />
        </div>
        <CardTitle className="text-lg">{title}</CardTitle>
      </div>
    </CardHeader>
    <CardContent className="pb-4">
      <CardDescription className="mt-2 min-h-[60px]">{description}</CardDescription>
    </CardContent>
    <CardFooter>
      <Button asChild className="w-full">
        <Link to={linkTo}>{buttonText}</Link>
      </Button>
    </CardFooter>
  </Card>
);

export default function Home() {
  const [activeTab, setActiveTab] = useState("pending");
  const userName = "Charlie";

  // Fetch deal statistics
  const { data: dealStats = { 
    totalDeals: 0, 
    pendingDeals: 0, 
    approvedDeals: 0, 
    rejectedDeals: 0, 
    totalValue: 0 
  } } = useQuery<DealStats>({
    queryKey: ['/api/stats'],
    retry: false,
    refetchOnWindowFocus: false,
  });

  // Fetch deals for the tables
  const { data: deals = [] } = useQuery<Deal[]>({
    queryKey: ['/api/deals'],
    retry: false,
    refetchOnWindowFocus: false,
  });

  // Filter deals based on active tab
  const filteredDeals = deals.filter((deal: Deal) => {
    if (activeTab === "all") return true;
    if (activeTab === "pending") return deal.status === "submitted" || deal.status === "in_review";
    if (activeTab === "approved") return deal.status === "approved";
    if (activeTab === "rejected") return deal.status === "rejected";
    return true;
  }).slice(0, 5); // Show only the 5 most recent deals
  
  // Calculate percentage of deals by status for the stats cards
  const pendingPercentage = dealStats.totalDeals 
    ? Math.round((dealStats.pendingDeals / dealStats.totalDeals) * 100) 
    : 0;
  
  const approvedPercentage = dealStats.totalDeals 
    ? Math.round((dealStats.approvedDeals / dealStats.totalDeals) * 100) 
    : 0;

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
      
      {/* Stats Overview */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Total Deals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold">{dealStats.totalDeals}</div>
              <div className="p-2 bg-slate-100 rounded-full">
                <BarChart3 className="h-5 w-5 text-slate-600" />
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-2">Total value: {formatCurrency(dealStats.totalValue)}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Pending Approval</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold">{dealStats.pendingDeals}</div>
              <div className="p-2 bg-amber-100 rounded-full">
                <ClipboardList className="h-5 w-5 text-amber-600" />
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-2">{pendingPercentage}% of total deals</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Approved</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold">{dealStats.approvedDeals}</div>
              <div className="p-2 bg-green-100 rounded-full">
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-2">{approvedPercentage}% of total deals</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Team Members</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold">7</div>
              <div className="p-2 bg-indigo-100 rounded-full">
                <Users2 className="h-5 w-5 text-indigo-600" />
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-2">Across 3 regions</p>
          </CardContent>
        </Card>
      </div>
      
      {/* Quick Links */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <QuickLinkCard
            title="Deal Scoping"
            description="Need help scoping a new commercial deal? Start here for guided assistance."
            icon={FileQuestion}
            linkTo="/request-support"
            buttonText="Start Scoping"
            color="bg-blue-600"
          />
          
          <QuickLinkCard
            title="Submit Deal"
            description="Ready to submit a fully formed deal? Complete the submission form."
            icon={FileText}
            linkTo="/submit-deal"
            buttonText="Submit Deal"
            color="bg-purple-600"
          />
          
          <QuickLinkCard
            title="Help Resources"
            description="Browse our knowledge base, processes, and best practices."
            icon={LifeBuoy}
            linkTo="/help"
            buttonText="View Resources"
            color="bg-emerald-600"
          />
          
          <QuickLinkCard
            title="Analytics"
            description="View detailed reports and insights on your commercial deal performance."
            icon={PieChart}
            linkTo="/analytics"
            buttonText="View Analytics"
            color="bg-amber-600"
          />
        </div>
      </div>
      
      {/* Recent Deal Activity */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Recent Deal Activity</h2>
          <Link to="/deals" className="text-sm text-primary hover:underline">
            View all deals
          </Link>
        </div>
        
        <Card>
          <CardHeader className="pb-2 border-b">
            <Tabs defaultValue="pending" value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-4 lg:w-auto">
                <TabsTrigger value="all">All Deals</TabsTrigger>
                <TabsTrigger value="pending">Pending</TabsTrigger>
                <TabsTrigger value="approved">Approved</TabsTrigger>
                <TabsTrigger value="rejected">Rejected</TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="px-4 py-3 text-left font-medium text-slate-500">Reference</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-500">Client</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-500">Type</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-500">Value</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-500">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredDeals.length > 0 ? (
                    filteredDeals.map((deal: Deal, i: number) => (
                      <tr key={i} className="hover:bg-slate-50">
                        <td className="px-4 py-3 whitespace-nowrap">
                          <Link to={`/deals/${deal.id}`} className="text-primary hover:underline">
                            {deal.referenceNumber}
                          </Link>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {deal.advertiserName || deal.agencyName}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap capitalize">
                          {deal.dealType.replace('_', ' ')}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {formatCurrency(deal.annualRevenue)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <Status status={deal.status} />
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-4 py-6 text-center text-slate-500">
                        No deals found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Announcements */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Announcements</h2>
        <Card>
          <CardContent className="p-4">
            <div className="space-y-4">
              <div className="border-l-4 border-blue-500 pl-4">
                <h3 className="font-medium">New Incentive Types Available</h3>
                <p className="text-sm text-slate-600 mt-1">
                  Six new incentive types are now available for tiered deals. Check the help documentation for details.
                </p>
                <p className="text-xs text-slate-500 mt-1">Posted 2 days ago</p>
              </div>
              
              <div className="border-l-4 border-green-500 pl-4">
                <h3 className="font-medium">Q2 Deal Approvals Expedited</h3>
                <p className="text-sm text-slate-600 mt-1">
                  All Q2 deals submitted before June 15 will receive expedited review.
                </p>
                <p className="text-xs text-slate-500 mt-1">Posted 1 week ago</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Deal status badge component
const Status = ({ status }: { status: string }) => {
  let color = "";
  let label = "";
  
  switch (status) {
    case "submitted":
      color = "bg-amber-100 text-amber-800 border-amber-200";
      label = "Submitted";
      break;
    case "in_review":
      color = "bg-blue-100 text-blue-800 border-blue-200";
      label = "In Review";
      break;
    case "approved":
      color = "bg-green-100 text-green-800 border-green-200";
      label = "Approved";
      break;
    case "rejected":
      color = "bg-red-100 text-red-800 border-red-200";
      label = "Rejected";
      break;
    default:
      color = "bg-slate-100 text-slate-800 border-slate-200";
      label = status.replace('_', ' ');
  }
  
  return (
    <Badge variant="outline" className={`${color} capitalize`}>
      {label}
    </Badge>
  );
};