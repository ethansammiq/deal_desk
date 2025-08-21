import { useParams, useLocation } from "wouter";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SectionLoading, ErrorState } from "@/components/ui/loading-states";
import { RevisionRequestModal } from "@/components/revision/RevisionRequestModal";
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  XCircle,
  ArrowRight,
  Users,
  Building2,
  MessageSquare, 
  FileText, 
  Send, 
  User, 
  History,
  ArrowLeft, 
  Calendar, 
  DollarSign, 
  MapPin, 
  Target, 
  FileCheck,
  Activity,
  CheckCircle2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { DealGenieAssessment } from "@/components/DealGenieAssessment";
import { FinancialTable, FinancialTableColGroup, FinancialTableHeader, FinancialTableBody, FinancialHeaderCell, FinancialDataCell, FinancialMetricLabel, GrowthIndicator } from "@/components/ui/financial-table";
import { useFinancialData } from "@/hooks/useFinancialData";
import { useDealCalculations } from "@/hooks/useDealCalculations";
import { formatCurrency } from "@/lib/utils";
import { RoleBasedActions } from "@/components/deal-details/RoleBasedActions";
import { ApprovalSummary } from "@/components/deal-details/ApprovalSummary";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { DealDetailsProvider, useDealDetails } from "@/providers/DealDetailsProvider";
import { useCurrentUser } from "@/hooks/useAuth";
import { useDealActions } from "@/hooks/useDealActions";
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

// Activity Feed types
interface UnifiedActivity {
  id: string;
  type: 'status_change' | 'comment' | 'created' | 'revised';
  title: string;
  description?: string;
  timestamp: string;
  actor?: string;
  actorRole?: string;
  content?: string;
  status?: string;
  previousStatus?: string;
  isSystemComment?: boolean;
}

// Content-only activity feed component
function ActivityFeedContent({ deal, dealId }: { deal: any; dealId: number }) {
  const [activeFilter, setActiveFilter] = useState<'all' | 'status' | 'comments'>('all');
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { data: user } = useCurrentUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const userRole = user?.role || 'seller';

  // Unified data fetching - consolidates status history and comments
  const { data: activities, isLoading, error } = useQuery({
    queryKey: ['/api/deals', dealId, 'unified-activity'],
    queryFn: async (): Promise<UnifiedActivity[]> => {
      const [statusResponse, commentsResponse] = await Promise.all([
        fetch(`/api/deals/${dealId}/history`),
        fetch(`/api/deals/${dealId}/comments`)
      ]);
      
      const statusHistory = statusResponse.ok ? await statusResponse.json() : [];
      const comments = commentsResponse.ok ? await commentsResponse.json() : [];
      
      // Consolidate all activities into unified format
      const unifiedActivities: UnifiedActivity[] = [
        // Deal creation event
        {
          id: `created-${deal.id}`,
          type: 'created',
          title: 'Deal Created',
          description: `Deal ${deal.dealName} was created`,
          timestamp: deal.createdAt || new Date().toISOString(),
          actor: deal.email || 'System'
        },
        // Status changes
        ...statusHistory.map((entry: any) => ({
          id: `status-${entry.id}`,
          type: 'status_change' as const,
          title: `Status changed to ${getStatusLabel(entry.status)}`,
          description: entry.comments,
          timestamp: entry.createdAt,
          actor: entry.changedBy,
          status: entry.status,
          previousStatus: entry.previousStatus
        })),
        // Comments
        ...comments.map((comment: any) => ({
          id: `comment-${comment.id}`,
          type: 'comment' as const,
          title: comment.isSystemComment ? 'System Update' : 'Comment Added',
          content: comment.content,
          timestamp: comment.createdAt,
          actor: comment.actor,
          actorRole: comment.actorRole,
          isSystemComment: comment.isSystemComment
        }))
      ];
      
      // Sort by timestamp (newest first)
      return unifiedActivities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    },
    enabled: !!dealId,
    refetchInterval: 30000
  });

  // Filter activities based on active filter
  const filteredActivities = activities?.filter(activity => {
    switch (activeFilter) {
      case 'status':
        return activity.type === 'status_change' || activity.type === 'created' || activity.type === 'revised';
      case 'comments':
        return activity.type === 'comment';
      default:
        return true;
    }
  }) || [];

  // Helper functions
  const getActivityIcon = (activity: UnifiedActivity) => {
    switch (activity.type) {
      case 'status_change':
        return <ArrowRight className="h-4 w-4 text-blue-600" />;
      case 'comment':
        return activity.isSystemComment ? 
          <CheckCircle2 className="h-4 w-4 text-green-600" /> : 
          <MessageSquare className="h-4 w-4 text-purple-600" />;
      case 'revised':
        return <AlertTriangle className="h-4 w-4 text-orange-600" />;
      default:
        return <FileText className="h-4 w-4 text-gray-600" />;
    }
  };

  const getRoleColor = (role: string) => {
    const colors: Record<string, string> = {
      seller: 'bg-blue-100 text-blue-800', approver: 'bg-green-100 text-green-800',
      legal: 'bg-purple-100 text-purple-800', admin: 'bg-red-100 text-red-800',
      department_reviewer: 'bg-yellow-100 text-yellow-800'
    };
    return colors[role] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-4">
      {/* Filter Tabs */}
      <div className="flex gap-2">
        {(['all', 'status', 'comments'] as const).map((filter) => (
          <Button
            key={filter}
            variant={activeFilter === filter ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveFilter(filter)}
            className="capitalize"
          >
            {filter === 'all' ? 'All Activity' : filter}
          </Button>
        ))}
        {activities && (
          <Badge variant="outline" className="ml-auto">
            {filteredActivities.length} activities
          </Badge>
        )}
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="text-center py-8 text-sm text-slate-500">
          <Activity className="h-8 w-8 mx-auto mb-2 opacity-50 animate-spin" />
          Loading activity feed...
        </div>
      )}
      
      {/* Error State */}
      {error && (
        <div className="text-center py-8 text-sm text-red-500">
          <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
          Failed to load activity feed
        </div>
      )}
      
      {/* Empty State */}
      {filteredActivities.length === 0 && !isLoading && !error && (
        <div className="text-center py-8 text-sm text-slate-500">
          <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
          No activities found
        </div>
      )}
      
      {/* Activity Timeline */}
      {filteredActivities.length > 0 && (
        <div className="space-y-4">
          {filteredActivities.map((activity, index) => (
            <div key={activity.id} className="flex gap-3 pb-4 border-b border-slate-100 last:border-b-0 last:pb-0">
              {/* Timeline indicator */}
              <div className="flex flex-col items-center">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-50 border border-slate-200">
                  {getActivityIcon(activity)}
                </div>
                {index < filteredActivities.length - 1 && (
                  <div className="w-px h-8 bg-slate-200 mt-2" />
                )}
              </div>
              
              {/* Activity content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h4 className="font-medium text-slate-900 text-sm">{activity.title}</h4>
                    {activity.description && (
                      <p className="text-slate-600 text-sm mt-1">{activity.description}</p>
                    )}
                    {activity.content && (
                      <div className="mt-2 p-3 bg-slate-50 rounded-lg border text-sm">
                        {activity.content}
                      </div>
                    )}
                    
                    {/* Actor information */}
                    <div className="flex items-center gap-2 mt-2">
                      <User className="h-3 w-3 text-slate-400" />
                      <span className="text-xs text-slate-500">{activity.actor}</span>
                      {activity.actorRole && (
                        <Badge variant="outline" className={`text-xs ${getRoleColor(activity.actorRole)}`}>
                          {activity.actorRole.replace('_', ' ')}
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  {/* Timestamp */}
                  <div className="text-xs text-slate-400 whitespace-nowrap">
                    {activity.timestamp ? format(new Date(activity.timestamp), 'MMM d, yyyy HH:mm') : 'Date unknown'}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Comment Section */}
      <div className="pt-4 border-t border-slate-200">
        <div className="flex items-start gap-3">
          <MessageSquare className="h-5 w-5 text-slate-400 mt-1" />
          <div className="flex-1 space-y-3">
            <h4 className="font-medium text-sm">Add Comment</h4>
            <Textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment to this deal..."
              className="min-h-[80px] resize-none"
            />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <User className="h-3 w-3" />
                <span>Commenting as {user?.email || 'seller@company.com'}</span>
              </div>
              <Button 
                size="sm" 
                disabled={!newComment.trim() || isSubmitting}
                className="gap-1"
              >
                <Send className="h-3 w-3" />
                Add Comment
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper function for status labels
function getStatusLabel(status: string): string {
  const statusLabels: Record<string, string> = {
    'draft': 'Draft',
    'submitted': 'Submitted',
    'under_review': 'Under Review',
    'approved': 'Approved',
    'revision_requested': 'Revision Requested',
    'contract_sent': 'Contract Sent',
    'closed_won': 'Closed Won',
    'closed_lost': 'Closed Lost'
  };
  return statusLabels[status] || status;
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
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-2xl font-semibold text-slate-900 mb-2">
                {deal.dealName}
              </h1>
              <p className="text-sm text-slate-500">
                #{deal.referenceNumber}
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

          {/* Two-column layout for deal information */}
          <div className="grid grid-cols-2 gap-8 mb-6">
            {/* Left Column */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-slate-400" />
                <span className="text-sm font-medium text-slate-700">Client:</span>
                <span className="text-sm text-slate-900">{deal.advertiserName || deal.agencyName || deal.dealName.split(' ')[0]}</span>
              </div>
              
              {deal.salesChannel && (
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-slate-400" />
                  <span className="text-sm font-medium text-slate-700">Sales Channel:</span>
                  <span className="text-sm text-slate-900 capitalize">{deal.salesChannel.replace('_', ' ')}</span>
                </div>
              )}
              
              {deal.dealStructure && (
                <div className="flex items-center gap-2">
                  <FileCheck className="h-4 w-4 text-slate-400" />
                  <span className="text-sm font-medium text-slate-700">Deal Structure:</span>
                  <span className="text-sm text-slate-900 capitalize">{deal.dealStructure.replace('_', ' ')}</span>
                </div>
              )}
              
              {deal.contractTermMonths && (
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-slate-400" />
                  <span className="text-sm font-medium text-slate-700">Contract Term:</span>
                  <span className="text-sm text-slate-900">{deal.contractTermMonths} month{Number(deal.contractTermMonths) !== 1 ? 's' : ''}</span>
                </div>
              )}
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              {deal.region && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-slate-400" />
                  <span className="text-sm font-medium text-slate-700">Region:</span>
                  <span className="text-sm text-slate-900 capitalize">{deal.region}</span>
                </div>
              )}
              
              {deal.dealType && (
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-slate-400" />
                  <span className="text-sm font-medium text-slate-700">Deal Type:</span>
                  <span className="text-sm text-slate-900 capitalize">{deal.dealType}</span>
                </div>
              )}

              {deal.termStartDate && deal.termEndDate && (
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-slate-400" />
                  <span className="text-sm font-medium text-slate-700">Timeline:</span>
                  <span className="text-sm text-slate-900">
                    {format(new Date(deal.termStartDate), 'MMM dd, yyyy')} - {format(new Date(deal.termEndDate), 'MMM dd, yyyy')}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Business Summary Section */}
          {deal.businessSummary && deal.businessSummary.trim() && (
            <div className="mt-12 pt-6 border-t border-slate-200">
              <h3 className="text-sm font-medium text-slate-700 mb-2">Business Summary</h3>
              <p className="text-sm text-slate-600 leading-relaxed">{deal.businessSummary}</p>
            </div>
          )}
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
              <ActivityFeedContent deal={deal} dealId={deal.id} />
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