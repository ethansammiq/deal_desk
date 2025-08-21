import { useParams, useLocation } from "wouter";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SectionLoading, ErrorState } from "@/components/ui/loading-states";
import { RevisionRequestModal } from "@/components/revision/RevisionRequestModal";
import { useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  XCircle,
  ArrowRight,
  Users,
  Building2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { DealGenieAssessment } from "@/components/DealGenieAssessment";
import { FinancialTable, FinancialTableColGroup, FinancialTableHeader, FinancialTableBody, FinancialHeaderCell, FinancialDataCell, FinancialMetricLabel, GrowthIndicator } from "@/components/ui/financial-table";
import { useFinancialData } from "@/hooks/useFinancialData";
import { useDealCalculations } from "@/hooks/useDealCalculations";
import { formatCurrency } from "@/lib/utils";
import { RoleBasedActions } from "@/components/deal-details/RoleBasedActions";
import { ApprovalSummary } from "@/components/deal-details/ApprovalSummary";
import { ActivityFeed } from "@/components/deal-details/ActivityFeed";
import { DealDetailsProvider, useDealDetails } from "@/providers/DealDetailsProvider";
import { useCurrentUser } from "@/hooks/useAuth";
import { useDealActions } from "@/hooks/useDealActions";
import { ArrowLeft, Calendar, DollarSign, MapPin, Target, FileCheck } from "lucide-react";
import { format } from "date-fns";

type UserRole = 'seller' | 'approver' | 'legal' | 'admin' | 'department_reviewer';

// Table-only financial summary component
function FinancialSummaryTable({ 
  dealTiers, 
  salesChannel, 
  advertiserName, 
  agencyName 
}: {
  dealTiers: any[];
  salesChannel: string;
  advertiserName: string;
  agencyName: string;
}) {
  const { agenciesQuery, advertisersQuery, isLoading, hasError, agenciesData, advertisersData } = useFinancialData();
  const { calculationService } = useDealCalculations(advertisersData, agenciesData);

  if (isLoading) {
    return <SectionLoading title="Loading Financial Data..." rows={5} />;
  }

  if (hasError) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">Error loading financial data. Please try again.</p>
      </div>
    );
  }

  return (
    <FinancialTable>
      <FinancialTableColGroup dealTiers={dealTiers} />
      
      <FinancialTableHeader>
        <tr>
          <FinancialHeaderCell isMetricName />
          <FinancialHeaderCell>Last Year</FinancialHeaderCell>
          {dealTiers.map((tier) => (
            <FinancialHeaderCell key={`fs-header-${tier.tierNumber}`}>
              Tier {tier.tierNumber}
            </FinancialHeaderCell>
          ))}
        </tr>
      </FinancialTableHeader>
            
      <FinancialTableBody>
        {/* Adjusted Gross Margin */}
        <tr>
          <FinancialDataCell isMetricLabel>
            <FinancialMetricLabel 
              title="Adjusted Gross Margin"
              description="Gross margin after incentives"
            />
          </FinancialDataCell>
          <FinancialDataCell>
            {(() => {
              const lastYearAdjustedMargin = calculationService.getPreviousYearAdjustedGrossMargin(salesChannel, advertiserName, agencyName);
              return `${(lastYearAdjustedMargin * 100).toFixed(1)}%`;
            })()}
          </FinancialDataCell>
          {dealTiers.map((tier) => {
            const revenue = tier.annualRevenue || 0;
            const grossMarginDecimal = tier.annualGrossMargin || 0;
            const grossProfit = revenue * grossMarginDecimal;
            const incentiveCost = calculationService.calculateTierIncentiveCost(tier);
            const adjustedProfit = grossProfit - incentiveCost;
            const adjustedMarginDecimal = revenue > 0 ? adjustedProfit / revenue : 0;
            
            return (
              <FinancialDataCell key={`adj-margin-${tier.tierNumber}`}>
                {(adjustedMarginDecimal * 100).toFixed(1)}%
              </FinancialDataCell>
            );
          })}
        </tr>
        
        {/* Adjusted Gross Profit */}
        <tr>
          <FinancialDataCell isMetricLabel>
            <FinancialMetricLabel 
              title="Adjusted Gross Profit"
              description="Gross profit after incentive costs"
            />
          </FinancialDataCell>
          <FinancialDataCell>
            {formatCurrency(calculationService.getPreviousYearAdjustedGrossProfit(salesChannel, advertiserName, agencyName))}
          </FinancialDataCell>
          {dealTiers.map((tier) => {
            const revenue = tier.annualRevenue || 0;
            const grossMarginDecimal = tier.annualGrossMargin || 0;
            const grossProfit = revenue * grossMarginDecimal;
            const incentiveCost = calculationService.calculateTierIncentiveCost(tier);
            const adjustedProfit = grossProfit - incentiveCost;
            
            return (
              <FinancialDataCell key={`adj-profit-${tier.tierNumber}`}>
                {formatCurrency(adjustedProfit)}
              </FinancialDataCell>
            );
          })}
        </tr>
        
        {/* Adjusted Gross Margin Growth Rate */}
        <tr>
          <FinancialDataCell isMetricLabel>
            <FinancialMetricLabel 
              title="Adjusted Gross Margin Growth Rate"
              description="Percentage change in adjusted margin"
            />
          </FinancialDataCell>
          <FinancialDataCell>
            <span className="text-slate-500">—</span>
          </FinancialDataCell>
          {dealTiers.map((tier) => {
            const marginGrowthRate = calculationService.calculateAdjustedGrossMarginGrowthRate(
              tier,
              salesChannel,
              advertiserName,
              agencyName
            );
            
            return (
              <FinancialDataCell key={`margin-growth-${tier.tierNumber}`}>
                <GrowthIndicator value={marginGrowthRate} />
              </FinancialDataCell>
            );
          })}
        </tr>
        
        {/* Adjusted Gross Profit Growth Rate */}
        <tr>
          <FinancialDataCell isMetricLabel>
            <FinancialMetricLabel 
              title="Adjusted Gross Profit Growth Rate"
              description="Percentage increase in adjusted profit vs last year"
            />
          </FinancialDataCell>
          <FinancialDataCell>
            <span className="text-slate-500">—</span>
          </FinancialDataCell>
          {dealTiers.map((tier) => {
            const profitGrowthRate = calculationService.calculateAdjustedGrossProfitGrowthRate(
              tier,
              salesChannel,
              advertiserName,
              agencyName
            );
            
            return (
              <FinancialDataCell key={`profit-growth-${tier.tierNumber}`}>
                <GrowthIndicator value={profitGrowthRate} />
              </FinancialDataCell>
            );
          })}
        </tr>
      </FinancialTableBody>
    </FinancialTable>
  );
}

// Content-only approval tracker component
function ApprovalTrackerContent({ 
  dealId, 
  dealName 
}: {
  dealId: number;
  dealName: string;
}) {
  const { data: approvalState, isLoading } = useQuery<{
    overallState: string;
    departmentApprovals: number;
    businessApprovals: number;
    departmentsComplete: boolean;
    revisionsRequested: boolean;
  }>({
    queryKey: [`/api/deals/${dealId}/approval-state`],
    enabled: !!dealId,
    refetchInterval: 30000
  });

  const { data: approvalStatus } = useQuery<any>({
    queryKey: [`/api/deals/${dealId}/approval-status`],
    enabled: !!dealId,
    refetchInterval: 5000
  });

  if (isLoading) {
    return <SectionLoading title="Loading approval data..." rows={3} />;
  }

  if (!approvalState || !approvalStatus) {
    return (
      <div className="text-center py-8">
        <p className="text-slate-500">No approval workflow initiated yet</p>
      </div>
    );
  }

  // Process approval data into stages
  const stages = [
    {
      stage: 1,
      name: 'Department Review',
      description: 'Parallel review by relevant departments',
      status: getStageStatus(1, approvalState, approvalStatus),
      approvals: (approvalStatus.approvals || []).filter((a: any) => a.approvalStage === 1),
      progress: calculateStageProgress(1, approvalStatus)
    },
    {
      stage: 2,
      name: 'Business Approval', 
      description: 'Executive approval for final sign-off',
      status: getStageStatus(2, approvalState, approvalStatus),
      approvals: (approvalStatus.approvals || []).filter((a: any) => a.approvalStage === 2),
      progress: calculateStageProgress(2, approvalStatus)
    }
  ];

  return (
    <div className="space-y-4">
      {stages.map((stage) => (
        <div key={stage.stage} className="border rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium flex items-center gap-2">
              Stage {stage.stage}: {stage.name}
              {(stage.status === 'in_progress' || stage.status === 'revision_requested') && (
                <Badge variant="outline" className="bg-blue-100 text-blue-800">
                  In Progress
                </Badge>
              )}
              {stage.status === 'completed' && (
                <Badge variant="outline" className="bg-green-100 text-green-800">
                  Completed
                </Badge>
              )}
              {stage.status === 'not_started' && (
                <Badge variant="outline" className="bg-gray-100 text-gray-800">
                  Not Started
                </Badge>
              )}
            </h4>
          </div>
          
          {stage.approvals.length > 0 ? (
            <div className="grid gap-2">
              {stage.approvals.map((approval: any) => (
                <div key={approval.id} className="flex items-center justify-between p-3 rounded text-sm bg-gray-50">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-gray-500" />
                    <span className="font-medium">{approval.department}</span>
                  </div>
                  <Badge variant={
                    approval.status === 'approved' ? 'default' :
                    approval.status === 'revision_requested' ? 'secondary' :
                    'outline'
                  }>
                    {approval.status === 'approved' ? 'Approved' :
                     approval.status === 'revision_requested' ? 'Revision Requested' :
                     'Pending'}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-500 text-sm">
              {stage.stage === 1 ? 'No approvals required for this stage' : 'Waiting for previous stage to complete'}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

// Helper functions
function getStageStatus(stageNumber: number, approvalState: any, approvalStatus: any): string {
  const stageApprovals = (approvalStatus.approvals || []).filter((a: any) => a.approvalStage === stageNumber);
  if (stageApprovals.length === 0) return 'not_started';
  
  const hasRevisions = stageApprovals.some((a: any) => a.status === 'revision_requested');
  const allApproved = stageApprovals.every((a: any) => a.status === 'approved');
  
  if (hasRevisions) return 'revision_requested';
  if (allApproved) return 'completed';
  
  return 'in_progress';
}

function calculateStageProgress(stageNumber: number, approvalStatus: any): number {
  const stageApprovals = (approvalStatus.approvals || []).filter((a: any) => a.approvalStage === stageNumber);
  if (stageApprovals.length === 0) return 0;
  
  const completed = stageApprovals.filter((a: any) => a.status === 'approved').length;
  return Math.round((completed / stageApprovals.length) * 100);
}

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
    <div className="space-y-6">

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
        <CardHeader className="pb-6">
          <div className="flex items-center gap-3">
            <div className="w-1 h-6 bg-[#3e0075] rounded-full"></div>
            <div className="flex-1">
              <CardTitle className="text-xl font-semibold text-slate-900">
                Financial Summary
              </CardTitle>
              <CardDescription className="text-slate-500">
                Revenue projections and growth analysis for this deal
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <FinancialSummaryTable 
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
            <ApprovalTrackerContent 
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