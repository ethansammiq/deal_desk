import React, { useEffect } from "react";
import { UseFormReturn } from "react-hook-form";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FormSectionHeader, FormNavigation } from "@/components/ui/form-style-guide";
import { FormFieldWithTooltip } from "@/components/ui/form-components";
import { DealEvaluationPanel } from "./DealEvaluationPanel";
import { ApprovalRule } from "@/lib/approval-matrix";
// Removed EnhancedApprovalAlert - using ApprovalAlert instead for consistency
// Legacy interfaces - simplified for current architecture
interface SelectedIncentive {
  id: string;
  type: string;
  value: number;
  option?: string;
  tierIds?: number[];
  notes?: string;
}

interface TierIncentive {
  tierNumber: number;
  incentives: SelectedIncentive[];
}
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
  selectedIncentives: SelectedIncentive[];
  tierIncentives: TierIncentive[];
  contractTermMonths: number;
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
  contractTermMonths,
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

  // Streamlined review step - removed redundant data calculations and auto-population
  // Deal evaluation is now handled by the DealEvaluationPanel component

  return (
    <div className="space-y-6">
      <FormSectionHeader
        title="Review & Submit"
        description="Verify deal evaluation and approval requirements before submission"
      />

      {/* Deal Evaluation Panel - Replaces redundant components with focused assessment */}
      <DealEvaluationPanel
        dealValue={dealTiers.reduce((sum, tier) => sum + (tier.annualRevenue || 0), 0)}
        dealType={formValues.dealType || "grow"}
        salesChannel={salesChannel}
        contractTerm={contractTermMonths}
        onChange={(approverLevel, approver) => {
          // Pass approval information to parent if needed
          // This maintains compatibility with existing approval tracking
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