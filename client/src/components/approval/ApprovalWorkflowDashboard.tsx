import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  CheckCircle, 
  Clock, 
  XCircle, 
  AlertTriangle, 
  Users, 
  FileText,
  ChevronRight,
  Timer
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ApprovalDashboardProps {
  dealId: number;
  dealName: string;
  dealValue: number;
  currentUser: {
    id: number;
    role: string;
    department?: string;
  };
}

export function ApprovalWorkflowDashboard({ 
  dealId, 
  dealName, 
  dealValue, 
  currentUser 
}: ApprovalDashboardProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedApproval, setSelectedApproval] = useState<number | null>(null);
  const [reviewComments, setReviewComments] = useState('');

  // Fetch approval status
  const { data: approvalStatus, isLoading } = useQuery({
    queryKey: [`/api/deals/${dealId}/approval-status`],
    enabled: !!dealId
  });

  // Fetch approval departments
  const { data: departments } = useQuery({
    queryKey: ['/api/approval-departments']
  });

  // Approve/reject mutation
  const approvalMutation = useMutation({
    mutationFn: async ({ approvalId, status, comments }: {
      approvalId: number;
      status: 'approved' | 'rejected' | 'revision_requested';
      comments: string;
    }) => {
      const response = await fetch(`/api/deals/${dealId}/approvals/${approvalId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          comments,
          reviewedBy: currentUser.id
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to update approval');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Approval Updated",
        description: "The approval status has been updated successfully."
      });
      queryClient.invalidateQueries({ queryKey: [`/api/deals/${dealId}/approval-status`] });
      setSelectedApproval(null);
      setReviewComments('');
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update approval status.",
        variant: "destructive"
      });
    }
  });

  const handleApprovalAction = (status: 'approved' | 'rejected' | 'revision_requested') => {
    if (!selectedApproval) return;
    
    approvalMutation.mutate({
      approvalId: selectedApproval,
      status,
      comments: reviewComments
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'revision_requested':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'revision_requested':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'normal':
        return 'bg-blue-100 text-blue-800';
      case 'low':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getDepartmentDisplayName = (departmentName: string) => {
    const dept = departments?.find((d: any) => d.departmentName === departmentName);
    return dept?.displayName || departmentName.charAt(0).toUpperCase() + departmentName.slice(1);
  };

  const canReviewApproval = (approval: any) => {
    // Check if user has permission to review this approval
    if (currentUser.role === 'admin') return true;
    if (currentUser.role === 'department_reviewer' && currentUser.department === approval.departmentName) return true;
    if (approval.requiredRole === currentUser.role) return true;
    return false;
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!approvalStatus || !approvalStatus.approvals.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Approval Workflow</CardTitle>
          <CardDescription>No approval workflow has been initiated for this deal.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600">
            The approval workflow will be automatically initiated when the deal is submitted for review.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Workflow Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Approval Workflow: {dealName}
          </CardTitle>
          <CardDescription>
            Deal Value: ${dealValue?.toLocaleString()} • Stage {approvalStatus.currentStage} of {Math.max(...approvalStatus.approvals.map((a: any) => a.approvalStage))}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Progress</span>
                <span>{approvalStatus.progressPercentage}%</span>
              </div>
              <Progress value={approvalStatus.progressPercentage} className="h-2" />
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <div className="font-medium text-gray-700">Total Approvals</div>
                <div className="text-lg font-semibold">{approvalStatus.approvals.length}</div>
              </div>
              <div>
                <div className="font-medium text-gray-700">Pending</div>
                <div className="text-lg font-semibold text-yellow-600">
                  {approvalStatus.pendingApprovals.length}
                </div>
              </div>
              <div>
                <div className="font-medium text-gray-700">Approved</div>
                <div className="text-lg font-semibold text-green-600">
                  {approvalStatus.approvals.filter((a: any) => a.status === 'approved').length}
                </div>
              </div>
              <div>
                <div className="font-medium text-gray-700">Current Stage</div>
                <div className="text-lg font-semibold text-blue-600">
                  {approvalStatus.currentStage}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stage-by-Stage View */}
      <Tabs defaultValue="stages" className="w-full">
        <TabsList>
          <TabsTrigger value="stages">By Stage</TabsTrigger>
          <TabsTrigger value="pending">Pending Reviews</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="stages" className="space-y-4">
          {Object.entries(approvalStatus.stageGroups).map(([stage, stageApprovals]: [string, any[]]) => (
            <Card key={stage}>
              <CardHeader>
                <CardTitle className="text-lg">
                  Stage {stage}: {
                    stage === '1' ? 'Incentive Review (Parallel)' :
                    stage === '2' ? 'Margin Review (Sequential)' :
                    'Final Executive Review'
                  }
                </CardTitle>
                <CardDescription>
                  {stage === '1' && 'Department reviewers evaluate incentive components in parallel'}
                  {stage === '2' && 'Trading team reviews overall margin impact'}
                  {stage === '3' && 'Executive approval for high-value deals'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3">
                  {stageApprovals.map((approval: any) => (
                    <div key={approval.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(approval.status)}
                        <div>
                          <div className="font-medium">
                            {getDepartmentDisplayName(approval.departmentName)}
                          </div>
                          <div className="text-sm text-gray-600">
                            Due: {new Date(approval.dueDate).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Badge className={getPriorityColor(approval.priority)}>
                          {approval.priority}
                        </Badge>
                        <Badge className={getStatusColor(approval.status)}>
                          {approval.status.replace('_', ' ')}
                        </Badge>
                        
                        {canReviewApproval(approval) && approval.status === 'pending' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedApproval(approval.id)}
                          >
                            Review
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="pending" className="space-y-4">
          {approvalStatus.pendingApprovals.map((approval: any) => (
            <Card key={approval.id}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{getDepartmentDisplayName(approval.departmentName)} Review</span>
                  <Badge className={getPriorityColor(approval.priority)}>
                    {approval.priority} priority
                  </Badge>
                </CardTitle>
                <CardDescription>
                  Stage {approval.approvalStage} • Due: {new Date(approval.dueDate).toLocaleDateString()}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    Required Role: {approval.requiredRole.replace('_', ' ')}
                  </div>
                  
                  {canReviewApproval(approval) && (
                    <Button
                      onClick={() => setSelectedApproval(approval.id)}
                      className="flex items-center gap-2"
                    >
                      <FileText className="h-4 w-4" />
                      Review Now
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          {approvalStatus.approvals
            .filter((a: any) => a.status !== 'pending')
            .map((approval: any) => (
              <Card key={approval.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(approval.status)}
                      <div>
                        <div className="font-medium">
                          {getDepartmentDisplayName(approval.departmentName)}
                        </div>
                        <div className="text-sm text-gray-600">
                          {approval.reviewedBy && `Reviewed by User ${approval.reviewedBy}`}
                          {approval.completedAt && ` • ${new Date(approval.completedAt).toLocaleDateString()}`}
                        </div>
                      </div>
                    </div>
                    <Badge className={getStatusColor(approval.status)}>
                      {approval.status.replace('_', ' ')}
                    </Badge>
                  </div>
                  
                  {approval.comments && (
                    <div className="mt-3 p-3 bg-gray-50 rounded text-sm">
                      <strong>Comments:</strong> {approval.comments}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
        </TabsContent>
      </Tabs>

      {/* Review Modal */}
      {selectedApproval && (
        <Card className="fixed inset-0 z-50 bg-white shadow-xl border">
          <CardHeader className="border-b">
            <CardTitle>Review Approval</CardTitle>
            <CardDescription>
              Provide your review and decision for this approval request.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div>
              <Label htmlFor="comments">Review Comments</Label>
              <Textarea
                id="comments"
                placeholder="Provide detailed feedback and reasoning for your decision..."
                value={reviewComments}
                onChange={(e) => setReviewComments(e.target.value)}
                className="min-h-[100px]"
              />
            </div>
            
            <div className="flex gap-3 pt-4">
              <Button
                onClick={() => handleApprovalAction('approved')}
                disabled={approvalMutation.isPending}
                className="bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Approve
              </Button>
              
              <Button
                onClick={() => handleApprovalAction('revision_requested')}
                disabled={approvalMutation.isPending}
                variant="outline"
                className="border-yellow-300 text-yellow-700 hover:bg-yellow-50"
              >
                <AlertTriangle className="h-4 w-4 mr-2" />
                Request Revision
              </Button>
              
              <Button
                onClick={() => handleApprovalAction('rejected')}
                disabled={approvalMutation.isPending}
                variant="outline"
                className="border-red-300 text-red-700 hover:bg-red-50"
              >
                <XCircle className="h-4 w-4 mr-2" />
                Reject
              </Button>
              
              <Button
                onClick={() => setSelectedApproval(null)}
                variant="ghost"
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}