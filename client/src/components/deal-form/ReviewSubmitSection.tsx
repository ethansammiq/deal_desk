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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  FinancialTable,
  FinancialTableColGroup,
  FinancialTableHeader,
  FinancialTableBody,
  FinancialHeaderCell,
  FinancialDataCell,
  FinancialMetricLabel,
  GrowthIndicator,
} from "@/components/ui/financial-table";
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
      {(dealTiers.length > 0 || dealStructureType === "flat_commit") ? (
        <FinancialMetricsGrid financialSummary={financialSummary} />
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

      {/* Financial Structure using shared component - MUST use same calculation instance as step 3 */}
      {(dealTiers.length > 0 || dealStructureType === "flat_commit") && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Deal Structure Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <FinancialTable>
              <FinancialTableColGroup dealTiers={dealTiers} />
              
              <FinancialTableHeader>
                <tr>
                  <FinancialHeaderCell isMetricName />
                  <FinancialHeaderCell>Last Year</FinancialHeaderCell>
                  {dealTiers.map((tier) => (
                    <FinancialHeaderCell key={`header-${tier.tierNumber}`}>
                      Tier {tier.tierNumber}
                    </FinancialHeaderCell>
                  ))}
                </tr>
              </FinancialTableHeader>
              
              <FinancialTableBody>
                {/* Use the SAME financial summary data that was calculated in parent */}
                <tr>
                  <FinancialDataCell isMetricLabel>
                    <FinancialMetricLabel 
                      title="Annual Revenue"
                      description="Total expected annual revenue"
                    />
                  </FinancialDataCell>
                  <FinancialDataCell>
                    {formatCurrency(financialSummary.lastYearRevenue)}
                  </FinancialDataCell>
                  {dealTiers.map((tier) => (
                    <FinancialDataCell key={`revenue-${tier.tierNumber}`}>
                      {formatCurrency(tier.annualRevenue || 0)}
                    </FinancialDataCell>
                  ))}
                </tr>

                <tr>
                  <FinancialDataCell isMetricLabel>
                    <FinancialMetricLabel 
                      title="Revenue Growth Rate"
                      description="Percentage increase compared to last year"
                    />
                  </FinancialDataCell>
                  <FinancialDataCell>
                    <span className="text-slate-500">—</span>
                  </FinancialDataCell>
                  {dealTiers.map((tier) => {
                    const growthRate = financialSummary.revenueGrowthRate || 0;
                    return (
                      <FinancialDataCell key={`rev-growth-${tier.tierNumber}`}>
                        <GrowthIndicator value={growthRate} />
                      </FinancialDataCell>
                    );
                  })}
                </tr>

                <tr>
                  <FinancialDataCell isMetricLabel>
                    <FinancialMetricLabel 
                      title="Adjusted Gross Margin Growth Rate"
                      description="Change in margin percentage vs last year"
                    />
                  </FinancialDataCell>
                  <FinancialDataCell>
                    <span className="text-slate-500">—</span>
                  </FinancialDataCell>
                  {dealTiers.map((tier) => {
                    const marginGrowthRate = financialSummary.adjustedGrossMarginGrowthRate || 0;
                    return (
                      <FinancialDataCell key={`margin-growth-${tier.tierNumber}`}>
                        <GrowthIndicator value={marginGrowthRate} />
                      </FinancialDataCell>
                    );
                  })}
                </tr>

                <tr>
                  <FinancialDataCell isMetricLabel>
                    <FinancialMetricLabel 
                      title="Adjusted Gross Profit Growth Rate"
                      description="Percentage increase in adjusted profit vs last year"
                    />
                  </FinancialDataCell>
                  <FinancialDataCell>
                    <span className="text-slate-500">—</span>
                  </FinancialDataCell>
                  {dealTiers.map((tier) => {
                    const profitGrowthRate = financialSummary.adjustedGrossProfitGrowthRate || 0;
                    return (
                      <FinancialDataCell key={`profit-growth-${tier.tierNumber}`}>
                        <GrowthIndicator value={profitGrowthRate} />
                      </FinancialDataCell>
                    );
                  })}
                </tr>

                <tr>
                  <FinancialDataCell isMetricLabel>
                    <FinancialMetricLabel 
                      title="Total Incentive Cost"
                      description="All incentives applied to this tier"
                    />
                  </FinancialDataCell>
                  <FinancialDataCell>
                    {formatCurrency(financialSummary.lastYearIncentiveCost)}
                  </FinancialDataCell>
                  {dealTiers.map((tier) => {
                    const incentiveCost = financialSummary.totalIncentiveCost || 0;
                    return (
                      <FinancialDataCell key={`incentive-${tier.tierNumber}`}>
                        {formatCurrency(incentiveCost)}
                      </FinancialDataCell>
                    );
                  })}
                </tr>

                <tr>
                  <FinancialDataCell isMetricLabel>
                    <FinancialMetricLabel 
                      title="Total Client Value"
                      description="Expected business value from incentive"
                    />
                  </FinancialDataCell>
                  <FinancialDataCell>
                    {formatCurrency(financialSummary.lastYearClientValue)}
                  </FinancialDataCell>
                  {dealTiers.map((tier) => {
                    const clientValue = financialSummary.totalClientValue || 0;
                    return (
                      <FinancialDataCell key={`client-value-${tier.tierNumber}`}>
                        {formatCurrency(clientValue)}
                      </FinancialDataCell>
                    );
                  })}
                </tr>

                <tr>
                  <FinancialDataCell isMetricLabel>
                    <FinancialMetricLabel 
                      title="Client Value Growth Rate"
                      description="Change vs. last year"
                    />
                  </FinancialDataCell>
                  <FinancialDataCell>
                    <span className="text-slate-500">—</span>
                  </FinancialDataCell>
                  {dealTiers.map((tier) => {
                    const clientValueGrowthRate = financialSummary.clientValueGrowthRate || 0;
                    return (
                      <FinancialDataCell key={`client-growth-${tier.tierNumber}`}>
                        <GrowthIndicator value={clientValueGrowthRate} />
                      </FinancialDataCell>
                    );
                  })}
                </tr>

                <tr>
                  <FinancialDataCell isMetricLabel>
                    <FinancialMetricLabel 
                      title="Incentive Cost Growth Rate"
                      description="Change vs. last year"
                    />
                  </FinancialDataCell>
                  <FinancialDataCell>
                    <span className="text-slate-500">—</span>
                  </FinancialDataCell>
                  {dealTiers.map((tier) => {
                    const incentiveCostGrowthRate = financialSummary.incentiveCostGrowthRate || 0;
                    return (
                      <FinancialDataCell key={`incentive-growth-${tier.tierNumber}`}>
                        <GrowthIndicator value={incentiveCostGrowthRate} />
                      </FinancialDataCell>
                    );
                  })}
                </tr>
              </FinancialTableBody>
            </FinancialTable>
          </CardContent>
        </Card>
      )}

      {/* Approval Pipeline Alert */}
      <ApprovalAlert
        totalValue={financialSummary.totalAnnualRevenue}
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