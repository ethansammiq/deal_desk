import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { ApprovalAlert } from "@/components/ApprovalAlert";
import { IncentiveSelector } from "@/components/IncentiveSelector";
import { queryClient } from "@/lib/queryClient";
import { cn } from "@/lib/utils";
import { SelectedIncentive } from "@/lib/incentive-data";
import { AlertCircle, AlertTriangle, CheckCircle, ChevronRight } from "lucide-react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  Table, 
  TableBody, 
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { formatCurrency, formatPercentage } from "@/lib/utils";
import { ApprovalRule } from "@/lib/approval-matrix";

// Form validation schema
const dealFormSchema = z.object({
  // Basic Deal Info
  dealType: z.string().min(1, "Please select a deal type"),
  businessSummary: z.string().min(10, "Please provide a business summary"),
  salesChannel: z.string().min(1, "Please select a sales channel"),
  region: z.string().min(1, "Please select a region"),
  email: z.string().email("Please enter a valid email").optional().or(z.literal("")),
  advertiserName: z.string().min(1, "Please select an advertiser").optional(),
  agencyName: z.string().min(1, "Please select an agency").optional(),
  // Deal Structure & Pricing
  dealStructureType: z.string({ required_error: "Please select a deal structure type" }),
  contractStartDate: z.string().min(1, "Please select a contract start date"),
  contractEndDate: z.string().min(1, "Please select a contract end date"),
  contractTerm: z.number().min(1, "Contract term must be at least 1 month"),
  notes: z.string().optional(),
  hasNonStandardTerms: z.boolean().default(false),
  nonStandardTermsDetails: z.string().optional(),
}).refine((data) => {
  // Ensure at least one of advertiserName or agencyName is filled
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
}).refine((data) => {
  // If nonStandardTerms is checked, details are required
  if (data.hasNonStandardTerms && (!data.nonStandardTermsDetails || data.nonStandardTermsDetails.length < 10)) {
    return false;
  }
  return true;
}, {
  message: "Please provide details about non-standard terms",
  path: ["nonStandardTermsDetails"],
});

export default function SubmitDeal() {
  const { toast } = useToast();
  const [formStep, setFormStep] = useState(0);
  const [dealTiers, setDealTiers] = useState<Array<{tierNumber: number, annualRevenue: number, annualMargin: number}>>([
    { tierNumber: 1, annualRevenue: 0, annualMargin: 0 }
  ]);
  const [selectedIncentives, setSelectedIncentives] = useState<SelectedIncentive[]>([]);
  const [revenue, setRevenue] = useState<number | undefined>();
  const [margin, setMargin] = useState<number | undefined>();
  const [requiredApprover, setRequiredApprover] = useState<string>("");
  const [approvalInfo, setApprovalInfo] = useState<ApprovalRule | null>(null);
  
  const [advertisers, setAdvertisers] = useState<any[]>([]);
  const [agencies, setAgencies] = useState<any[]>([]);
  
  // Initialize form with default values
  const form = useForm<z.infer<typeof dealFormSchema>>({
    resolver: zodResolver(dealFormSchema),
    defaultValues: {
      dealType: "",
      businessSummary: "",
      salesChannel: "",
      region: "",
      email: "",
      advertiserName: "",
      agencyName: "",
      dealStructureType: "tiered",
      contractStartDate: "",
      contractEndDate: "",
      contractTerm: 12,
      notes: "",
      hasNonStandardTerms: false,
      nonStandardTermsDetails: "",
    },
  });
  
  function getTypedValue(field: keyof z.infer<typeof dealFormSchema>) {
    return form.getValues(field);
  }

  function watchTypedValue(field: keyof z.infer<typeof dealFormSchema>) {
    return form.watch(field);
  }
  
  const dealType = watchTypedValue("dealType");
  const salesChannel = watchTypedValue("salesChannel");
  const contractTerm = watchTypedValue("contractTerm");
  const hasNonStandardTerms = !!watchTypedValue("hasNonStandardTerms");
  const dealStructureType = watchTypedValue("dealStructureType");
  
  const handleApprovalChange = (level: string, approvalInfo: ApprovalRule) => {
    setRequiredApprover(level);
    setApprovalInfo(approvalInfo);
  };
  
  // Query advertisers and agencies
  useEffect(() => {
    async function fetchData() {
      try {
        const [advertisersResponse, agenciesResponse] = await Promise.all([
          fetch('/api/advertisers', { credentials: 'include' }),
          fetch('/api/agencies', { credentials: 'include' })
        ]);
        
        if (advertisersResponse.ok) {
          const data = await advertisersResponse.json();
          setAdvertisers(data);
        }
        
        if (agenciesResponse.ok) {
          const data = await agenciesResponse.json();
          setAgencies(data);
        }
      } catch (error) {
        toast({
          title: "Error loading data",
          description: "Failed to load advertisers and agencies. Please refresh the page.",
          variant: "destructive",
        });
      }
    }
    
    fetchData();
  }, [toast]);
  
  async function validateAndGoToStep(targetStep: number) {
    let isValid = true;
    
    if (targetStep === 1) {
      // Validate fields required for step 1
      const step1Fields = [
        "dealType", "businessSummary", "salesChannel", "region"
      ];
      
      // If salesChannel is client_direct, validate advertiserName
      if (salesChannel === "client_direct") {
        step1Fields.push("advertiserName");
      }
      
      // If salesChannel is holding_company or independent_agency, validate agencyName
      if (salesChannel === "holding_company" || salesChannel === "independent_agency") {
        step1Fields.push("agencyName");
      }
      
      isValid = await form.trigger(step1Fields as any);
      if (isValid) setFormStep(targetStep);
    } else if (targetStep === 2) {
      // Validate fields required for step 2
      const step2Fields = [
        "dealStructureType", "contractStartDate", "contractEndDate", "contractTerm"
      ];
      
      // If hasNonStandardTerms is true, validate nonStandardTermsDetails
      if (hasNonStandardTerms) {
        step2Fields.push("nonStandardTermsDetails");
      }
      
      isValid = await form.trigger(step2Fields as any);
      if (isValid) {
        // Ensure deal tiers are valid
        if (dealStructureType === "tiered") {
          // Check if there's at least one tier with revenue > 0
          const validTiers = dealTiers.filter(tier => tier.annualRevenue > 0);
          if (validTiers.length === 0) {
            toast({
              title: "Invalid Deal Structure",
              description: "Please add at least one tier with revenue greater than 0.",
              variant: "destructive",
            });
            return false;
          }
        }
        
        setFormStep(targetStep);
      }
    }
    
    return isValid;
  }
  
  async function nextStep() {
    await validateAndGoToStep(formStep + 1);
  }
  
  function prevStep() {
    setFormStep(Math.max(0, formStep - 1));
  }
  
  // Set up mutation for form submission
  const createDeal = useMutation({
    mutationFn: async (data: z.infer<typeof dealFormSchema>) => {
      // Create the deal payload
      const totalRevenue = dealTiers.reduce((sum, tier) => sum + tier.annualRevenue, 0);
      const totalMargin = dealTiers.reduce((sum, tier) => sum + (tier.annualMargin || 0), 0);
      
      // Calculate the average margin percentage across all tiers
      const avgMarginPercent = totalRevenue > 0 
        ? (totalMargin / totalRevenue) * 100 
        : 0;
      
      const dealData = {
        ...data,
        status: "pending_approval",
        dealTiers: dealTiers,
        incentives: selectedIncentives,
        totalAnnualRevenue: totalRevenue,
        totalAnnualMargin: totalMargin,
        averageMarginPercent: avgMarginPercent,
        approvedBy: "",
        requiredApprover: requiredApprover,
      };
      
      const response = await fetch('/api/deals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dealData),
        credentials: 'include'
      });
      
      if (!response.ok) {
        const text = await response.text();
        throw new Error(`${response.status}: ${text || response.statusText}`);
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Deal Submitted",
        description: `Deal #${data.id} has been submitted successfully and is pending approval.`,
      });
      
      // Reset form and state
      form.reset();
      setDealTiers([{ tierNumber: 1, annualRevenue: 0, annualMargin: 0 }]);
      setSelectedIncentives([]);
      setFormStep(0);
      
      // Invalidate queries to refresh deal listings
      queryClient.invalidateQueries({queryKey: ['/api/deals']});
    },
    onError: (error) => {
      toast({
        title: "Submission Failed",
        description: `There was an error submitting your deal: ${error.message}`,
        variant: "destructive",
      });
    }
  });
  
  function onSubmit(data: z.infer<typeof dealFormSchema>) {
    // Final validation before submission
    if (dealStructureType === "tiered" && dealTiers.length === 0) {
      toast({
        title: "Invalid Deal Structure",
        description: "Please add at least one tier with revenue greater than 0.",
        variant: "destructive",
      });
      return;
    }
    
    createDeal.mutate(data);
  }
  
  return (
    <div className="bg-slate-50 min-h-screen">
      <div className="container mx-auto py-6 px-4 md:px-6">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-indigo-700 to-purple-700 bg-clip-text text-transparent mb-2">Deal Submission</h1>
            <p className="text-slate-600">Submit and track commercial deals for approval</p>
          </div>
          <div className="mt-4 md:mt-0">
            <span className="px-3 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">Step 2 of 2</span>
          </div>
        </div>
        
        {/* About Deal Section */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold text-slate-800 mb-4">About Deal Submission</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg shadow-md p-5 border-0">
              <h4 className="font-medium text-slate-900 mb-2">What is Deal Submission?</h4>
              <p className="text-sm text-slate-500">
                Deal submission is where you formally propose a commercial deal for approval. This form collects all required information about deal structure, revenue, and incentives.
              </p>
            </div>
            
            <div className="bg-white rounded-lg shadow-md p-5 border-0">
              <h4 className="font-medium text-slate-900 mb-2">Deal Approval Process</h4>
              <ol className="text-sm text-slate-500 list-decimal list-inside space-y-1">
                <li>Complete and submit this form</li>
                <li>Appropriate approvers review the deal terms</li>
                <li>You'll receive updates on approval status</li>
                <li>Once approved, the deal will be finalized for execution</li>
              </ol>
            </div>
            
            <div className="bg-blue-50 rounded-lg shadow-md p-5 border-0">
              <h4 className="font-medium text-blue-800 mb-2">Tips for Faster Approval</h4>
              <ul className="text-sm text-blue-700 list-disc list-inside space-y-1">
                <li>Include all required documentation</li>
                <li>Clearly explain any non-standard terms</li>
                <li>For urgent deals, add a note in the comments</li>
                <li>Use the chatbot for help with any questions</li>
              </ul>
            </div>
          </div>
        </div>
        
        {/* Submit Deal Form Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex items-center mb-2">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Submit New Deal</h2>
            <span className="ml-3 px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">Step 2 of 2</span>
          </div>
          <p className="mt-1 mb-6 text-sm text-slate-500">Complete the form below to submit a new commercial deal for approval</p>
        
          {/* Form Progress - Modified to be clickable for back and forth navigation */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div className="w-full flex items-center">
                <div 
                  onClick={() => prevStep()}
                  className={cn(
                    "flex items-center justify-center w-10 h-10 rounded-full border-2 text-sm font-medium cursor-pointer hover:opacity-90 transition-opacity",
                    formStep >= 0 ? "border-primary bg-primary text-white" : "border-slate-300 text-slate-500"
                  )}
                >
                  1
                </div>
                <div className={cn(
                  "w-full h-1 bg-slate-200",
                  formStep >= 1 ? "bg-primary" : ""
                )}></div>
                <div 
                  onClick={async () => {
                    if (formStep >= 1) {
                      setFormStep(1);
                    } else {
                      await validateAndGoToStep(1);
                    }
                  }}
                  className={cn(
                    "flex items-center justify-center w-10 h-10 rounded-full border-2 text-sm font-medium cursor-pointer hover:opacity-90 transition-opacity",
                    formStep >= 1 ? "border-primary bg-primary text-white" : "border-slate-300 text-slate-500"
                  )}
                >
                  2
                </div>
                <div className={cn(
                  "w-full h-1 bg-slate-200",
                  formStep >= 2 ? "bg-primary" : ""
                )}></div>
                <div 
                  onClick={async () => {
                    if (formStep >= 2) {
                      setFormStep(2);
                    } else {
                      await validateAndGoToStep(2);
                    }
                  }}
                  className={cn(
                    "flex items-center justify-center w-10 h-10 rounded-full border-2 text-sm font-medium cursor-pointer hover:opacity-90 transition-opacity",
                    formStep >= 2 ? "border-primary bg-primary text-white" : "border-slate-300 text-slate-500"
                  )}
                >
                  3
                </div>
              </div>
            </div>
            <div className="flex justify-between text-sm text-slate-600">
              <div 
                onClick={() => prevStep()}
                className={cn(
                  "cursor-pointer hover:text-primary transition-colors", 
                  formStep === 0 ? "font-medium text-primary" : ""
                )}
              >
                Deal Details
              </div>
              <div 
                onClick={async () => {
                  if (formStep >= 1) {
                    setFormStep(1);
                  } else {
                    await validateAndGoToStep(1);
                  }
                }} 
                className={cn(
                  "cursor-pointer hover:text-primary transition-colors", 
                  formStep === 1 ? "font-medium text-primary" : ""
                )}
              >
                Deal Structure & Pricing
              </div>
              <div 
                onClick={async () => {
                  if (formStep >= 2) {
                    setFormStep(2);
                  } else {
                    await validateAndGoToStep(2);
                  }
                }}
                className={cn(
                  "cursor-pointer hover:text-primary transition-colors", 
                  formStep === 2 ? "font-medium text-primary" : ""
                )}
              >
                Review & Submit
              </div>
            </div>
          </div>
          
          {/* Form Container */}
          <Card className="border shadow-md rounded-lg">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)}>
              {/* Step 1: Deal Details */}
              {formStep === 0 && (
                <CardContent className="p-6">
                  <div className="mb-6">
                    <h2 className="text-lg font-medium text-slate-900">Basic Deal Information</h2>
                    <p className="mt-1 text-sm text-slate-500">Provide the basic details about this commercial deal</p>
                  </div>
                  
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                      
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
                                <SelectItem value="grow">Grow ({'>'}20% YOY Growth)</SelectItem>
                                <SelectItem value="protect">Protect (Large Account Retention)</SelectItem>
                                <SelectItem value="custom">Custom (Special Builds/Requirements)</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormDescription>
                              Grow: {'>'}20% YOY growth for existing clients<br />
                              Protect: Retention focus for large accounts<br />
                              Custom: Special build requirements
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <FormField
                      control={form.control}
                      name="businessSummary"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Business Summary <span className="text-red-500">*</span></FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Briefly describe the deal, its objectives, and any special considerations"
                              className="resize-none"
                              rows={4}
                              {...field} 
                            />
                          </FormControl>
                          <FormDescription>
                            Briefly describe the business opportunity, growth potential, and any special considerations.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="salesChannel"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Sales Channel <span className="text-red-500">*</span></FormLabel>
                            <Select 
                              onValueChange={field.onChange} 
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select sales channel" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="client_direct">Client Direct</SelectItem>
                                <SelectItem value="holding_company">Holding Company</SelectItem>
                                <SelectItem value="independent_agency">Independent Agency</SelectItem>
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
                            <FormLabel>Region <span className="text-red-500">*</span></FormLabel>
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
                                <SelectItem value="northeast">Northeast</SelectItem>
                                <SelectItem value="midwest">Midwest</SelectItem>
                                <SelectItem value="midatlantic">Mid-Atlantic</SelectItem>
                                <SelectItem value="south">South</SelectItem>
                                <SelectItem value="west">West</SelectItem>
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
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Contact Email</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter contact email" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    {/* Conditional fields based on sales channel */}
                    <div className="grid grid-cols-1 gap-6">
                      {salesChannel === "client_direct" && (
                        <FormField
                          control={form.control}
                          name="advertiserName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Advertiser Name <span className="text-red-500">*</span></FormLabel>
                              <Select 
                                onValueChange={field.onChange} 
                                defaultValue={field.value}
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
                              <FormDescription>
                                Historical data will be loaded automatically when selected
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}
                      
                      {(salesChannel === "holding_company" || salesChannel === "independent_agency") && (
                        <FormField
                          control={form.control}
                          name="agencyName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Agency Name <span className="text-red-500">*</span></FormLabel>
                              <Select 
                                onValueChange={field.onChange} 
                                defaultValue={field.value}
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
                              <FormDescription>
                                Historical data will be loaded automatically when selected
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}
                    </div>
                    
                    <div className="flex justify-end mt-6">
                      <Button type="button" onClick={() => nextStep()}>Next: Deal Structure & Pricing</Button>
                    </div>
                  </div>
                </CardContent>
              )}
              
              {/* Step 2: Deal Structure & Pricing */}
              {formStep === 1 && (
                <CardContent className="p-6">
                  <div className="mb-6">
                    <h2 className="text-lg font-medium text-slate-900">Deal Structure & Pricing</h2>
                    <p className="mt-1 text-sm text-slate-500">Define your deal's structure, revenue tiers, and incentives</p>
                  </div>
                  
                  <div className="space-y-8">
                    {/* Deal Structure Type */}
                    <div className="space-y-4">
                      <FormField
                        control={form.control}
                        name="dealStructureType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Deal Structure Type <span className="text-red-500">*</span></FormLabel>
                            <Select 
                              onValueChange={field.onChange} 
                              defaultValue={field.value}
                              disabled={selectedIncentives.length > 0}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select structure type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="tiered">Tiered Revenue Structure</SelectItem>
                                <SelectItem value="flat_commit">Flat Commit</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormDescription>
                              {field.value === "tiered" 
                                ? "Tiered structure includes multiple revenue thresholds with potential for increased incentives at higher tiers" 
                                : "Flat commit is a guaranteed level of spending across the contract period"}
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      {/* Contract Term */}
                      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                        <FormField
                          control={form.control}
                          name="contractStartDate"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Contract Start Date <span className="text-red-500">*</span></FormLabel>
                              <FormControl>
                                <Input type="date" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="contractEndDate"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Contract End Date <span className="text-red-500">*</span></FormLabel>
                              <FormControl>
                                <Input type="date" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="contractTerm"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Contract Term (Months) <span className="text-red-500">*</span></FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  {...field} 
                                  onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      {/* Revenue Structure */}
                      {dealStructureType === "tiered" && (
                        <div className="space-y-4 mt-6">
                          <div className="flex justify-between items-center">
                            <h3 className="text-base font-medium text-slate-900">Tier Revenue Structure</h3>
                            <div className="flex space-x-2">
                              <Button 
                                variant="outline" 
                                size="sm"
                                type="button"
                                onClick={() => {
                                  if (dealTiers.length > 1) {
                                    setDealTiers(dealTiers.slice(0, -1));
                                  }
                                }}
                                disabled={dealTiers.length <= 1}
                              >
                                Remove Tier
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                type="button"
                                onClick={() => {
                                  const newTierNumber = dealTiers.length + 1;
                                  setDealTiers([...dealTiers, { 
                                    tierNumber: newTierNumber, 
                                    annualRevenue: 0, 
                                    annualMargin: 0
                                  }]);
                                }}
                                disabled={dealTiers.length >= 6}
                              >
                                Add Tier
                              </Button>
                            </div>
                          </div>
                          
                          <div className="bg-white rounded-lg border">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead className="w-20">Tier</TableHead>
                                  <TableHead>Annual Revenue</TableHead>
                                  <TableHead>Annual Margin %</TableHead>
                                  <TableHead>Annual Margin Value</TableHead>
                                  <TableHead>Last Year</TableHead>
                                  <TableHead>Growth</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {dealTiers.map((tier, index) => (
                                  <TableRow key={tier.tierNumber}>
                                    <TableCell className="font-medium">Tier {tier.tierNumber}</TableCell>
                                    <TableCell>
                                      <div className="flex items-center">
                                        <span className="text-sm text-slate-500 mr-2">$</span>
                                        <Input 
                                          type="number"
                                          value={tier.annualRevenue} 
                                          onChange={(e) => {
                                            const newValue = parseFloat(e.target.value) || 0;
                                            const newTiers = [...dealTiers];
                                            newTiers[index].annualRevenue = newValue;
                                            setDealTiers(newTiers);
                                            
                                            // Update total revenue
                                            const totalRevenue = newTiers.reduce((sum, t) => sum + t.annualRevenue, 0);
                                            setRevenue(totalRevenue);
                                          }}
                                          className="max-w-[120px]"
                                        />
                                      </div>
                                    </TableCell>
                                    <TableCell>
                                      <div className="flex items-center">
                                        <Input 
                                          type="number"
                                          value={tier.annualMargin} 
                                          onChange={(e) => {
                                            const newValue = parseFloat(e.target.value) || 0;
                                            const newTiers = [...dealTiers];
                                            newTiers[index].annualMargin = newValue;
                                            setDealTiers(newTiers);
                                            
                                            // Update total margin
                                            const totalMargin = newTiers.reduce((sum, t) => sum + (t.annualMargin || 0), 0);
                                            setMargin(totalMargin);
                                          }}
                                          className="max-w-[80px]"
                                        />
                                        <span className="text-sm text-slate-500 ml-2">%</span>
                                      </div>
                                    </TableCell>
                                    <TableCell>
                                      {formatCurrency(tier.annualRevenue * (tier.annualMargin / 100))}
                                    </TableCell>
                                    <TableCell className="text-slate-500">
                                      {formatCurrency(tier.annualRevenue * 0.85)} {/* Sample "last year" value */}
                                    </TableCell>
                                    <TableCell className="text-green-600">
                                      {formatPercentage(15)} {/* Sample growth rate */}
                                    </TableCell>
                                  </TableRow>
                                ))}
                                <TableRow className="bg-slate-50">
                                  <TableCell className="font-semibold">Total</TableCell>
                                  <TableCell className="font-semibold">
                                    {formatCurrency(dealTiers.reduce((sum, tier) => sum + tier.annualRevenue, 0))}
                                  </TableCell>
                                  <TableCell className="font-semibold">
                                    {formatPercentage(
                                      dealTiers.reduce((sum, tier) => sum + tier.annualRevenue, 0) > 0
                                        ? (dealTiers.reduce((sum, tier) => sum + (tier.annualRevenue * tier.annualMargin / 100), 0) / 
                                          dealTiers.reduce((sum, tier) => sum + tier.annualRevenue, 0)) * 100
                                        : 0
                                    )}
                                  </TableCell>
                                  <TableCell className="font-semibold">
                                    {formatCurrency(
                                      dealTiers.reduce((sum, tier) => sum + (tier.annualRevenue * tier.annualMargin / 100), 0)
                                    )}
                                  </TableCell>
                                  <TableCell className="font-semibold text-slate-500">
                                    {formatCurrency(dealTiers.reduce((sum, tier) => sum + tier.annualRevenue, 0) * 0.85)}
                                  </TableCell>
                                  <TableCell className="font-semibold text-green-600">
                                    {formatPercentage(15)}
                                  </TableCell>
                                </TableRow>
                              </TableBody>
                            </Table>
                          </div>
                        </div>
                      )}
                      
                      {/* Flat commit structure */}
                      {dealStructureType === "flat_commit" && (
                        <div className="space-y-4 mt-6">
                          <h3 className="text-base font-medium text-slate-900">Flat Commit Structure</h3>
                          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                            <div>
                              <label className="block text-sm font-medium text-slate-700 mb-1">
                                Annual Revenue <span className="text-red-500">*</span>
                              </label>
                              <div className="flex items-center">
                                <span className="text-sm text-slate-500 mr-2">$</span>
                                <Input 
                                  type="number"
                                  value={dealTiers[0].annualRevenue} 
                                  onChange={(e) => {
                                    const newValue = parseFloat(e.target.value) || 0;
                                    const newTiers = [...dealTiers];
                                    newTiers[0].annualRevenue = newValue;
                                    setDealTiers(newTiers);
                                    setRevenue(newValue);
                                  }}
                                />
                              </div>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-slate-700 mb-1">
                                Annual Margin % <span className="text-red-500">*</span>
                              </label>
                              <div className="flex items-center">
                                <Input 
                                  type="number"
                                  value={dealTiers[0].annualMargin} 
                                  onChange={(e) => {
                                    const newValue = parseFloat(e.target.value) || 0;
                                    const newTiers = [...dealTiers];
                                    newTiers[0].annualMargin = newValue;
                                    setDealTiers(newTiers);
                                    setMargin(newValue);
                                  }}
                                  className="max-w-[120px]"
                                />
                                <span className="text-sm text-slate-500 ml-2">%</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="mt-4 p-4 bg-slate-50 rounded-lg">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <span className="text-sm text-slate-500">Annual Margin Value:</span>
                                <p className="font-semibold">
                                  {formatCurrency(dealTiers[0].annualRevenue * (dealTiers[0].annualMargin / 100))}
                                </p>
                              </div>
                              <div>
                                <span className="text-sm text-slate-500">YOY Growth:</span>
                                <p className="font-semibold text-green-600">
                                  {formatPercentage(15)} {/* Sample growth rate */}
                                </p>
                              </div>
                              <div>
                                <span className="text-sm text-slate-500">Monthly Revenue:</span>
                                <p className="font-semibold">
                                  {formatCurrency(dealTiers[0].annualRevenue / 12)}
                                </p>
                              </div>
                              <div>
                                <span className="text-sm text-slate-500">Previous Year Revenue:</span>
                                <p className="font-semibold text-slate-500">
                                  {formatCurrency(dealTiers[0].annualRevenue * 0.85)} {/* Sample "last year" value */}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {/* Incentives Section */}
                      <div className="space-y-4 mt-8">
                        <h3 className="text-base font-medium text-slate-900">Deal Incentives</h3>
                        <p className="text-sm text-slate-500">Add incentives that will be offered as part of this deal</p>
                        
                        <IncentiveSelector 
                          dealTiers={dealTiers}
                          selectedIncentives={selectedIncentives}
                          onChange={setSelectedIncentives}
                          dealStructureType={dealStructureType as string}
                        />
                        
                        {/* Non-standard Terms */}
                        <div className="space-y-4 mt-8 pt-6 border-t border-slate-200">
                          <div className="flex items-start">
                            <FormField
                              control={form.control}
                              name="hasNonStandardTerms"
                              render={({ field }) => (
                                <FormItem className="flex items-start">
                                  <FormControl>
                                    <Checkbox 
                                      checked={field.value}
                                      onCheckedChange={field.onChange}
                                    />
                                  </FormControl>
                                  <div className="ml-2">
                                    <FormLabel>This deal includes non-standard terms</FormLabel>
                                    <FormDescription>
                                      Select this option if the deal includes any custom or non-standard terms
                                    </FormDescription>
                                  </div>
                                </FormItem>
                              )}
                            />
                          </div>
                          
                          {hasNonStandardTerms && (
                            <FormField
                              control={form.control}
                              name="nonStandardTermsDetails"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Non-standard Terms Details <span className="text-red-500">*</span></FormLabel>
                                  <FormControl>
                                    <Textarea 
                                      placeholder="Please describe the non-standard terms in detail..."
                                      className="resize-none"
                                      rows={4}
                                      {...field} 
                                    />
                                  </FormControl>
                                  <FormDescription>
                                    Provide clear details about any custom or non-standard terms included in this deal
                                  </FormDescription>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          )}
                          
                          {/* Notes */}
                          <FormField
                            control={form.control}
                            name="notes"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Additional Notes</FormLabel>
                                <FormControl>
                                  <Textarea 
                                    placeholder="Add any additional notes about this deal..."
                                    className="resize-none"
                                    rows={3}
                                    {...field} 
                                  />
                                </FormControl>
                                <FormDescription>
                                  Optional notes for the approval team
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex justify-between pt-6">
                      <Button type="button" variant="outline" onClick={prevStep}>Back: Deal Details</Button>
                      <Button type="button" onClick={() => nextStep()}>Next: Review & Submit</Button>
                    </div>
                  </div>
                </CardContent>
              )}
              
              {/* Step 3: Review & Submit */}
              {formStep === 2 && (
                <CardContent className="p-6">
                  <div className="mb-6">
                    <h2 className="text-lg font-medium text-slate-900">Review & Submit</h2>
                    <p className="mt-1 text-sm text-slate-500">Review your deal details before submission</p>
                  </div>
                  
                  <div className="space-y-8">
                    <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                      {/* Deal Details Summary */}
                      <div className="space-y-4">
                        <h3 className="text-base font-medium text-slate-900 border-b pb-2">Deal Details</h3>
                        <div className="grid grid-cols-1 gap-4">
                          <div>
                            <span className="text-sm text-slate-500 block">Deal Type:</span>
                            <p className="font-medium">{salesChannel && salesChannel.replace('_', ' ').replace(/\w\S*/g, w => w.replace(/^\w/, c => c.toUpperCase()))}</p>
                          </div>
                          
                          <div>
                            <span className="text-sm text-slate-500 block">Company:</span>
                            <p className="font-medium">
                              {salesChannel === "client_direct" 
                                ? form.getValues("advertiserName")
                                : form.getValues("agencyName")}
                            </p>
                          </div>
                          
                          <div>
                            <span className="text-sm text-slate-500 block">Region:</span>
                            <p className="font-medium">
                              {form.getValues("region")?.replace(/\w\S*/g, w => w.replace(/^\w/, c => c.toUpperCase()))}
                            </p>
                          </div>
                          
                          <div>
                            <span className="text-sm text-slate-500 block">Business Summary:</span>
                            <p className="text-sm">
                              {form.getValues("businessSummary")}
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      {/* Structure & Pricing Summary */}
                      <div className="space-y-4">
                        <h3 className="text-base font-medium text-slate-900 border-b pb-2">Deal Structure</h3>
                        <div className="grid grid-cols-1 gap-4">
                          <div>
                            <span className="text-sm text-slate-500 block">Structure Type:</span>
                            <p className="font-medium">
                              {dealStructureType && dealStructureType.replace('_', ' ').replace(/\w\S*/g, w => w.replace(/^\w/, c => c.toUpperCase()))}
                            </p>
                          </div>
                          
                          <div>
                            <span className="text-sm text-slate-500 block">Contract Period:</span>
                            <p className="font-medium">
                              {form.getValues("contractStartDate")} to {form.getValues("contractEndDate")} ({form.getValues("contractTerm")} months)
                            </p>
                          </div>
                          
                          <div>
                            <span className="text-sm text-slate-500 block">Total Annual Revenue:</span>
                            <p className="font-semibold text-lg">
                              {formatCurrency(dealTiers.reduce((sum, tier) => sum + tier.annualRevenue, 0))}
                            </p>
                          </div>
                          
                          <div>
                            <span className="text-sm text-slate-500 block">Average Margin:</span>
                            <p className="font-medium">
                              {formatPercentage(
                                dealTiers.reduce((sum, tier) => sum + tier.annualRevenue, 0) > 0
                                  ? (dealTiers.reduce((sum, tier) => sum + (tier.annualRevenue * tier.annualMargin / 100), 0) / 
                                    dealTiers.reduce((sum, tier) => sum + tier.annualRevenue, 0)) * 100
                                  : 0
                              )}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Incentives */}
                    <div className="space-y-4">
                      <h3 className="text-base font-medium text-slate-900 border-b pb-2">Incentives</h3>
                      
                      {selectedIncentives.length > 0 ? (
                        <div className="space-y-3">
                          {selectedIncentives.map((incentive, index) => (
                            <div key={index} className="bg-slate-50 rounded-lg p-4">
                              <div className="flex justify-between">
                                <div>
                                  <div className="text-slate-900">{incentive.option}</div>
                                  <div className="text-xs text-slate-500">{incentive.categoryId}/{incentive.subCategoryId}</div>
                                </div>
                                <div className="text-right">
                                  <div className="text-sm text-slate-500">
                                    {Object.keys(incentive.tierValues).length} {dealStructureType === "tiered" ? "Tiers" : "Value"}
                                  </div>
                                  <div className="text-xs text-slate-400">
                                    {Object.values(incentive.tierValues).reduce((total, val) => total + val, 0) > 0 && (
                                      <>Value: {formatCurrency(Object.values(incentive.tierValues).reduce((total, val) => total + val, 0))}</>
                                    )}
                                  </div>
                                </div>
                              </div>
                              {incentive.notes && (
                                <div className="mt-2 text-xs text-slate-500 border-t pt-2">
                                  <span className="font-medium">Notes:</span> {incentive.notes}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-sm text-slate-500 italic">No incentives added to this deal</div>
                      )}
                    </div>
                    
                    {/* Approval Requirements */}
                    <div className="space-y-4 bg-slate-50 p-4 rounded-lg">
                      <h3 className="text-base font-medium text-slate-900">Approval Requirements</h3>
                      
                      <ApprovalAlert 
                        totalValue={dealTiers.reduce((sum, tier) => sum + tier.annualRevenue, 0)}
                        hasNonStandardTerms={!!form.getValues("hasNonStandardTerms")}
                        contractTerm={form.getValues("contractTerm") || 12}
                        dealType={form.getValues("dealType")}
                        salesChannel={form.getValues("salesChannel")}
                        onChange={handleApprovalChange}
                      />
                      
                      {hasNonStandardTerms && (
                        <Alert className="bg-amber-50 border-amber-100 text-amber-800">
                          <AlertTriangle className="h-4 w-4" />
                          <AlertTitle>Non-standard Terms</AlertTitle>
                          <AlertDescription>
                            {form.getValues("nonStandardTermsDetails")}
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                    
                    <div className="flex justify-between pt-6">
                      <Button type="button" variant="outline" onClick={prevStep}>Back: Deal Structure</Button>
                      
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button disabled={createDeal.isPending}>
                            {createDeal.isPending ? "Submitting..." : "Submit Deal for Approval"}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Confirm Deal Submission</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to submit this deal for approval? Once submitted, you can't edit the details until it's reviewed.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => form.handleSubmit(onSubmit)()}
                              disabled={createDeal.isPending}
                            >
                              {createDeal.isPending ? "Submitting..." : "Submit Deal"}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardContent>
              )}
              </form>
            </Form>
          </Card>
        </div>
      </div>
    </div>
  );
}