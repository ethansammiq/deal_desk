import { useParams, useLocation } from "wouter";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { ArrowLeft, Calendar, DollarSign, Users, MapPin, Target, FileCheck, Clock } from "lucide-react";
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
    <div className="min-h-screen bg-slate-50 p-6 space-y-6">

      {/* Deal Summary Card */}
      <Card className="border border-slate-200 shadow-sm bg-white">
        <CardHeader className="pb-6">
          <div className="flex items-center gap-3">
            <div className="w-1 h-6 bg-[#3e0075] rounded-full"></div>
            <div className="flex-1">
              <CardTitle className="text-xl font-semibold text-slate-900">
                {deal.dealName}
              </CardTitle>
              <CardDescription className="text-slate-500">
                {deal.dealType} • {deal.dealStructure?.replace('_', ' ')} • Client: {deal.dealName.split(' ')[0]}
              </CardDescription>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-medium text-slate-900">#{deal.referenceNumber}</p>
                <p className="text-xs text-slate-500">
                  {deal.createdAt && format(new Date(deal.createdAt), 'MMM dd, yyyy')}
                </p>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                deal.status === 'submitted' ? 'bg-blue-100 text-blue-800' :
                deal.status === 'under_review' ? 'bg-yellow-100 text-yellow-800' :
                deal.status === 'approved' ? 'bg-green-100 text-green-800' :
                deal.status === 'revision_requested' ? 'bg-orange-100 text-orange-800' :
                deal.status === 'negotiating' ? 'bg-purple-100 text-purple-800' :
                'bg-slate-100 text-slate-800'
              }`}>
                {deal.status?.replace('_', ' ')}
              </span>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Financial Summary Card */}
      <Card className="border border-slate-200 shadow-sm bg-white">
        <CardContent className="p-0">
          <FinancialSummarySection 
          dealTiers={tiers.length > 0 ? tiers : [
            {
              dealId: deal.id,
              tierNumber: 1,
              annualRevenue: 6000000, // Tesla's revenue from fallback
              annualGrossMargin: 0.22, // Tesla's margin from fallback
              incentives: [],
              createdAt: deal.createdAt || new Date(),
              updatedAt: deal.updatedAt || new Date()
            }
          ]}
          salesChannel="independent_agency"
          advertiserName={deal.dealName.split(' ')[0]}
          agencyName="MiQ"
          />
        </CardContent>
      </Card>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LEFT COLUMN - Approval Workflow */}
        <Card className="border border-slate-200 shadow-sm bg-white">
          <CardHeader className="pb-6">
            <div className="flex items-center gap-3">
              <div className="w-1 h-6 bg-[#3e0075] rounded-full"></div>
              <div className="flex-1">
                <CardTitle className="text-xl font-semibold text-slate-900">
                  Approval Workflow
                </CardTitle>
                <CardDescription className="text-slate-500">
                  Current approval status and next steps
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ApprovalTracker 
              dealId={deal.id}
              dealName={deal.dealName}
            />
          </CardContent>
        </Card>

        {/* RIGHT COLUMN - Activity & Actions */}
        <div className="space-y-6">
          {/* Activity Feed */}
          <Card className="border border-slate-200 shadow-sm bg-white">
            <CardHeader className="pb-6">
              <div className="flex items-center gap-3">
                <div className="w-1 h-6 bg-[#3e0075] rounded-full"></div>
                <div className="flex-1">
                  <CardTitle className="text-xl font-semibold text-slate-900">
                    Activity & Communication
                  </CardTitle>
                  <CardDescription className="text-slate-500">
                    Comments, updates, and collaboration history
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ActivityFeed deal={deal} dealId={deal.id} />
            </CardContent>
          </Card>

          {/* Role-Based Actions */}
          <Card className="border border-slate-200 shadow-sm bg-white">
            <CardHeader className="pb-6">
              <div className="flex items-center gap-3">
                <div className="w-1 h-6 bg-[#3e0075] rounded-full"></div>
                <div className="flex-1">
                  <CardTitle className="text-xl font-semibold text-slate-900">
                    Actions
                  </CardTitle>
                  <CardDescription className="text-slate-500">
                    Available actions for your role
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <RoleBasedActions
                deal={deal}
                userRole={userRole}
                onApprove={() => approveDeal.mutate({ dealId: deal.id })}
                onEdit={() => navigate(`/deals/${deal.id}/edit`)}
                onRequestRevision={() => setRevisionModalOpen(true)}
                onResubmit={() => resubmitDeal()}
                isLoading={isUpdatingStatus}
              />
            </CardContent>
          </Card>
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