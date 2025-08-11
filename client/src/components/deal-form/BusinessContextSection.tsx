import React from "react";
import { UseFormReturn } from "react-hook-form";
import { CardContent } from "@/components/ui/card";
import { FormSectionHeader } from "@/components/ui/form-style-guide";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
} from "@/components/ui/form";

// Interface for business context form values - matching SubmitDeal form structure
interface BusinessContextFormValues {
  growthOpportunityMIQ: string;
  growthAmbition: number;
  growthOpportunityClient: string;
  clientAsks?: string;
  // We need to be compatible with SubmitDeal's broader form structure
  [key: string]: any;
}

interface BusinessContextSectionProps {
  form: UseFormReturn<BusinessContextFormValues>;
}

export function BusinessContextSection({ form }: BusinessContextSectionProps) {
  return (
    <CardContent className="p-6">
      <FormSectionHeader
        title="Business Context"
        description="Provide detailed information about the growth opportunity and client requirements"
      />

      <div className="space-y-6">
        {/* Growth Opportunity (MIQ) */}
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
                Growth ambition must be at least $1M. What revenue target are we aiming for in 2025?
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Growth Opportunity (Client) */}
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

        {/* Client Asks */}
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
      </div>
    </CardContent>
  );
}