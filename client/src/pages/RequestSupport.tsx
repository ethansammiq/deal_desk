import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Info, InfoIcon } from "lucide-react";
import { useLocation } from "wouter";
import { FormSectionHeader, FormProgressTracker, FormStyles, FormNavigation } from "@/components/ui/form-style-guide";
import { DealOverviewStep } from "@/components/shared/DealOverviewStep";
import { BusinessContextSection } from "@/components/deal-form/BusinessContextSection";
import { useDealFormValidation, type DealFormData } from "@/hooks/useDealFormValidation";
import { processDealScopingData } from "@/utils/form-data-processing";
import { useClientData } from "@/hooks/useClientData";
import { useTabNavigation } from "@/hooks/useTabNavigation";
import { AdvertiserData, AgencyData } from "@shared/types";

// Schema for deal scoping requests
// Simplified schema - fields now handled by shared components
const dealScopingSchema = z.object({
  // Allow any fields from shared components - validation handled by components
}).passthrough();

type DealScopingFormValues = z.infer<typeof dealScopingSchema>;

// Define tab configuration for RequestSupport
const REQUEST_SUPPORT_TABS = [
  { id: "deal-overview", label: "Deal Overview", stepNumber: 1 },
  { id: "business-context", label: "Business Context", stepNumber: 2 }
];

export default function RequestSupport() {
  const { toast } = useToast();
  const [, navigate] = useLocation();

  // ✅ PHASE 2: Using shared client data hook
  const { agencies, advertisers, isLoading: isLoadingClientData, error: clientDataError } = useClientData();
  
  // Deal structure state for DealDetailsSection
  const [dealStructureType, setDealStructureType] = useState<"tiered" | "flat_commit" | "">("");

  const form = useForm<any>({
    resolver: zodResolver(dealScopingSchema),
    defaultValues: {
      salesChannel: "",
      region: undefined,
      advertiserName: "",
      agencyName: "",
      dealType: undefined,
      dealStructure: undefined,
      contractTerm: 12,
      termStartDate: undefined,
      termEndDate: undefined,
      growthAmbition: 1000000,
      growthOpportunityMIQ: "",
      growthOpportunityClient: "",
      clientAsks: "",

    },
    mode: "onChange",
  });

  // ✅ SYNCHRONIZED: Form validation hook for RequestSupport
  const formValidation = useDealFormValidation(form, {
    enableAutoAdvance: false,
    validateOnChange: true,
    formType: 'requestSupport' // Use RequestSupport form steps (3 steps max)
  });

  // ✅ PHASE 3: Using shared tab navigation hook
  const {
    activeTab,
    goToNextTab,
    goToPrevTab,
    goToTab,
    getNextTabLabel,
    getPreviousTabLabel,
    isLastTab
  } = useTabNavigation(
    REQUEST_SUPPORT_TABS,
    "deal-overview",
    (targetStep) => formValidation.canAdvanceToStep(targetStep)
  );

  // Create deal scoping request mutation
  const createDealScopingRequest = useMutation({
    mutationFn: async (data: DealScopingFormValues) => {
      console.log("Submitting deal scoping request:", data);

      // ✅ REFACTORED: Using shared data processing utility
      const formData = processDealScopingData(data);

      const res = await fetch("/api/deal-scoping-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
        credentials: "include",
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`${res.status}: ${errorText || res.statusText}`);
      }

      return await res.json();
    },
    onSuccess: (scopingRequest) => {
      toast({
        title: "Request Submitted",
        description: "Your deal scoping request has been submitted successfully. Would you like to convert it to a full deal submission?",
        action: (
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/submit-deal?from-scoping=${scopingRequest.id}`)}
          >
            Convert to Deal
          </Button>
        ),
      });

      // Reset form and return to dashboard
      form.reset();
      navigate("/dashboard");

      // Clear cached data
      queryClient.invalidateQueries({
        queryKey: ["/api/deal-scoping-requests"],
      });
    },
    onError: (error) => {
      toast({
        title: "Error Submitting Request",
        description:
          "There was an error submitting your request. Please try again.",
        variant: "destructive",
      });
    },
  });

  async function onSubmit(data: DealScopingFormValues) {
    createDealScopingRequest.mutate(data);
  }

  function goToDealSubmission() {
    navigate("/submit-deal");
  }

  // ✅ PHASE 2: Data fetching now handled by useClientData hook

  return (
    <div className="min-h-screen bg-slate-50">
      
      <div className="p-6 rounded-lg bg-white shadow-md">
        {/* Standardized Form Section Header */}
      <FormSectionHeader
        title="Deal Scoping"
        description="New to the deal process? Start here to get help with scoping, pricing, or technical aspects of your deals."
        helpTitle="About Deal Scoping"
        helpContent={
          <>
            <p className="text-sm text-slate-700">
              Deal scoping is the first step in our deal process:
            </p>
            <ol className={FormStyles.help.list}>
              <li>Our partnership team reviews your request</li>
              <li>A team member contacts you to schedule a discovery call</li>
              <li>Together, we craft a tailored proposal</li>
              <li>Once aligned, you can proceed to deal submission</li>
            </ol>
            <p className="text-sm text-slate-700 mt-2">
              For assistance, contact the partnership team at
              partnerships@example.com
            </p>
          </>
        }
      />

      {/* ✅ PHASE 3: Simplified Form Progress Tracker using shared navigation */}
      <FormProgressTracker
        steps={REQUEST_SUPPORT_TABS}
        currentStep={activeTab}
        onStepClick={(stepId) => goToTab(String(stepId))}
      />

      {/* Form Card */}
      <Card className="border border-slate-200">
        <CardContent className="p-6">
          <Form {...form}>
            <Tabs
              value={activeTab}
              onValueChange={goToTab}
              className="w-full"
            >
              <TabsContent value="deal-overview" className="space-y-6 pt-4">
                <DealOverviewStep
                  form={form}
                  agencies={agencies}
                  advertisers={advertisers}
                  salesChannel={form.watch("salesChannel")}
                  dealStructureType={dealStructureType}
                  setDealStructure={(value) => {
                    setDealStructureType(value);
                    form.setValue("dealStructure", value as "tiered" | "flat_commit");
                  }}
                  layout="tabs"
                  includeEmail={false}
                  showNavigation={false}
                />
              </TabsContent>

              <TabsContent
                value="business-context"
                className="space-y-0"
              >
                <BusinessContextSection form={form as any} variant="requestSupport" />
              </TabsContent>
            </Tabs>
          </Form>
        </CardContent>
      </Card>

      {/* ✅ PHASE 3: Navigation using shared tab navigation labels */}
      <FormNavigation
        variant={isLastTab() ? "submit" : "next"}
        onPrevious={isLastTab() ? goToPrevTab : undefined}
        onNext={!isLastTab() ? goToNextTab : undefined}
        onSubmit={isLastTab() ? form.handleSubmit(onSubmit) : undefined}
        previousLabel={getPreviousTabLabel()}
        nextLabel={getNextTabLabel()}
        submitLabel="Submit Request"
        isSubmitting={createDealScopingRequest.isPending}
        showBorder={false}
      />
      </div>
    </div>
  );
}
