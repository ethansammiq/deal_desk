import React, { useEffect, useState } from "react";
import { AlertCircle, Clock, CheckCircle2, UserCog } from "lucide-react";
import { 
  determineRequiredApprover, 
  getApproverDetails, 
  generateApprovalAlert,
  DealParameters,
  ApprovalRule
} from "@/lib/approval-matrix";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface ApprovalAlertProps {
  totalValue: number;
  hasNonStandardTerms: boolean;
  discountPercentage: number;
  contractTerm: number;
  onChange?: (approverLevel: string, approvalInfo: ApprovalRule) => void;
}

export function ApprovalAlert({
  totalValue,
  hasNonStandardTerms,
  discountPercentage,
  contractTerm,
  onChange
}: ApprovalAlertProps) {
  const [alertInfo, setAlertInfo] = useState<{
    message: string;
    level: 'info' | 'warning' | 'alert';
    approver: ApprovalRule;
  } | null>(null);

  useEffect(() => {
    // Only calculate and show alert if we have valid deal parameters
    if (totalValue > 0 && contractTerm > 0) {
      const params: DealParameters = {
        totalValue,
        hasNonStandardTerms,
        discountPercentage,
        contractTerm
      };
      
      const alert = generateApprovalAlert(params);
      setAlertInfo(alert);
      
      // Notify parent component about the approver level if callback provided
      if (onChange) {
        onChange(alert.approver.level, alert.approver);
      }
    } else {
      setAlertInfo(null);
    }
  }, [totalValue, hasNonStandardTerms, discountPercentage, contractTerm, onChange]);

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
        
        <div>
          <AlertTitle className="flex items-center gap-2 mb-1">
            <span>Approval Required: {alertInfo.approver.title}</span>
          </AlertTitle>
          <AlertDescription className="text-sm">
            {alertInfo.message}
          </AlertDescription>
          
          <div className="mt-3 flex items-center text-sm gap-2">
            <UserCog className="h-4 w-4" /> 
            <span>Approver: {alertInfo.approver.title} ({alertInfo.approver.level})</span>
          </div>
        </div>
      </div>
    </Alert>
  );
}

export function ApprovalHelpText({ level }: { level: string }) {
  const getHelpText = () => {
    switch (level) {
      case 'Manager':
        return "Standard approval process, typically fast.";
      case 'Director':
        return "Director approval may require additional documentation.";
      case 'VP':
        return "VP approval requires strong business justification.";
      case 'SVP':
        return "SVP approval needed for high-value deals. Prepare executive summary.";
      case 'C-Level':
        return "C-Level approval requires executive briefing and strong ROI validation.";
      default:
        return "Standard approval process applies.";
    }
  };

  return (
    <div className="text-sm text-muted-foreground">
      <p>{getHelpText()}</p>
    </div>
  );
}