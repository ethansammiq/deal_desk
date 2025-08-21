import React, { useEffect } from "react";
import { UseFormReturn } from "react-hook-form";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FormSectionHeader, FormNavigation } from "@/components/ui/form-style-guide";
import { FormFieldWithTooltip } from "@/components/ui/form-components";
import { DealEvaluationPanel } from "./DealEvaluationPanel";
import { ApprovalPathPredictor } from "./ApprovalPathPredictor";
import { ApprovalRule } from "@/lib/approval-matrix";
// Removed EnhancedApprovalAlert - using ApprovalAlert instead for consistency
// Updated interfaces for current architecture - using consolidated DealTier structure
import {
  formatCurrency,
  formatPercentage,
} from "@/lib/utils";

import { Textarea } from "@/components/ui/textarea";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
} from "@/components/ui/form";

// Type this component to accept any valid form structure
type ReviewSubmitFormValues = any;

// Import unified interface from hook - simplified for streamlined review step
import { DealTier } from "@/hooks/useDealTiers";

interface ReviewSubmitSectionProps {
  form: UseFormReturn<ReviewSubmitFormValues>;
  dealStructureType: "tiered" | "flat_commit" | "";
  dealTiers: DealTier[];
  selectedIncentives: any[]; // Legacy prop - not used (kept for compatibility)
  tierIncentives: any[]; // Legacy prop - not used (kept for compatibility)
  contractTerm: number;
  currentApprover: ApprovalRule | null;
  isSubmitting: boolean;
  onSubmit: () => void;
  onPrevStep: () => void;
}

// Legacy DealSummary component removed - functionality consolidated into DealSummaryCard

export function ReviewSubmitSection({
  form,
  dealStructureType,
  dealTiers,
  selectedIncentives,
  tierIncentives,
  contractTerm,
  currentApprover,
  isSubmitting,
  onSubmit,
  onPrevStep,
}: ReviewSubmitSectionProps) {
  const formValues = form.getValues();
  
  // Helper to get client names for calculations (same as SubmitDeal.tsx)
  const salesChannel = String(formValues.salesChannel || "");
  const advertiserName = String(formValues.advertiserName || "");
  const agencyName = String(formValues.agencyName || "");

  // Streamlined review step - focused on deal evaluation and approval prediction
  // Extract deal value and incentive types for approval prediction
  const totalDealValue = dealTiers.reduce((sum, tier) => sum + (tier.annualRevenue || 0), 0);
  
  // Extract incentive types from dealTiers incentives (updated structure)
  const allIncentiveTypes = dealTiers
    .flatMap(tier => tier.incentives || [])
    .flatMap(incentive => [
      incentive.category,        // e.g., "analytics", "technology"
      incentive.subCategory,     // e.g., "analytics-reporting", "tech-infra"
      incentive.option          // e.g., "Custom Reports", "Enhanced API Access"
    ])
    .filter((type, index, array) => type && array.indexOf(type) === index); // Remove duplicates and empty values
  

  return (
    <div className="space-y-6">
      <FormSectionHeader
        title="Review & Submit"
        description="Verify deal evaluation and approval requirements before submission"
      />

      {/* Deal Evaluation Panel - Standard vs Non-standard assessment */}
      <DealEvaluationPanel
        dealValue={totalDealValue}
        dealType={formValues.dealType || "grow"}
        salesChannel={salesChannel}
        contractTerm={contractTerm}
        onChange={(approverLevel, approver) => {
          // Pass approval information to parent if needed
          // This maintains compatibility with existing approval tracking
        }}
      />

      {/* Approval Path Predictor - Shows predicted workflow and timeline */}
      <ApprovalPathPredictor
        dealValue={totalDealValue}
        dealType={formValues.dealType || "grow"}
        incentiveTypes={allIncentiveTypes}
        onChange={(prediction) => {
          // Optional: Store prediction data for analytics or user feedback
        }}
      />

      {/* Action Buttons - Using shared FormNavigation component */}
      <FormNavigation
        variant="submit"
        onPrevious={onPrevStep}
        onSubmit={onSubmit}
        previousLabel="Previous: Financial Structure"
        submitLabel="Submit Deal"
        isSubmitting={isSubmitting}
        showBorder={true}
      />
    </div>
  );
}