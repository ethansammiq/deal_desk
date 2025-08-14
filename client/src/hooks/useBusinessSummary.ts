import { useEffect } from "react";
import { UseFormReturn } from "react-hook-form";

interface UseBusinessSummaryProps {
  form: UseFormReturn<any>;
  formValues: any;
}

/**
 * Custom hook to auto-generate business summary from form fields
 */
export function useBusinessSummary({ form, formValues }: UseBusinessSummaryProps) {
  useEffect(() => {
    const generateBusinessSummary = () => {
      const parts = [];
      
      if (formValues.growthOpportunityMIQ) {
        parts.push(`Growth Opportunity (MIQ): ${formValues.growthOpportunityMIQ}`);
      }
      
      if (formValues.growthOpportunityClient) {
        parts.push(`Growth Opportunity (Client): ${formValues.growthOpportunityClient}`);
      }
      
      if (formValues.clientAsks) {
        parts.push(`Client Requirements: ${formValues.clientAsks}`);
      }
      
      if (parts.length > 0) {
        const autoSummary = parts.join(' | ');
        // Only update if business summary is empty or different
        if (!formValues.businessSummary || formValues.businessSummary !== autoSummary) {
          form.setValue('businessSummary', autoSummary);
        }
      }
    };

    generateBusinessSummary();
  }, [formValues.growthOpportunityMIQ, formValues.growthOpportunityClient, formValues.clientAsks, form, formValues.businessSummary]);
}