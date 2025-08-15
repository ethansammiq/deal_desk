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

  const getApprovalProcessDetails = (stage: string, department: ApprovalDepartment) => {
    const processMap = {
      incentive_review: {
        finance: [
          "• Review financial incentive structure and payment terms",
          "• Validate budget impact and cash flow implications", 
          "• Assess credit risk and payment feasibility",
          "• Ensure compliance with financial policies"
        ],
        product: [
          "• Evaluate product incentive offerings and discounts",
          "• Review feature access and product bundle proposals",
          "• Validate technical feasibility of product commitments",
          "• Assess impact on product roadmap and resources"
        ],
        creative: [
          "• Review marketing and creative incentive proposals",
          "• Validate brand exposure and co-marketing opportunities",
          "• Assess creative resource allocation and timeline",
          "• Ensure brand guidelines and compliance"
        ],
        analytics: [
          "• Review data access and analytics incentive proposals",
          "• Validate reporting tools and data sharing agreements",
          "• Assess technical requirements and data privacy",
          "• Ensure compliance with data governance policies"
        ]
      },
      margin_review: {
        trading: [
          "• Validate margin calculations and profit projections",
          "• Review trading desk capacity and execution feasibility",
          "• Assess market conditions and risk factors",
          "• Confirm pricing strategy alignment"
        ],
        finance: [
          "• Review overall profitability and ROI projections",
          "• Validate financial modeling and assumptions",
          "• Assess impact on quarterly/annual targets",
          "• Confirm budget allocation and resource requirements"
        ]
      },
      final_review: {
        finance: [
          "• Comprehensive deal structure and strategic alignment review",
          "• Final validation of all financial and risk components",
          "• Assessment of precedent-setting implications",
          "• Executive decision on deal approval or escalation"
        ]
      }
    };

    const stageProcesses = processMap[stage as keyof typeof processMap];
    if (!stageProcesses) return <div>Standard approval process</div>;
    
    const departmentProcess = stageProcesses[department as keyof typeof stageProcesses];
    if (!departmentProcess) return <div>Department-specific review process</div>;

    return (
      <div className="space-y-1">
        {departmentProcess.map((step, index) => (
          <div key={index} className="text-slate-600">{step}</div>
        ))}
      </div>
    );
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

        {/* Streamlined Approval Overview */}
        {!showDetails ? (
          /* Condensed View - Just the essentials */
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
        ) : (
          /* Detailed View - Full workflow breakdown */
          <div className="space-y-4">
            {pipelineStatus.stages.map((stage, stageIndex) => {
              const stageRequirements = approvalRequirements.filter(req => req.stage === stage.stage);
              
              return (
                <div key={stage.stage} className="border rounded-lg overflow-hidden">
                  {/* Stage Header */}
                  <div className="bg-slate-100 p-3 border-b">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {getStageIcon(stage.stage, stage.status)}
                        <div>
                          <div className="font-medium capitalize">
                            Stage {stageIndex + 1}: {stage.stage.replace('_', ' ')}
                          </div>
                          <div className="text-sm text-slate-600">
                            {stage.completedCount}/{stage.totalCount} reviewers • {stage.progress}% complete
                          </div>
                        </div>
                      </div>
                      <Badge className={getStatusColor(stage.status)}>
                        {stage.status.replace('_', ' ')}
                      </Badge>
                    </div>
                  </div>

                  {/* Stage Requirements */}
                  <div className="p-3 space-y-3">
                    {stageRequirements.map((req) => (
                      <div key={req.id} className="p-3 bg-white border rounded space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="font-medium text-sm">
                              {departmentConfig[req.department].name}
                            </div>
                            {getDepartmentBadge(req.department)}
                          </div>
                          <div className="text-xs text-slate-500">
                            {req.estimatedTime}
                          </div>
                        </div>

                        {/* What they review */}
                        <div className="text-xs text-slate-600">
                          <strong>Reviews:</strong> {departmentConfig[req.department].description}
                        </div>

                        {/* Key process points */}
                        <div className="bg-slate-50 p-2 rounded text-xs">
                          {getApprovalProcessDetails(req.stage, req.department)}
                        </div>

                        {/* Dependencies */}
                        {req.dependencies.length > 0 && (
                          <div className="text-xs text-amber-600 bg-amber-50 p-2 rounded">
                            ⏳ Waiting for {req.dependencies.length} prerequisite approval{req.dependencies.length > 1 ? 's' : ''}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}

            {/* Reviewer Actions Reference */}
            <div className="bg-blue-50 p-3 rounded border border-blue-200">
              <div className="font-medium text-blue-800 mb-2 text-sm">Available Reviewer Actions:</div>
              <div className="grid grid-cols-2 gap-2 text-xs text-blue-700">
                <div>✅ <strong>Approve</strong> - Move to next stage</div>
                <div>🔄 <strong>Request Revision</strong> - Send back with feedback</div>
                <div>❌ <strong>Reject</strong> - Decline with explanation</div>
                <div>💬 <strong>Add Comments</strong> - Provide insights</div>
              </div>
            </div>
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