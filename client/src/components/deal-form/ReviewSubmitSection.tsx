import React, { useEffect } from "react";
import { UseFormReturn } from "react-hook-form";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FormSectionHeader } from "@/components/ui/form-style-guide";
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
  const dealCalculations = useDealCalculations();
  
  // Helper to get client names for calculations
  const getClientNames = () => ({
    advertiserName: String(formValues.advertiserName || ""),
    agencyName: String(formValues.agencyName || ""),
    salesChannel: String(formValues.salesChannel || "")
  });

  // Calculate contract term from dates - handle string dates properly
  const startDate = formValues.termStartDate;
  const endDate = formValues.termEndDate;
  const contractTerm = startDate && endDate ? (() => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    return Math.max(1, (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth()));
  })() : 12;

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

      {/* Enhanced Deal Summary - All Client Information and Deal Timeline fields */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Deal Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Client Information Section */}
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Client Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            </div>
          </div>

          {/* Deal Timeline Section */}
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Deal Timeline</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Deal Type</label>
                <p className="text-base capitalize">{formValues.dealType}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Structure</label>
                <p className="text-base">
                  {dealStructureType === "tiered" ? "Tiered Revenue" : "Flat Commit"}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Contract Term</label>
                <p className="text-base">{contractTerm} months</p>
              </div>
              {formValues.termStartDate && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Start Date</label>
                  <p className="text-base">{new Date(formValues.termStartDate).toLocaleDateString()}</p>
                </div>
              )}
              {formValues.termEndDate && (
                <div>
                  <label className="text-sm font-medium text-gray-700">End Date</label>
                  <p className="text-base">{new Date(formValues.termEndDate).toLocaleDateString()}</p>
                </div>
              )}
              {formValues.contractTermMonths && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Contract Term (Months)</label>
                  <p className="text-base">{formValues.contractTermMonths}</p>
                </div>
              )}
            </div>
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

      {/* Financial Structure - Consolidated Deal Structure Summary Table */}
      {dealStructureType === "tiered" && dealTiers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Financial Structure</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-300 p-3 text-left font-medium text-gray-700">Metric</th>
                    <th className="border border-gray-300 p-3 text-center font-medium text-gray-700 bg-gray-50">Last Year</th>
                    {dealTiers.map((tier) => (
                      <th key={tier.tierNumber} className="border border-gray-300 p-3 text-center font-medium text-gray-700">
                        Tier {tier.tierNumber}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {/* Annual Revenue Row */}
                  <tr>
                    <td className="border border-gray-300 p-3 font-medium">Annual Revenue</td>
                    <td className="border border-gray-300 p-3 text-center">
                      {formatCurrency(dealCalculations.getPreviousYearValue(
                        getClientNames().salesChannel, 
                        getClientNames().advertiserName, 
                        getClientNames().agencyName
                      ))}
                    </td>
                    {dealTiers.map((tier) => (
                      <td key={tier.tierNumber} className="border border-gray-300 p-3 text-center">
                        {formatCurrency(tier.annualRevenue || 0)}
                      </td>
                    ))}
                  </tr>
                  
                  {/* Revenue Growth Rate Row */}
                  <tr>
                    <td className="border border-gray-300 p-3 font-medium">Revenue Growth Rate</td>
                    <td className="border border-gray-300 p-3 text-center text-gray-500">--</td>
                    {dealTiers.map((tier) => (
                      <td key={tier.tierNumber} className="border border-gray-300 p-3 text-center text-green-600 font-medium">
                        {formatPercentage(dealCalculations.calculateRevenueGrowthRate(
                          tier, 
                          getClientNames().salesChannel, 
                          getClientNames().advertiserName, 
                          getClientNames().agencyName
                        ))}
                      </td>
                    ))}
                  </tr>
                  
                  {/* Adjusted Gross Margin Growth Rate Row */}
                  <tr>
                    <td className="border border-gray-300 p-3 font-medium">Adjusted Gross Margin Growth Rate</td>
                    <td className="border border-gray-300 p-3 text-center text-gray-500">--</td>
                    {dealTiers.map((tier) => (
                      <td key={tier.tierNumber} className="border border-gray-300 p-3 text-center text-green-600 font-medium">
                        {formatPercentage(dealCalculations.calculateAdjustedGrossMarginGrowthRate(
                          tier, 
                          getClientNames().salesChannel, 
                          getClientNames().advertiserName, 
                          getClientNames().agencyName
                        ))}
                      </td>
                    ))}
                  </tr>
                  
                  {/* Adjusted Gross Profit Growth Rate Row */}
                  <tr>
                    <td className="border border-gray-300 p-3 font-medium">Adjusted Gross Profit Growth Rate</td>
                    <td className="border border-gray-300 p-3 text-center text-gray-500">--</td>
                    {dealTiers.map((tier) => (
                      <td key={tier.tierNumber} className="border border-gray-300 p-3 text-center text-green-600 font-medium">
                        {formatPercentage(dealCalculations.calculateAdjustedGrossProfitGrowthRate(
                          tier, 
                          getClientNames().salesChannel, 
                          getClientNames().advertiserName, 
                          getClientNames().agencyName
                        ))}
                      </td>
                    ))}
                  </tr>
                  
                  {/* Total Incentive Cost Row */}
                  <tr>
                    <td className="border border-gray-300 p-3 font-medium">Total Incentive Cost</td>
                    <td className="border border-gray-300 p-3 text-center">
                      {formatCurrency(dealCalculations.getPreviousYearIncentiveCost(
                        getClientNames().salesChannel, 
                        getClientNames().advertiserName, 
                        getClientNames().agencyName
                      ))}
                    </td>
                    {dealTiers.map((tier) => (
                      <td key={tier.tierNumber} className="border border-gray-300 p-3 text-center">
                        {formatCurrency(dealCalculations.calculateTierIncentiveCost(tier))}
                      </td>
                    ))}
                  </tr>
                  
                  {/* Total Client Value Row */}
                  <tr>
                    <td className="border border-gray-300 p-3 font-medium">Total Client Value</td>
                    <td className="border border-gray-300 p-3 text-center">
                      {formatCurrency(dealCalculations.getPreviousYearValue(
                        getClientNames().salesChannel, 
                        getClientNames().advertiserName, 
                        getClientNames().agencyName
                      ) - dealCalculations.getPreviousYearIncentiveCost(
                        getClientNames().salesChannel, 
                        getClientNames().advertiserName, 
                        getClientNames().agencyName
                      ))}
                    </td>
                    {dealTiers.map((tier) => (
                      <td key={tier.tierNumber} className="border border-gray-300 p-3 text-center">
                        {formatCurrency((tier.annualRevenue || 0) - dealCalculations.calculateTierIncentiveCost(tier))}
                      </td>
                    ))}
                  </tr>
                  
                  {/* Client Value Growth Rate Row */}
                  <tr>
                    <td className="border border-gray-300 p-3 font-medium">Client Value Growth Rate</td>
                    <td className="border border-gray-300 p-3 text-center text-gray-500">--</td>
                    {dealTiers.map((tier) => (
                      <td key={tier.tierNumber} className="border border-gray-300 p-3 text-center text-green-600 font-medium">
                        {formatPercentage(dealCalculations.calculateClientValueGrowthRate(
                          tier, 
                          getClientNames().salesChannel, 
                          getClientNames().advertiserName, 
                          getClientNames().agencyName
                        ))}
                      </td>
                    ))}
                  </tr>
                  
                  {/* Incentive Cost Growth Rate Row */}
                  <tr>
                    <td className="border border-gray-300 p-3 font-medium">Incentive Cost Growth Rate</td>
                    <td className="border border-gray-300 p-3 text-center text-gray-500">--</td>
                    {dealTiers.map((tier) => (
                      <td key={tier.tierNumber} className="border border-gray-300 p-3 text-center text-green-600 font-medium">
                        {formatPercentage(dealCalculations.calculateCostGrowthRate(
                          tier, 
                          getClientNames().salesChannel, 
                          getClientNames().advertiserName, 
                          getClientNames().agencyName
                        ))}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Approval Requirements */}
      {currentApprover && (
        <ApprovalAlert
          totalValue={0}
          contractTerm={12}
          dealType="grow"
          salesChannel="independent_agency"
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