import React, { useState, useEffect } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Clock, AlertCircle, Users, Mail, ChevronDown, ChevronUp } from "lucide-react";
import {
  generateApprovalRequirements,
  calculateApprovalPipelineStatus,
  getFollowUpRecommendations,
  departmentConfig,
  type ApprovalRequirement,
  type ApprovalPipelineStatus,
  type ApprovalDepartment
} from "@/lib/enhanced-approval-matrix";
import type { DealTier } from "@/hooks/useDealTiers";

interface SelectedIncentive {
  id: string;
  type: string;
  value: number;
  option?: string;
  tierIds?: number[];
  notes?: string;
}

interface EnhancedApprovalAlertProps {
  totalValue: number;
  contractTerm: number;
  dealType: string;
  salesChannel: string;
  dealTiers: DealTier[];
  selectedIncentives: SelectedIncentive[];
}

export function EnhancedApprovalAlert({
  totalValue,
  contractTerm,
  dealType,
  salesChannel,
  dealTiers,
  selectedIncentives
}: EnhancedApprovalAlertProps) {
  const [approvalRequirements, setApprovalRequirements] = useState<ApprovalRequirement[]>([]);
  const [pipelineStatus, setPipelineStatus] = useState<ApprovalPipelineStatus | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [followUpRecommendations, setFollowUpRecommendations] = useState<string[]>([]);

  useEffect(() => {
    if (totalValue > 0) {
      // Generate approval requirements for this deal
      const requirements = generateApprovalRequirements(
        0, // Deal ID placeholder
        totalValue,
        dealType,
        salesChannel,
        dealTiers,
        selectedIncentives
      );
      
      setApprovalRequirements(requirements);
      
      // Calculate pipeline status
      const status = calculateApprovalPipelineStatus(requirements);
      setPipelineStatus(status);
      
      // Get follow-up recommendations
      const recommendations = getFollowUpRecommendations(status);
      setFollowUpRecommendations(recommendations);
    }
  }, [totalValue, dealType, salesChannel, dealTiers, selectedIncentives]);

  if (!pipelineStatus || approvalRequirements.length === 0) {
    return null;
  }

  const getStageIcon = (stage: string, status: string) => {
    if (status === 'approved') {
      return <CheckCircle2 className="h-4 w-4 text-green-600" />;
    } else if (status === 'revision_requested') {
      return <AlertCircle className="h-4 w-4 text-red-600" />;
    } else {
      return <Clock className="h-4 w-4 text-yellow-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'revision_requested': return 'bg-red-100 text-red-800';
      default: return 'bg-yellow-100 text-yellow-800';
    }
  };

  const getDepartmentBadge = (dept: ApprovalDepartment) => {
    const config = departmentConfig[dept];
    return (
      <Badge variant="outline" className="text-xs">
        {config.name}
      </Badge>
    );
  };

  return (
    <Card className="border-l-4 border-l-blue-500">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Users className="h-5 w-5" />
            Approval Pipeline
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowDetails(!showDetails)}
            className="text-sm"
          >
            {showDetails ? (
              <>
                Hide Details <ChevronUp className="h-4 w-4 ml-1" />
              </>
            ) : (
              <>
                Show Details <ChevronDown className="h-4 w-4 ml-1" />
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Pipeline Status Overview */}
        <Alert className="border-blue-200 bg-blue-50">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="font-medium mb-2">
              This deal requires approval from {approvalRequirements.length} reviewers across multiple departments.
            </div>
            <div className="text-sm text-slate-600">
              Current Status: <Badge className={getStatusColor(pipelineStatus.overallStatus)}>
                {pipelineStatus.overallStatus.replace('_', ' ').toUpperCase()}
              </Badge>
            </div>
          </AlertDescription>
        </Alert>

        {/* Stage Progress */}
        <div className="space-y-3">
          {pipelineStatus.stages.map((stage, index) => (
            <div key={stage.stage} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
              {getStageIcon(stage.stage, stage.status)}
              <div className="flex-1">
                <div className="font-medium capitalize">
                  {stage.stage.replace('_', ' ')} ({stage.completedCount}/{stage.totalCount})
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2 mt-1">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${stage.progress}%` }}
                  />
                </div>
              </div>
              <Badge className={getStatusColor(stage.status)}>
                {stage.status.replace('_', ' ')}
              </Badge>
            </div>
          ))}
        </div>

        {/* Detailed Approval Requirements */}
        {showDetails && (
          <div className="space-y-3 mt-4 pt-4 border-t">
            <h4 className="font-medium text-sm text-slate-700">Detailed Approval Requirements</h4>
            
            {approvalRequirements.map((req) => (
              <div key={req.id} className="flex items-center justify-between p-3 bg-white border rounded-lg">
                <div className="flex items-center gap-3">
                  {getStageIcon(req.stage, req.status)}
                  <div>
                    <div className="font-medium text-sm">
                      {departmentConfig[req.department].name}
                    </div>
                    <div className="text-xs text-slate-500">
                      {departmentConfig[req.department].description}
                    </div>
                    <div className="text-xs text-slate-400 mt-1">
                      Est. time: {req.estimatedTime}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {getDepartmentBadge(req.department)}
                  <Badge className={getStatusColor(req.status)}>
                    {req.status.replace('_', ' ')}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Follow-up Actions */}
        {followUpRecommendations.length > 0 && (
          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="font-medium text-amber-800 mb-2 flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Recommended Follow-up Actions
            </div>
            <ul className="space-y-1 text-sm text-amber-700">
              {followUpRecommendations.map((recommendation, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-amber-500 mt-1">•</span>
                  {recommendation}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Key Information */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium text-slate-600">Deal Value:</span>
            <div className="text-lg font-semibold">
              {new Intl.NumberFormat('en-US', { 
                style: 'currency', 
                currency: 'USD',
                minimumFractionDigits: 0
              }).format(totalValue)}
            </div>
          </div>
          <div>
            <span className="font-medium text-slate-600">Approval Level:</span>
            <div className="text-lg font-semibold">
              {totalValue >= 500000 ? 'Executive Committee' : 'Managing Director'}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}