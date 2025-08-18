import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { TrendingUp, Users, Target, Clock, DollarSign } from "lucide-react";

interface ScopingAnalytics {
  overview: {
    totalScopingRequests: number;
    activeScopingDeals: number;
    convertedScopingDeals: number;
    conversionRate: number;
    avgConvertedValue: number;
    recentConversions: number;
  };
  breakdown: {
    bySalesChannel: Record<string, number>;
    byRegion: Record<string, number>;
  };
  dealDetails: Array<{
    id: number;
    dealName: string;
    salesChannel: string;
    region: string;
    status: string;
    convertedAt?: string;
    convertedDealId?: number;
    annualRevenue: number;
    createdAt: string;
    email: string;
  }>;
}

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#8dd1e1'];

export default function ScopingAnalytics() {
  const { data: analytics, isLoading, error } = useQuery<ScopingAnalytics>({
    queryKey: ["/api/analytics/scoping"],
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center min-h-96">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
              <p className="text-slate-600">Loading scoping analytics...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 p-6">
        <div className="max-w-7xl mx-auto">
          <Card className="bg-red-50 border-red-200">
            <CardContent className="p-6">
              <h3 className="text-red-800 font-medium mb-2">Error Loading Analytics</h3>
              <p className="text-red-600">Failed to load scoping deal analytics. Please try again later.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="min-h-screen bg-slate-50 p-6">
        <div className="max-w-7xl mx-auto">
          <Card>
            <CardContent className="p-6">
              <p className="text-slate-600">No scoping analytics data available.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const { overview, breakdown, dealDetails } = analytics;

  // Prepare chart data
  const channelData = Object.entries(breakdown.bySalesChannel).map(([channel, count]) => ({
    channel: channel.replace('_', ' ').toUpperCase(),
    count
  }));

  const regionData = Object.entries(breakdown.byRegion).map(([region, count]) => ({
    region: region.toUpperCase(),
    count,
    fill: COLORS[Object.keys(breakdown.byRegion).indexOf(region) % COLORS.length]
  }));

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Scoping Deal Analytics</h1>
              <p className="text-slate-600 mt-1">Complete insights into scoping requests and conversions</p>
            </div>
            <Badge variant="secondary" className="bg-purple-100 text-purple-700">
              Partnership Team
            </Badge>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-600">Total Requests</p>
                  <p className="text-2xl font-bold text-slate-900">{overview.totalScopingRequests}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Target className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-600">Conversion Rate</p>
                  <p className="text-2xl font-bold text-slate-900">{overview.conversionRate}%</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-600">Converted</p>
                  <p className="text-2xl font-bold text-slate-900">{overview.convertedScopingDeals}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Clock className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-600">Active</p>
                  <p className="text-2xl font-bold text-slate-900">{overview.activeScopingDeals}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-100 rounded-lg">
                  <DollarSign className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-600">Avg Value</p>
                  <p className="text-2xl font-bold text-slate-900">
                    ${(overview.avgConvertedValue / 1000000).toFixed(1)}M
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Sales Channel Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Requests by Sales Channel</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={channelData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="channel" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Region Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Requests by Region</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={regionData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ region, percent }) => `${region} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {regionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Deal Details Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">All Scoping Deals</CardTitle>
            <p className="text-sm text-slate-600">Complete history of scoping requests and conversions</p>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-3 px-4 font-medium text-slate-600">Deal Name</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-600">Sales Channel</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-600">Region</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-600">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-600">Value</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-600">Created</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-600">Converted</th>
                  </tr>
                </thead>
                <tbody>
                  {dealDetails.map((deal) => (
                    <tr key={deal.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-medium text-slate-900">{deal.dealName}</p>
                          <p className="text-sm text-slate-500">#{deal.id}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4 capitalize">
                        {deal.salesChannel?.replace('_', ' ') || 'N/A'}
                      </td>
                      <td className="py-3 px-4 uppercase">
                        {deal.region || 'N/A'}
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant={deal.convertedAt ? "default" : "secondary"}>
                          {deal.convertedAt ? "Converted" : "Active"}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        {deal.annualRevenue > 0 ? 
                          `$${(deal.annualRevenue / 1000000).toFixed(1)}M` : 
                          'N/A'
                        }
                      </td>
                      <td className="py-3 px-4 text-sm text-slate-600">
                        {new Date(deal.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-sm text-slate-600">
                        {deal.convertedAt ? 
                          new Date(deal.convertedAt).toLocaleDateString() : 
                          '-'
                        }
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}