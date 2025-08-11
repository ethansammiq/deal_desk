import React from "react";
import { UseFormReturn } from "react-hook-form";
import { CardContent } from "@/components/ui/card";
import { FormSectionHeader } from "@/components/ui/form-style-guide";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
} from "@/components/ui/form";

// Interface for business context form values - compatible with both forms
interface BusinessContextFormValues {
  // Shared growth opportunity fields
  growthOpportunityMIQ?: string;
  growthOpportunityClient?: string;
  clientAsks?: string;
  // RequestSupport-specific fields
  growthAmbition?: number;
  // Common fields that both forms may have
  salesChannel?: string;
  region?: "northeast" | "midwest" | "midatlantic" | "west" | "south";
  dealType?: "custom" | "grow" | "protect";
  dealStructure?: "tiered" | "flat_commit";
  termStartDate?: Date;
  termEndDate?: Date;
  contractTermMonths?: string;
  advertiserName?: string;
  agencyName?: string;
  // We need to be compatible with both SubmitDeal and RequestSupport form structures
  [key: string]: any;
}

interface BusinessContextSectionProps {
  form: UseFormReturn<BusinessContextFormValues>;
  variant?: "submitDeal" | "requestSupport";
}

export function BusinessContextSection({ form, variant = "submitDeal" }: BusinessContextSectionProps) {
  const isRequestSupport = variant === "requestSupport";
  
  if (isRequestSupport) {
    // For RequestSupport, don't wrap in CardContent since it's inside TabsContent
    return (
      <div className="space-y-6 p-6">
        <FormSectionHeader
          title="Growth Opportunity"
          description="Provide detailed information about the growth opportunity and client requirements"
        />
        <div className="space-y-6">
          {/* Growth Ambition */}
          <FormField
            control={form.control}
            name="growthAmbition"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  2025 Growth Ambition ($) <span className="text-red-500">*</span>
                </FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="1000000"
                    placeholder="Enter amount (minimum $1M)"
                    {...field}
                    onChange={(e) =>
                      field.onChange(parseFloat(e.target.value))
                    }
                  />
                </FormControl>
                <FormDescription>
                  Growth ambition must be at least $1M for partnership team review.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Growth Opportunity MIQ */}
          <FormField
            control={form.control}
            name="growthOpportunityMIQ"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Growth Opportunity (MIQ) <span className="text-red-500">*</span>
                </FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Describe the pathway to growth from our perspective..."
                    className="resize-none"
                    rows={4}
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Explain how this opportunity represents growth potential for our business and what we can offer to drive success.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Growth Opportunity Client */}
          <FormField
            control={form.control}
            name="growthOpportunityClient"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Growth Opportunity (Client) <span className="text-red-500">*</span>
                </FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Describe the pathway to growth from the client's perspective..."
                    className="resize-none"
                    rows={4}
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Explain how this partnership will drive growth for the client's business and help them achieve their goals.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Client Asks */}
          <FormField
            control={form.control}
            name="clientAsks"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Client Asks <span className="text-red-500">*</span>
                </FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="What specific requirements or needs does the client have..."
                    className="resize-none"
                    rows={4}
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Detail the client's specific requirements, expectations, and any unique needs for this partnership.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>
    );
  }
  
  // For SubmitDeal, keep the CardContent wrapper
  return (
    <CardContent className="p-6">
      <FormSectionHeader
        title="Business Context"
        description="Provide detailed information about the growth opportunity and client requirements"
      />

      <div className="space-y-6">
        {/* Request Support specific fields */}
        {isRequestSupport && (
          <>
            <FormField
              control={form.control}
              name="growthAmbition"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    2025 Growth Ambition ($) <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="1000000"
                      placeholder="Enter amount (minimum $1M)"
                      {...field}
                      onChange={(e) =>
                        field.onChange(parseFloat(e.target.value))
                      }
                    />
                  </FormControl>
                  <FormDescription>
                    Growth ambition must be at least $1M for partnership team review.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        )}

        {/* Submit Deal specific fields */}
        {!isRequestSupport && (
          <>
            <FormField
              control={form.control}
              name="growthOpportunityMIQ"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Growth Opportunity (MIQ) <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe the pathway to growth from our perspective..."
                      className="resize-none"
                      rows={4}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    What's the pathway to growth from our perspective? Include market opportunities, strategic advantages, and revenue potential.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="growthOpportunityClient"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Growth Opportunity (Client) <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe how the client is looking to grow their business AND with MIQ..."
                      className="resize-none"
                      rows={4}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    How is the client looking to grow their business AND with MIQ? Include their objectives, challenges, and expectations.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="clientAsks"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Client Asks</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe what the client has asked from us (if applicable)..."
                      className="resize-none"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    What has the client specifically asked from us? Include special requirements, custom solutions, or specific deliverables.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        )}
      </div>
    </CardContent>
  );
}