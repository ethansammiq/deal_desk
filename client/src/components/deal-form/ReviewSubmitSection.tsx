import React, { useEffect } from "react";
import { UseFormReturn } from "react-hook-form";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FormSectionHeader } from "@/components/ui/form-style-guide";
import { ApprovalAlert } from "@/components/ApprovalAlert";
import { ApprovalRule } from "@/lib/approval-matrix";
import { type SelectedIncentive } from "@/lib/incentive-data";
import { type TierIncentive } from "@/components/TierSpecificIncentives";
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

interface DealTierData {
  tierNumber: number;
  annualRevenue?: number;
  annualGrossMargin?: number;
  annualGrossMarginPercent?: number;
  incentivePercentage?: number;
  incentiveNotes?: string;
  incentiveType?: "rebate" | "discount" | "bonus" | "other";
  incentiveThreshold?: number;
  incentiveAmount?: number;
}

interface ReviewSubmitSectionProps {
  form: UseFormReturn<ReviewSubmitFormValues>;
  dealStructureType: "tiered" | "flat_commit" | "";
  dealTiers: DealTierData[];
  selectedIncentives: SelectedIncentive[];
  tierIncentives: TierIncentive[];
  financialSummary: DealFinancialSummary;
  currentApprover: ApprovalRule | null;
  isSubmitting: boolean;
  onSubmit: () => void;
  onPrevStep: () => void;
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

  // Calculate contract term from dates
  const startDate = formValues.termStartDate;
  const endDate = formValues.termEndDate;
  const contractTerm = startDate && endDate ?
    Math.max(1, (endDate.getFullYear() - startDate.getFullYear()) * 12 + (endDate.getMonth() - startDate.getMonth())) : 12;

  // Auto-populate business summary based on business context fields
  useEffect(() => {
    const generateBusinessSummary = () => {
      const parts = [];
      
      if (formValues.growthOpportunityMIQ) {
        parts.push(`Growth Opportunity (MIQ): ${formValues.growthOpportunityMIQ}`);
      }
      
      if (formValues.growthOpportunityClient) {
        parts.push(`Growth Opportunity (Client): ${formValues.growthOpportunityClient}`);
      }
      
      if (formValues.clientAsks) {
        parts.push(`Client Requirements: ${formValues.clientAsks}`);
      }
      
      if (parts.length > 0) {
        const autoSummary = parts.join(' | ');
        // Only update if business summary is empty or different
        if (!formValues.businessSummary || formValues.businessSummary !== autoSummary) {
          form.setValue('businessSummary', autoSummary);
        }
      }
    };

    generateBusinessSummary();
  }, [formValues.growthOpportunityMIQ, formValues.growthOpportunityClient, formValues.clientAsks, form]);

  return (
    <div className="space-y-6">
      <FormSectionHeader
        title="Review & Submit"
        description="Review your deal details and submit for approval"
      />

      {/* Deal Summary */}
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
                {formValues.dealStructure === "tiered" ? "Tiered Revenue" : "Flat Commit"}
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

          {/* Auto-populated Business Summary Field */}
          <div className="col-span-2">
            <FormField
              control={form.control}
              name="businessSummary"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Business Summary <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Auto-populated from business context fields..."
                      className="min-h-[100px]"
                      value={field.value || ""}
                      onChange={field.onChange}
                    />
                  </FormControl>
                  <FormDescription>
                    This summary is auto-generated from your business context inputs but can be edited as needed.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </CardContent>
      </Card>

      {/* Financial Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Financial Impact</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {formatCurrency(financialSummary.totalAnnualRevenue)}
              </div>
              <div className="text-sm text-gray-600">Annual Revenue</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(financialSummary.totalGrossMargin)}
              </div>
              <div className="text-sm text-gray-600">Gross Margin</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {formatCurrency(financialSummary.totalIncentiveValue)}
              </div>
              <div className="text-sm text-gray-600">Total Incentives</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {formatCurrency(financialSummary.projectedNetValue)}
              </div>
              <div className="text-sm text-gray-600">Net Value</div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Effective Discount Rate</label>
                <p className="text-lg font-semibold">
                  {formatPercentage(financialSummary.effectiveDiscountRate)}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Monthly Value</label>
                <p className="text-lg font-semibold">
                  {formatCurrency(financialSummary.monthlyValue)}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">YoY Growth</label>
                <p className="text-lg font-semibold">
                  {formatPercentage(financialSummary.yearOverYearGrowth)}
                </p>
              </div>
            </div>
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
                        ({tier.annualGrossMarginPercent || 0}% margin)
                      </span>
                    </div>
                  </div>
                  {tier.incentivePercentage && (
                    <Badge variant="secondary">
                      {tier.incentivePercentage}% {tier.incentiveType}
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Selected Incentives */}
      {selectedIncentives.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Selected Incentives</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {selectedIncentives.map((incentive, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-blue-50 rounded">
                  <span className="font-medium">{incentive.option}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">
                      Tiers: {incentive.tierIds.join(", ")}
                    </span>
                    {incentive.notes && (
                      <Badge variant="outline" className="text-xs">
                        {incentive.notes}
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Approval Requirements */}
      {currentApprover && (
        <ApprovalAlert
          currentApprover={currentApprover}
          onApprovalChange={() => {}}
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