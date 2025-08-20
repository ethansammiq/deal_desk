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

// Import unified interface from hook - Step 4 uses minimal calculations for display
import { DealTier } from "@/hooks/useDealTiers";
import { useBusinessSummary } from "@/hooks/useBusinessSummary";
import { calculateContractTerm } from "@/lib/contractUtils";
import { useFinancialData } from "@/hooks/useFinancialData";
import { useDealCalculations } from "@/hooks/useDealCalculations";

// Import shared components from step 3 - NO new calculations in step 4
import { DealSummaryCard } from "./DealSummaryCard";
import { FinancialMetricsGrid } from "./FinancialMetricsGrid";
import { FinancialStructureTable } from "./FinancialStructureTable";

interface ReviewSubmitSectionProps {
  form: UseFormReturn<ReviewSubmitFormValues>;
  dealStructureType: "tiered" | "flat_commit" | "";
  dealTiers: DealTier[];
  selectedIncentives: SelectedIncentive[];
  tierIncentives: TierIncentive[];
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

  // Calculate contract term using shared utility
  const contractTerm = calculateContractTerm(formValues.termStartDate, formValues.termEndDate);

  // Step 4 is pure display - get same calculation service as step 3 to ensure consistency
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
      {(dealTiers.length > 0 || dealStructureType === "flat_commit") ? (
        <FinancialMetricsGrid dealTiers={dealTiers} contractTerm={contractTerm} />
      ) : (
        <Card>
          <CardContent className="p-6">
            <div className="text-center py-8">
              <h3 className="text-lg font-medium text-muted-foreground mb-2">No Financial Structure Configured</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Please go back to step 3 "Financial Structure" to configure deal tiers and see financial summary.
              </p>
              <Button variant="outline" onClick={() => window.history.back()}>
                Go to Financial Structure
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Financial Structure Summary - Step 4 pure display version with same calculation service */}
      {(dealTiers.length > 0 || dealStructureType === "flat_commit") && (
        <FinancialStructureTable 
          dealTiers={dealTiers}
          salesChannel={salesChannel}
          advertiserName={advertiserName}
          agencyName={agencyName}
          calculationService={dealCalculations.calculationService}
        />
      )}

      {/* Approval Pipeline Alert */}
      <ApprovalAlert
        totalValue={dealTiers.reduce((sum, tier) => sum + (tier.annualRevenue || 0), 0)}
        contractTerm={contractTerm}
        dealType={formValues.dealType}
        salesChannel={salesChannel}
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