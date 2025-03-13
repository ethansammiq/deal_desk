import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
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
import { format } from "date-fns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLocation } from "wouter";

// Enhanced schema for deal scoping support requests
const dealScopingSchema = z.object({
  // Support request fields
  supportType: z.string().min(1, "Support type is required"),
  requestTitle: z.string().min(1, "Request title is required"),
  description: z.string().min(10, "Description should be at least 10 characters"),
  relatedDealId: z.number().optional(),
  priorityLevel: z.string().default("medium"),
  deadline: z.string().optional(),
  
  // Deal information fields
  dealName: z.string().min(1, "Deal name is required").optional(),
  dealType: z.string().min(1, "Deal type is required").optional(),
  department: z.string().min(1, "Department is required").optional(),
  expectedCloseDate: z.string().optional(),
  
  // Client information
  clientName: z.string().min(1, "Client name is required").optional(),
  clientType: z.string().optional(),
  industry: z.string().optional(),
  region: z.string().optional(),
  companySize: z.string().optional(),
});

type DealScopingFormValues = z.infer<typeof dealScopingSchema>;

export default function RequestSupport() {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState("support-info");
  
  // Fetch deals for the dropdown
  const { data: deals } = useQuery({
    queryKey: ['/api/deals'],
  });
  
  const form = useForm<DealScopingFormValues>({
    resolver: zodResolver(dealScopingSchema),
    defaultValues: {
      supportType: "",
      requestTitle: "",
      description: "",
      priorityLevel: "medium",
      deadline: format(new Date(), "yyyy-MM-dd"),
      dealType: "",
      department: "",
      clientType: "",
      expectedCloseDate: format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), "yyyy-MM-dd"), // 30 days from now
    },
    mode: "onChange"
  });
  
  // Create support request mutation
  const createSupportRequest = useMutation({
    mutationFn: async (data: DealScopingFormValues) => {
      const response = await apiRequest("POST", "/api/support-requests", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/support-requests'] });
      toast({
        title: "Success",
        description: "Deal scoping request submitted successfully! A team member will contact you to set up a discovery call.",
        variant: "default",
      });
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to submit deal scoping request",
        variant: "destructive",
      });
    }
  });
  
  function onSubmit(data: DealScopingFormValues) {
    createSupportRequest.mutate(data);
  }
  
  function goToNextTab() {
    if (activeTab === "support-info") {
      setActiveTab("deal-info");
    } else if (activeTab === "deal-info") {
      setActiveTab("client-info");
    }
  }
  
  function goToPrevTab() {
    if (activeTab === "client-info") {
      setActiveTab("deal-info");
    } else if (activeTab === "deal-info") {
      setActiveTab("support-info");
    }
  }

  function goToDealSubmission() {
    navigate("/submit-deal");
  }
  
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Deal Scoping Request</h1>
        <p className="mt-1 text-sm text-slate-500">
          New to the deal process? Start here to get help with scoping, pricing, or technical aspects of your deals.
          <span className="block mt-1 text-primary">
            Already familiar with the process? <button onClick={goToDealSubmission} className="underline font-medium">Skip straight to Deal Submission</button>
          </span>
        </p>
      </div>
      
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Deal Scoping Form */}
        <div className="lg:col-span-2">
          <Card>
            <div className="px-4 py-5 border-b border-slate-200 sm:px-6">
              <h3 className="text-lg font-medium leading-6 text-slate-900">Deal Scoping Request Form</h3>
              <p className="mt-1 text-sm text-slate-500">
                This is the first step in the deal process. After submission, you'll be contacted to arrange a discovery call.
              </p>
            </div>
            <CardContent className="p-6">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="support-info">Support Info</TabsTrigger>
                      <TabsTrigger value="deal-info">Deal Details</TabsTrigger>
                      <TabsTrigger value="client-info">Client Info</TabsTrigger>
                    </TabsList>
                    
                    {/* Support Info Tab */}
                    <TabsContent value="support-info" className="space-y-6 pt-4">
                      <FormField
                        control={form.control}
                        name="supportType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Support Type <span className="text-red-500">*</span></FormLabel>
                            <Select 
                              onValueChange={field.onChange} 
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select support type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="pricing">Pricing Assistance</SelectItem>
                                <SelectItem value="technical">Technical Scoping</SelectItem>
                                <SelectItem value="legal">Legal Review</SelectItem>
                                <SelectItem value="proposal">Proposal Development</SelectItem>
                                <SelectItem value="discovery">Discovery Call</SelectItem>
                                <SelectItem value="other">Other</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="requestTitle"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Request Title <span className="text-red-500">*</span></FormLabel>
                            <FormControl>
                              <Input placeholder="Enter request title" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Description <span className="text-red-500">*</span></FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Please provide detailed information about your request"
                                className="resize-none"
                                rows={4}
                                {...field} 
                              />
                            </FormControl>
                            <FormDescription>
                              Describe what you need help with, specific questions, or areas where you need guidance.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                        <FormField
                          control={form.control}
                          name="relatedDealId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Related Deal (if applicable)</FormLabel>
                              <Select 
                                onValueChange={(value) => field.onChange(value ? parseInt(value) : undefined)} 
                                value={field.value?.toString() || ""}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select a deal or leave blank" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="none">None - This is a new deal</SelectItem>
                                  {Array.isArray(deals) && deals.map((deal: any) => (
                                    <SelectItem key={deal.id} value={deal.id.toString()}>
                                      {deal.dealName} (#{deal.referenceNumber})
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="priorityLevel"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Priority Level</FormLabel>
                              <Select 
                                onValueChange={field.onChange} 
                                defaultValue={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select priority level" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="high">High</SelectItem>
                                  <SelectItem value="medium">Medium</SelectItem>
                                  <SelectItem value="low">Low</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <FormField
                        control={form.control}
                        name="deadline"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Deadline (if applicable)</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="pt-4 flex justify-end">
                        <Button type="button" onClick={goToNextTab}>
                          Next: Deal Details
                        </Button>
                      </div>
                    </TabsContent>
                    
                    {/* Deal Details Tab */}
                    <TabsContent value="deal-info" className="space-y-6 pt-4">
                      <FormField
                        control={form.control}
                        name="dealName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Deal Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter deal name" {...field} />
                            </FormControl>
                            <FormDescription>
                              Provide a descriptive name for this potential deal
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                        <FormField
                          control={form.control}
                          name="dealType"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Deal Type</FormLabel>
                              <Select 
                                onValueChange={field.onChange} 
                                value={field.value || ""}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select deal type" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="new_business">New Business</SelectItem>
                                  <SelectItem value="renewal">Renewal</SelectItem>
                                  <SelectItem value="upsell">Upsell</SelectItem>
                                  <SelectItem value="expansion">Expansion</SelectItem>
                                  <SelectItem value="special_project">Special Project</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="department"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Department</FormLabel>
                              <Select 
                                onValueChange={field.onChange} 
                                value={field.value || ""}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select department" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="sales">Sales</SelectItem>
                                  <SelectItem value="marketing">Marketing</SelectItem>
                                  <SelectItem value="operations">Operations</SelectItem>
                                  <SelectItem value="it">IT</SelectItem>
                                  <SelectItem value="finance">Finance</SelectItem>
                                  <SelectItem value="other">Other</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <FormField
                        control={form.control}
                        name="expectedCloseDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Expected Close Date</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} />
                            </FormControl>
                            <FormDescription>
                              Estimated date when you need the deal to be finalized
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="pt-4 flex justify-between">
                        <Button type="button" variant="outline" onClick={goToPrevTab}>
                          Previous: Support Info
                        </Button>
                        <Button type="button" onClick={goToNextTab}>
                          Next: Client Info
                        </Button>
                      </div>
                    </TabsContent>
                    
                    {/* Client Info Tab */}
                    <TabsContent value="client-info" className="space-y-6 pt-4">
                      <FormField
                        control={form.control}
                        name="clientName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Client Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter client name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                        <FormField
                          control={form.control}
                          name="clientType"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Client Type</FormLabel>
                              <Select 
                                onValueChange={field.onChange} 
                                value={field.value || ""}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select client type" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="new">New Client</SelectItem>
                                  <SelectItem value="existing">Existing Client</SelectItem>
                                  <SelectItem value="partner">Partner</SelectItem>
                                  <SelectItem value="strategic">Strategic Account</SelectItem>
                                  <SelectItem value="former">Former Client</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="industry"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Industry</FormLabel>
                              <Select 
                                onValueChange={field.onChange} 
                                value={field.value || ""}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select industry" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="technology">Technology</SelectItem>
                                  <SelectItem value="healthcare">Healthcare</SelectItem>
                                  <SelectItem value="finance">Finance & Banking</SelectItem>
                                  <SelectItem value="retail">Retail & E-commerce</SelectItem>
                                  <SelectItem value="manufacturing">Manufacturing</SelectItem>
                                  <SelectItem value="education">Education</SelectItem>
                                  <SelectItem value="government">Government</SelectItem>
                                  <SelectItem value="other">Other</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                        <FormField
                          control={form.control}
                          name="region"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Region</FormLabel>
                              <Select 
                                onValueChange={field.onChange} 
                                value={field.value || ""}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select region" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="north_america">North America</SelectItem>
                                  <SelectItem value="latin_america">Latin America</SelectItem>
                                  <SelectItem value="europe">Europe</SelectItem>
                                  <SelectItem value="asia_pacific">Asia Pacific</SelectItem>
                                  <SelectItem value="middle_east">Middle East & Africa</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="companySize"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Company Size</FormLabel>
                              <Select 
                                onValueChange={field.onChange} 
                                value={field.value || ""}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select company size" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="startup">Startup (1-50)</SelectItem>
                                  <SelectItem value="small">Small (51-200)</SelectItem>
                                  <SelectItem value="medium">Medium (201-1000)</SelectItem>
                                  <SelectItem value="large">Large (1001-5000)</SelectItem>
                                  <SelectItem value="enterprise">Enterprise (5000+)</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-slate-700">Attachments (if applicable)</label>
                        <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-slate-300 border-dashed rounded-md">
                          <div className="space-y-1 text-center">
                            <svg className="mx-auto h-12 w-12 text-slate-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                              <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            <div className="flex text-sm text-slate-600">
                              <label htmlFor="deal-file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-primary hover:text-blue-500">
                                <span>Upload files</span>
                                <input id="deal-file-upload" name="deal-file-upload" type="file" className="sr-only" multiple />
                              </label>
                              <p className="pl-1">or drag and drop</p>
                            </div>
                            <p className="text-xs text-slate-500">
                              PDF, DOC, XLS, PNG up to 10MB each
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="pt-4 flex justify-between">
                        <Button type="button" variant="outline" onClick={goToPrevTab}>
                          Previous: Deal Details
                        </Button>
                        <Button type="submit" disabled={createSupportRequest.isPending}>
                          {createSupportRequest.isPending ? "Submitting..." : "Submit Scoping Request"}
                        </Button>
                      </div>
                    </TabsContent>
                  </Tabs>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
        
        {/* Help & Support Info */}
        <div className="lg:col-span-1">
          <Card>
            <div className="px-4 py-5 border-b border-slate-200 sm:px-6">
              <h3 className="text-lg font-medium leading-6 text-slate-900">Deal Process Guide</h3>
            </div>
            <CardContent className="p-6">
              <div className="space-y-6">
                <div>
                  <h4 className="text-sm font-medium text-slate-900">Deal Process Flow</h4>
                  <ul className="mt-2 text-sm text-slate-600 space-y-4">
                    <li className="flex">
                      <div className="flex-shrink-0 flex items-center justify-center h-6 w-6 rounded-full bg-primary text-white text-xs font-bold mr-3">1</div>
                      <span className="font-medium">Deal Scoping (You are here)</span>
                    </li>
                    <li className="flex">
                      <div className="flex-shrink-0 flex items-center justify-center h-6 w-6 rounded-full bg-slate-200 text-slate-600 text-xs font-bold mr-3">2</div>
                      <span>Discovery Call with Deal Desk</span>
                    </li>
                    <li className="flex">
                      <div className="flex-shrink-0 flex items-center justify-center h-6 w-6 rounded-full bg-slate-200 text-slate-600 text-xs font-bold mr-3">3</div>
                      <span>Deal Submission with Pricing</span>
                    </li>
                    <li className="flex">
                      <div className="flex-shrink-0 flex items-center justify-center h-6 w-6 rounded-full bg-slate-200 text-slate-600 text-xs font-bold mr-3">4</div>
                      <span>Deal Approval & Implementation</span>
                    </li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-slate-900">Response Times</h4>
                  <ul className="mt-2 text-sm text-slate-600 space-y-2">
                    <li className="flex items-center">
                      <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
                      <span>High Priority: 1 business day</span>
                    </li>
                    <li className="flex items-center">
                      <span className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></span>
                      <span>Medium Priority: 2-3 business days</span>
                    </li>
                    <li className="flex items-center">
                      <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                      <span>Low Priority: 3-5 business days</span>
                    </li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-slate-900">Support Team Contacts</h4>
                  <ul className="mt-2 text-sm text-slate-600 space-y-2">
                    <li>
                      <span className="font-medium">Pricing Team:</span> pricing@dealdesk.com
                    </li>
                    <li>
                      <span className="font-medium">Technical Team:</span> technical@dealdesk.com
                    </li>
                    <li>
                      <span className="font-medium">Deal Desk:</span> dealdesk@company.com
                    </li>
                  </ul>
                </div>
                
                <div className="pt-4">
                  <h4 className="text-sm font-medium text-slate-900">Helpful Resources</h4>
                  <ul className="mt-2 space-y-2">
                    <li>
                      <a href="#" className="text-sm text-primary hover:text-blue-700">Deal Process Guide PDF</a>
                    </li>
                    <li>
                      <a href="#" className="text-sm text-primary hover:text-blue-700">Technical Implementation Guide</a>
                    </li>
                    <li>
                      <a href="#" className="text-sm text-primary hover:text-blue-700">Client Qualification Checklist</a>
                    </li>
                  </ul>
                </div>
                
                <div className="pt-4 border-t border-slate-200">
                  <h4 className="text-sm font-medium text-slate-900">Experienced Deal Creator?</h4>
                  <p className="mt-2 text-sm text-slate-600">
                    Skip the scoping process if you've done this before and know the deal requirements.
                  </p>
                  <Button variant="outline" className="mt-3 w-full" onClick={goToDealSubmission}>
                    Go to Deal Submission
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
