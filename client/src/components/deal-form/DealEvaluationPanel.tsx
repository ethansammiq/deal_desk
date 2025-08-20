import React, { useMemo } from "react";
import { CheckCircle2, AlertCircle, Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  determineRequiredApprover, 
  getApproverDetails, 
  standardDealCriteria,
  ApprovalRule
} from "@/lib/approval-matrix";
import { formatCurrency } from "@/lib/utils";

interface DealEvaluationPanelProps {
  dealValue: number;
  dealType: string;
  salesChannel: string;
  contractTerm: number;
  onChange?: (approverLevel: string, approvalInfo: ApprovalRule) => void;
}

interface CriteriaItem {
  label: string;
  value: string;
  meets: boolean;
  description?: string;
}

export function DealEvaluationPanel({
  dealValue,
  dealType = "grow",
  salesChannel = "independent_agency", 
  contractTerm,
  onChange
}: DealEvaluationPanelProps) {
  
  const evaluationData = useMemo(() => {
    // Determine if deal meets standard criteria
    const approverLevel = determineRequiredApprover(dealValue, dealType, salesChannel);
    const approver = getApproverDetails(approverLevel);
    const isStandardDeal = approverLevel === 'MD';
    
    // Create criteria checklist
    const criteria: CriteriaItem[] = [
      {
        label: "Deal Type",
        value: dealType?.charAt(0).toUpperCase() + dealType?.slice(1) || "Not specified",
        meets: dealType === standardDealCriteria.dealType,
        description: `Required: ${standardDealCriteria.dealType.charAt(0).toUpperCase() + standardDealCriteria.dealType.slice(1)}`
      },
      {
        label: "Sales Channel", 
        value: getSalesChannelDisplay(salesChannel),
        meets: standardDealCriteria.salesChannel.includes(salesChannel),
        description: `Required: ${standardDealCriteria.salesChannel.map(ch => getSalesChannelDisplay(ch)).join(" or ")}`
      },
      {
        label: "Annual Value",
        value: `${formatCurrency(dealValue)} ${dealValue <= standardDealCriteria.maxValue ? "(Under threshold)" : "(Over threshold)"}`,
        meets: dealValue <= standardDealCriteria.maxValue,
        description: `Required: Under ${formatCurrency(standardDealCriteria.maxValue)}`
      },
      {
        label: "Contract Term",
        value: `${contractTerm} months ${contractTerm === 12 ? "(Standard)" : contractTerm < 12 ? "(Short-term)" : "(Extended)"}`,
        meets: contractTerm === 12, // Assuming 12 months is standard
        description: "Standard term: 12 months"
      }
    ];

    return {
      isStandardDeal,
      approver,
      approverLevel,
      criteria,
      allCriteriaMet: criteria.every(c => c.meets)
    };
  }, [dealValue, dealType, salesChannel, contractTerm]);

  // Notify parent component if callback provided
  React.useEffect(() => {
    if (onChange) {
      onChange(evaluationData.approverLevel, evaluationData.approver);
    }
  }, [evaluationData.approverLevel, evaluationData.approver, onChange]);

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2">
          📊 Deal Assessment
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Standard Deal Criteria Checklist */}
        <div>
          <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
            Standard Deal Criteria:
          </h4>
          <div className="space-y-2">
            {evaluationData.criteria.map((criterion, index) => (
              <div key={index} className="flex items-center justify-between py-2">
                <div className="flex items-center gap-3">
                  {criterion.meets ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-amber-600" />
                  )}
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">
                      {criterion.label}: {criterion.value}
                    </span>
                    {criterion.description && (
                      <span className="text-xs text-muted-foreground">
                        {criterion.description}
                      </span>
                    )}
                  </div>
                </div>
                <Badge 
                  variant={criterion.meets ? "default" : "secondary"}
                  className={criterion.meets ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"}
                >
                  {criterion.meets ? "✓" : "!"}
                </Badge>
              </div>
            ))}
          </div>
        </div>

        {/* Assessment Result - Focused on criteria evaluation only */}
        <div className={`p-4 rounded-lg border ${evaluationData.isStandardDeal ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'}`}>
          <div className="flex items-center gap-2 mb-1">
            {evaluationData.isStandardDeal ? (
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            ) : (
              <AlertCircle className="h-5 w-5 text-amber-600" />
            )}
            <span className="font-medium text-sm">
              {evaluationData.isStandardDeal ? (
                "🎉 STANDARD DEAL - Meets all criteria"
              ) : (
                "⚠️ NON-STANDARD DEAL - Executive approval required"
              )}
            </span>
          </div>
          
          <div className="text-xs text-muted-foreground">
            {evaluationData.isStandardDeal ? (
              "All criteria met for streamlined processing"
            ) : (
              `${evaluationData.criteria.filter(c => !c.meets).length} criteria require Executive Committee review`
            )}
          </div>
        </div>

      </CardContent>
    </Card>
  );
}

// Helper function to format sales channel display names
function getSalesChannelDisplay(salesChannel: string): string {
  const channelMap: Record<string, string> = {
    'independent_agency': 'Independent Agency',
    'client_direct': 'Client Direct', 
    'network_agency': 'Network Agency',
    'holding_company': 'Holding Company'
  };
  
  return channelMap[salesChannel] || salesChannel.charAt(0).toUpperCase() + salesChannel.slice(1);
}