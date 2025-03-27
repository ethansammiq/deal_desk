import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
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
  CardDescription,
  CardHeader,
  CardTitle,
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
  
  async function validateAndGoToStep(targetStep: number): Promise<boolean> {
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
      if (!!hasNonStandardTerms) {
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
  
  // Direct sibling sections with no wrapper
  return (
    <div className="deal-submission-page">
      {/* About Deal Submission Section */}
      <section className="bg-gradient-to-b from-purple-50 to-transparent">
        <div className="container mx-auto p-6">
          <h3 className="text-xl font-bold text-slate-800 mb-5 bg-gradient-to-r from-indigo-700 to-purple-700 bg-clip-text text-transparent">About Deal Submission</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
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
      </section>
      
      {/* Submit Deal Form Section */}
      <section className="container mx-auto p-6 bg-white mb-8 rounded-lg shadow-md">
            <div className="flex items-center mb-2">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Submit New Deal</h1>
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
                  onClick={() => formStep >= 1 ? setFormStep(1) : validateAndGoToStep(1).then()}
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
                  onClick={() => formStep >= 2 ? setFormStep(2) : validateAndGoToStep(2).then()}
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
                onClick={() => formStep >= 1 ? setFormStep(1) : validateAndGoToStep(1).then()} 
                className={cn(
                  "cursor-pointer hover:text-primary transition-colors", 
                  formStep === 1 ? "font-medium text-primary" : ""
                )}
              >
                Deal Structure & Pricing
              </div>
              <div 
                onClick={() => formStep >= 2 ? setFormStep(2) : validateAndGoToStep(2).then()}
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
                      <Button type="button" onClick={nextStep}>Next: Deal Structure & Pricing</Button>
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
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div 
                                className={cn(
                                  "flex items-center space-x-3 border rounded-lg p-4 cursor-pointer transition-all hover:border-primary",
                                  field.value === "tiered" ? "border-primary bg-primary/5" : "border-slate-200"
                                )}
                                onClick={() => field.onChange("tiered")}
                              >
                                <div className={cn(
                                  "w-4 h-4 rounded-full border-2 flex items-center justify-center",
                                  field.value === "tiered" ? "border-primary" : "border-slate-300"
                                )}>
                                  {field.value === "tiered" && (
                                    <div className="w-2 h-2 rounded-full bg-primary"></div>
                                  )}
                                </div>
                                <div>
                                  <h4 className="font-medium text-slate-900">Tiered Structure</h4>
                                  <p className="text-sm text-slate-500">Increasing incentives at different revenue tiers</p>
                                </div>
                              </div>
                              
                              <div 
                                className={cn(
                                  "flex items-center space-x-3 border rounded-lg p-4 cursor-pointer transition-all hover:border-primary",
                                  field.value === "flat_commit" ? "border-primary bg-primary/5" : "border-slate-200"
                                )}
                                onClick={() => field.onChange("flat_commit")}
                              >
                                <div className={cn(
                                  "w-4 h-4 rounded-full border-2 flex items-center justify-center",
                                  field.value === "flat_commit" ? "border-primary" : "border-slate-300"
                                )}>
                                  {field.value === "flat_commit" && (
                                    <div className="w-2 h-2 rounded-full bg-primary"></div>
                                  )}
                                </div>
                                <div>
                                  <h4 className="font-medium text-slate-900">Flat Commitment</h4>
                                  <p className="text-sm text-slate-500">Single revenue target with fixed incentives</p>
                                </div>
                              </div>
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    {/* Contract Period */}
                    <div className="space-y-4">
                      <h3 className="text-md font-medium text-slate-900">Contract Period</h3>
                      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                        <FormField
                          control={form.control}
                          name="contractStartDate"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Start Date <span className="text-red-500">*</span></FormLabel>
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
                              <FormLabel>End Date <span className="text-red-500">*</span></FormLabel>
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
                              <FormLabel>Term (Months) <span className="text-red-500">*</span></FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  min="1"
                                  placeholder="Enter contract length in months" 
                                  {...field}
                                  onChange={e => field.onChange(parseInt(e.target.value))}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                    
                    {/* Revenue Structure - Improved with table layout and tier management */}
                    <Accordion type="single" collapsible defaultValue="revenue-structure" className="w-full">
                      <AccordionItem value="revenue-structure" className="border rounded-lg">
                        <AccordionTrigger className="px-6 hover:no-underline font-medium">
                          Revenue Structure
                        </AccordionTrigger>
                        <AccordionContent className="px-6 pb-6">
                          <div className="mb-2">
                            <p className="text-sm text-slate-500 mb-2">Define annual revenue targets for each tier{dealStructureType === "flat_commit" ? "" : "s"}</p>
                            
                            <div className="flex justify-between mb-4">
                              <div className="flex space-x-2">
                                {dealStructureType === "tiered" && (
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      if (dealTiers.length < 6) {
                                        setDealTiers([
                                          ...dealTiers,
                                          {
                                            tierNumber: dealTiers.length + 1,
                                            annualRevenue: 0,
                                            annualMargin: 0
                                          }
                                        ]);
                                      } else {
                                        toast({
                                          title: "Maximum tiers reached",
                                          description: "You can add a maximum of 6 tiers.",
                                          variant: "destructive",
                                        });
                                      }
                                    }}
                                    disabled={dealTiers.length >= 6}
                                  >
                                    Add Tier
                                  </Button>
                                )}
                              </div>
                            </div>
                            
                            <div className="overflow-x-auto">
                              <Table className="border border-slate-200">
                                <TableHeader>
                                  <TableRow className="bg-slate-50">
                                    <TableHead className="w-1/3 font-medium text-slate-800">Tier</TableHead>
                                    <TableHead className="font-medium text-slate-800">Last Year</TableHead>
                                    <TableHead className="font-medium text-slate-800">{new Date().getFullYear()} Target</TableHead>
                                    <TableHead className="font-medium text-slate-800">Margin %</TableHead>
                                    <TableHead className="font-medium text-slate-800">Margin Value</TableHead>
                                    {dealStructureType === "tiered" && (
                                      <TableHead className="w-10 font-medium text-slate-800">Actions</TableHead>
                                    )}
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {dealTiers.map((tier, index) => (
                                    <TableRow key={index} className="hover:bg-slate-50">
                                      <TableCell className="font-medium text-slate-900">
                                        {dealStructureType === "tiered" 
                                          ? `Tier ${tier.tierNumber}` 
                                          : "Annual Commitment"}
                                      </TableCell>
                                      <TableCell className="text-slate-800">
                                        {formatCurrency(850000)} <br />
                                        <span className="text-xs text-slate-500">35% margin</span>
                                      </TableCell>
                                      <TableCell>
                                        <Input
                                          type="number"
                                          placeholder="Enter annual revenue"
                                          value={tier.annualRevenue || ""}
                                          onChange={(e) => {
                                            const newTiers = [...dealTiers];
                                            newTiers[index].annualRevenue = parseFloat(e.target.value) || 0;
                                            setDealTiers(newTiers);
                                          }}
                                          className="max-w-[150px]"
                                        />
                                      </TableCell>
                                      <TableCell>
                                        <Input
                                          type="number"
                                          placeholder="%"
                                          value={tier.annualMargin ? (tier.annualMargin / tier.annualRevenue * 100).toFixed(1) : ""}
                                          onChange={(e) => {
                                            const newTiers = [...dealTiers];
                                            const marginPercent = parseFloat(e.target.value) || 0;
                                            newTiers[index].annualMargin = (marginPercent / 100) * tier.annualRevenue;
                                            setDealTiers(newTiers);
                                          }}
                                          className="max-w-[80px]"
                                        />
                                      </TableCell>
                                      <TableCell>
                                        {tier.annualMargin ? formatCurrency(tier.annualMargin) : "-"}
                                      </TableCell>
                                      {dealStructureType === "tiered" && (
                                        <TableCell>
                                          <Button
                                            type="button"
                                            size="icon"
                                            variant="ghost"
                                            className="h-8 w-8"
                                            onClick={() => {
                                              if (dealTiers.length > 1) {
                                                const newTiers = dealTiers.filter((_, i) => i !== index);
                                                // Renumber tiers
                                                const renumberedTiers = newTiers.map((t, i) => ({
                                                  ...t,
                                                  tierNumber: i + 1
                                                }));
                                                setDealTiers(renumberedTiers);
                                              } else {
                                                toast({
                                                  title: "Cannot remove",
                                                  description: "You must have at least one tier.",
                                                  variant: "destructive",
                                                });
                                              }
                                            }}
                                            disabled={dealTiers.length <= 1}
                                          >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-500">
                                              <path d="M3 6h18"></path>
                                              <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                                              <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                                            </svg>
                                          </Button>
                                        </TableCell>
                                      )}
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </div>
                            
                            {dealStructureType === "tiered" && (
                              <div className="mt-2 text-sm text-slate-500">
                                <p>Tiers represent increasing revenue targets with corresponding incentive levels.</p>
                              </div>
                            )}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                    
                    {/* Incentive Structure - Using dedicated component */}
                    <Accordion type="single" collapsible defaultValue="incentive-structure" className="w-full">
                      <AccordionItem value="incentive-structure" className="border rounded-lg">
                        <AccordionTrigger className="px-6 hover:no-underline font-medium">
                          Incentive Structure
                        </AccordionTrigger>
                        <AccordionContent className="px-6 pb-6">
                          <div className="space-y-4">
                            <p className="text-sm text-slate-500">Configure incentives for this deal</p>
                            
                            {/* Incentive Selector Component */}
                            <div className="pt-2">
                              <IncentiveSelector 
                                dealTiers={dealTiers.map(tier => ({ 
                                  tierNumber: tier.tierNumber, 
                                  annualRevenue: tier.annualRevenue 
                                }))}
                                onChange={(incentives) => setSelectedIncentives(incentives)}
                                selectedIncentives={selectedIncentives}
                              />
                            </div>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                    
                    {/* Additional Terms */}
                    <div className="space-y-4">
                      <FormField
                        control={form.control}
                        name="notes"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Additional Notes</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Add any additional information about this deal"
                                className="resize-none"
                                rows={4}
                                {...field} 
                              />
                            </FormControl>
                            <FormDescription>
                              Include any other relevant information that would help with deal approval.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="hasNonStandardTerms"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel>This deal has non-standard terms</FormLabel>
                              <FormDescription>
                                Check this box if this deal includes terms that deviate from standard agreements
                              </FormDescription>
                            </div>
                          </FormItem>
                        )}
                      />
                      
                      {!!hasNonStandardTerms && (
                        <FormField
                          control={form.control}
                          name="nonStandardTermsDetails"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Non-Standard Terms Details <span className="text-red-500">*</span></FormLabel>
                              <FormControl>
                                <Textarea 
                                  placeholder="Describe the non-standard terms in detail"
                                  className="resize-none"
                                  rows={4}
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}

                      <div className="flex justify-between mt-6">
                        <Button type="button" variant="outline" onClick={prevStep}>
                          Back: Deal Details
                        </Button>
                        <Button type="button" onClick={nextStep}>
                          Next: Review & Submit
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              )}
              
              {/* Step 3: Review & Submit */}
              {formStep === 2 && (
                <CardContent className="p-6">
                  <div className="mb-6">
                    <h2 className="text-lg font-medium text-slate-900">Review & Submit</h2>
                    <p className="mt-1 text-sm text-slate-500">Please review all information before submitting your deal</p>
                  </div>
                  
                  <div className="space-y-8">
                    {/* Deal Summary */}
                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-6">
                      <h3 className="text-md font-medium text-slate-900 mb-4">Deal Summary</h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <h4 className="text-sm font-medium text-slate-800 mb-2">Basic Information</h4>
                          <dl className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <dt className="text-slate-500">Deal Type:</dt>
                              <dd className="text-slate-900 font-medium capitalize">{dealType || "-"}</dd>
                            </div>
                            <div className="flex justify-between text-sm">
                              <dt className="text-slate-500">Sales Channel:</dt>
                              <dd className="text-slate-900 font-medium capitalize">
                                {typeof salesChannel === 'string' ? salesChannel.replace(/_/g, " ") : "-"}
                              </dd>
                            </div>
                            <div className="flex justify-between text-sm">
                              <dt className="text-slate-500">Region:</dt>
                              <dd className="text-slate-900 font-medium capitalize">{form.getValues("region") || "-"}</dd>
                            </div>
                            <div className="flex justify-between text-sm">
                              <dt className="text-slate-500">Company:</dt>
                              <dd className="text-slate-900 font-medium">
                                {form.getValues("advertiserName") || form.getValues("agencyName") || "-"}
                              </dd>
                            </div>
                          </dl>
                        </div>
                        
                        <div>
                          <h4 className="text-sm font-medium text-slate-800 mb-2">Deal Structure</h4>
                          <dl className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <dt className="text-slate-500">Structure Type:</dt>
                              <dd className="text-slate-900 font-medium capitalize">
                                {typeof dealStructureType === 'string' ? dealStructureType.replace(/_/g, " ") : "-"}
                              </dd>
                            </div>
                            <div className="flex justify-between text-sm">
                              <dt className="text-slate-500">Contract Term:</dt>
                              <dd className="text-slate-900 font-medium">{contractTerm || 0} months</dd>
                            </div>
                            <div className="flex justify-between text-sm">
                              <dt className="text-slate-500">Total Annual Revenue:</dt>
                              <dd className="text-slate-900 font-medium">
                                {formatCurrency(dealTiers.reduce((sum, tier) => sum + tier.annualRevenue, 0))}
                              </dd>
                            </div>
                            <div className="flex justify-between text-sm">
                              <dt className="text-slate-500">Number of Tiers:</dt>
                              <dd className="text-slate-900 font-medium">{dealTiers.length}</dd>
                            </div>
                          </dl>
                        </div>
                      </div>
                      
                      {/* Business Summary */}
                      <div className="mt-6">
                        <h4 className="text-sm font-medium text-slate-800 mb-2">Business Summary</h4>
                        <div className="bg-white border border-slate-200 rounded-md p-3 text-sm text-slate-700">
                          {form.getValues("businessSummary") || "No business summary provided."}
                        </div>
                      </div>
                      
                      {/* Selected Incentives */}
                      {selectedIncentives.length > 0 && (
                        <div className="mt-6">
                          <h4 className="text-sm font-medium text-slate-800 mb-2">Selected Incentives</h4>
                          <div className="overflow-x-auto">
                            <Table className="w-full border border-slate-200">
                              <TableHeader>
                                <TableRow className="bg-slate-50">
                                  <TableHead className="font-medium text-slate-800">Type</TableHead>
                                  <TableHead className="font-medium text-slate-800">Tiers</TableHead>
                                  <TableHead className="font-medium text-slate-800">Value</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {selectedIncentives.map((incentive, index) => (
                                  <TableRow key={index} className="hover:bg-slate-50">
                                    <TableCell className="font-medium">
                                      <div className="space-y-1">
                                        <div className="text-slate-900">{incentive.option}</div>
                                        <div className="text-xs text-slate-500">{incentive.categoryId}/{incentive.subCategoryId}</div>
                                      </div>
                                    </TableCell>
                                    <TableCell>
                                      <div className="flex gap-1 flex-wrap">
                                        {incentive.tierIds.map(tierId => (
                                          <Badge key={tierId} variant="outline">
                                            Tier {tierId}
                                          </Badge>
                                        ))}
                                      </div>
                                    </TableCell>
                                    <TableCell>
                                      <div className="space-y-1">
                                        {Object.entries(incentive.tierValues).map(([tierId, value]) => (
                                          <div key={tierId} className="text-slate-900">
                                            T{tierId}: {formatCurrency(value)}
                                          </div>
                                        ))}
                                        {incentive.notes && (
                                          <div className="text-xs text-slate-500 mt-1 italic">
                                            {incentive.notes}
                                          </div>
                                        )}
                                      </div>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Approval Requirements */}
                    <div>
                      <h3 className="text-md font-medium text-slate-900 mb-2">Approval Requirements</h3>
                      
                      <ApprovalAlert
                        totalValue={dealTiers.reduce((sum, tier) => sum + tier.annualRevenue, 0)}
                        hasNonStandardTerms={!!hasNonStandardTerms}
                        contractTerm={Number(contractTerm) || 12}
                        dealType={typeof dealType === 'string' ? dealType : undefined}
                        salesChannel={typeof salesChannel === 'string' ? salesChannel : undefined}
                        onChange={handleApprovalChange}
                      />
                      
                      {!!hasNonStandardTerms && (
                        <Alert className="mt-4 bg-amber-50 border-amber-200 text-amber-800">
                          <AlertTriangle className="h-4 w-4" />
                          <AlertTitle>Non-Standard Terms</AlertTitle>
                          <AlertDescription>
                            This deal includes non-standard terms which may require additional approval steps.
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                    
                    <div className="flex justify-between mt-6">
                      <Button type="button" variant="outline" onClick={prevStep}>
                        Back: Deal Structure & Pricing
                      </Button>
                      
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button type="button">Submit Deal for Approval</Button>
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
        </section>
    </div>
  );
}