import { useParams, useLocation } from "wouter";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SectionLoading, ErrorState } from "@/components/ui/loading-states";
import { RevisionRequestModal } from "@/components/revision/RevisionRequestModal";
import { ApprovalTracker } from "@/components/approval/ApprovalTracker";
import { DealGenieAssessment } from "@/components/DealGenieAssessment";
import { EnhancedFinancialCard } from "@/components/deal-details/EnhancedFinancialCard";
import { DealHeader } from "@/components/deal-details/DealHeader";
import { RoleBasedActions } from "@/components/deal-details/RoleBasedActions";
import { ApprovalSummary } from "@/components/deal-details/ApprovalSummary";
import { ActivityFeed } from "@/components/deal-details/ActivityFeed";
import { DealDetailsProvider, useDealDetails } from "@/providers/DealDetailsProvider";
import { useCurrentUser } from "@/hooks/useAuth";
import { useDealActions } from "@/hooks/useDealActions";
import { ArrowLeft, ArrowRight, Building2, Calendar, DollarSign, Users, MapPin, Target, FileCheck, BarChart3, Clock } from "lucide-react";
import { format } from "date-fns";

type UserRole = 'seller' | 'approver' | 'legal' | 'admin' | 'department_reviewer';

// Inner component that uses the consolidated data
function DealDetailsContent() {
  const [, navigate] = useLocation();
  const { data: user } = useCurrentUser();
  const [revisionModalOpen, setRevisionModalOpen] = useState(false);
  const { approveDeal, isUpdatingStatus } = useDealActions();
  const [activeTab, setActiveTab] = useState('overview');
  
  // Get all consolidated data from provider
  const {
    deal,
    tiers,
    financialMetrics,
    approvalStatus,
    aiScore,
    isLoading,
    error,
    resubmitDeal
  } = useDealDetails();
  
  const userRole = (user?.role as UserRole) || 'seller';

  const handleGoBack = () => {
    navigate('/analytics');
  };

  // Handle loading state
  if (isLoading) {
    return <SectionLoading title="Loading deal details..." rows={3} />;
  }

  // Handle error state
  if (error || !deal) {
    return (
      <ErrorState
        title="Failed to load deal"
        message="Unable to fetch deal details. Please try again."
        onRetry={() => window.location.reload()}
      />
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

      {/* Deal Header with KPI Strip */}
      <DealHeader 
        deal={deal}
        tiers={tiers}
        aiScore={aiScore || 90}
        bottleneckCount={2}
      />

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="px-6 py-4 border-b border-gray-200">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <FileCheck className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="approvals" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Approvals
            </TabsTrigger>
            <TabsTrigger value="financials" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Financials
            </TabsTrigger>
            <TabsTrigger value="ai-insights" className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              AI Insights
            </TabsTrigger>
            <TabsTrigger value="activity" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Activity
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Tab Content */}
        <div className="px-6 py-6">
          <TabsContent value="overview" className="space-y-6 mt-0">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Column 1: Deal Metadata */}
              <div className="space-y-6">
                {/* Deal Information Card */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    Deal Information
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Reference:</span>
                      <span className="font-medium">#{deal.referenceNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Type:</span>
                      <span className="font-medium">{deal.dealType}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Structure:</span>
                      <span className="font-medium capitalize">{deal.dealStructure?.replace('_', ' ')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Created:</span>
                      <span className="font-medium">
                        {deal.createdAt && format(new Date(deal.createdAt), 'MMM dd, yyyy')}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Client:</span>
                      <span className="font-medium">{deal.dealName.split(' ')[0]}</span>
                    </div>
                  </div>
                </div>

                {/* Current Status Card */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Current Status
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Status:</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        deal.status === 'submitted' ? 'bg-blue-100 text-blue-800' :
                        deal.status === 'under_review' ? 'bg-yellow-100 text-yellow-800' :
                        deal.status === 'approved' ? 'bg-green-100 text-green-800' :
                        deal.status === 'revision_requested' ? 'bg-orange-100 text-orange-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {deal.status?.replace('_', ' ')}
                      </span>
                    </div>
                    {deal.lastRevisedAt && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Last Revised:</span>
                        <span className="font-medium">
                          {format(new Date(deal.lastRevisedAt), 'MMM dd, yyyy')}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Column 2: Actions & Next Steps */}
              <div className="space-y-6">
                {/* Role-Based Actions */}
                <RoleBasedActions
                  deal={deal}
                  userRole={userRole}
                  onApprove={() => approveDeal.mutate({ dealId: deal.id })}
                  onEdit={() => navigate(`/deals/${deal.id}/edit`)}
                  onRequestRevision={() => setRevisionModalOpen(true)}
                  onResubmit={() => resubmitDeal()}
                  isLoading={isUpdatingStatus}
                />

                {/* Next Steps Card */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <ArrowRight className="h-5 w-5" />
                    Next Steps
                  </h3>
                  <div className="space-y-3">
                    {deal.status === 'submitted' && (
                      <p className="text-sm text-gray-600">
                        Your deal is awaiting department review. You'll be notified of any updates.
                      </p>
                    )}
                    {deal.status === 'under_review' && (
                      <p className="text-sm text-gray-600">
                        Your deal is currently under review by department teams and approvers.
                      </p>
                    )}
                    {deal.status === 'revision_requested' && (
                      <p className="text-sm text-gray-600">
                        Please review the feedback and edit your deal accordingly, then resubmit.
                      </p>
                    )}
                    {deal.status === 'approved' && (
                      <p className="text-sm text-gray-600">
                        Congratulations! Your deal has been approved and is ready for execution.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="approvals" className="mt-0">
            <div className="space-y-6">
              <ApprovalTracker 
                dealId={deal.id}
                dealName={deal.dealName}
              />
            </div>
          </TabsContent>

          <TabsContent value="financials" className="mt-0">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <EnhancedFinancialCard 
                tiers={tiers}
                dealStructure={deal.dealStructure || 'flat_commit'}
              />
              
              {/* Additional Financial Details */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Financial Summary</h3>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Revenue</span>
                    <span className="font-medium">
                      {financialMetrics?.annualRevenue ? `$${(financialMetrics.annualRevenue / 1000000).toFixed(1)}M` : 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Gross Profit</span>
                    <span className="font-medium">
                      {financialMetrics?.adjustedGrossProfit ? `$${(financialMetrics.adjustedGrossProfit / 1000000).toFixed(1)}M` : 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Incentive Costs</span>
                    <span className="font-medium">
                      {financialMetrics?.totalIncentiveCosts ? `$${(financialMetrics.totalIncentiveCosts / 1000000).toFixed(1)}M` : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="ai-insights" className="mt-0">
            <div className="space-y-6">
              <DealGenieAssessment 
                dealData={deal}
                compact={false}
              />
            </div>
          </TabsContent>

          <TabsContent value="activity" className="mt-0">
            <ActivityFeed deal={deal} dealId={deal.id} />
          </TabsContent>
        </div>
      </Tabs>

      {/* Revision Request Modal */}
      <RevisionRequestModal
        isOpen={revisionModalOpen}
        onClose={() => setRevisionModalOpen(false)}
        deal={deal}
      />
    </div>
  );
}

// Main component with provider wrapper
export default function DealDetails() {
  const { id } = useParams<{ id: string }>();
  const dealId = parseInt(id || "0");

  if (!dealId || dealId <= 0) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500">Invalid deal ID</p>
        <Button onClick={() => window.history.back()} variant="outline" className="mt-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Go Back
        </Button>
      </div>
    );
  }

  return (
    <DealDetailsProvider dealId={dealId}>
      <DealDetailsContent />
    </DealDetailsProvider>
  );
}