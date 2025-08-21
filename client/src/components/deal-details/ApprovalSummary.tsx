import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, Clock, AlertTriangle, Users, ChevronRight } from "lucide-react";

interface ApprovalSummaryProps {
  dealId: number;
  onViewDetails?: () => void;
  compact?: boolean; // New prop to enable compact mode
}

export function ApprovalSummary({ dealId, onViewDetails, compact = false }: ApprovalSummaryProps) {
  // Unified data fetching - consolidates both API calls
  const { data: consolidatedApprovalData, isLoading, error } = useQuery({
    queryKey: ['/api/deals', dealId, 'consolidated-approvals'],
    queryFn: async () => {
      const [statusResponse, stateResponse] = await Promise.all([
        fetch(`/api/deals/${dealId}/approval-status`),
        fetch(`/api/deals/${dealId}/approval-state`)
      ]);
      
      const approvalStatus = statusResponse.ok ? await statusResponse.json() : { approvals: [] };
      const approvalState = stateResponse.ok ? await stateResponse.json() : {};
      
      return { approvalStatus, approvalState };
    },
    refetchInterval: 30000,
    enabled: !!dealId
  });

  // Loading state
  if (isLoading) {
    return (
      <Card className={compact ? "h-32" : ""}>
        <CardContent className="p-4 flex items-center justify-center">
          <Clock className="h-4 w-4 animate-spin mr-2" />
          <span className="text-sm text-gray-500">Loading approvals...</span>
        </CardContent>
      </Card>
    );
  }

  // Error or no data state
  if (error || !consolidatedApprovalData?.approvalStatus?.approvals) {
    return (
      <Card className={compact ? "h-32" : ""}>
        <CardContent className="p-4 text-center text-gray-500">
          <Users className="h-6 w-6 mx-auto mb-2 opacity-50" />
          <div className="text-sm">No approval information available</div>
        </CardContent>
      </Card>
    );
  }

  const approvals = consolidatedApprovalData.approvalStatus.approvals;
  const totalApprovals = approvals.length;
  const approvedCount = approvals.filter((a: any) => a.status === 'approved').length;
  const pendingCount = approvals.filter((a: any) => a.status === 'pending').length;
  const revisionCount = approvals.filter((a: any) => a.status === 'revision_requested').length;

  // Enhanced bottleneck calculation
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

  const getStatusIndicator = (count: number, total: number, type: 'approved' | 'pending' | 'revision') => {
    const colors = {
      approved: 'text-green-600',
      pending: 'text-yellow-600', 
      revision: 'text-red-600'
    };
    return count > 0 ? `${count}` : '0';
  };

  // Compact mode - streamlined view
  if (compact) {
    return (
      <Card className="h-32">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-gray-600" />
              <span className="text-sm font-medium">Approvals</span>
            </div>
            {bottlenecks.length > 0 && (
              <Badge variant="destructive" className="text-xs px-2 py-0.5">
                {bottlenecks.length} stuck
              </Badge>
            )}
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="text-xl font-bold text-green-600">{approvedCount}</div>
              <div className="text-xl font-bold text-yellow-600">{pendingCount}</div>
              {revisionCount > 0 && (
                <div className="text-xl font-bold text-red-600">{revisionCount}</div>
              )}
            </div>
            
            <div className="text-right">
              <div className="text-sm font-medium">{getProgressPercentage()}%</div>
              <div className="text-xs text-gray-500">complete</div>
            </div>
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-1.5">
            <div 
              className="bg-green-500 h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${getProgressPercentage()}%` }}
            />
          </div>
        </CardContent>
      </Card>
    );
  }

  // Full mode - enhanced original view
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
                  className={`text-xs ${
                    approval.status === 'approved' ? 'bg-green-500 text-white border-0' :
                    approval.status === 'pending' ? 'bg-yellow-500 text-white border-0' :
                    'bg-red-500 text-white border-0'
                  }`}
                >
                  {approval.status.replace('_', ' ')}
                </Badge>
              </div>
            ))}
          </div>
        </div>

        {/* View Details Button */}
        {onViewDetails && (
          <div className="pt-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onViewDetails}
              className="w-full flex items-center gap-1"
            >
              View Full Approval Details
              <ChevronRight className="h-3 w-3" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}