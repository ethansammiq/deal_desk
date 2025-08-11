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

// Schema for deal scoping requests
const dealScopingSchema = z
  .object({
    // Sales channel and client information
    salesChannel: z.string().min(1, "Sales channel is required"),
    region: z.enum(["northeast", "midwest", "midatlantic", "west", "south"], {
      required_error: "Region is required",
    }),
    advertiserName: z.string().optional(),
    agencyName: z.string().optional(),

    // Deal timeline fields (shared with SubmitDeal)
    dealType: z.enum(["grow", "protect", "custom"], {
      required_error: "Deal type is required",
    }),
    dealStructure: z.enum(["tiered", "flat_commit"], {
      required_error: "Deal structure is required",
    }),
    contractTermMonths: z.string().optional(),
    termStartDate: z.date({
      required_error: "Start date is required",
    }),
    termEndDate: z.date({
      required_error: "End date is required",
    }),

    // Simplified business context (minimal for scoping requests)
    requestType: z.enum(["scoping", "pricing", "technical"], {
      required_error: "Request type is required",
    }),
    growthAmbition: z
      .number()
      .min(1000000, "Growth ambition must be at least $1M"),
    businessContext: z
      .string()
      .min(20, "Please provide more details about your request"),
  })
  .superRefine((data, ctx) => {
    // If sales channel is client_direct, advertiserName is required
    if (data.salesChannel === "client_direct" && !data.advertiserName) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Advertiser name is required for client direct sales",
        path: ["advertiserName"],
      });
    }

    // If sales channel is holding_company or independent_agency, agencyName is required
    if (
      (data.salesChannel === "holding_company" ||
        data.salesChannel === "independent_agency") &&
      !data.agencyName
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Agency name is required for agency sales",
        path: ["agencyName"],
      });
    }
  });

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
  const [activeTab, setActiveTab] = useState("sales-channel");

  // State to track selected agencies and advertisers for dropdowns
  const [agencies, setAgencies] = useState<AgencyData[]>([]);
  const [advertisers, setAdvertisers] = useState<AdvertiserData[]>([]);
  
  // Deal structure state for DealDetailsSection
  const [dealStructureType, setDealStructureType] = useState<"tiered" | "flat_commit" | "">("");

  const form = useForm<DealScopingFormValues>({
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
      requestType: undefined,
      businessContext: "",
      growthAmbition: 1000000,
    },
    mode: "onChange",
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
    onSuccess: () => {
      toast({
        title: "Request Submitted",
        description:
          "Your deal scoping request has been submitted successfully. The partnership team will contact you shortly.",
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
    if (activeTab === "sales-channel") {
      setActiveTab("deal-details");
    } else if (activeTab === "deal-details") {
      setActiveTab("growth-opportunity");
    }
  }

  function goToPrevTab() {
    if (activeTab === "growth-opportunity") {
      setActiveTab("deal-details");
    } else if (activeTab === "deal-details") {
      setActiveTab("sales-channel");
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

      {/* Standardized Form Progress Tracker */}
      <FormProgressTracker
        steps={[
          { id: "sales-channel", label: "Client Information" },
          { id: "deal-details", label: "Deal Timeline" },
          { id: "growth-opportunity", label: "Request Details" }
        ]}
        currentStep={activeTab}
        onStepClick={(stepId) => setActiveTab(stepId.toString())}
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
              <TabsContent value="sales-channel" className="space-y-6 pt-4">
                {/* Client Information Section - Shared Component */}
                <ClientInfoSection
                  form={form}
                  agencies={agencies}
                  advertisers={advertisers}
                  salesChannel={form.watch("salesChannel")}
                  includeEmail={false}
                  layout="stacked"
                />
              </TabsContent>

              <TabsContent value="deal-details" className="space-y-6 pt-4">
                {/* Deal Details Section - Shared Component */}
                <DealDetailsSection
                  form={form}
                  dealStructureType={dealStructureType}
                  setDealStructure={(value) => {
                    setDealStructureType(value);
                    form.setValue("dealStructure", value as "tiered" | "flat_commit");
                  }}
                  showBusinessSummary={false}
                  showNavigationButton={false}
                  title="Deal Timeline"
                  description="Configure the basic deal structure and timeline"
                />
              </TabsContent>

              <TabsContent
                value="growth-opportunity"
                className="space-y-0"
              >
                <BusinessContextSection form={form} variant="requestSupport" />
              </TabsContent>
            </Tabs>
          </Form>
        </CardContent>
      </Card>

      {/* Navigation Buttons - Completely moved outside card and form */}
      <div className="mt-5">
        {activeTab === "sales-channel" && (
          <div className="flex justify-end">
            <Button type="button" onClick={goToNextTab}>
              Next: Deal Timeline
            </Button>
          </div>
        )}

        {activeTab === "deal-details" && (
          <div className="flex justify-between">
            <Button type="button" variant="outline" onClick={goToPrevTab}>
              Previous: Client Information
            </Button>
            <Button type="button" onClick={goToNextTab}>
              Next: Request Details
            </Button>
          </div>
        )}

        {activeTab === "growth-opportunity" && (
          <div className="flex justify-between">
            <Button type="button" variant="outline" onClick={goToPrevTab}>
              Previous: Deal Timeline
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
