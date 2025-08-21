import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, Clock, AlertTriangle, Users } from "lucide-react";

interface ApprovalSummaryProps {
  dealId: number;
  onViewDetails?: () => void;
}

export function ApprovalSummary({ dealId, onViewDetails }: ApprovalSummaryProps) {
  const { data: approvalStatus } = useQuery({
    queryKey: ['/api/deals', dealId, 'approval-status'],
    queryFn: async () => {
      const response = await fetch(`/api/deals/${dealId}/approval-status`);
      if (!response.ok) throw new Error('Failed to fetch approval status');
      return response.json();
    },
    refetchInterval: 30000,
    enabled: !!dealId
  });

  const { data: approvalState } = useQuery({
    queryKey: ['/api/deals', dealId, 'approval-state'],
    refetchInterval: 30000,
    enabled: !!dealId
  });

  if (!approvalStatus?.approvals) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-gray-500">
          No approval information available
        </CardContent>
      </Card>
    );
  }

  const approvals = approvalStatus.approvals;
  const totalApprovals = approvals.length;
  const approvedCount = approvals.filter((a: any) => a.status === 'approved').length;
  const pendingCount = approvals.filter((a: any) => a.status === 'pending').length;
  const revisionCount = approvals.filter((a: any) => a.status === 'revision_requested').length;

  // Calculate bottlenecks (pending > 1 day)
  const now = new Date();
  const bottlenecks = approvals
    .filter((approval: any) => approval.status === 'pending')
    .map((approval: any) => {
      const createdDate = new Date(approval.createdAt || '2025-01-18');
      const daysPending = Math.floor((now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
      return { ...approval, daysPending, isBottleneck: daysPending > 1 };
    })
    .filter((approval: any) => approval.isBottleneck);

  const getProgressPercentage = () => {
    if (totalApprovals === 0) return 0;
    return Math.round((approvedCount / totalApprovals) * 100);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-500';
      case 'pending': return 'bg-yellow-500';
      case 'revision_requested': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Approval Progress
          </CardTitle>
          {bottlenecks.length > 0 && (
            <Badge variant="destructive" className="flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              {bottlenecks.length} Bottleneck{bottlenecks.length > 1 ? 's' : ''}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress Overview */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Overall Progress</span>
            <span className="font-medium">{approvedCount}/{totalApprovals} Approved</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-green-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${getProgressPercentage()}%` }}
            />
          </div>
        </div>

        {/* Status Summary */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="p-2 bg-green-50 rounded-lg">
            <div className="flex items-center justify-center gap-1 mb-1">
              <CheckCircle2 className="h-3 w-3 text-green-600" />
              <span className="text-xs font-medium text-green-800">Approved</span>
            </div>
            <div className="text-lg font-bold text-green-700">{approvedCount}</div>
          </div>
          
          <div className="p-2 bg-yellow-50 rounded-lg">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Clock className="h-3 w-3 text-yellow-600" />
              <span className="text-xs font-medium text-yellow-800">Pending</span>
            </div>
            <div className="text-lg font-bold text-yellow-700">{pendingCount}</div>
          </div>
          
          {revisionCount > 0 && (
            <div className="p-2 bg-red-50 rounded-lg">
              <div className="flex items-center justify-center gap-1 mb-1">
                <AlertTriangle className="h-3 w-3 text-red-600" />
                <span className="text-xs font-medium text-red-800">Revision</span>
              </div>
              <div className="text-lg font-bold text-red-700">{revisionCount}</div>
            </div>
          )}
        </div>

        {/* Quick Department Status */}
        <div className="space-y-2">
          <div className="text-sm font-medium text-gray-700">Department Status</div>
          <div className="space-y-1">
            {approvals.slice(0, 3).map((approval: any, index: number) => (
              <div key={index} className="flex items-center justify-between text-sm">
                <span className="capitalize">{approval.department} Team</span>
                <Badge 
                  variant="outline" 
                  className={`text-xs ${getStatusColor(approval.status)} text-white border-0`}
                >
                  {approval.status.replace('_', ' ')}
                </Badge>
              </div>
            ))}
          </div>
        </div>

        {/* View Details Button */}
        <div className="pt-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onViewDetails}
            className="w-full"
          >
            View Full Approval Details
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}