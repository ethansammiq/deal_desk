import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { format } from "date-fns";
import { 
  Card,
  CardContent
} from "@/components/ui/card";
import { 
  formatCurrency,
  calculateMonthlyValue,
  calculateNetValue, 
  calculateProfit,
  calculateProfitMargin,
  calculateYOYGrowth,
  calculateIncentiveImpact,
  cn
} from "@/lib/utils";
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
import { Slider } from "@/components/ui/slider";

// Extend the deal schema with additional validations
const dealFormSchema = z.object({
  dealName: z.string().min(1, "Deal name is required"),
  dealType: z.string().min(1, "Deal type is required"),
  description: z.string().min(10, "Description should be at least 10 characters"),
  department: z.string().min(1, "Department is required"),
  expectedCloseDate: z.string().min(1, "Expected close date is required"),
  priority: z.string().default("medium"),
  
  clientName: z.string().min(1, "Client name is required"),
  clientType: z.string().default("new"),
  industry: z.string().optional(),
  region: z.string().optional(),
  companySize: z.string().optional(),
  
  totalValue: z.coerce.number().positive("Deal value must be positive"),
  contractTerm: z.coerce.number().int().positive("Contract term must be positive"),
  paymentTerms: z.string().default("monthly"),
  discountPercentage: z.coerce.number().min(0).max(100, "Discount must be between 0 and 100%").default(0),
  costPercentage: z.coerce.number().min(0).max(100, "Cost must be between 0 and 100%").default(30),
  incentivePercentage: z.coerce.number().min(0).max(50, "Incentives must be between 0 and 50%").default(0),
  previousYearValue: z.coerce.number().min(0, "Previous year value must be non-negative").default(0),
  renewalOption: z.string().default("manual"),
  pricingNotes: z.string().optional(),
  
  referenceNumber: z.string().optional()
});

type DealFormValues = z.infer<typeof dealFormSchema>;

export default function SubmitDeal() {
  const [formStep, setFormStep] = useState(0);
  const { toast } = useToast();
  const [, navigate] = useLocation();
  
  const form = useForm<DealFormValues>({
    resolver: zodResolver(dealFormSchema),
    defaultValues: {
      dealName: "",
      dealType: "",
      description: "",
      department: "",
      expectedCloseDate: format(new Date(), "yyyy-MM-dd"),
      priority: "medium",
      
      clientName: "",
      clientType: "new",
      industry: "",
      region: "north_america",
      companySize: "medium",
      
      totalValue: undefined,
      contractTerm: undefined,
      paymentTerms: "monthly",
      discountPercentage: 0,
      costPercentage: 30,
      incentivePercentage: 0,
      previousYearValue: 0,
      renewalOption: "manual",
      pricingNotes: "",
    },
    mode: "onChange"
  });
  
  // Create deal mutation
  const createDeal = useMutation({
    mutationFn: async (data: DealFormValues) => {
      const response = await apiRequest("POST", "/api/deals", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/deals'] });
      toast({
        title: "Success",
        description: "Deal submitted successfully!",
        variant: "default",
      });
      navigate("/");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to submit deal",
        variant: "destructive",
      });
    }
  });
  
  function nextStep() {
    // Validate current step fields
    if (formStep === 0) {
      form.trigger(['dealName', 'dealType', 'description', 'department', 'expectedCloseDate']);
      const dealNameError = form.getFieldState('dealName').error;
      const dealTypeError = form.getFieldState('dealType').error;
      const descriptionError = form.getFieldState('description').error;
      const departmentError = form.getFieldState('department').error;
      const closeDateError = form.getFieldState('expectedCloseDate').error;
      
      if (dealNameError || dealTypeError || descriptionError || departmentError || closeDateError) {
        return;
      }
    } else if (formStep === 1) {
      form.trigger(['clientName', 'totalValue', 'contractTerm']);
      const clientNameError = form.getFieldState('clientName').error;
      const totalValueError = form.getFieldState('totalValue').error;
      const contractTermError = form.getFieldState('contractTerm').error;
      
      if (clientNameError || totalValueError || contractTermError) {
        return;
      }
    }
    
    setFormStep(prev => Math.min(prev + 1, 2));
  }
  
  function prevStep() {
    setFormStep(prev => Math.max(prev - 1, 0));
  }
  
  function onSubmit(data: DealFormValues) {
    createDeal.mutate(data);
  }
  
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Submit New Deal</h1>
        <p className="mt-1 text-sm text-slate-500">Complete the form below to submit a new commercial deal for approval</p>
      </div>
      
      {/* Form Progress */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="w-full flex items-center">
            <div className={cn(
              "flex items-center justify-center w-10 h-10 rounded-full border-2 text-sm font-medium",
              formStep >= 0 ? "border-primary bg-primary text-white" : "border-slate-300 text-slate-500"
            )}>
              1
            </div>
            <div className={cn(
              "w-full h-1 bg-slate-200",
              formStep >= 1 ? "bg-primary" : ""
            )}></div>
            <div className={cn(
              "flex items-center justify-center w-10 h-10 rounded-full border-2 text-sm font-medium",
              formStep >= 1 ? "border-primary bg-primary text-white" : "border-slate-300 text-slate-500"
            )}>
              2
            </div>
            <div className={cn(
              "w-full h-1 bg-slate-200",
              formStep >= 2 ? "bg-primary" : ""
            )}></div>
            <div className={cn(
              "flex items-center justify-center w-10 h-10 rounded-full border-2 text-sm font-medium",
              formStep >= 2 ? "border-primary bg-primary text-white" : "border-slate-300 text-slate-500"
            )}>
              3
            </div>
          </div>
        </div>
        <div className="flex justify-between text-sm text-slate-600">
          <div className={formStep === 0 ? "font-medium text-primary" : ""}>Deal Details</div>
          <div className={formStep === 1 ? "font-medium text-primary" : ""}>Client & Pricing</div>
          <div className={formStep === 2 ? "font-medium text-primary" : ""}>Review & Submit</div>
        </div>
      </div>
      
      {/* Form Container */}
      <Card>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            {/* Step 1: Deal Details */}
            {formStep === 0 && (
              <CardContent className="p-6">
                <div className="mb-6">
                  <h2 className="text-lg font-medium text-slate-900">Deal Information</h2>
                  <p className="mt-1 text-sm text-slate-500">Provide the basic details about this commercial deal</p>
                </div>
                
                <div className="space-y-6">
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="dealName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Deal Name <span className="text-red-500">*</span></FormLabel>
                          <FormControl>
                            <Input placeholder="Enter deal name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="dealType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Deal Type <span className="text-red-500">*</span></FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a deal type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="new_business">New Business</SelectItem>
                              <SelectItem value="renewal">Renewal</SelectItem>
                              <SelectItem value="upsell">Upsell / Cross-sell</SelectItem>
                              <SelectItem value="expansion">Expansion / Growth</SelectItem>
                              <SelectItem value="enterprise">Enterprise Agreement</SelectItem>
                              <SelectItem value="strategic">Strategic Partnership</SelectItem>
                              <SelectItem value="custom">Custom Solution</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Deal Description <span className="text-red-500">*</span></FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Briefly describe the deal, its objectives, and any special considerations"
                            className="resize-none"
                            rows={4}
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>
                          Briefly describe the deal, its objectives, and any special considerations.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                    <FormField
                      control={form.control}
                      name="department"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Department <span className="text-red-500">*</span></FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
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
                              <SelectItem value="it">IT & Technology</SelectItem>
                              <SelectItem value="finance">Finance</SelectItem>
                              <SelectItem value="product">Product</SelectItem>
                              <SelectItem value="customer_success">Customer Success</SelectItem>
                              <SelectItem value="legal">Legal</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="expectedCloseDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Expected Close Date <span className="text-red-500">*</span></FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="priority"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Priority</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select priority" />
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
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700">Supporting Documents</label>
                    <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-slate-300 border-dashed rounded-md">
                      <div className="space-y-1 text-center">
                        <svg className="mx-auto h-12 w-12 text-slate-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                          <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <div className="flex text-sm text-slate-600">
                          <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-primary hover:text-blue-500">
                            <span>Upload a file</span>
                            <input id="file-upload" name="file-upload" type="file" className="sr-only" />
                          </label>
                          <p className="pl-1">or drag and drop</p>
                        </div>
                        <p className="text-xs text-slate-500">
                          PDF, DOC, XLS up to 10MB
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="mt-8 flex justify-end">
                  <Button type="button" onClick={nextStep}>
                    Next: Client & Pricing
                  </Button>
                </div>
              </CardContent>
            )}
            
            {/* Step 2: Client & Pricing */}
            {formStep === 1 && (
              <CardContent className="p-6">
                <div className="mb-6">
                  <h2 className="text-lg font-medium text-slate-900">Client Information</h2>
                  <p className="mt-1 text-sm text-slate-500">Provide details about the client and pricing information</p>
                </div>
                
                <div className="space-y-6">
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="clientName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Client Name <span className="text-red-500">*</span></FormLabel>
                          <FormControl>
                            <Input placeholder="Enter client name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="clientType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Client Type</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select client type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="existing">Existing Client</SelectItem>
                              <SelectItem value="new">New Client</SelectItem>
                              <SelectItem value="partner">Partner</SelectItem>
                              <SelectItem value="reseller">Reseller</SelectItem>
                              <SelectItem value="distributor">Distributor</SelectItem>
                              <SelectItem value="strategic">Strategic Account</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                    <FormField
                      control={form.control}
                      name="industry"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Industry</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select industry" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="technology">Technology</SelectItem>
                              <SelectItem value="healthcare">Healthcare</SelectItem>
                              <SelectItem value="finance">Finance</SelectItem>
                              <SelectItem value="retail">Retail</SelectItem>
                              <SelectItem value="manufacturing">Manufacturing</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="region"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Region</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select region" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="north_america">North America</SelectItem>
                              <SelectItem value="europe">Europe</SelectItem>
                              <SelectItem value="asia_pacific">Asia Pacific</SelectItem>
                              <SelectItem value="latin_america">Latin America</SelectItem>
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
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select company size" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="small">Small (1-50)</SelectItem>
                              <SelectItem value="medium">Medium (51-500)</SelectItem>
                              <SelectItem value="large">Large (501-5000)</SelectItem>
                              <SelectItem value="enterprise">Enterprise (5000+)</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <hr className="my-4" />
                  
                  <div className="mb-6">
                    <h3 className="text-lg font-medium text-slate-900">Pricing Information</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="totalValue"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Total Deal Value <span className="text-red-500">*</span></FormLabel>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <span className="text-slate-500 sm:text-sm">$</span>
                            </div>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="0.00" 
                                className="pl-7"
                                {...field}
                              />
                            </FormControl>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="contractTerm"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Contract Term <span className="text-red-500">*</span></FormLabel>
                          <div className="flex rounded-md">
                            <FormControl>
                              <Input
                                type="number"
                                {...field}
                                className="rounded-r-none"
                              />
                            </FormControl>
                            <span className="inline-flex items-center px-3 py-2 rounded-r-md border border-l-0 border-slate-300 bg-slate-50 text-slate-500 text-sm">
                              Months
                            </span>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                    <FormField
                      control={form.control}
                      name="paymentTerms"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Payment Terms</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select payment terms" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="monthly">Monthly</SelectItem>
                              <SelectItem value="quarterly">Quarterly</SelectItem>
                              <SelectItem value="annually">Annually</SelectItem>
                              <SelectItem value="upfront">Upfront</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="discountPercentage"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Discount (%)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="0"
                              min="0"
                              max="100"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="renewalOption"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Renewal Option</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select renewal option" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="automatic">Automatic</SelectItem>
                              <SelectItem value="manual">Manual</SelectItem>
                              <SelectItem value="none">None</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="pricingNotes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Special Pricing Notes</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Include any special pricing considerations, concessions, or non-standard terms"
                            className="resize-none"
                            rows={3}
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>
                          Include any special pricing considerations, concessions, or non-standard terms.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="mt-8 flex justify-between">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={prevStep}
                  >
                    Previous: Deal Details
                  </Button>
                  <Button type="button" onClick={nextStep}>
                    Next: Review & Submit
                  </Button>
                </div>
              </CardContent>
            )}
            
            {/* Step 3: Review & Submit */}
            {formStep === 2 && (
              <CardContent className="p-6">
                <div className="mb-6">
                  <h2 className="text-lg font-medium text-slate-900">Review and Submit</h2>
                  <p className="mt-1 text-sm text-slate-500">Please review all information before submitting</p>
                </div>
                
                <div className="bg-slate-50 p-4 rounded-lg mb-6">
                  <div className="text-sm text-slate-500 italic">
                    By submitting this deal, you confirm that all information is accurate and complete. The deal will be reviewed by the appropriate team members based on your department and deal value.
                  </div>
                </div>
                
                {/* Review Sections */}
                <div className="space-y-6">
                  <div className="border border-slate-200 rounded-lg overflow-hidden">
                    <div className="px-4 py-3 bg-slate-50 border-b border-slate-200">
                      <h3 className="text-sm font-medium text-slate-700">Deal Information</h3>
                    </div>
                    <div className="p-4">
                      <dl className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
                        <div>
                          <dt className="text-sm font-medium text-slate-500">Deal Name</dt>
                          <dd className="mt-1 text-sm text-slate-900">
                            {form.getValues("dealName") || "Not provided"}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-slate-500">Deal Type</dt>
                          <dd className="mt-1 text-sm text-slate-900">
                            {form.getValues("dealType") ? 
                              form.getValues("dealType")
                                .replace("_", " ")
                                .replace(/\b\w/g, char => char.toUpperCase()) : 
                              "Not provided"}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-slate-500">Expected Close Date</dt>
                          <dd className="mt-1 text-sm text-slate-900">
                            {form.getValues("expectedCloseDate") ? 
                              new Date(form.getValues("expectedCloseDate")).toLocaleDateString() : 
                              "Not provided"}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-slate-500">Department</dt>
                          <dd className="mt-1 text-sm text-slate-900">
                            {form.getValues("department") ? 
                              form.getValues("department")
                                .replace("_", " ")
                                .replace(/\b\w/g, char => char.toUpperCase()) : 
                              "Not provided"}
                          </dd>
                        </div>
                        <div className="sm:col-span-2">
                          <dt className="text-sm font-medium text-slate-500">Deal Description</dt>
                          <dd className="mt-1 text-sm text-slate-900">
                            {form.getValues("description") || "Not provided"}
                          </dd>
                        </div>
                      </dl>
                    </div>
                  </div>
                  
                  <div className="border border-slate-200 rounded-lg overflow-hidden">
                    <div className="px-4 py-3 bg-slate-50 border-b border-slate-200">
                      <h3 className="text-sm font-medium text-slate-700">Client Information</h3>
                    </div>
                    <div className="p-4">
                      <dl className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
                        <div>
                          <dt className="text-sm font-medium text-slate-500">Client Name</dt>
                          <dd className="mt-1 text-sm text-slate-900">
                            {form.getValues("clientName") || "Not provided"}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-slate-500">Client Type</dt>
                          <dd className="mt-1 text-sm text-slate-900">
                            {form.getValues("clientType") ? 
                              form.getValues("clientType")
                                .replace("_", " ")
                                .replace(/\b\w/g, char => char.toUpperCase()) : 
                              "Not provided"}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-slate-500">Industry</dt>
                          <dd className="mt-1 text-sm text-slate-900">
                            {form.getValues("industry") ? 
                              form.getValues("industry")
                                .replace("_", " ")
                                .replace(/\b\w/g, char => char.toUpperCase()) : 
                              "Not provided"}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-slate-500">Region</dt>
                          <dd className="mt-1 text-sm text-slate-900">
                            {form.getValues("region") ? 
                              form.getValues("region")
                                .replace("_", " ")
                                .replace(/\b\w/g, char => char.toUpperCase()) : 
                              "Not provided"}
                          </dd>
                        </div>
                      </dl>
                    </div>
                  </div>
                  
                  <div className="border border-slate-200 rounded-lg overflow-hidden">
                    <div className="px-4 py-3 bg-slate-50 border-b border-slate-200">
                      <h3 className="text-sm font-medium text-slate-700">Pricing Information</h3>
                    </div>
                    <div className="p-4">
                      <dl className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
                        <div>
                          <dt className="text-sm font-medium text-slate-500">Total Deal Value</dt>
                          <dd className="mt-1 text-sm text-slate-900">
                            {form.getValues("totalValue") ? 
                              `$${form.getValues("totalValue").toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2
                              })}` : 
                              "Not provided"}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-slate-500">Contract Term</dt>
                          <dd className="mt-1 text-sm text-slate-900">
                            {form.getValues("contractTerm") ? 
                              `${form.getValues("contractTerm")} Months` : 
                              "Not provided"}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-slate-500">Payment Terms</dt>
                          <dd className="mt-1 text-sm text-slate-900">
                            {form.getValues("paymentTerms") ? 
                              form.getValues("paymentTerms")
                                .replace("_", " ")
                                .replace(/\b\w/g, char => char.toUpperCase()) : 
                              "Not provided"}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-slate-500">Discount</dt>
                          <dd className="mt-1 text-sm text-slate-900">
                            {`${form.getValues("discountPercentage") || 0}%`}
                          </dd>
                        </div>
                        <div className="sm:col-span-2">
                          <dt className="text-sm font-medium text-slate-500">Special Pricing Notes</dt>
                          <dd className="mt-1 text-sm text-slate-900">
                            {form.getValues("pricingNotes") || "None"}
                          </dd>
                        </div>
                      </dl>
                    </div>
                  </div>
                </div>
                
                <div className="mt-8 flex justify-between">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={prevStep}
                  >
                    Previous: Client & Pricing
                  </Button>
                  <Button type="submit" disabled={createDeal.isPending}>
                    {createDeal.isPending ? "Submitting..." : "Submit Deal for Approval"}
                  </Button>
                </div>
              </CardContent>
            )}
          </form>
        </Form>
      </Card>
    </div>
  );
}
