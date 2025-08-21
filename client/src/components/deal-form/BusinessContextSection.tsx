import React from "react";
import { UseFormReturn } from "react-hook-form";
import { CardContent } from "@/components/ui/card";
import { FormSectionHeader } from "@/components/ui/form-style-guide";
import { FormFieldWithTooltip } from "@/components/ui/form-components";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

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
  contractTerm?: string;
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
          <FormFieldWithTooltip
            form={form}
            name="growthAmbition"
            label="2025 Growth Ambition ($)"
            type="number"
            min={1000000}
            placeholder="Enter amount (minimum $1M)"
            required
            tooltip="Minimum $1M growth target required for partnership team review"
            description="Growth ambition must be at least $1M for partnership team review."
          />

          {/* Growth Opportunity MIQ */}
          <FormFieldWithTooltip
            form={form}
            name="growthOpportunityMIQ"
            label="Growth Opportunity (MIQ)"
            type="textarea"
            placeholder="Describe the pathway to growth from our perspective..."
            required
            tooltip="Explain the specific growth pathway and how we can contribute to success"
            description="Explain how this opportunity represents growth potential for our business and what we can offer to drive success."
          />

          {/* Growth Opportunity Client */}
          <FormFieldWithTooltip
            form={form}
            name="growthOpportunityClient"
            label="Growth Opportunity (Client)"
            type="textarea"
            placeholder="Describe the pathway to growth from the client's perspective..."
            required
            tooltip="Focus on client benefits, success metrics, and partnership value"
            description="Explain how this partnership will drive growth for the client's business and help them achieve their goals."
          />

          {/* Client Asks */}
          <FormFieldWithTooltip
            form={form}
            name="clientAsks"
            label="Client Asks"
            type="textarea"
            placeholder="What specific requirements or needs does the client have..."
            required
            tooltip="Document specific client requirements, expectations, and resource requests"
            description="Detail the client's specific requirements, expectations, and any unique needs for this partnership."
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
            <FormFieldWithTooltip
              form={form}
              name="growthAmbition"
              label="2025 Growth Ambition ($)"
              type="number"
              min={1000000}
              placeholder="Enter amount (minimum $1M)"
              required
              tooltip="Minimum $1M growth target required for partnership team review"
              description="Growth ambition must be at least $1M for partnership team review."
            />
          </>
        )}

        {/* Submit Deal specific fields */}
        {!isRequestSupport && (
          <>
            <FormFieldWithTooltip
              form={form}
              name="growthOpportunityMIQ"
              label="Growth Opportunity (MIQ)"
              type="textarea"
              placeholder="Describe the pathway to growth from our perspective..."
              required
              tooltip="Explain the specific growth pathway and how we can contribute to success"
              description="What's the pathway to growth from our perspective? Include market opportunities, strategic advantages, and revenue potential."
            />

            <FormFieldWithTooltip
              form={form}
              name="growthOpportunityClient"
              label="Growth Opportunity (Client)"
              type="textarea"
              placeholder="Describe how the client is looking to grow their business AND with MIQ..."
              required
              tooltip="Focus on client benefits, success metrics, and partnership value"
              description="How is the client looking to grow their business AND with MIQ? Include their objectives, challenges, and expectations."
            />

            <FormFieldWithTooltip
              form={form}
              name="clientAsks"
              label="Client Asks"
              type="textarea"
              placeholder="Describe what the client has asked from us (if applicable)..."
              tooltip="Document specific client requirements, expectations, and resource requests"
              description="What has the client specifically asked from us? Include special requirements, custom solutions, or specific deliverables."
            />
          </>
        )}
      </div>
    </CardContent>
  );
}