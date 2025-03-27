import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { cn } from "@/lib/utils";
import { 
  Card,
  CardContent
} from "@/components/ui/card";
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { InfoIcon } from "lucide-react";
import { useLocation } from "wouter";

// Schema for deal scoping requests
const dealScopingSchema = z.object({
  // Email address
  email: z.string().email("Please enter a valid email address").optional(),
  
  // Sales channel and client information
  salesChannel: z.string().min(1, "Sales channel is required"),
  advertiserName: z.string().optional(),
  agencyName: z.string().optional(),
  
  // Growth opportunity fields
  growthOpportunityMIQ: z.string().min(10, "Please provide more details about the growth opportunity"),
  growthAmbition: z.number().min(1000000, "Growth ambition must be at least $1M"),
  growthOpportunityClient: z.string().min(10, "Please provide more details about the client's growth opportunity"),
  clientAsks: z.string().optional(),
  
  // Legacy fields maintained for compatibility
  requestTitle: z.string().min(1, "Request title is required").default("Deal Scoping Request"),
  description: z.string().optional(),
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
  if ((data.salesChannel === "holding_company" || data.salesChannel === "independent_agency") && !data.agencyName) {
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
  
  const form = useForm<DealScopingFormValues>({
    resolver: zodResolver(dealScopingSchema),
    defaultValues: {
      email: "",
      salesChannel: "",
      advertiserName: "",
      agencyName: "",
      growthOpportunityMIQ: "",
      growthAmbition: 1000000,
      growthOpportunityClient: "",
      clientAsks: "",
      requestTitle: "Deal Scoping Request",
      description: ""
    },
    mode: "onChange"
  });
  
  // Create deal scoping request mutation
  const createDealScopingRequest = useMutation({
    mutationFn: async (data: DealScopingFormValues) => {
      console.log("Submitting deal scoping request:", data);
      
      // Add requestTitle if not present
      const formData = {
        ...data,
        requestTitle: data.requestTitle || "Deal Scoping Request",
        description: data.description || `Request from ${data.email || 'unknown'}`
      };
      
      const res = await fetch("/api/deal-scoping-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
        credentials: "include"
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
        description: "Your deal scoping request has been submitted successfully. The partnership team will contact you shortly.",
      });
      
      // Reset form and return to dashboard
      form.reset();
      navigate("/dashboard");
      
      // Clear cached data
      queryClient.invalidateQueries({ queryKey: ['/api/deal-scoping-requests'] });
    },
    onError: (error) => {
      toast({
        title: "Error Submitting Request",
        description: "There was an error submitting your request. Please try again.",
        variant: "destructive",
      });
    }
  });
  
  async function onSubmit(data: DealScopingFormValues) {
    createDealScopingRequest.mutate(data);
  }
  
  function goToNextTab() {
    setActiveTab("growth-opportunity");
  }
  
  function goToPrevTab() {
    setActiveTab("sales-channel");
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
          credentials: "include"
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
          credentials: "include"
        });
        if (!response.ok) {
          throw new Error("Failed to fetch advertisers");
        }
        const data = await response.json();
        setAdvertisers(data as AdvertiserData[]);
      } catch (error) {
        toast({
          title: "Error Fetching Advertisers",
          description: "Could not load advertiser data. Please refresh the page.",
          variant: "destructive",
        });
      }
    }

    fetchAgencies();
    fetchAdvertisers();
  }, [toast]);
  
  return (
    <div className="p-6 rounded-lg bg-white shadow-md">
      {/* Header with info button */}
      <div className="flex items-center mb-2">
        <h1 className="text-2xl font-bold text-slate-900 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Deal Scoping</h1>
        <span className="ml-3 px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">Step 1 of 2</span>
          
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0 ml-2">
              <InfoIcon className="h-4 w-4 text-primary" />
              <span className="sr-only">Deal Scoping Information</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-0">
            <div className="p-4 bg-[#f6f0ff] border-b border-slate-200">
              <h4 className="font-medium text-slate-900">About Deal Scoping</h4>
              <p className="text-sm text-slate-600 mt-1">
                Deal scoping is the first step in our deal process. It helps us understand your client's needs and growth opportunities.
              </p>
            </div>
            
            <div className="p-4">
              <h5 className="font-medium text-slate-800 mb-2">What Happens Next?</h5>
              <ol className="text-sm text-slate-600 list-decimal list-inside space-y-1">
                <li>Our partnership team reviews your request</li>
                <li>A team member contacts you to schedule a discovery call</li>
                <li>Together, we'll craft a tailored proposal</li>
                <li>Once aligned, you can proceed to deal submission</li>
              </ol>
              
              <div className="mt-3 pt-3 border-t border-slate-200">
                <h5 className="font-medium text-blue-700 mb-1">Need Help?</h5>
                <p className="text-sm text-blue-600">
                  For assistance, contact the partnership team at partnerships@example.com
                </p>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>
      
      {/* Description */}
      <p className="mt-1 text-sm text-slate-500">
        New to the deal process? Start here to get help with scoping, pricing, or technical aspects of your deals.
        <span className="block mt-1 text-primary">
          Already familiar with the process? <button onClick={goToDealSubmission} className="underline font-medium">Skip straight to Deal Submission</button>
        </span>
      </p>
      
      {/* Form Progress - Moved completely outside the form container */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="w-full flex items-center">
            <div 
              onClick={() => setActiveTab("sales-channel")}
              className={cn(
                "flex items-center justify-center w-10 h-10 rounded-full border-2 text-sm font-medium cursor-pointer hover:opacity-90 transition-opacity",
                activeTab === "sales-channel" ? "border-primary bg-primary text-white" : "border-slate-300 text-slate-500"
              )}
            >
              1
            </div>
            <div className={cn(
              "w-full h-1 bg-slate-200",
              activeTab === "growth-opportunity" ? "bg-primary" : ""
            )}></div>
            <div 
              onClick={() => setActiveTab("growth-opportunity")}
              className={cn(
                "flex items-center justify-center w-10 h-10 rounded-full border-2 text-sm font-medium cursor-pointer hover:opacity-90 transition-opacity",
                activeTab === "growth-opportunity" ? "border-primary bg-primary text-white" : "border-slate-300 text-slate-500"
              )}
            >
              2
            </div>
          </div>
        </div>
        <div className="flex justify-between text-sm text-slate-600">
          <div 
            onClick={() => setActiveTab("sales-channel")} 
            className={cn(
              "cursor-pointer hover:text-primary transition-colors", 
              activeTab === "sales-channel" ? "font-medium text-primary" : ""
            )}
          >
            Sales Channel Info
          </div>
          <div 
            onClick={() => setActiveTab("growth-opportunity")} 
            className={cn(
              "cursor-pointer hover:text-primary transition-colors", 
              activeTab === "growth-opportunity" ? "font-medium text-primary" : ""
            )}
          >
            Growth Opportunity
          </div>
        </div>
      </div>
              
      {/* Form Card */}
      <Card className="border border-slate-200">
        <CardContent className="p-6">
          <Form {...form}>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsContent value="sales-channel" className="space-y-6 pt-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Address</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="Your email address" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="salesChannel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sales Channel <span className="text-red-500">*</span></FormLabel>
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
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select sales channel" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="holding_company">Holding Company</SelectItem>
                          <SelectItem value="independent_agency">Independent Agency</SelectItem>
                          <SelectItem value="client_direct">Client Direct</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* Show Advertiser Name only if Client Direct is selected */}
                {form.watch("salesChannel") === "client_direct" && (
                  <FormField
                    control={form.control}
                    name="advertiserName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Advertiser Name <span className="text-red-500">*</span></FormLabel>
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
                            {advertisers.map(advertiser => (
                              <SelectItem key={advertiser.id} value={advertiser.name}>
                                {advertiser.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
                
                {/* Show Agency Name only if Holding Company or Independent Agency is selected */}
                {(form.watch("salesChannel") === "holding_company" || 
                  form.watch("salesChannel") === "independent_agency") && (
                  <FormField
                    control={form.control}
                    name="agencyName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Agency Name <span className="text-red-500">*</span></FormLabel>
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
                            {agencies.map(agency => (
                              <SelectItem key={agency.id} value={agency.name}>
                                {agency.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </TabsContent>
              
              <TabsContent value="growth-opportunity" className="space-y-6 pt-4">
                <FormField
                  control={form.control}
                  name="growthOpportunityMIQ"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Growth Opportunity (MIQ) <span className="text-red-500">*</span></FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Describe the pathway to growth from our perspective"
                          className="resize-none"
                          rows={4}
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        What's the pathway to growth from our perspective?
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
                      <FormLabel>2025 Growth Ambition ($) <span className="text-red-500">*</span></FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="1000000"
                          placeholder="Enter amount (minimum $1M)" 
                          {...field}
                          onChange={e => field.onChange(parseFloat(e.target.value))}
                        />
                      </FormControl>
                      <FormDescription>
                        Growth ambition must be at least $1M
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
                      <FormLabel>Growth Opportunity (Client) <span className="text-red-500">*</span></FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Describe how the client is looking to grow their business AND with MIQ"
                          className="resize-none"
                          rows={4}
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        How is the client looking to grow their business AND with MIQ?
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
                          placeholder="Describe what the client has asked from us (if applicable)"
                          className="resize-none"
                          rows={4}
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        What has the client asked from us (if applicable)?
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>
            </Tabs>
          </Form>
        </CardContent>
      </Card>
      
      {/* Navigation Buttons - Completely moved outside card and form */}
      <div className="mt-10">
        {activeTab === "sales-channel" && (
          <div className="flex justify-end">
            <Button type="button" onClick={goToNextTab}>
              Next: Growth Opportunity
            </Button>
          </div>
        )}
        
        {activeTab === "growth-opportunity" && (
          <div className="flex justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={goToPrevTab}
            >
              Back: Sales Channel Info
            </Button>
            <Button 
              type="button" 
              onClick={form.handleSubmit(onSubmit)}
              disabled={createDealScopingRequest.isPending}
            >
              {createDealScopingRequest.isPending ? "Submitting..." : "Submit Request"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}