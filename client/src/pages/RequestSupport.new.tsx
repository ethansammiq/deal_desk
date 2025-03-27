import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { queryClient } from "@/lib/queryClient";

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

// Form validation schema
const dealScopingSchema = z.object({
  email: z.string().email("Please enter a valid email address").optional(),
  salesChannel: z.string({
    required_error: "Please select a sales channel",
  }),
  advertiserName: z.string().optional(),
  agencyName: z.string().optional(),
  growthOpportunityMIQ: z.string({
    required_error: "Please describe the growth opportunity from our perspective",
  }).min(10, "Description is too short"),
  growthAmbition: z.number({
    required_error: "Please enter the 2025 growth ambition",
    invalid_type_error: "Please enter a number",
  }).min(1000000, "Growth ambition must be at least $1M"),
  growthOpportunityClient: z.string({
    required_error: "Please describe how the client is looking to grow",
  }).min(10, "Description is too short"),
  clientAsks: z.string().optional(),
}).refine(data => {
  if (data.salesChannel === "client_direct" && !data.advertiserName) {
    return false;
  }
  if ((data.salesChannel === "holding_company" || data.salesChannel === "independent_agency") && !data.agencyName) {
    return false;
  }
  return true;
}, {
  message: "Please select a company name",
  path: ["advertiserName"],
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
  const [_, setLocation] = useLocation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<string>("sales-channel");
  const [advertisers, setAdvertisers] = useState<AdvertiserData[]>([]);
  const [agencies, setAgencies] = useState<AgencyData[]>([]);
  
  // Initialize form with default values
  const form = useForm<DealScopingFormValues>({
    resolver: zodResolver(dealScopingSchema),
    defaultValues: {
      email: "",
      salesChannel: "",
      advertiserName: "",
      agencyName: "",
      growthOpportunityMIQ: "",
      growthAmbition: undefined,
      growthOpportunityClient: "",
      clientAsks: "",
    },
  });

  // Set up mutation for form submission
  const createDealScopingRequest = useMutation({
    mutationFn: async (data: DealScopingFormValues) => {
      const response = await fetch('/api/deal-scoping-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        credentials: 'include'
      });
      
      if (!response.ok) {
        const text = await response.text();
        throw new Error(`${response.status}: ${text || response.statusText}`);
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Request Submitted",
        description: "Your deal scoping request has been submitted successfully. Our team will contact you soon.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/deal-scoping-requests'] });
      form.reset();
      setActiveTab("sales-channel");
    },
    onError: (error) => {
      toast({
        title: "Submission Failed",
        description: `There was an error submitting your request: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Handle form submission
  async function onSubmit(data: DealScopingFormValues) {
    createDealScopingRequest.mutate(data);
  }
  
  // Tab navigation
  function goToNextTab() {
    setActiveTab("growth-opportunity");
  }
  
  function goToPrevTab() {
    setActiveTab("sales-channel");
  }
  
  // Navigation to Deal Submission
  function goToDealSubmission() {
    setLocation("/submit-deal");
  }
  
  // Load agencies and advertisers
  useEffect(() => {
    async function fetchAgencies() {
      try {
        const response = await fetch('/api/agencies', {
          credentials: "include"
        });
        if (response.ok) {
          const data = await response.json();
          setAgencies(data);
        }
      } catch (error) {
        toast({
          title: "Error loading agencies",
          description: "Failed to load agency data. Please try refreshing the page.",
          variant: "destructive",
        });
      }
    }
    
    async function fetchAdvertisers() {
      try {
        const response = await fetch('/api/advertisers', {
          credentials: "include"
        });
        if (response.ok) {
          const data = await response.json();
          setAdvertisers(data);
        }
      } catch (error) {
        toast({
          title: "Error loading advertisers",
          description: "Failed to load advertiser data. Please try refreshing the page.",
          variant: "destructive",
        });
      }
    }
    
    fetchAgencies();
    fetchAdvertisers();
  }, [toast]);
  
  return (
    <div>
      {/* About Deal Scoping Section - Completely separate section */}
      <div className="bg-gradient-to-b from-purple-50 to-transparent">
        <div className="container mx-auto p-6">
          <div className="mb-8 rounded-lg p-8">
            <h3 className="text-xl font-bold text-slate-800 mb-3 bg-gradient-to-r from-indigo-700 to-purple-700 bg-clip-text text-transparent">About Deal Scoping</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-lg shadow-md p-5 border-0">
                <h4 className="font-medium text-slate-900 mb-2">What is Deal Scoping?</h4>
                <p className="text-sm text-slate-500">
                  Deal scoping is the first step in our deal process. It helps us understand your client's needs and growth opportunities to provide better support.
                </p>
              </div>
              
              <div className="bg-white rounded-lg shadow-md p-5 border-0">
                <h4 className="font-medium text-slate-900 mb-2">What Happens Next?</h4>
                <ol className="text-sm text-slate-500 list-decimal list-inside space-y-1">
                  <li>Our partnership team reviews your request</li>
                  <li>A team member contacts you to schedule a discovery call</li>
                  <li>Together, we'll craft a tailored proposal</li>
                  <li>Once aligned, you can proceed to deal submission</li>
                </ol>
              </div>
              
              <div className="bg-blue-50 rounded-lg shadow-md p-5 border-0">
                <h4 className="font-medium text-blue-800 mb-2">Need Help?</h4>
                <p className="text-sm text-blue-700">
                  For assistance with deal scoping, contact the partnership team at partnerships@example.com or check out our Help & Resources page.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Deal Scoping Request Section - Completely separate section */}
      <div className="bg-white">
        <div className="container mx-auto p-6">
          <div className="mb-8 bg-white rounded-lg shadow-md p-8">
            <div className="flex items-center mb-2">
              <h1 className="text-2xl font-bold text-slate-900 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Deal Scoping Request</h1>
              <span className="ml-3 px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">Step 1 of 2</span>
            </div>
            <p className="mt-1 mb-6 text-sm text-slate-500">
              New to the deal process? Start here to get help with scoping, pricing, or technical aspects of your deals.
              <span className="block mt-1 text-primary">
                Already familiar with the process? <button onClick={goToDealSubmission} className="underline font-medium">Skip straight to Deal Submission</button>
              </span>
            </p>
      
            <Card className="border border-slate-200">
              <div className="px-4 py-5 border-b border-slate-200 sm:px-6">
                <h3 className="text-lg font-medium leading-6 text-slate-900">Request Form</h3>
                <p className="mt-1 text-sm text-slate-500">
                  Complete this form to start the deal process. After submission, you'll be contacted to arrange a discovery call.
                </p>
              </div>
              <CardContent className="p-6">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="sales-channel">Sales Channel Info</TabsTrigger>
                        <TabsTrigger value="growth-opportunity">Growth Opportunity</TabsTrigger>
                      </TabsList>
                      
                      {/* Sales Channel Info Tab */}
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
                        
                        <div className="pt-4 flex justify-end">
                          <Button type="button" onClick={goToNextTab}>
                            Next: Growth Opportunity
                          </Button>
                        </div>
                      </TabsContent>
                      
                      {/* Growth Opportunity Tab */}
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
                        
                        <div className="pt-4 flex justify-between">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={goToPrevTab}
                          >
                            Back: Sales Channel Info
                          </Button>
                          <Button type="submit" disabled={createDealScopingRequest.isPending}>
                            {createDealScopingRequest.isPending ? "Submitting..." : "Submit Deal Scoping Request"}
                          </Button>
                        </div>
                      </TabsContent>
                    </Tabs>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}