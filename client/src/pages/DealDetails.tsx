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
import { DealHistory } from "@/components/collaboration/DealHistory";
import { ApprovalTracker } from "@/components/approval/ApprovalTracker";
import { DealGenieAssessment } from "@/components/DealGenieAssessment";
import { formatCurrency, formatPercentage } from "@/lib/utils";
import { useCurrentUser } from "@/hooks/useAuth";
import { useDealActions } from "@/hooks/useDealActions";
import { useToast } from "@/hooks/use-toast";
import { useDealCalculations } from "@/hooks/useDealCalculations";
import { ArrowLeft, Building2, Calendar, DollarSign, Users, MapPin, AlertTriangle, FileCheck, Edit, CheckCircle2 as CheckCircle, Share2, FileText, TrendingUp, TrendingDown, Minus, BarChart3 } from "lucide-react";
import { Deal } from "@shared/schema";
import { format } from "date-fns";

type UserRole = 'seller' | 'approver' | 'legal' | 'admin' | 'department_reviewer';

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

  // Fetch deal tiers for proper financial calculations
  const dealTiersQuery = useQuery({
    queryKey: ['/api/deals', dealId, 'tiers'],
    queryFn: async () => {
      const response = await fetch(`/api/deals/${dealId}/tiers`);
      if (!response.ok) {
        throw new Error('Failed to fetch deal tiers');
      }
      return response.json();
    },
    enabled: !!dealId && dealId > 0,
  });

  // Initialize calculation service for proper financial aggregation
  const { calculateFinancialSummary } = useDealCalculations();

  const handleGoBack = () => {
    navigate('/analytics');
  };

  // Initialize calculation service for adjusted metrics  
  const calculationService = useDealCalculations();

  // Calculate proper financial metrics based on deal structure
  const getFinancialMetrics = () => {
    const deal = dealQuery.data;
    const dealTiers = dealTiersQuery.data || [];
    
    if (!deal) return null;

    // For tiered deals with tiers data, show expected tier performance (middle tier)
    if (deal.dealStructure === "tiered" && dealTiers.length > 0) {
      // Sort tiers by tier number to ensure consistent ordering
      const sortedTiers = [...dealTiers].sort((a, b) => a.tierNumber - b.tierNumber);
      
      // Use middle tier as "expected" performance, or second tier if available
      const expectedTierIndex = sortedTiers.length > 2 ? 1 : 0; // Index 1 = Tier 2, or first tier
      const expectedTier = sortedTiers[expectedTierIndex];
      
      // Calculate total revenue across all tiers for context
      const summary = calculateFinancialSummary(dealTiers, deal.salesChannel, deal.advertiserName || undefined, deal.agencyName || undefined);
      
      // Calculate adjusted metrics for the expected tier
      const adjustedGrossMargin = calculationService.calculateAdjustedGrossMargin(expectedTier);
      const adjustedGrossProfit = calculationService.calculateTierGrossProfit(expectedTier);
      const tierIncentiveCosts = expectedTier.incentives?.reduce((sum: number, inc: any) => sum + (inc.value || 0), 0) || 0;
      
      return {
        annualRevenue: expectedTier.annualRevenue, // Show expected tier revenue
        annualGrossMargin: expectedTier.annualGrossMargin, // Expected tier margin
        adjustedGrossMargin: adjustedGrossMargin,
        adjustedGrossProfit: adjustedGrossProfit,
        totalIncentiveCosts: tierIncentiveCosts,
        displayTier: expectedTier.tierNumber // Track which tier we're showing
      };
    } else {
      // For flat commit deals, use direct values with calculations
      const flatTier = {
        tierNumber: 1,
        annualRevenue: deal.annualRevenue || 0,
        annualGrossMargin: deal.annualGrossMargin || 0, // Already in decimal format
        incentives: [] // No incentives in flat deals for now
      };
      
      return {
        annualRevenue: deal.annualRevenue,
        annualGrossMargin: deal.annualGrossMargin,
        adjustedGrossMargin: calculationService.calculateAdjustedGrossMargin(flatTier),
        adjustedGrossProfit: calculationService.calculateTierGrossProfit(flatTier),
        totalIncentiveCosts: 0, // No incentives in flat deals for now
        displayTier: null // No tiers in flat deals
      };
    }
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
        {(deal) => {
          const financialMetrics = getFinancialMetrics();
          
          return (
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
                      <span className="text-sm">{deal.salesChannel?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'N/A'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-slate-500" />
                      <span className="text-sm font-medium">Deal Type:</span>
                      <Badge variant="outline">
                        {deal.dealType === 'grow' ? 'Grow' : 
                         deal.dealType === 'protect' ? 'Protect' : 
                         deal.dealType === 'custom' ? 'Custom' : deal.dealType}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <BarChart3 className="h-4 w-4 text-slate-500" />
                      <span className="text-sm font-medium">Deal Structure:</span>
                      <Badge variant="secondary">
                        {deal.dealStructure === 'tiered' ? 'Tiered Revenue' : 'Flat Commit'}
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

              {/* Enhanced Financial Details */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-green-600" />
                    <CardTitle>Financial Performance</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Revenue & Adjusted Margin Row */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg border border-green-200">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-green-800">Annual Revenue</span>
                        <DollarSign className="h-4 w-4 text-green-600" />
                      </div>
                      <p className="text-2xl font-bold text-green-700 mt-1">
                        {financialMetrics?.annualRevenue ? formatCurrency(financialMetrics.annualRevenue) : 'N/A'}
                      </p>
                      {financialMetrics?.annualRevenue && (
                        <p className="text-xs text-green-600 mt-1">
                          {deal.dealStructure === "tiered" ? 
                            `Expected tier performance (Tier ${financialMetrics.displayTier || 2})` : 
                            "Primary revenue target"}
                        </p>
                      )}
                    </div>
                    
                    <div className="bg-gradient-to-r from-blue-50 to-cyan-50 p-4 rounded-lg border border-blue-200">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-blue-800">Adjusted Gross Margin</span>
                        <div className="flex items-center gap-1">
                          {financialMetrics?.adjustedGrossMargin && financialMetrics.adjustedGrossMargin > 0.15 ? (
                            <TrendingUp className="h-4 w-4 text-green-500" />
                          ) : financialMetrics?.adjustedGrossMargin && financialMetrics.adjustedGrossMargin > 0.10 ? (
                            <Minus className="h-4 w-4 text-yellow-500" />
                          ) : (
                            <TrendingDown className="h-4 w-4 text-red-500" />
                          )}
                        </div>
                      </div>
                      <p className="text-2xl font-bold text-blue-700 mt-1">
                        {financialMetrics?.adjustedGrossMargin ? formatPercentage(financialMetrics.adjustedGrossMargin) : 'N/A'}
                      </p>
                      {financialMetrics?.adjustedGrossMargin && (
                        <p className="text-xs text-blue-600 mt-1">
                          {financialMetrics.adjustedGrossMargin > 0.15 ? 'Strong margin after costs' : 
                           financialMetrics.adjustedGrossMargin > 0.10 ? 'Fair margin after costs' : 'Low margin after costs'}
                          {financialMetrics.displayTier ? ` (Tier ${financialMetrics.displayTier} expected)` : ''}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Adjusted Profit & Incentive Costs Row */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-gradient-to-r from-purple-50 to-violet-50 p-4 rounded-lg border border-purple-200">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-purple-800">Adjusted Gross Profit</span>
                        <TrendingUp className="h-4 w-4 text-purple-600" />
                      </div>
                      <p className="text-2xl font-bold text-purple-700 mt-1">
                        {financialMetrics?.adjustedGrossProfit ? formatCurrency(financialMetrics.adjustedGrossProfit) : 'N/A'}
                      </p>
                      <p className="text-xs text-purple-600 mt-1">
                        {financialMetrics?.displayTier ? 
                          `Tier ${financialMetrics.displayTier} profit after costs` : 
                          'Profit after all incentive costs'}
                      </p>
                    </div>
                    
                    <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-4 rounded-lg border border-amber-200">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-amber-800">Total Incentive Costs</span>
                        <FileCheck className="h-4 w-4 text-amber-600" />
                      </div>
                      <p className="text-2xl font-bold text-amber-700 mt-1">
                        {financialMetrics?.totalIncentiveCosts ? formatCurrency(financialMetrics.totalIncentiveCosts) : 'N/A'}
                      </p>
                      <p className="text-xs text-amber-600 mt-1">
                        Investment to secure deal
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* AI Assessment Section */}
              <DealGenieAssessment 
                dealData={deal}
                revenueGrowthRate={undefined}
                grossProfitGrowthRate={financialMetrics?.annualGrossMargin || undefined}
              />

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
                  {/* Seller actions */}
                  {userRole === 'seller' && (
                    <>
                      {/* Edit Deal for drafts/revisions */}
                      {(deal.status === 'draft' || deal.status === 'revision_requested') && (
                        <Button 
                          className="w-full" 
                          variant="default"
                          onClick={() => navigate(`/request/proposal?draftId=${deal.id}`)}
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          {deal.status === 'draft' ? 'Continue Draft' : 'Continue Editing'}
                        </Button>
                      )}
                      
                      {/* Generate Deck placeholder */}
                      <Button 
                        className="w-full" 
                        variant="outline"
                        onClick={() => {/* TODO: Generate deck functionality */}}
                        disabled
                      >
                        <FileText className="mr-2 h-4 w-4" />
                        Generate Deck
                      </Button>
                    </>
                  )}
                  
                  {/* Reviewer/Approver actions */}
                  {(userRole === 'approver' || userRole === 'legal' || userRole === 'department_reviewer') && deal.status === 'under_review' && (
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
                </CardContent>
              </Card>

              {/* Deal History Section */}
              <DealHistory dealId={deal.id} />
            </div>
          </div>
          );
        }}
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