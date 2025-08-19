import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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

interface ApprovalTrackerProps {
  dealId: number;
  dealName: string;
  className?: string;
}

interface ApprovalStageData {
  stage: number;
  name: string;
  description: string;
  status: 'not_started' | 'in_progress' | 'completed' | 'blocked' | 'revision_requested';
  approvals: Array<{
    id: number;
    department: string;
    departmentDisplayName: string;
    status: 'pending' | 'approved' | 'revision_requested' | 'rejected';
    reviewerNotes?: string;
    completedAt?: string;
    priority: 'normal' | 'high' | 'urgent';
  }>;
  completedAt?: string;
  progress: number;
}

export function ApprovalTracker({ dealId, dealName, className }: ApprovalTrackerProps) {
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
    refetchInterval: 5000 // Refresh every 5 seconds to catch new approvals
  });

  const { data: departments } = useQuery<any[]>({
    queryKey: ['/api/approval-departments'],
    enabled: !!dealId
  });

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Approval Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-12 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!approvalState || !approvalStatus || !departments) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Approval Progress
          </CardTitle>
          <CardDescription>
            No approval workflow initiated yet
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600">
            The approval workflow will begin when this deal is submitted for review.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Create department lookup map
  const departmentMap = departments.reduce((acc: any, dept: any) => {
    acc[dept.departmentName] = dept.displayName;
    return acc;
  }, {});

  // Process approval data into stages
  const stages: ApprovalStageData[] = [
    {
      stage: 1,
      name: 'Department Review',
      description: 'Parallel review by relevant departments',
      status: getStageStatus(1, approvalState, approvalStatus),
      approvals: (approvalStatus.approvals || []).filter((a: any) => a.approvalStage === 1).map((a: any) => ({
        ...a,
        departmentDisplayName: departmentMap[a.department] || a.department
      })),
      progress: calculateStageProgress(1, approvalStatus),
      completedAt: getStageCompletedAt(1, approvalStatus)
    },
    {
      stage: 2,
      name: 'Business Approval',
      description: 'Executive approval for final sign-off',
      status: getStageStatus(2, approvalState, approvalStatus),
      approvals: (approvalStatus.approvals || []).filter((a: any) => a.approvalStage === 2).map((a: any) => ({
        ...a,
        departmentDisplayName: departmentMap[a.department] || a.department
      })),
      progress: calculateStageProgress(2, approvalStatus),
      completedAt: getStageCompletedAt(2, approvalStatus)
    }
  ];

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Approval Progress: {dealName}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Simplified 2-Stage Structure */}
        {stages.map((stage) => (
          <div key={stage.stage} className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium flex items-center gap-2">
                Stage {stage.stage}: {stage.name}
                {stage.status === 'in_progress' && (
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
                {stage.approvals.map((approval) => (
                  <div key={approval.id} className="flex items-center justify-between p-3 bg-gray-50 rounded text-sm">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-gray-500" />
                      <span className="font-medium">{approval.departmentDisplayName}</span>
                    </div>
                    <Badge 
                      variant="outline" 
                      className={cn(
                        "text-xs",
                        approval.status === 'approved' && 'bg-green-100 text-green-800',
                        approval.status === 'pending' && 'bg-yellow-100 text-yellow-800',
                        approval.status === 'revision_requested' && 'bg-orange-100 text-orange-800',
                        approval.status === 'rejected' && 'bg-red-100 text-red-800'
                      )}
                    >
                      {approval.status.replace('_', ' ')}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">
                {stage.status === 'not_started' ? 'Waiting for previous stage to complete' : 'No approvals required for this stage'}
              </p>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

// Helper functions
function getStageStatus(
  stageNumber: number, 
  approvalState: any, 
  approvalStatus: any
): ApprovalStageData['status'] {
  const stageApprovals = (approvalStatus.approvals || []).filter((a: any) => a.approvalStage === stageNumber);
  
  if (stageApprovals.length === 0) {
    return stageNumber === 1 ? 'in_progress' : 'not_started';
  }

  const hasRevisions = stageApprovals.some((a: any) => a.status === 'revision_requested');
  const allApproved = stageApprovals.every((a: any) => a.status === 'approved');
  const anyRejected = stageApprovals.some((a: any) => a.status === 'rejected');
  
  if (anyRejected) return 'blocked';
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

function getStageCompletedAt(stageNumber: number, approvalStatus: any): string | undefined {
  const stageApprovals = (approvalStatus.approvals || []).filter((a: any) => a.approvalStage === stageNumber);
  if (stageApprovals.length === 0) return undefined;
  
  const allApproved = stageApprovals.every((a: any) => a.status === 'approved');
  if (!allApproved) return undefined;
  
  const completedDates = stageApprovals
    .filter((a: any) => a.completedAt)
    .map((a: any) => new Date(a.completedAt))
    .sort((a: Date, b: Date) => b.getTime() - a.getTime());
    
  return completedDates[0]?.toISOString();
}

function getStageIcon(status: ApprovalStageData['status']) {
  switch (status) {
    case 'completed':
      return <CheckCircle className="h-6 w-6 text-white" />;
    case 'revision_requested':
      return <AlertTriangle className="h-6 w-6 text-white" />;
    case 'blocked':
      return <XCircle className="h-6 w-6 text-white" />;
    case 'in_progress':
      return <Clock className="h-6 w-6 text-white" />;
    default:
      return <Clock className="h-6 w-6 text-gray-400" />;
  }
}

function getStageCircleClasses(status: ApprovalStageData['status']): string {
  switch (status) {
    case 'completed':
      return 'bg-green-500 border-green-500';
    case 'revision_requested':
      return 'bg-orange-500 border-orange-500';
    case 'blocked':
      return 'bg-red-500 border-red-500';
    case 'in_progress':
      return 'bg-blue-500 border-blue-500';
    default:
      return 'bg-gray-200 border-gray-300';
  }
}

function getStageStatusColor(status: ApprovalStageData['status']): string {
  switch (status) {
    case 'completed':
      return 'bg-green-100 text-green-800';
    case 'revision_requested':
      return 'bg-orange-100 text-orange-800';
    case 'blocked':
      return 'bg-red-100 text-red-800';
    case 'in_progress':
      return 'bg-blue-100 text-blue-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

function getStageStatusLabel(status: ApprovalStageData['status']): string {
  switch (status) {
    case 'completed':
      return 'Completed';
    case 'revision_requested':
      return 'Revision Requested';
    case 'blocked':
      return 'Blocked';
    case 'in_progress':
      return 'In Progress';
    default:
      return 'Not Started';
  }
}

function getOverallStatusColor(status: string): string {
  switch (status) {
    case 'fully_approved':
      return 'bg-green-100 text-green-800';
    case 'pending_business_approval':
      return 'bg-blue-100 text-blue-800';
    case 'revision_requested':
      return 'bg-orange-100 text-orange-800';
    default:
      return 'bg-yellow-100 text-yellow-800';
  }
}

function getOverallStatusLabel(status: string): string {
  switch (status) {
    case 'fully_approved':
      return 'Fully Approved';
    case 'pending_business_approval':
      return 'Pending Business Approval';
    case 'pending_department_review':
      return 'Department Review';
    case 'revision_requested':
      return 'Revision Requested';
    default:
      return 'Under Review';
  }
}