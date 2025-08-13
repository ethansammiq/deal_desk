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
import { FormSectionHeader, FormProgressTracker, FormStyles } from "@/components/ui/form-style-guide";
import { ClientInfoSection } from "@/components/shared/ClientInfoSection";
import { DealDetailsSection } from "@/components/deal-form/DealDetailsSection";
import { BusinessContextSection } from "@/components/deal-form/BusinessContextSection";
import { useDealFormValidation, type DealFormData } from "@/hooks/useDealFormValidation";

// Schema for deal scoping requests
// Simplified schema - fields now handled by shared components
const dealScopingSchema = z.object({
  // Allow any fields from shared components - validation handled by components
}).passthrough();

type DealScopingFormValues = z.infer<typeof dealScopingSchema>;

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

export default function RequestSupport() {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState("deal-overview");

  // State to track selected agencies and advertisers for dropdowns
  const [agencies, setAgencies] = useState<AgencyData[]>([]);
  const [advertisers, setAdvertisers] = useState<AdvertiserData[]>([]);
  
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
      contractTermMonths: "",
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

  // Create deal scoping request mutation
  const createDealScopingRequest = useMutation({
    mutationFn: async (data: DealScopingFormValues) => {
      console.log("Submitting deal scoping request:", data);

      // Add default title for backend compatibility
      const formData = {
        ...data,
        requestTitle: "Deal Scoping Request",
        description: "Growth opportunity assessment request",
      };

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

  function goToNextTab() {
    if (activeTab === "deal-overview") {
      setActiveTab("business-context");
    }
  }

  function goToPrevTab() {
    if (activeTab === "business-context") {
      setActiveTab("deal-overview");
    }
  }

  function goToDealSubmission() {
    navigate("/submit-deal");
  }

  // Fetch agencies and advertisers on component mount
  useEffect(() => {
    async function fetchAgencies() {
      try {
        const response = await fetch("/api/agencies", {
          method: "GET",
          credentials: "include",
        });
        if (!response.ok) {
          throw new Error("Failed to fetch agencies");
        }
        const data = await response.json();
        setAgencies(data as AgencyData[]);
      } catch (error) {
        toast({
          title: "Error Fetching Agencies",
          description: "Could not load agency data. Please refresh the page.",
          variant: "destructive",
        });
      }
    }

    async function fetchAdvertisers() {
      try {
        const response = await fetch("/api/advertisers", {
          method: "GET",
          credentials: "include",
        });
        if (!response.ok) {
          throw new Error("Failed to fetch advertisers");
        }
        const data = await response.json();
        setAdvertisers(data as AdvertiserData[]);
      } catch (error) {
        toast({
          title: "Error Fetching Advertisers",
          description:
            "Could not load advertiser data. Please refresh the page.",
          variant: "destructive",
        });
      }
    }

    fetchAgencies();
    fetchAdvertisers();
  }, [toast]);

  return (
    <div className="p-6 rounded-lg bg-white shadow-md">
      {/* Standardized Form Section Header */}
      <FormSectionHeader
        title="Deal Scoping"
        badge="Step 1 of 2"
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

      {/* ✅ SYNCHRONIZED: Form Progress Tracker with validation-aware navigation */}
      <FormProgressTracker
        steps={[
          { id: "deal-overview", label: "Deal Overview" },
          { id: "business-context", label: "Business Context" }
        ]}
        currentStep={activeTab}
        onStepClick={(stepId) => {
          const targetStep = stepId.toString();
          // Map tab IDs to step numbers for validation
          const stepMap: Record<string, number> = {
            'deal-overview': 1,
            'business-context': 2
          };
          
          const stepNumber = stepMap[targetStep];
          if (stepNumber && formValidation.canAdvanceToStep(stepNumber)) {
            setActiveTab(targetStep);
          } else {
            toast({
              title: "Complete Current Step",
              description: "Please fill out the required fields before proceeding.",
              variant: "destructive",
            });
          }
        }}
      />

      {/* Form Card */}
      <Card className="border border-slate-200">
        <CardContent className="p-6">
          <Form {...form}>
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full"
            >
              <TabsContent value="deal-overview" className="space-y-6 pt-4">
                {/* Client Information Section */}
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">Client Information</h2>
                  <p className="text-sm text-gray-600 mb-6">Select the client and sales channel for this deal</p>
                  <ClientInfoSection
                    form={form}
                    agencies={agencies}
                    advertisers={advertisers}
                    salesChannel={form.watch("salesChannel")}
                    includeEmail={false}
                    layout="stacked"
                  />
                </div>
                
                {/* Deal Timeline Section */}
                <div className="border-t pt-6 mt-8">
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">Deal Timeline</h2>
                  <p className="text-sm text-gray-600 mb-6">Configure the basic deal structure and timeline</p>
                  <DealDetailsSection
                    form={form as any}
                    dealStructureType={dealStructureType}
                    setDealStructure={(value) => {
                      setDealStructureType(value);
                      form.setValue("dealStructure", value as "tiered" | "flat_commit");
                    }}
                    showBusinessSummary={false}
                    showNavigationButton={false}
                    title=""
                    description=""
                  />
                </div>
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

      {/* Navigation Buttons - Updated for consolidated steps */}
      <div className="mt-5">
        {activeTab === "deal-overview" && (
          <div className="flex justify-end">
            <Button type="button" onClick={goToNextTab}>
              Next: Business Context
            </Button>
          </div>
        )}

        {activeTab === "business-context" && (
          <div className="flex justify-between">
            <Button type="button" variant="outline" onClick={goToPrevTab}>
              Previous: Deal Overview
            </Button>
            <Button
              type="button"
              onClick={form.handleSubmit(onSubmit)}
              disabled={createDealScopingRequest.isPending}
            >
              {createDealScopingRequest.isPending
                ? "Submitting..."
                : "Submit Request"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
