import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, cn } from "@/lib/utils";
import { ArrowRight, Plus, CheckCircle, Clock, ArrowUpRight } from "lucide-react";
import { useDealConversion } from "@/hooks/useDealConversion";
import { format } from "date-fns";

interface ScopingRequest {
  id: number;
  requestTitle: string;
  advertiserName: string | null;
  agencyName: string | null;
  salesChannel: string;
  growthAmbition: number;
  status: string;
  convertedDealId: number | null;
  convertedAt: Date | null;
  createdAt: Date;
}

export function ScopingRequestsDashboard() {
  const { convertScopingToDeal, isConverting } = useDealConversion();

  const scopingRequestsQuery = useQuery<ScopingRequest[]>({
    queryKey: ['/api/deal-scoping-requests'],
    retry: 3,
    staleTime: 30000,
  });

  const pendingRequests = scopingRequestsQuery.data?.filter(req => req.status === 'pending') || [];
  const convertedRequests = scopingRequestsQuery.data?.filter(req => req.status === 'converted') || [];

  const handleConvert = (requestId: number) => {
    convertScopingToDeal.mutate(requestId);
  };

  if (scopingRequestsQuery.isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Scoping Requests
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (scopingRequestsQuery.isError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Scoping Requests
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-600">Failed to load scoping requests</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending Requests</p>
                <p className="text-2xl font-bold">{pendingRequests.length}</p>
              </div>
              <Clock className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Converted to Deals</p>
                <p className="text-2xl font-bold">{convertedRequests.length}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Conversion Rate</p>
                <p className="text-2xl font-bold">
                  {scopingRequestsQuery.data?.length 
                    ? Math.round((convertedRequests.length / scopingRequestsQuery.data.length) * 100)
                    : 0}%
                </p>
              </div>
              <ArrowUpRight className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Requests - Ready for Conversion */}
      {pendingRequests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Pending Scoping Requests
              <Badge variant="secondary">{pendingRequests.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingRequests.map((request) => (
                <div key={request.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <div>
                        <h4 className="font-medium">{request.requestTitle}</h4>
                        <p className="text-sm text-muted-foreground">
                          {request.advertiserName || request.agencyName} • {formatCurrency(request.growthAmbition)} growth target
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Created {format(new Date(request.createdAt), 'MMM d, yyyy')}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">
                      {request.salesChannel.replace('_', ' ').toUpperCase()}
                    </Badge>
                    <Button
                      onClick={() => handleConvert(request.id)}
                      disabled={isConverting}
                      size="sm"
                      className="bg-primary hover:bg-primary/90"
                    >
                      {isConverting ? "Converting..." : (
                        <>
                          Convert to Deal
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Converted Requests - Success Stories */}
      {convertedRequests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Successfully Converted
              <Badge variant="secondary">{convertedRequests.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {convertedRequests.slice(0, 5).map((request) => (
                <div key={request.id} className="flex items-center justify-between p-3 border rounded-lg bg-green-50">
                  <div className="flex-1">
                    <h4 className="font-medium text-green-800">{request.requestTitle}</h4>
                    <p className="text-sm text-green-600">
                      Converted to Deal #{request.convertedDealId} • {formatCurrency(request.growthAmbition)}
                    </p>
                    <p className="text-xs text-green-600">
                      {request.convertedAt && format(new Date(request.convertedAt), 'MMM d, yyyy')}
                    </p>
                  </div>
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {(!scopingRequestsQuery.data || scopingRequestsQuery.data.length === 0) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              No Scoping Requests Yet
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-6">
              <p className="text-muted-foreground mb-4">
                Start by creating a scoping request to assess deal opportunities.
              </p>
              <Button variant="outline">
                Create Scoping Request
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}