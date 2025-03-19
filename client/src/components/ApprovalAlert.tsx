import React, { useEffect, useState } from "react";
import { AlertCircle, Clock, CheckCircle2, UserCog, Info, AlertTriangle, ChevronDown, ChevronUp } from "lucide-react";
import { 
  determineRequiredApprover, 
  getApproverDetails, 
  generateApprovalAlert,
  getNonStandardDealReasons,
  isStandardDeal,
  DealParameters,
  ApprovalRule
} from "@/lib/approval-matrix";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface ApprovalAlertProps {
  totalValue: number;
  hasNonStandardTerms: boolean;
  discountPercentage: number;
  contractTerm: number;
  dealType?: string;
  salesChannel?: string;
  hasTradeAMImplications?: boolean;
  yearlyRevenueGrowthRate?: number;
  forecastedMargin?: number;
  yearlyMarginGrowthRate?: number;
  addedValueBenefitsCost?: number;
  analyticsTier?: string;
  requiresCustomMarketing?: boolean;
  onChange?: (approverLevel: string, approvalInfo: ApprovalRule) => void;
}

export function ApprovalAlert({
  totalValue,
  hasNonStandardTerms,
  discountPercentage,
  contractTerm,
  dealType = "grow",
  salesChannel = "independent_agency",
  hasTradeAMImplications = false,
  yearlyRevenueGrowthRate = 25,
  forecastedMargin = 30,
  yearlyMarginGrowthRate = 0,
  addedValueBenefitsCost = 0,
  analyticsTier = "silver",
  requiresCustomMarketing = false,
  onChange
}: ApprovalAlertProps) {
  const [alertInfo, setAlertInfo] = useState<{
    message: string;
    level: 'info' | 'warning' | 'alert';
    approver: ApprovalRule;
    reasons: string[];
  } | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    // Only calculate and show alert if we have valid deal parameters
    if (totalValue > 0 && contractTerm > 0) {
      const params: DealParameters = {
        totalValue,
        hasNonStandardTerms,
        discountPercentage,
        contractTerm,
        dealType,
        salesChannel,
        hasTradeAMImplications,
        yearlyRevenueGrowthRate,
        forecastedMargin,
        yearlyMarginGrowthRate,
        addedValueBenefitsCost,
        analyticsTier,
        requiresCustomMarketing,
        // Calculate annual value based on total value and contract term
        annualValue: totalValue / (contractTerm / 12)
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
  }, [
    totalValue, 
    hasNonStandardTerms, 
    discountPercentage, 
    contractTerm, 
    dealType,
    salesChannel,
    hasTradeAMImplications,
    yearlyRevenueGrowthRate,
    forecastedMargin,
    yearlyMarginGrowthRate,
    addedValueBenefitsCost,
    analyticsTier,
    requiresCustomMarketing,
    onChange
  ]);

  if (!alertInfo) {
    return null;
  }

  const toggleDetails = () => setShowDetails(!showDetails);

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
            
            {alertInfo.reasons.length > 0 && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="px-2 h-8" 
                onClick={toggleDetails}
              >
                {showDetails ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </Button>
            )}
          </div>
          
          <AlertDescription className="text-sm">
            {alertInfo.message}
          </AlertDescription>
          
          {showDetails && alertInfo.reasons.length > 0 && (
            <div className="mt-3 pt-3 border-t border-slate-200">
              <div className="flex items-center gap-1 mb-2 text-sm font-medium">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                <span>Non-Standard Deal Criteria</span>
              </div>
              <ul className="text-sm pl-5 space-y-1 list-disc">
                {alertInfo.reasons.map((reason, index) => (
                  <li key={index} className="text-slate-700">{reason}</li>
                ))}
              </ul>
            </div>
          )}
          
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
        <li>No Trading & AM resource implications</li>
        <li>Projected Annual Spend: $1M–$3M</li>
        <li>Yearly revenue growth rate ≥ 25%</li>
        <li>Forecasted margin ≥ 30%</li>
        <li>Yearly margin growth rate ≥ -5%</li>
        <li>Cost of added value benefits ≤ $100K</li>
        <li>Analytics solutions: Silver tier</li>
        <li>No custom marketing/PR required</li>
      </ul>
    </div>
  );
}