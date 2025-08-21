import React from "react";
import { UseFormReturn } from "react-hook-form";
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
import { FormFieldWithTooltip, FormSelectField } from "@/components/ui/form-components";

// Import shared type definitions
import { AdvertiserData, AgencyData } from "@shared/types";

interface ClientInfoSectionProps {
  form: UseFormReturn<any>;
  agencies: AgencyData[];
  advertisers: AdvertiserData[];
  salesChannel?: string;
  includeEmail?: boolean;
  emailLabel?: string;
  emailPlaceholder?: string;
  layout?: "grid" | "stacked";
}

export function ClientInfoSection({
  form,
  agencies,
  advertisers,
  salesChannel,
  includeEmail = false,
  emailLabel = "Email Address",
  emailPlaceholder = "your.email@company.com",
  layout = "grid",
}: ClientInfoSectionProps) {
  const gridClass = layout === "grid" ? "grid grid-cols-1 gap-6 md:grid-cols-2" : "space-y-6";

  return (
    <div className="space-y-6">
      {/* Email field (optional) */}
      {includeEmail && (
        <FormFieldWithTooltip
          form={form}
          name="email"
          label={emailLabel}
          type="email"
          placeholder={emailPlaceholder}
          tooltip="Contact email address for deal communications"
        />
      )}

      {/* Region and Sales Channel */}
      <div className={gridClass}>
        <FormSelectField
          form={form}
          name="region"
          label="Region"
          placeholder="Select region"
          required
          tooltip="Geographic region for this client relationship"
          options={[
            { value: "northeast", label: "Northeast" },
            { value: "midwest", label: "Midwest" },
            { value: "midatlantic", label: "Mid-Atlantic" },
            { value: "south", label: "South" },
            { value: "west", label: "West" }
          ]}
        />

        <FormSelectField
          form={form}
          name="salesChannel"
          label="Sales Channel"
          placeholder="Select sales channel"
          required
          tooltip="How this deal will be managed - direct with client or through agency"
          options={[
            { value: "client_direct", label: "Client Direct" },
            { value: "holding_company", label: "Holding Company" },
            { value: "independent_agency", label: "Independent Agency" }
          ]}
          onValueChange={(value) => {
            // Reset related fields when changing sales channel
            if (value === "client_direct" || value === "Client Direct") {
              form.setValue("agencyName", "");
            } else {
              form.setValue("advertiserName", "");
            }
          }}
        />
      </div>

      {/* Conditional Client/Agency Selection */}
      <div className="grid grid-cols-1 gap-6">
        {(salesChannel === "client_direct" || salesChannel === "Client Direct") && (
          <FormField
            control={form.control}
            name="advertiserName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Advertiser Name <span className="text-red-500">*</span>
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
                      <SelectItem key={advertiser.name} value={advertiser.name}>
                        {advertiser.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>
                  Historical data will be loaded automatically when selected
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {(salesChannel === "holding_company" || salesChannel === "independent_agency" || 
          salesChannel === "Holding Company" || salesChannel === "Independent Agency") && (
          <FormField
            control={form.control}
            name="agencyName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Agency Name <span className="text-red-500">*</span>
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
                        // Handle both underscore and space formats for sales channel values
                        if (salesChannel === "holding_company" || salesChannel === "Holding Company") {
                          return agency.type === "holding_company" || agency.type === "holding company";
                        } else if (salesChannel === "independent_agency" || salesChannel === "Independent Agency") {
                          return agency.type === "independent" || agency.type === "independent agency";
                        }
                        return false;
                      })
                      .map((agency) => (
                        <SelectItem key={agency.name} value={agency.name}>
                          {agency.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                <FormDescription>
                  Historical data will be loaded automatically when selected
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
      </div>
    </div>
  );
}