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
import { Input } from "@/components/ui/input";

interface AgencyData {
  id: string | number;
  name: string;
  type: string;
  tier?: string;
  region: string;
  previousYearRevenue?: number;
  previousYearMargin?: number;
}

interface AdvertiserData {
  id: string | number;
  name: string;
  tier?: string;
  region: string;
  previousYearRevenue?: number;
  previousYearMargin?: number;
}

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
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{emailLabel}</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder={emailPlaceholder}
                  value={field.value || ""}
                  onChange={field.onChange}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      )}

      {/* Region and Sales Channel */}
      <div className={gridClass}>
        <FormField
          control={form.control}
          name="region"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Region <span className="text-red-500">*</span>
              </FormLabel>
              <Select
                onValueChange={field.onChange}
                value={field.value || ""}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select region" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="northeast">Northeast</SelectItem>
                  <SelectItem value="midwest">Midwest</SelectItem>
                  <SelectItem value="midatlantic">Mid-Atlantic</SelectItem>
                  <SelectItem value="south">South</SelectItem>
                  <SelectItem value="west">West</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="salesChannel"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Sales Channel <span className="text-red-500">*</span>
              </FormLabel>
              <Select
                onValueChange={(value) => {
                  field.onChange(value);
                  // Reset related fields when changing sales channel
                  if (value === "client_direct") {
                    form.setValue("agencyName", "");
                  } else {
                    form.setValue("advertiserName", "");
                  }
                }}
                value={field.value || ""}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select sales channel" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="client_direct">Client Direct</SelectItem>
                  <SelectItem value="holding_company">Holding Company</SelectItem>
                  <SelectItem value="independent_agency">Independent Agency</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Conditional Client/Agency Selection */}
      <div className="grid grid-cols-1 gap-6">
        {salesChannel === "client_direct" && (
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
                      <SelectItem key={advertiser.id} value={advertiser.name}>
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

        {(salesChannel === "holding_company" || salesChannel === "independent_agency") && (
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
        )}
      </div>
    </div>
  );
}