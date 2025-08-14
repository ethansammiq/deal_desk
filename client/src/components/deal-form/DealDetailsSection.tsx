import React from "react";
import { UseFormReturn } from "react-hook-form";

import { FormSectionHeader } from "@/components/ui/form-style-guide";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
// Date formatting no longer needed - using ISO 8601 strings directly
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { DealTypeCardSelector } from "@/components/shared/DealTypeCardSelector";
import { ClientInfoSection } from "@/components/shared/ClientInfoSection";
import { AdvertiserData, AgencyData } from "@shared/types";

// Enhanced interface to support all form contexts (BasicDealInfo + DealDetails)
interface DealDetailsFormValues {
  // Basic deal fields
  dealType?: "custom" | "grow" | "protect";
  dealStructure?: "tiered" | "flat_commit";
  contractTermMonths?: string | number;
  termStartDate?: Date | string | null;
  termEndDate?: Date | string | null;
  businessSummary?: string;
  
  // Client information fields (from BasicDealInfoSection)
  region?: string;
  salesChannel?: string;
  advertiserName?: string;
  agencyName?: string;
  
  // Allow additional fields for different form types
  [key: string]: any;
}

interface DealDetailsSectionProps {
  form: UseFormReturn<DealDetailsFormValues>;
  dealStructureType: "tiered" | "flat_commit" | "";
  setDealStructure: (value: "tiered" | "flat_commit" | "") => void;
  nextStep?: () => void;
  
  // Client information props (from BasicDealInfoSection)
  agencies?: AgencyData[];
  advertisers?: AdvertiserData[];
  salesChannel?: string;
  
  // Configuration props to control which fields are shown
  showClientInfo?: boolean;
  showBusinessSummary?: boolean;
  showDealStructure?: boolean;
  showNavigationButton?: boolean;
  title?: string;
  description?: string;
}

export function DealDetailsSection({
  form,
  dealStructureType,
  setDealStructure,
  nextStep,
  agencies = [],
  advertisers = [],
  salesChannel,
  showClientInfo = false,
  showBusinessSummary = true,
  showDealStructure = true,
  showNavigationButton = true,
  title = "Deal Details",
  description = "Configure the deal type, structure, and timeline",
}: DealDetailsSectionProps) {
  return (
    <div className="p-6">
      <FormSectionHeader
        title={title}
        description={description}
      />

      <div className="space-y-6">
        {/* Client Information Section - Conditional */}
        {showClientInfo && agencies && advertisers && (
          <ClientInfoSection
            form={form}
            agencies={agencies}
            advertisers={advertisers}
            salesChannel={salesChannel}
            layout="grid"
          />
        )}

        {/* Deal Type - Using Shared Component */}
        <DealTypeCardSelector
          form={form}
          name="dealType"
          label="Deal Type"
          required={true}
        />

        {/* Deal Structure - Conditional */}
        {showDealStructure && (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <FormField
            control={form.control}
            name="dealStructure"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Deal Structure <span className="text-red-500">*</span>
                </FormLabel>
                <Select
                  onValueChange={(value) => {
                    field.onChange(value);
                    setDealStructure(value as "tiered" | "flat_commit" | "");
                  }}
                  value={field.value || ""}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose tiered or flat commit structure" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="tiered">Tiered Revenue</SelectItem>
                    <SelectItem value="flat_commit">Flat Commit</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>
                  The revenue structure for this deal
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="contractTermMonths"
            render={({ field }) => {
              // Auto-calculate contract term when dates change
              const startDate = form.watch("termStartDate");
              const endDate = form.watch("termEndDate");
              
              React.useEffect(() => {
                if (startDate && endDate && startDate < endDate) {
                  const start = new Date(startDate);
                  const end = new Date(endDate);
                  const monthsDiff = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 30.44));
                  if (monthsDiff !== parseInt(String(field.value) || "0")) {
                    field.onChange(monthsDiff.toString());
                  }
                }
              }, [startDate, endDate, field]);

              return (
                <FormItem>
                  <FormLabel>
                    Contract Term (Months) <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="14"
                      value={field.value || ""}
                      onChange={(e) => {
                        const months = parseInt(e.target.value) || 0;
                        field.onChange(e.target.value);
                        // Auto-calculate end date based on start date + months
                        const startDate = form.getValues("termStartDate");
                        if (startDate && months > 0) {
                          const startDateObj = new Date(startDate);
                          startDateObj.setMonth(startDateObj.getMonth() + months);
                          form.setValue("termEndDate", startDateObj.toISOString().split('T')[0]);
                        }
                      }}
                    />
                  </FormControl>
                  <FormDescription>
                    Length of the contract in months (auto-calculated from dates)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              );
            }}
          />
          </div>
        )}

        {/* Date Range Selection */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <FormField
            control={form.control}
            name="termStartDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Deal Start Date <span className="text-red-500">*</span>
                </FormLabel>
                <FormControl>
                  <Input
                    type="date"
                    value={field.value instanceof Date ? field.value.toISOString().split('T')[0] : (field.value || "")}
                    onChange={(e) => {
                      const dateString = e.target.value;
                      field.onChange(dateString);
                      
                      // Auto-update end date if contract term is set
                      const contractTermMonths = parseInt(String(form.getValues("contractTermMonths")) || "0");
                      if (dateString && contractTermMonths > 0) {
                        const startDate = new Date(dateString);
                        startDate.setMonth(startDate.getMonth() + contractTermMonths);
                        form.setValue("termEndDate", startDate.toISOString().split('T')[0]);
                      }
                    }}
                  />
                </FormControl>
                <FormDescription>
                  When the deal term begins
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="termEndDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Deal End Date <span className="text-red-500">*</span>
                </FormLabel>
                <FormControl>
                  <Input
                    type="date"
                    value={field.value instanceof Date ? field.value.toISOString().split('T')[0] : (field.value || "")}
                    onChange={(e) => {
                      const dateString = e.target.value;
                      field.onChange(dateString);
                      
                      // Auto-update contract term when end date changes
                      const startDate = form.getValues("termStartDate");
                      if (startDate && dateString && startDate < dateString) {
                        const start = new Date(startDate);
                        const end = new Date(dateString);
                        const monthsDiff = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 30.44));
                        form.setValue("contractTermMonths", monthsDiff.toString());
                      }
                    }}
                  />
                </FormControl>
                <FormDescription>
                  When the deal term ends
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Business Summary moved to ReviewSubmitSection with auto-population */}

        {/* Navigation Button - Conditional */}
        {showNavigationButton && nextStep && (
          <div className="flex justify-end pt-4">
            <Button
              type="button"
              onClick={nextStep}
            >
              Next: Business Context
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}