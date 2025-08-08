import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ApprovalAlert } from "@/components/ApprovalAlert";
import { ApprovalRule } from "@/lib/approval-matrix";
import {
  CheckCircle2,
  AlertCircle,
  Users,
  Clock,
  DollarSign,
  TrendingUp,
} from "lucide-react";
import { formatCurrency, formatPercentage } from "@/lib/utils";

interface ApprovalMatrixDisplayProps {
  currentApprover: ApprovalRule | null;
  dealValue: number;
  incentiveValue: number;
  dealType: string;
  hasNonStandardTerms: boolean;
  isHighRisk: boolean;
}

export function ApprovalMatrixDisplay({
  currentApprover,
  dealValue,
  incentiveValue,
  dealType,
  hasNonStandardTerms,
  isHighRisk,
}: ApprovalMatrixDisplayProps) {
  // Calculate approval factors
  const approvalFactors = [
    {
      label: "Deal Value",
      value: formatCurrency(dealValue),
      status: dealValue > 1000000 ? "high" : dealValue > 500000 ? "medium" : "low",
      icon: DollarSign,
    },
    {
      label: "Incentive Impact",
      value: formatCurrency(incentiveValue),
      status: incentiveValue > 100000 ? "high" : incentiveValue > 50000 ? "medium" : "low",
      icon: TrendingUp,
    },
    {
      label: "Deal Type",
      value: dealType.charAt(0).toUpperCase() + dealType.slice(1),
      status: dealType === "custom" ? "high" : dealType === "grow" ? "medium" : "low",
      icon: Users,
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "high":
        return "text-red-600 bg-red-50 border-red-200";
      case "medium":
        return "text-orange-600 bg-orange-50 border-orange-200";
      case "low":
        return "text-green-600 bg-green-50 border-green-200";
      default:
        return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  const getRiskFactors = () => {
    const factors = [];
    if (hasNonStandardTerms) factors.push("Non-standard terms");
    if (isHighRisk) factors.push("High-risk client");
    if (dealValue > 1000000) factors.push("Large deal value");
    if (incentiveValue > 100000) factors.push("High incentive cost");
    return factors;
  };

  const riskFactors = getRiskFactors();

  return (
    <div className="space-y-6">
      {/* Approval Status */}
      {currentApprover && (
        <ApprovalAlert
          totalValue={dealValue}
          contractTerm={12}
          dealType={dealType}
          onChange={() => {}}
        />
      )}

      {/* Approval Factors Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-blue-600" />
            Approval Matrix Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {approvalFactors.map((factor, index) => {
              const Icon = factor.icon;
              return (
                <div
                  key={index}
                  className={`p-4 rounded-lg border ${getStatusColor(factor.status)}`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className="h-4 w-4" />
                    <span className="text-sm font-medium">{factor.label}</span>
                  </div>
                  <div className="text-lg font-bold">{factor.value}</div>
                  <Badge variant="outline" className={`text-xs ${getStatusColor(factor.status)}`}>
                    {factor.status.toUpperCase()} IMPACT
                  </Badge>
                </div>
              );
            })}
          </div>

          {/* Risk Factors */}
          {riskFactors.length > 0 && (
            <Alert className="border-orange-200 bg-orange-50">
              <AlertCircle className="h-4 w-4 text-orange-600" />
              <AlertDescription className="text-orange-800">
                <strong>Risk Factors Identified:</strong>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  {riskFactors.map((factor, index) => (
                    <li key={index} className="text-sm">{factor}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Approval Process Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-purple-600" />
            Approval Process
          </CardTitle>
        </CardHeader>
        <CardContent>
          {currentApprover ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                  1
                </div>
                <div className="flex-1">
                  <div className="font-medium text-blue-800">
                    {currentApprover.level} Approval Required
                  </div>
                  <div className="text-sm text-blue-600">
                    {currentApprover.description}
                  </div>
                </div>
                <Badge variant="outline" className="text-blue-600 border-blue-300">
                  Current Step
                </Badge>
              </div>

              {/* Estimated Timeline */}
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="text-sm font-medium text-gray-700 mb-2">
                  Estimated Processing Time
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600">
                    {currentApprover.estimatedTime}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <div>
                <div className="font-medium text-green-800">
                  No Additional Approval Required
                </div>
                <div className="text-sm text-green-600">
                  This deal meets standard approval criteria and can be processed immediately.
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Approval Tips */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-800">Approval Tips</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-blue-700">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
              Ensure all required fields are completed accurately
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
              Provide detailed business justification for custom deals
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
              Include competitive analysis for high-value deals
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
              Document any non-standard terms or special conditions
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}