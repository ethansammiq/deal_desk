import React, { useEffect } from "react";
import { UseFormReturn } from "react-hook-form";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FormSectionHeader } from "@/components/ui/form-style-guide";
import { FormFieldWithTooltip } from "@/components/ui/form-components";
import { ApprovalAlert } from "@/components/ApprovalAlert";
import { ApprovalRule } from "@/lib/approval-matrix";
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
import { Loader2 } from "lucide-react";
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

// Standalone DealSummary component for use in tab architecture
interface DealSummaryProps {
  form: UseFormReturn<ReviewSubmitFormValues>;
  dealStructureType: "tiered" | "flat_commit" | "";
  dealTiers: DealTier[];
}

export function DealSummary({ form, dealStructureType, dealTiers }: DealSummaryProps) {
  const formValues = form.getValues();

  // Calculate contract term from dates - handle string dates properly
  const startDate = formValues.termStartDate;
  const endDate = formValues.termEndDate;
  const contractTerm = startDate && endDate ? (() => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    return Math.max(1, (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth()));
  })() : 12;

  return (
    <div className="space-y-6">
      {/* Deal Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Deal Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Deal Type</label>
              <p className="text-base capitalize">{formValues.dealType}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Sales Channel</label>
              <p className="text-base">
                {formValues.salesChannel === "client_direct" ? "Client Direct" :
                 formValues.salesChannel === "holding_company" ? "Holding Company" :
                 "Independent Agency"}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Region</label>
              <p className="text-base capitalize">{formValues.region}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Structure</label>
              <p className="text-base">
                {dealStructureType === "tiered" ? "Tiered Revenue" : "Flat Commit"}
              </p>
            </div>
          </div>

          {formValues.advertiserName && (
            <div>
              <label className="text-sm font-medium text-gray-700">Advertiser</label>
              <p className="text-base">{formValues.advertiserName}</p>
            </div>
          )}

          {formValues.agencyName && (
            <div>
              <label className="text-sm font-medium text-gray-700">Agency</label>
              <p className="text-base">{formValues.agencyName}</p>
            </div>
          )}

          <div>
            <label className="text-sm font-medium text-gray-700">Contract Term</label>
            <p className="text-base">{contractTerm} months</p>
          </div>
        </CardContent>
      </Card>

      {/* Deal Structure Details */}
      {dealStructureType === "tiered" && dealTiers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Tier Structure</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {dealTiers.map((tier) => (
                <div key={tier.tierNumber} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-4">
                    <Badge variant="outline">Tier {tier.tierNumber}</Badge>
                    <div>
                      <span className="font-medium">
                        {formatCurrency(tier.annualRevenue || 0)}
                      </span>
                      <span className="text-gray-600 ml-2">
                        ({((tier.annualGrossMargin || 0) * 100) || 0}% margin)
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

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

      {/* Approval Requirements */}
      {currentApprover && (
        <ApprovalAlert
          totalValue={financialSummary.totalAnnualRevenue}
          contractTerm={contractTerm}
          dealType={formValues.dealType}
          salesChannel={salesChannel}
          onChange={() => {}}
        />
      )}

      {/* Action Buttons */}
      <div className="flex items-center justify-between pt-6 border-t border-gray-200">
        <Button
          type="button"
          variant="outline"
          onClick={onPrevStep}
          disabled={isSubmitting}
        >
          Back to Value Structure
        </Button>

        <Button
          type="submit"
          onClick={onSubmit}
          disabled={isSubmitting}
          className="min-w-[120px]"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Submitting...
            </>
          ) : (
            "Submit Deal"
          )}
        </Button>
      </div>
    </div>
  );
}