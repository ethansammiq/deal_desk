import { useParams, Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { QueryStateHandler, SectionLoading, ErrorState } from "@/components/ui/loading-states";
import { DealStatusBadge } from "@/components/deal-status/DealStatusBadge";
import { RevisionRequestModal } from "@/components/revision/RevisionRequestModal";
import { formatCurrency } from "@/lib/utils";
import { useCurrentUser } from "@/hooks/useAuth";
import { useDealActions } from "@/hooks/useDealActions";
import { ArrowLeft, Building2, Calendar, DollarSign, Users, MapPin, AlertTriangle, FileCheck } from "lucide-react";
import { Deal } from "@shared/schema";
import { format } from "date-fns";

type UserRole = 'seller' | 'approver' | 'legal' | 'admin';

export default function DealDetails() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { data: user } = useCurrentUser();
  const [revisionModalOpen, setRevisionModalOpen] = useState(false);
  const { approveDeal, isUpdatingStatus } = useDealActions();
  
  const dealId = parseInt(id || "0");
  const userRole = (user?.role as UserRole) || 'seller';
  
  const dealQuery = useQuery({
    queryKey: ['/api/deals', dealId],
    queryFn: async (): Promise<Deal> => {
      const response = await fetch(`/api/deals/${dealId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch deal details');
      }
      return response.json();
    },
    enabled: !!dealId && dealId > 0,
  });

  const handleGoBack = () => {
    navigate('/');
  };

  if (!dealId || dealId <= 0) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500">Invalid deal ID</p>
        <Button onClick={handleGoBack} variant="outline" className="mt-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button onClick={handleGoBack} variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <h1 className="text-2xl font-bold text-slate-900">Deal Details</h1>
        </div>
        
        {/* Role-based Action Buttons */}
        <QueryStateHandler query={dealQuery} loadingComponent={null} errorComponent={null}>
          {(deal) => (
            <div className="flex items-center gap-2">
              {/* Approver Actions */}
              {userRole === 'approver' && deal.status === 'under_review' && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setRevisionModalOpen(true)}
                    disabled={isUpdatingStatus}
                  >
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    Request Revision
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => approveDeal.mutate({ dealId: deal.id, comments: "Approved via deal details" })}
                    disabled={isUpdatingStatus}
                  >
                    <FileCheck className="h-4 w-4 mr-2" />
                    Approve Deal
                  </Button>
                </>
              )}
              
              {/* Approver Actions for Negotiating */}
              {userRole === 'approver' && deal.status === 'negotiating' && (
                <Button
                  variant="outline" 
                  size="sm"
                  onClick={() => setRevisionModalOpen(true)}
                  disabled={isUpdatingStatus}
                >
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Request Revision
                </Button>
              )}
            </div>
          )}
        </QueryStateHandler>
      </div>

      <QueryStateHandler
        query={dealQuery}
        loadingComponent={<SectionLoading title="Loading deal details..." rows={3} />}
        errorComponent={
          <ErrorState
            title="Failed to load deal"
            message="Unable to fetch deal details. Please try again."
            onRetry={dealQuery.refetch}
          />
        }
      >
        {(deal) => (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Deal Information */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-xl">{deal.dealName}</CardTitle>
                      <p className="text-sm text-slate-500 mt-1">#{deal.referenceNumber}</p>
                    </div>
                    <DealStatusBadge status={deal.status} />
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-slate-500" />
                      <span className="text-sm font-medium">Client:</span>
                      <span className="text-sm">{deal.advertiserName || deal.agencyName || 'N/A'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-slate-500" />
                      <span className="text-sm font-medium">Region:</span>
                      <span className="text-sm capitalize">{deal.region || 'N/A'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-slate-500" />
                      <span className="text-sm font-medium">Sales Channel:</span>
                      <span className="text-sm">{deal.salesChannel?.replace('_', ' ') || 'N/A'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-slate-500" />
                      <span className="text-sm font-medium">Deal Type:</span>
                      <Badge variant="outline">
                        {deal.dealStructure === 'tiered' ? 'Tiered' : 'Flat Commit'}
                      </Badge>
                    </div>
                  </div>

                  {deal.businessSummary && (
                    <div>
                      <h3 className="text-sm font-medium text-slate-900 mb-2">Business Summary</h3>
                      <p className="text-sm text-slate-600">{deal.businessSummary}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Financial Details */}
              <Card>
                <CardHeader>
                  <CardTitle>Financial Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm font-medium text-slate-900">Annual Revenue</span>
                      <p className="text-lg font-semibold text-green-600">
                        {deal.annualRevenue ? formatCurrency(deal.annualRevenue) : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-slate-900">Gross Margin</span>
                      <p className="text-lg font-semibold">
                        {deal.annualGrossMargin ? `${deal.annualGrossMargin}%` : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-slate-900">Growth Rate</span>
                      <p className="text-lg font-semibold">
                        {deal.yearlyRevenueGrowthRate ? `${deal.yearlyRevenueGrowthRate}%` : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-slate-900">Analytics Tier</span>
                      <Badge variant="secondary" className="capitalize">
                        {deal.analyticsTier || 'N/A'}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Deal Timeline */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Timeline
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <span className="text-sm font-medium text-slate-900">Term Start</span>
                    <p className="text-sm text-slate-600">
                      {deal.termStartDate ? format(new Date(deal.termStartDate), 'MMM dd, yyyy') : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-slate-900">Term End</span>
                    <p className="text-sm text-slate-600">
                      {deal.termEndDate ? format(new Date(deal.termEndDate), 'MMM dd, yyyy') : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-slate-900">Last Updated</span>
                    <p className="text-sm text-slate-600">
                      {deal.updatedAt ? format(new Date(deal.updatedAt), 'MMM dd, yyyy') : 'Today'}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button className="w-full" variant="outline">
                    Edit Deal
                  </Button>
                  <Button className="w-full" variant="outline">
                    View History
                  </Button>
                  <Button className="w-full" variant="outline">
                    Export Details
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </QueryStateHandler>

      {/* Revision Request Modal */}
      <QueryStateHandler query={dealQuery} loadingComponent={null} errorComponent={null}>
        {(deal) => (
          <RevisionRequestModal
            isOpen={revisionModalOpen}
            onClose={() => setRevisionModalOpen(false)}
            deal={deal}
          />
        )}
      </QueryStateHandler>
    </div>
  );
}