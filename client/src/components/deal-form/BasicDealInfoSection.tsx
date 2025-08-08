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

          {/* Deal Type with detailed cards */}
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="dealType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Deal Type <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Grow Deal Type Card */}
                      <Card
                        className={`cursor-pointer transition-all hover:shadow-md ${field.value === "grow" ? "ring-2 ring-purple-600 shadow-md" : "border border-slate-200"}`}
                        onClick={() => field.onChange("grow")}
                      >
                        <div className="p-4 pb-2">
                          <div className="text-md flex items-center space-x-2">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="18"
                              height="18"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className="text-green-600"
                            >
                              <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
                              <polyline points="17 6 23 6 23 12"></polyline>
                            </svg>
                            <span>Grow</span>
                          </div>
                          <p className="text-sm text-slate-500 mb-2">20%+ YOY Growth</p>
                        </div>
                        <div className="p-4 pt-0">
                          <p className="text-sm text-slate-600">
                            For existing clients with strong growth potential. Focuses on exceeding 20%
                            year-over-year revenue growth through expanded product usage or new business units.
                          </p>
                        </div>
                      </Card>

                      {/* Protect Deal Type Card */}
                      <Card
                        className={`cursor-pointer transition-all hover:shadow-md ${field.value === "protect" ? "ring-2 ring-purple-600 shadow-md" : "border border-slate-200"}`}
                        onClick={() => field.onChange("protect")}
                      >
                        <div className="p-4 pb-2">
                          <div className="text-md flex items-center space-x-2">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="18"
                              height="18"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className="text-blue-600"
                            >
                              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                              <circle cx="12" cy="7" r="4"></circle>
                            </svg>
                            <span>Protect</span>
                          </div>
                          <p className="text-sm text-slate-500 mb-2">Large Account Retention</p>
                        </div>
                        <div className="p-4 pt-0">
                          <p className="text-sm text-slate-600">
                            Designed for strategic account retention, especially for large enterprise clients.
                            Focuses on maintaining current revenue levels while ensuring long-term partnership stability.
                          </p>
                        </div>
                      </Card>

                      {/* Custom Deal Type Card */}
                      <Card
                        className={`cursor-pointer transition-all hover:shadow-md ${field.value === "custom" ? "ring-2 ring-purple-600 shadow-md" : "border border-slate-200"}`}
                        onClick={() => field.onChange("custom")}
                      >
                        <div className="p-4 pb-2">
                          <div className="text-md flex items-center space-x-2">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="18"
                              height="18"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className="text-purple-600"
                            >
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                            </svg>
                            <span>Custom</span>
                          </div>
                          <p className="text-sm text-slate-500 mb-2">Special Requirements</p>
                        </div>
                        <div className="p-4 pt-0">
                          <p className="text-sm text-slate-600">
                            For specialized deals requiring custom implementation, non-standard terms, or
                            unique technical requirements. Typically used for strategic partnerships and innovative projects.
                          </p>
                        </div>
                      </Card>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Deal Structure */}
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
                            return agency.type === "holding_company";
                          } else {
                            return agency.type === "independent";
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
        </div>
      </CardContent>
    </Card>
  );
}