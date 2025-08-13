import React from "react";
import { UseFormReturn } from "react-hook-form";
import { CardContent } from "@/components/ui/card";
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
import { ClientInfoSection } from "@/components/shared/ClientInfoSection";
import { DealTypeCardSelector } from "@/components/shared/DealTypeCardSelector";

// Interface definitions matching the original form structure
interface BasicDealInfoFormValues {
  region: string;
  salesChannel: string;
  advertiserName?: string;
  agencyName?: string;
  dealType: string;
  dealStructure: string;
  contractTermMonths?: string;
  termStartDate?: string;
  termEndDate?: string;
  businessSummary: string;
}

interface AgencyData {
  id: string;
  name: string;
  type: string;
  tier?: string;
  region: string;
  previousYearRevenue?: number;
  previousYearMargin?: number;
}

interface AdvertiserData {
  id: string;
  name: string;
  tier?: string;
  region: string;
  previousYearRevenue?: number;
  previousYearMargin?: number;
}

interface BasicDealInfoSectionProps {
  form: UseFormReturn<BasicDealInfoFormValues>;
  salesChannel: string | undefined;
  dealStructureType: "tiered" | "flat_commit" | "";
  setDealStructure: (value: "tiered" | "flat_commit" | "") => void;
  agencies: AgencyData[];
  advertisers: AdvertiserData[];
  nextStep: () => void;
}

export function BasicDealInfoSection({
  form,
  salesChannel,
  dealStructureType,
  setDealStructure,
  agencies,
  advertisers,
  nextStep,
}: BasicDealInfoSectionProps) {
  return (
    <CardContent className="p-6">
      <FormSectionHeader
        title="Basic Deal Information"
        description="Provide the basic details about this commercial deal"
      />

      <div className="space-y-6">
        {/* Client Information Section - Shared Component */}
        <ClientInfoSection
          form={form}
          agencies={agencies}
          advertisers={advertisers}
          salesChannel={salesChannel}
          layout="grid"
        />

        {/* Deal Type - Using Shared Component */}
        <DealTypeCardSelector
          form={form}
          name="dealType"
          label="Deal Type"
          required={true}
        />

        {/* Deal Structure */}
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
                  if (monthsDiff !== parseInt(field.value || "0")) {
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
                          const endDate = new Date(startDate);
                          endDate.setMonth(endDate.getMonth() + months);
                          // Convert to ISO date string (YYYY-MM-DD)
                          form.setValue("termEndDate", endDate.toISOString().split('T')[0]);
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
                    value={field.value || ""}
                    onChange={(e) => {
                      const dateString = e.target.value;
                      field.onChange(dateString);
                      
                      // Auto-update end date if contract term is set
                      const contractTermMonths = parseInt(form.getValues("contractTermMonths") || "0");
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
                    value={field.value || ""}
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

        {/* Business Summary */}
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
                  placeholder="Briefly describe the deal, its objectives, and any special considerations"
                  className="min-h-[100px]"
                  value={field.value || ""}
                  onChange={field.onChange}
                />
              </FormControl>
              <FormDescription>
                Briefly describe the business opportunity, growth potential, and any special considerations.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Navigation Button */}
        <div className="flex justify-end pt-4">
          <Button
            type="button"
            onClick={nextStep}
            className="bg-purple-600 hover:bg-purple-700"
          >
            Next: Value Structure
          </Button>
        </div>
      </div>
    </CardContent>
  );
}