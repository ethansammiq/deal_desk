import { useParams, Link, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { QueryStateHandler, SectionLoading, ErrorState } from "@/components/ui/loading-states";
import { DealStatusBadge } from "@/components/deal-status/DealStatusBadge";
import { RevisionRequestModal } from "@/components/revision/RevisionRequestModal";
import { ApprovalTracker } from "@/components/approval/ApprovalTracker";
import { DealGenieAssessment } from "@/components/DealGenieAssessment";
import { EnhancedFinancialCard } from "@/components/deal-details/EnhancedFinancialCard";
import { DealHeader } from "@/components/deal-details/DealHeader";
import { RoleBasedActions } from "@/components/deal-details/RoleBasedActions";
import { ApprovalSummary } from "@/components/deal-details/ApprovalSummary";
import { ActivityFeed } from "@/components/deal-details/ActivityFeed";
import { formatCurrency, formatPercentage } from "@/lib/utils";
import { useCurrentUser } from "@/hooks/useAuth";
import { useDealActions } from "@/hooks/useDealActions";
import { useToast } from "@/hooks/use-toast";
import { useDealCalculations } from "@/hooks/useDealCalculations";
import { TierDataAccess } from "@/utils/tier-data-access";
import { ArrowLeft, Building2, Calendar, DollarSign, Users, MapPin, AlertTriangle, FileCheck, Edit, CheckCircle2 as CheckCircle, Share2, FileText, TrendingUp, TrendingDown, Minus, BarChart3, Clock, Target } from "lucide-react";
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
  const [activeTab, setActiveTab] = useState('overview');
  
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

  // Fetch deal tiers using TierDataAccess with enhanced fallback
  const dealTiersQuery = useQuery({
    queryKey: ['/api/deals', dealId, 'tiers'],
    queryFn: async () => {
      const response = await fetch(`/api/deals/${dealId}/tiers`);
      if (!response.ok) {
        throw new Error('Failed to fetch deal tiers');
      }
      const data = await response.json();
      
      // Apply enhanced fallback logic if no tiers found
      if (!data.tiers || data.tiers.length === 0) {
        return await TierDataAccess.fetchTiersWithFallback(dealId);
      }
      
      return data.tiers;
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

  // Calculate financial metrics using TierDataAccess system
  const getFinancialMetrics = () => {
    const deal = dealQuery.data;
    const tiers = dealTiersQuery.data || [];
    
    if (!deal || !tiers) return null;

    // Use TierDataAccess for consistent tier-first calculations
    const expectedRevenue = TierDataAccess.getExpectedRevenue(tiers);
    const expectedGrossMargin = TierDataAccess.getExpectedGrossMargin(tiers);
    const expectedIncentiveCost = TierDataAccess.getExpectedIncentiveCost(tiers);
    const expectedGrossProfit = TierDataAccess.getExpectedGrossProfit(tiers);

    return {
      annualRevenue: expectedRevenue,
      annualGrossMargin: expectedGrossMargin,
      adjustedGrossMargin: expectedGrossMargin,
      adjustedGrossProfit: expectedGrossProfit,
      totalIncentiveCosts: expectedIncentiveCost,
      displayTier: tiers.length > 0 ? TierDataAccess.getExpectedTier(tiers)?.tierNumber : null
    };
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
    <div className="space-y-0">
      {/* Navigation Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <Button onClick={handleGoBack} variant="outline" size="sm">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Analytics
        </Button>
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
            <div>
              {/* Deal Header with KPI Strip */}
              <DealHeader 
                deal={deal}
                tiers={dealTiersQuery.data || []}
                aiScore={7} // TODO: Get from AI analysis
                bottleneckCount={2} // TODO: Calculate from approvals
              />

              {/* Primary Actions Bar */}
              <div className="px-6 py-4 bg-white border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">{deal.advertiserName || deal.agencyName}</span> • {deal.region}
                    </p>
                  </div>
                  <RoleBasedActions
                    deal={deal}
                    userRole={userRole}
                    onApprove={() => approveDeal.mutate({ dealId })}
                    onEdit={() => navigate(`/deals/${dealId}/edit`)}
                    onRequestRevision={() => setRevisionModalOpen(true)}
                    onResubmit={() => resubmitMutation.mutate(dealId)}
                    isLoading={isUpdatingStatus || resubmitMutation.isPending}
                  />
                </div>
              </div>

              {/* Tab-Based Content */}
              <div className="bg-white">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <div className="px-6 border-b border-gray-200">
                    <TabsList className="grid w-full grid-cols-5 bg-transparent h-auto p-0">
                      <TabsTrigger 
                        value="overview" 
                        className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-none py-4 px-6"
                      >
                        Overview
                      </TabsTrigger>
                      <TabsTrigger 
                        value="approvals"
                        className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-none py-4 px-6"
                      >
                        Approvals
                      </TabsTrigger>
                      <TabsTrigger 
                        value="financials"
                        className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-none py-4 px-6"
                      >
                        Financials
                      </TabsTrigger>
                      <TabsTrigger 
                        value="ai-insights"
                        className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-none py-4 px-6"
                      >
                        AI Insights
                      </TabsTrigger>
                      <TabsTrigger 
                        value="activity"
                        className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-none py-4 px-6"
                      >
                        Activity
                      </TabsTrigger>
                    </TabsList>
                  </div>

                  <div className="p-6">
                    {/* Overview Tab */}
                    <TabsContent value="overview" className="mt-0 space-y-6">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Financial Summary */}
                        <div>
                          <h3 className="text-lg font-semibold mb-4">Financial Performance</h3>
                          <EnhancedFinancialCard 
                            tiers={dealTiersQuery.data || []}
                            dealStructure={deal.dealStructure || 'flat_commit'}
                          />
                        </div>

                        {/* Approval Summary */}
                        <div>
                          <h3 className="text-lg font-semibold mb-4">Approval Status</h3>
                          <ApprovalSummary 
                            dealId={dealId}
                            onViewDetails={() => setActiveTab('approvals')}
                          />
                        </div>
                      </div>

                      {/* Deal Details Grid */}
                      <Card>
                        <CardHeader>
                          <CardTitle>Deal Information</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="flex items-center gap-2">
                              <Building2 className="h-4 w-4 text-slate-500" />
                              <span className="text-sm font-medium">Client:</span>
                              <span className="text-sm">{deal.advertiserName || deal.agencyName || 'N/A'}</span>
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
                              <span className="text-sm font-medium">Structure:</span>
                              <Badge variant="secondary">
                                {deal.dealStructure === 'tiered' ? 'Tiered Revenue' : 'Flat Commit'}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2">
                              <Target className="h-4 w-4 text-slate-500" />
                              <span className="text-sm font-medium">Priority:</span>
                              <Badge variant={deal.priority === 'critical' ? 'destructive' : deal.priority === 'high' ? 'default' : 'outline'}>
                                {deal.priority?.charAt(0).toUpperCase() + deal.priority?.slice(1) || 'N/A'}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-slate-500" />
                              <span className="text-sm font-medium">Contract Term:</span>
                              <span className="text-sm">{deal.contractTerm ? `${deal.contractTerm} months` : 'N/A'}</span>
                            </div>
                          </div>

                          {/* Business Summary */}
                          {deal.businessSummary && (
                            <div className="mt-6">
                              <h4 className="text-sm font-medium text-slate-900 mb-2">Business Summary</h4>
                              <p className="text-sm text-slate-600">{deal.businessSummary}</p>
                            </div>
                          )}

                          {/* Revision Information */}
                          {deal.status === 'revision_requested' && deal.revisionReason && (
                            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mt-6">
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
                        </CardContent>
                      </Card>
                    </TabsContent>

                    {/* Approvals Tab */}
                    <TabsContent value="approvals" className="mt-0">
                      <ApprovalTracker dealId={dealId} dealName={deal.dealName} />
                    </TabsContent>

                    {/* Financials Tab */}
                    <TabsContent value="financials" className="mt-0">
                      <EnhancedFinancialCard 
                        tiers={dealTiersQuery.data || []}
                        dealStructure={deal.dealStructure || 'flat_commit'}
                      />
                    </TabsContent>

                    {/* AI Insights Tab */}
                    <TabsContent value="ai-insights" className="mt-0">
                      <DealGenieAssessment dealData={deal} />
                    </TabsContent>

                    {/* Activity Tab */}
                    <TabsContent value="activity" className="mt-0">
                      <ActivityFeed deal={deal} dealId={dealId} />
                    </TabsContent>
                  </div>
                </Tabs>
              </div>

              {/* Revision Request Modal */}
              <RevisionRequestModal
                deal={deal}
                isOpen={revisionModalOpen}
                onClose={() => setRevisionModalOpen(false)}
              />
            </div>
          );
        }}
      </QueryStateHandler>
    </div>
  );
}
