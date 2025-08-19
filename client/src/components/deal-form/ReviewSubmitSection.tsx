import React, { useEffect } from "react";
import { UseFormReturn } from "react-hook-form";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FormSectionHeader, FormNavigation } from "@/components/ui/form-style-guide";
import { FormFieldWithTooltip } from "@/components/ui/form-components";
import { ApprovalAlert } from "@/components/ApprovalAlert";
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
  type DealFinancialSummary,
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

// Import unified interface from hook
import { DealTier } from "@/hooks/useDealTiers";
import { useDealCalculations } from "@/hooks/useDealCalculations";
import { useFinancialData } from "@/hooks/useFinancialData";

// Import new shared components
import { DealSummaryCard } from "./DealSummaryCard";
import { FinancialMetricsGrid } from "./FinancialMetricsGrid";
import { FinancialStructureTable } from "./FinancialStructureTable";
import { useBusinessSummary } from "@/hooks/useBusinessSummary";
import { calculateContractTerm } from "@/lib/contractUtils";

interface ReviewSubmitSectionProps {
  form: UseFormReturn<ReviewSubmitFormValues>;
  dealStructureType: "tiered" | "flat_commit" | "";
  dealTiers: DealTier[];
  selectedIncentives: SelectedIncentive[];
  tierIncentives: TierIncentive[];
  financialSummary: DealFinancialSummary;
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
  financialSummary,
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

  // Calculate contract term using shared utility
  const contractTerm = calculateContractTerm(formValues.termStartDate, formValues.termEndDate);

  // ✅ FIXED: Use same data source as FinancialTierTable (Step 3)
  const { agenciesData, advertisersData } = useFinancialData();
  const dealCalculations = useDealCalculations(advertisersData, agenciesData);

  // Auto-populate business summary using shared hook
  useBusinessSummary({ form, formValues });

  return (
    <div className="space-y-6">
      <FormSectionHeader
        title="Review & Submit"
        description="Review your deal details and submit for approval"
      />

      {/* Deal Summary using shared component */}
      <DealSummaryCard 
        formValues={formValues}
        dealStructureType={dealStructureType}
        contractTerm={contractTerm}
      />

      {/* Business Summary Field - Using shared FormFieldWithTooltip */}
      <Card>
        <CardContent className="p-6">
          <FormFieldWithTooltip
            form={form}
            name="businessSummary"
            label="Business Summary"
            type="textarea"
            required={true}
            placeholder="Auto-populated from business context fields..."
            description="This summary is auto-generated from your business context inputs but can be edited as needed."
            tooltip="Use this field to provide additional context about the deal that wasn't captured in other sections."
          />
        </CardContent>
      </Card>

      {/* Financial Summary using shared component */}
      <FinancialMetricsGrid financialSummary={financialSummary} />

      {/* Financial Structure using shared component */}
      {dealStructureType === "tiered" && dealTiers.length > 0 && (
        <FinancialStructureTable 
          dealTiers={dealTiers}
          salesChannel={salesChannel}
          advertiserName={advertiserName}
          agencyName={agencyName}
        />
      )}

      {/* Approval Pipeline Alert */}
      {currentApprover && (
        <ApprovalAlert approver={currentApprover} />
      )}

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