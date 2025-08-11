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
  growthOpportunityMIQ?: string;
  growthOpportunityClient?: string;
  clientAsks?: string;
  growthAmbition?: number;
  businessContext?: string;
  requestType?: string;
  // We need to be compatible with both SubmitDeal and RequestSupport form structures
  [key: string]: any;
}

interface BusinessContextSectionProps {
  form: UseFormReturn<BusinessContextFormValues>;
  variant?: "submitDeal" | "requestSupport";
}

export function BusinessContextSection({ form, variant = "submitDeal" }: BusinessContextSectionProps) {
  const isRequestSupport = variant === "requestSupport";
  return (
    <CardContent className="p-6">
      <FormSectionHeader
        title={isRequestSupport ? "Request Details" : "Business Context"}
        description={isRequestSupport 
          ? "Specify the type of assistance needed and provide business context"
          : "Provide detailed information about the growth opportunity and client requirements"
        }
      />

      <div className="space-y-6">
        {/* Request Support specific fields */}
        {isRequestSupport && (
          <>
            <FormField
              control={form.control}
              name="requestType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Request Type <span className="text-red-500">*</span>
                  </FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value || ""}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select the type of assistance needed" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="scoping">Deal Scoping & Strategy</SelectItem>
                      <SelectItem value="pricing">Pricing & Structure</SelectItem>
                      <SelectItem value="technical">Technical Requirements</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    What type of assistance do you need with this deal?
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

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

            <FormField
              control={form.control}
              name="businessContext"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Business Context <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Provide context about the opportunity, client needs, and what assistance you're seeking..."
                      className="resize-none"
                      rows={6}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Describe the business opportunity, client requirements, and the specific help you need from our partnership team.
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