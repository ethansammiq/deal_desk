import React, { useEffect, useState } from "react";
import { AlertCircle, Clock, CheckCircle2, UserCog, Info } from "lucide-react";
import { 
  determineRequiredApprover, 
  getApproverDetails, 
  ApprovalRule
} from "@/lib/approval-matrix";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

interface ApprovalAlertProps {
  totalValue: number;
  contractTerm: number;
  dealType?: string;
  salesChannel?: string;
  onChange?: (approverLevel: string, approvalInfo: ApprovalRule) => void;
}

export function ApprovalAlert({
  totalValue,
  contractTerm,
  dealType = "grow",
  salesChannel = "independent_agency",
  onChange
}: ApprovalAlertProps) {
  const [alertInfo, setAlertInfo] = useState<{
    message: string;
    level: 'info' | 'warning' | 'alert';
    approver: ApprovalRule;
  } | null>(null);

  useEffect(() => {
    // Only calculate and show alert if we have valid deal parameters
    if (totalValue > 0) {
      // Use the simplified approval matrix logic
      const approverLevel = determineRequiredApprover(
        totalValue,
        dealType,
        salesChannel
      );
      
      // Get approver details
      const approver = getApproverDetails(approverLevel);
      
      // Set alert level and message
      let level: 'info' | 'warning' | 'alert';
      let message: string;
      
      if (approverLevel === 'MD') {
        level = 'info';
        message = "This deal meets standard criteria and requires MD approval.";
      } else {
        level = 'warning';
        message = "This deal requires Executive approval due to its value, terms, or special conditions.";
      }
      
      setAlertInfo({
        message,
        level,
        approver
      });
      
      // Notify parent component about the approver level if callback provided
      if (onChange) {
        onChange(approverLevel, approver);
      }
    } else {
      setAlertInfo(null);
    }
  }, [
    totalValue, 
    contractTerm, 
    dealType,
    salesChannel,
    onChange
  ]);

  if (!alertInfo) {
    return null;
  }

  return (
    <Alert 
      variant={
        alertInfo.level === 'info' 
          ? 'default' 
          : alertInfo.level === 'warning' 
            ? 'warning' 
            : 'destructive'
      }
      className="mb-4"
    >
      <div className="flex items-start gap-4">
        {alertInfo.level === 'info' && <CheckCircle2 className="h-5 w-5 mt-0.5" />}
        {alertInfo.level === 'warning' && <Clock className="h-5 w-5 mt-0.5" />}
        {alertInfo.level === 'alert' && <AlertCircle className="h-5 w-5 mt-0.5" />}
        
        <div className="w-full">
          <div className="flex justify-between items-center">
            <AlertTitle className="flex items-center gap-2 mb-1">
              <span>Approval Required: {alertInfo.approver.title}</span>
              <Badge 
                variant={alertInfo.approver.level === 'MD' ? 'default' : 'secondary'}
                className={alertInfo.approver.level === 'MD' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}
              >
                {alertInfo.approver.level}
              </Badge>
            </AlertTitle>
          </div>
          
          <AlertDescription className="text-sm">
            {alertInfo.message}
          </AlertDescription>
          
          <div className="mt-3 flex justify-between items-center">
            <div className="flex items-center text-sm gap-2">
              <UserCog className="h-4 w-4" /> 
              <span>Approver: {alertInfo.approver.title}</span>
            </div>
            <div className="text-xs text-slate-500">
              Est. approval time: {alertInfo.approver.estimatedTime}
            </div>
          </div>
        </div>
      </div>
    </Alert>
  );
}

export function ApprovalHelpText({ level }: { level: string }) {
  const getHelpText = () => {
    switch (level) {
      case 'MD':
        return "Managing Director approval is allowed only for standard deals that meet all predefined criteria including deal type, sales channel, projected spend, and performance metrics.";
      case 'Executive':
        return "Executive Committee approval is required for all non-standard deals that don't meet predefined criteria, deals over $500K, or deals with special terms. Requires comprehensive business case and ROI validation.";
      default:
        return "Standard approval process applies.";
    }
  };

  return (
    <div className="text-sm text-muted-foreground">
      <div className="flex items-start gap-2">
        <Info className="h-4 w-4 mt-0.5 text-blue-500" />
        <p>{getHelpText()}</p>
      </div>
    </div>
  );
}

export function StandardDealCriteriaHelp() {
  return (
    <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 mt-3">
      <h4 className="text-sm font-medium mb-2 flex items-center">
        <Info className="h-4 w-4 mr-2 text-blue-500" />
        Standard Deal Criteria
      </h4>
      <p className="text-xs text-slate-600 mb-2">
        For MD approval, a deal must meet ALL of the following criteria:
      </p>
      <ul className="text-xs text-slate-700 pl-5 space-y-1 list-disc">
        <li>Deal type: Grow</li>
        <li>Sales channel: Independent Agency or Client Direct</li>
        <li>Projected Annual Spend: Under $500,000</li>
      </ul>
      
      <h4 className="text-sm font-medium mt-4 mb-2 flex items-center">
        <Info className="h-4 w-4 mr-2 text-blue-500" />
        Complete Approval Workflow
      </h4>
      <p className="text-xs text-slate-600 mb-2">
        All deals go through the following approval sequence:
      </p>
      <ol className="text-xs text-slate-700 pl-5 space-y-1 list-decimal">
        <li><span className="font-medium">Regional Director</span>: Initial review for regional fit and strategy alignment (1-2 days)</li>
        <li><span className="font-medium">Finance Department</span>: Reviews financial terms and profitability (1-3 days)</li>
        <li><span className="font-medium">Legal Department</span>: Reviews contract terms and compliance for high-value deals (2-3 days)</li>
        <li><span className="font-medium">Final Approval</span>: Either Managing Director (standard deals) or Executive Committee (non-standard deals)</li>
      </ol>
    </div>
  );
}