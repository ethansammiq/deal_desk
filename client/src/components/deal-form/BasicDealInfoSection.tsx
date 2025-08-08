import React from "react";
import { UseFormReturn } from "react-hook-form";
import { Card, CardContent } from "@/components/ui/card";
import { FormSectionHeader } from "@/components/ui/form-style-guide";
import {
  FormFieldWithTooltip,
  FormSelectField,
  ConditionalFieldGroup,
  FinancialInputGroup,
  DateRangeInput,
  REGION_OPTIONS,
  SALES_CHANNEL_OPTIONS,
  DEAL_TYPE_OPTIONS,
  DEAL_STRUCTURE_OPTIONS,
} from "@/components/ui/form-components";
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

// Type this component to accept any valid form structure
type BasicDealInfoFormValues = any;

interface AdvertiserData {
  id: number;
  name: string;
  region: string;
  previousYearRevenue?: number;
  previousYearMargin?: number;
}

interface AgencyData {
  id: number;
  name: string;
  type: string;
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
}

export function BasicDealInfoSection({
  form,
  salesChannel,
  dealStructureType,
  setDealStructure,
  agencies,
  advertisers,
}: BasicDealInfoSectionProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <FormSectionHeader
          title="Basic Deal Information"
          description="Provide the basic details about this commercial deal"
        />

        <div className="space-y-6">
          {/* Region and Sales Channel using shared components */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <FormSelectField
              form={form}
              name="region"
              label="Region"
              placeholder="Select your region"
              description="Your geographical sales region"
              tooltip="Choose the region where this deal will be executed"
              options={REGION_OPTIONS}
              required
            />

            <FormSelectField
              form={form}
              name="salesChannel"
              label="Sales Channel"
              placeholder="Select sales channel"
              description="How this deal will be structured from a sales perspective"
              tooltip="Determines the approval workflow and client relationship structure"
              options={SALES_CHANNEL_OPTIONS}
              required
            />
          </div>

          {/* Deal Type and Structure using shared components */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <FormSelectField
              form={form}
              name="dealType"
              label="Deal Type"
              placeholder="Select deal type"
              description="The strategic intent of this deal"
              tooltip="Grow deals focus on expansion, Protect on retention, Custom on unique scenarios"
              options={DEAL_TYPE_OPTIONS}
              required
            />

            <FormSelectField
              form={form}
              name="dealStructure"
              label="Deal Structure"
              placeholder="Choose tiered or flat commit structure"
              description="The revenue structure for this deal"
              tooltip="Tiered structures have performance-based incentives, flat commits are fixed"
              options={DEAL_STRUCTURE_OPTIONS}
              onValueChange={(value) => setDealStructure(value as "tiered" | "flat_commit")}
              required
            />
          </div>

          {/* Conditional Client/Agency Selection using shared components */}
          <ConditionalFieldGroup condition={salesChannel === "client_direct"}>
            <FormField
              control={form.control}
              name="advertiserName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Advertiser <span className="text-red-500">*</span>
                  </FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value || ""}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select advertiser" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {advertisers.map((advertiser) => (
                        <SelectItem key={advertiser.id} value={advertiser.name}>
                          {advertiser.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    The advertiser for this direct client deal
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </ConditionalFieldGroup>

          <ConditionalFieldGroup 
            condition={salesChannel === "holding_company" || salesChannel === "independent_agency"}
          >
            <FormField
              control={form.control}
              name="agencyName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Agency <span className="text-red-500">*</span>
                  </FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value || ""}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select agency" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {agencies
                        .filter((agency) => {
                          if (salesChannel === "holding_company") {
                            return agency.type === "Holding Company";
                          } else {
                            return agency.type === "Independent";
                          }
                        })
                        .map((agency) => (
                          <SelectItem key={agency.id} value={agency.name}>
                            {agency.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    The agency for this deal
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </ConditionalFieldGroup>

          {/* Date Range using shared component */}
          <DateRangeInput
            form={form}
            startDateFieldName="termStartDate"
            endDateFieldName="termEndDate"
          />

          {/* Financial Information using shared component */}
          <FinancialInputGroup
            form={form}
            revenueFieldName="annualRevenue"
            marginFieldName="annualGrossMargin"
          />

          {/* Business Summary using shared component */}
          <FormFieldWithTooltip
            form={form}
            name="businessSummary"
            label="Business Summary"
            type="textarea"
            placeholder="Provide a brief summary of the business case for this deal..."
            description="Describe the strategic rationale and business value of this deal"
            tooltip="Include competitive landscape, market opportunity, and expected business outcomes"
            required
          />

          {/* Contact Email using shared component */}
          <FormFieldWithTooltip
            form={form}
            name="email"
            label="Contact Email"
            type="email"
            placeholder="your.email@company.com"
            description="Contact email for questions about this deal"
            tooltip="This email will be used for approval notifications and follow-up questions"
          />
        </div>
      </CardContent>
    </Card>
  );
}