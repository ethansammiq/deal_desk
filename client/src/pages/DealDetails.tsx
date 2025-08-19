import { useParams, Link, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { QueryStateHandler, SectionLoading, ErrorState } from "@/components/ui/loading-states";
import { DealStatusBadge } from "@/components/deal-status/DealStatusBadge";
import { RevisionRequestModal } from "@/components/revision/RevisionRequestModal";
import { DealComments } from "@/components/collaboration/DealComments";
import { StatusHistory } from "@/components/collaboration/StatusHistory";
import { ApprovalTracker } from "@/components/approval/ApprovalTracker";
import { formatCurrency } from "@/lib/utils";
import { useCurrentUser } from "@/hooks/useAuth";
import { useDealActions } from "@/hooks/useDealActions";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Building2, Calendar, DollarSign, Users, MapPin, AlertTriangle, FileCheck, Edit, CheckCircle2 as CheckCircle, Share2, FileText } from "lucide-react";
import { Deal } from "@shared/schema";
import { format } from "date-fns";

type UserRole = 'seller' | 'approver' | 'legal' | 'admin';

export default function DealDetails() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { data: user } = useCurrentUser();
  const [revisionModalOpen, setRevisionModalOpen] = useState(false);
  const { approveDeal, isUpdatingStatus } = useDealActions();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const dealId = parseInt(id || "0");
  const userRole = (user?.role as UserRole) || 'seller';
  
  // Resubmit deal mutation
  const resubmitMutation = useMutation({
    mutationFn: async (dealId: number) => {
      const response = await fetch(`/api/deals/${dealId}/resubmit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to resubmit deal');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/deals'] });
      queryClient.invalidateQueries({ queryKey: ['/api/deals', dealId] });
      toast({
        title: "Deal Resubmitted",
        description: "Your deal has been resubmitted for review.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to Resubmit",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    }
  });
  
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
    navigate('/analytics');
  };

  if (!dealId || dealId <= 0) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500">Invalid deal ID</p>
        <Button onClick={handleGoBack} variant="outline" className="mt-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Analytics
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
            Back to Analytics
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
              
              {/* Seller Actions for Revision Requested */}
              {userRole === 'seller' && deal.status === 'revision_requested' && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/request/proposal?draftId=${deal.id}`)}
                  >
                    Edit Deal
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => resubmitMutation.mutate(deal.id)}
                    disabled={resubmitMutation.isPending}
                  >
                    Resubmit Deal
                  </Button>
                </>
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
                    <DealStatusBadge status={deal.status as any} />
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

                  {/* Revision Information */}
                  {deal.status === 'revision_requested' && deal.revisionReason && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
                        <div className="flex-1">
                          <h4 className="font-medium text-amber-900 mb-2">Revision Requested</h4>
                          <p className="text-sm text-amber-800 mb-3">{deal.revisionReason}</p>
                          <div className="flex items-center gap-2 text-xs text-amber-700">
                            <span>Revision #{deal.revisionCount || 1}</span>
                            {deal.lastRevisedAt && (
                              <span>• Requested {format(new Date(deal.lastRevisedAt), 'MMM dd, yyyy')}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

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

              {/* Approval Progress Tracker */}
              {deal.status !== 'draft' && deal.status !== 'scoping' && (
                <ApprovalTracker
                  dealId={deal.id}
                  dealName={deal.dealName}
                />
              )}

              {/* Comments Section */}
              <DealComments 
                deal={deal} 
                userRole={userRole} 
                currentUser={user?.username || 'Unknown User'} 
              />
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
                  {/* Edit Deal - Navigate to submission form for drafts/revisions */}
                  {deal.status === 'draft' ? (
                    <Button 
                      className="w-full" 
                      variant="default"
                      onClick={() => navigate(`/request/proposal?draftId=${deal.id}`)}
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      Continue Draft
                    </Button>
                  ) : deal.status === 'revision_requested' ? (
                    <Button 
                      className="w-full" 
                      variant="default"
                      onClick={() => navigate(`/request/proposal?draftId=${deal.id}`)}
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      Continue Editing
                    </Button>
                  ) : null}
                  
                  {/* Primary actions based on user role and deal status */}
                  {user && (userRole === 'approver' || userRole === 'legal' || userRole === 'department_reviewer') && deal.status === 'under_review' && (
                    <>
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => setRevisionModalOpen(true)}
                      >
                        <AlertTriangle className="mr-2 h-4 w-4" />
                        Request Revision
                      </Button>
                      <Button
                        className="w-full"
                        onClick={() => {/* TODO: Implement approval action */}}
                      >
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Approve Deal
                      </Button>
                    </>
                  )}
                  
                  {/* Share deal link */}
                  <Button 
                    className="w-full" 
                    variant="outline"
                    onClick={() => {
                      navigator.clipboard.writeText(window.location.href);
                      toast({ 
                        title: "Link copied",
                        description: "Deal link has been copied to clipboard"
                      });
                    }}
                  >
                    <Share2 className="mr-2 h-4 w-4" />
                    Share Deal
                  </Button>
                  
                  {/* Status-specific actions */}
                  {deal.status === 'approved' && (
                    <Button 
                      className="w-full" 
                      variant="outline"
                      onClick={() => {/* TODO: Generate contract */}}
                    >
                      <FileText className="mr-2 h-4 w-4" />
                      Generate Contract
                    </Button>
                  )}
                  
                  {/* Back to previous page */}
                  <Button 
                    className="w-full" 
                    variant="ghost"
                    onClick={() => navigate('/analytics')}
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Analytics
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