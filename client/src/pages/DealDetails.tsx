import { useParams, useLocation } from "wouter";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { SectionLoading, ErrorState } from "@/components/ui/loading-states";
import { RevisionRequestModal } from "@/components/revision/RevisionRequestModal";
import { ApprovalTracker } from "@/components/approval/ApprovalTracker";
import { DealGenieAssessment } from "@/components/DealGenieAssessment";
import { FinancialSummarySection } from "@/components/deal-form/FinancialSummarySection";
import { RoleBasedActions } from "@/components/deal-details/RoleBasedActions";
import { ApprovalSummary } from "@/components/deal-details/ApprovalSummary";
import { ActivityFeed } from "@/components/deal-details/ActivityFeed";
import { DealDetailsProvider, useDealDetails } from "@/providers/DealDetailsProvider";
import { useCurrentUser } from "@/hooks/useAuth";
import { useDealActions } from "@/hooks/useDealActions";
import { ArrowLeft, ArrowRight, Calendar, DollarSign, Users, MapPin, Target, FileCheck, BarChart3, Clock } from "lucide-react";
import { format } from "date-fns";

type UserRole = 'seller' | 'approver' | 'legal' | 'admin' | 'department_reviewer';

// Inner component that uses the consolidated data
function DealDetailsContent() {
  const [, navigate] = useLocation();
  const { data: user } = useCurrentUser();
  const [revisionModalOpen, setRevisionModalOpen] = useState(false);
  const { approveDeal, isUpdatingStatus } = useDealActions();
  
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

      {/* Deal Summary Bar - Horizontal Layout */}
      <div className="px-6 py-4 border-b border-gray-200 bg-white">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Deal Title & Client */}
          <div>
            <h1 className="text-xl font-bold text-gray-900">{deal.dealName}</h1>
            <p className="text-sm text-gray-600 mt-1">Client: {deal.dealName.split(' ')[0]}</p>
          </div>
          
          {/* Reference & Type */}
          <div>
            <p className="text-sm font-medium text-gray-900">#{deal.referenceNumber}</p>
            <p className="text-sm text-gray-600 mt-1">{deal.dealType} • {deal.dealStructure?.replace('_', ' ')}</p>
          </div>
          
          {/* Timeline */}
          <div>
            <p className="text-sm font-medium text-gray-900">Created</p>
            <p className="text-sm text-gray-600 mt-1">
              {deal.createdAt && format(new Date(deal.createdAt), 'MMM dd, yyyy')}
            </p>
            {deal.lastRevisedAt && (
              <p className="text-xs text-gray-500 mt-1">
                Revised: {format(new Date(deal.lastRevisedAt), 'MMM dd')}
              </p>
            )}
          </div>
          
          {/* Status */}
          <div className="flex items-center justify-end">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              deal.status === 'submitted' ? 'bg-blue-100 text-blue-800' :
              deal.status === 'under_review' ? 'bg-yellow-100 text-yellow-800' :
              deal.status === 'approved' ? 'bg-green-100 text-green-800' :
              deal.status === 'revision_requested' ? 'bg-orange-100 text-orange-800' :
              deal.status === 'negotiating' ? 'bg-purple-100 text-purple-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {deal.status?.replace('_', ' ')}
            </span>
          </div>
        </div>
      </div>

      {/* Financial Structure - Full Width */}
      <div className="px-6 py-6 border-b border-gray-200">
        <FinancialSummarySection 
          dealTiers={tiers.length > 0 ? tiers : [
            {
              dealId: deal.id,
              tierNumber: 1,
              annualRevenue: 6000000, // Tesla's revenue from fallback
              annualGrossMargin: 0.22, // Tesla's margin from fallback
              incentiveStructure: [],
              createdAt: deal.createdAt,
              updatedAt: deal.updatedAt
            }
          ]}
          salesChannel="independent_agency"
          advertiserName={deal.dealName.split(' ')[0]}
          agencyName="MiQ"
        />
      </div>

      {/* Bottom Section - 2 Column Layout */}
      <div className="px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* LEFT COLUMN - Approval Workflow */}
          <div className="space-y-8">
            {/* Approval Workflow */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Users className="h-5 w-5" />
                Approval Workflow
              </h2>
              <ApprovalTracker 
                dealId={deal.id}
                dealName={deal.dealName}
              />
            </div>
          </div>

          {/* RIGHT COLUMN - Activity + Metadata + Actions */}
          <div className="space-y-8">
            {/* Activity Feed */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Activity & Communication
              </h2>
              <ActivityFeed deal={deal} dealId={deal.id} />
            </div>

            {/* Role-Based Actions */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <FileCheck className="h-5 w-5" />
                Actions
              </h2>
              <RoleBasedActions
                deal={deal}
                userRole={userRole}
                onApprove={() => approveDeal.mutate({ dealId: deal.id })}
                onEdit={() => navigate(`/deals/${deal.id}/edit`)}
                onRequestRevision={() => setRevisionModalOpen(true)}
                onResubmit={() => resubmitDeal()}
                isLoading={isUpdatingStatus}
              />
            </div>
          </div>
        </div>
      </div>

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