import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
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
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useLocation } from "wouter";
import { ApprovalAlert, ApprovalHelpText, StandardDealCriteriaHelp } from "@/components/ApprovalAlert";
import { getApproverDetails, ApprovalRule } from "@/lib/approval-matrix";
import { format } from "date-fns";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronUp } from "lucide-react";
import { IncentiveSelector } from "@/components/IncentiveSelector";
import { SelectedIncentive } from "@/lib/incentive-data";
import { calculateGrossMarginValue } from "@/lib/utils";

// Form schema for deal
const dealFormSchema = z.object({
  dealType: z.string().min(1, "Please select a deal type"),
  businessSummary: z.string().min(1, "Please enter a business summary"),
  salesChannel: z.string().min(1, "Please select a sales channel"),
  region: z.string().min(1, "Please select a region"),
  email: z.string().email("Please enter a valid email").optional(),
  advertiserName: z.string().optional(),
  agencyName: z.string().optional(),
  contractTerm: z.number().min(1, "Contract term is required"),
  dealStructure: z.enum(["flat_commit", "tiered"]),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  annualRevenue: z.number().min(1, "Annual revenue is required"),
  annualMargin: z.number().min(1, "Annual margin is required"),
  nonStandardTerms: z.boolean().default(false),
  nonStandardTermsDescription: z.string().optional(),
  tierCount: z.number().min(1).optional(),
  tierData: z.record(z.string(), z.any()).optional(),
  approvals: z.array(z.string()).optional(),
  comments: z.string().optional(),
  incentives: z.array(z.any()).optional()
});

export default function SubmitDeal() {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [formStep, setFormStep] = useState(0);
  const [dealStructure, setDealStructure] = useState<"tiered" | "flat_commit">("flat_commit");
  const [tierCount, setTierCount] = useState(3);
  const [hasNonStandardTerms, setHasNonStandardTerms] = useState(false);
  const [revenueTiers, setRevenueTiers] = useState<Array<{ tierNumber: number, annualRevenue: number, annualMargin: number }>>([]);
  const [advertisers, setAdvertisers] = useState<AdvertiserData[]>([]);
  const [agencies, setAgencies] = useState<AgencyData[]>([]);
  const [selectedIncentives, setSelectedIncentives] = useState<SelectedIncentive[]>([]);
  const [revenueExpanded, setRevenueExpanded] = useState(true);
  const [incentivesExpanded, setIncentivesExpanded] = useState(true);
  
  // Initialize the form
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
      contractTerm: 12,
      dealStructure: "flat_commit",
      annualRevenue: undefined,
      annualMargin: undefined,
      nonStandardTerms: false,
      nonStandardTermsDescription: "",
      tierCount: 3,
      tierData: {},
      approvals: [],
      comments: "",
      incentives: []
    },
  });
  
  const salesChannel = form.watch("salesChannel");
  
  // Get typed value from form
  function getTypedValue<T extends string>(
    field: T
  ): z.infer<typeof dealFormSchema>[keyof z.infer<typeof dealFormSchema>] {
    return form.getValues(field as any);
  }
  
  function watchTypedValue<T extends string>(
    field: T
  ): z.infer<typeof dealFormSchema>[keyof z.infer<typeof dealFormSchema>] {
    return form.watch(field as any);
  }
  
  const handleApprovalChange = (level: string, approvalInfo: ApprovalRule) => {
    console.log(`Approval level changed to: ${level}`, approvalInfo);
    // Update the form with the selected approval level
    const currentApprovals = form.getValues("approvals") || [];
    if (!currentApprovals.includes(level)) {
      form.setValue("approvals", [...currentApprovals, level]);
    }
  };
  
  // Define data types
  interface DealTierData {
    tierNumber: number;
    annualRevenue?: number;
    annualGrossMargin?: number;
    annualGrossMarginPercent?: number;
    incentivePercentage?: number;
    incentiveNotes?: string;
    incentiveType?: "rebate" | "discount" | "bonus" | "other";
    incentiveThreshold?: number; // Revenue threshold to achieve this incentive
    incentiveAmount?: number; // Monetary value of the incentive
  }
  
  interface AdvertiserData {
    id: number;
    name: string;
    region: string;
    // Historical fields - maintained in interface for API compatibility
    // but not used in the simplified UI implementation
    previousYearRevenue?: number;
    previousYearMargin?: number;
  }
  
  interface AgencyData {
    id: number;
    name: string;
    type: string;
    region: string;
    // Historical fields - maintained in interface for API compatibility
    // but not used in the simplified UI implementation
    previousYearRevenue?: number;
    previousYearMargin?: number;
  }
  
  // Create deal mutation
  const createDeal = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest('/api/deals', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      toast({
        title: "Deal Submitted",
        description: "Your deal has been submitted successfully and is pending approval.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/deals'] });
      navigate("/");
    },
    onError: (error) => {
      toast({
        title: "Submission Failed",
        description: `There was an error submitting your deal: ${error.message}`,
        variant: "destructive",
      });
    }
  });
  
  // Handle tier count changes
  useEffect(() => {
    if (dealStructure === "tiered") {
      const newTiers = [];
      for (let i = 1; i <= tierCount; i++) {
        const existingTier = revenueTiers.find(tier => tier.tierNumber === i);
        if (existingTier) {
          newTiers.push(existingTier);
        } else {
          newTiers.push({
            tierNumber: i,
            annualRevenue: 0,
            annualMargin: 0
          });
        }
      }
      setRevenueTiers(newTiers);
    }
  }, [tierCount, dealStructure]);
  
  // Load agencies and advertisers
  useEffect(() => {
    async function fetchData() {
      try {
        const [advertisersData, agenciesData] = await Promise.all([
          apiRequest('/api/advertisers'),
          apiRequest('/api/agencies')
        ]);
        
        if (advertisersData) setAdvertisers(advertisersData);
        if (agenciesData) setAgencies(agenciesData);
      } catch (error) {
        toast({
          title: "Error loading data",
          description: "Failed to load advertisers or agencies data.",
          variant: "destructive",
        });
      }
    }
    
    fetchData();
  }, [toast]);
  
  function validateAndGoToStep(targetStep: number): boolean {
    let isValid = true;
    
    // Define validation fields for each step
    const step0Fields = ["dealType", "businessSummary", "salesChannel", "region"];
    if (salesChannel === "client_direct") {
      step0Fields.push("advertiserName");
    } else if (salesChannel === "holding_company" || salesChannel === "independent_agency") {
      step0Fields.push("agencyName");
    }
    
    const step1Fields = ["dealStructure", "contractTerm", "annualRevenue", "annualMargin"];
    
    // Check validation based on target step
    if (targetStep >= 1 && formStep === 0) {
      // Validate step 0 fields
      form.trigger(step0Fields as any);
      
      // Check if any of the fields has errors
      for (const field of step0Fields) {
        if (form.formState.errors[field as keyof typeof form.formState.errors]) {
          isValid = false;
          break;
        }
      }
    } else if (targetStep >= 2 && formStep === 1) {
      // Validate step 1 fields
      form.trigger(step1Fields as any);
      
      // Check if any of the fields has errors
      for (const field of step1Fields) {
        if (form.formState.errors[field as keyof typeof form.formState.errors]) {
          isValid = false;
          break;
        }
      }
    }
    
    if (isValid) {
      setFormStep(targetStep);
      return true;
    } else {
      toast({
        title: "Validation Error",
        description: "Please fill out all required fields before proceeding.",
        variant: "destructive",
      });
      return false;
    }
  }
  
  function nextStep() {
    validateAndGoToStep(formStep + 1);
  }
  
  function prevStep() {
    setFormStep(Math.max(0, formStep - 1));
  }
  
  function onSubmit(data: z.infer<typeof dealFormSchema>) {
    // Process the form data
    const dealData = {
      ...data,
      incentives: selectedIncentives,
      startDate: data.startDate ? format(data.startDate, 'yyyy-MM-dd') : undefined,
      endDate: data.endDate ? format(data.endDate, 'yyyy-MM-dd') : undefined,
      tiers: revenueTiers,
    };
    
    createDeal.mutate(dealData);
  }
  
  return (
    <div className="container mx-auto">
      {/* About Deal Submission Section */}
      <div className="p-6">
        <div className="mb-8 bg-gradient-to-b from-purple-50 to-transparent rounded-lg p-8">
          <h3 className="text-xl font-bold text-slate-800 mb-3 bg-gradient-to-r from-indigo-700 to-purple-700 bg-clip-text text-transparent">About Deal Submission</h3>
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
      </div>
      
      {/* Submit Deal Form Section */}
      <div className="p-6">
        <div className="mb-8 bg-white rounded-lg shadow-md p-8">
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
                  onClick={() => formStep >= 1 ? setFormStep(1) : validateAndGoToStep(1)}
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
                  onClick={() => formStep >= 2 ? setFormStep(2) : validateAndGoToStep(2)}
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
                onClick={() => formStep >= 1 ? setFormStep(1) : validateAndGoToStep(1)} 
                className={cn(
                  "cursor-pointer hover:text-primary transition-colors", 
                  formStep === 1 ? "font-medium text-primary" : ""
                )}
              >
                Deal Structure & Pricing
              </div>
              <div 
                onClick={() => formStep >= 2 ? setFormStep(2) : validateAndGoToStep(2)}
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
                                  {agencies
                                    .filter(agency => 
                                      salesChannel === "holding_company" 
                                        ? agency.type === "holding_company" 
                                        : agency.type === "independent"
                                    )
                                    .map(agency => (
                                      <SelectItem key={agency.id} value={agency.name}>
                                        {agency.name}
                                      </SelectItem>
                                    ))
                                  }
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
                  </div>
                  
                  <div className="mt-8 flex justify-end">
                    <Button type="button" onClick={nextStep}>
                      Next: Deal Structure & Pricing
                    </Button>
                  </div>
                </CardContent>
              )}
              
              {/* Step 2: Deal Structure & Pricing */}
              {formStep === 1 && (
                <CardContent className="p-6">
                  <div className="mb-6">
                    <h2 className="text-lg font-medium text-slate-900">Deal Structure & Pricing</h2>
                    <p className="mt-1 text-sm text-slate-500">Define the structure and financial terms for this deal</p>
                  </div>
                  
                  <div className="space-y-6">
                    {/* Simplified approval alert based on basic deal parameters */}
                    {(watchTypedValue("annualRevenue") !== undefined && watchTypedValue("contractTerm") !== undefined) && (
                      <ApprovalAlert 
                        totalValue={Number(watchTypedValue("annualRevenue")) || 0}
                        contractTerm={Number(watchTypedValue("contractTerm")) || 12}
                        hasNonStandardTerms={hasNonStandardTerms}
                        dealType={String(watchTypedValue("dealType")) || "grow"}
                        salesChannel={String(watchTypedValue("salesChannel")) || "independent_agency"}
                        onChange={handleApprovalChange}
                      />
                    )}
                    
                    {/* Standard Deal Criteria Help Info moved to Review & Submit tab */}
                    
                    {/* Deal Structure & Pricing Card */}
                    <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm mb-8">
                      <h3 className="text-lg font-semibold text-slate-900 mb-4 pb-2 border-b border-slate-100 bg-gradient-to-r from-purple-700 to-indigo-500 bg-clip-text text-transparent">Deal Structure & Pricing</h3>
                      
                      {/* 2-column layout for structure selection and dates */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                        <FormField
                          control={form.control}
                          name="dealStructure"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Deal Structure <span className="text-red-500">*</span></FormLabel>
                              <Select 
                                onValueChange={(value) => {
                                  field.onChange(value);
                                  setDealStructure(value as "tiered" | "flat_commit");
                                }}
                                defaultValue={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger className="bg-slate-50">
                                    <SelectValue placeholder="Select deal structure" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="flat_commit">Flat Commit</SelectItem>
                                  <SelectItem value="tiered">Tiered Revenue</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormDescription>
                                The revenue structure for this deal
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        {/* Contract Term Field */}
                        <FormField
                          control={form.control}
                          name="contractTerm"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Contract Term (Months) <span className="text-red-500">*</span></FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  min="1"
                                  max="60"
                                  className="bg-slate-50"
                                  {...field}
                                  onChange={(e) => {
                                    const value = parseInt(e.target.value);
                                    field.onChange(isNaN(value) ? 12 : value);
                                  }}
                                />
                              </FormControl>
                              <FormDescription>
                                Length of the contract in months
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      {/* Collapsible Revenue Structure Section - Default for all deal structures */}
                      <div className="bg-slate-50 p-6 rounded-lg border border-slate-200 mb-6">
                        {/* Header with toggle */}
                        <Collapsible
                          open={revenueExpanded}
                          onOpenChange={setRevenueExpanded}
                          className="w-full"
                        >
                          <div className="flex items-center justify-between">
                            <h4 className="text-lg font-medium text-slate-900">Revenue Structure</h4>
                            <CollapsibleTrigger asChild>
                              <Button variant="ghost" size="sm">
                                {revenueExpanded ? (
                                  <ChevronUp className="h-4 w-4" />
                                ) : (
                                  <ChevronDown className="h-4 w-4" />
                                )}
                              </Button>
                            </CollapsibleTrigger>
                          </div>
                          
                          <CollapsibleContent className="mt-4">
                            {dealStructure === "flat_commit" ? (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Annual Revenue Field */}
                                <FormField
                                  control={form.control}
                                  name="annualRevenue"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Annual Revenue ($) <span className="text-red-500">*</span></FormLabel>
                                      <FormControl>
                                        <Input
                                          type="number"
                                          min="0"
                                          className="bg-white"
                                          {...field}
                                          onChange={(e) => {
                                            const value = parseFloat(e.target.value);
                                            field.onChange(isNaN(value) ? 0 : value);
                                          }}
                                        />
                                      </FormControl>
                                      <FormDescription>
                                        Total annual revenue for this deal
                                      </FormDescription>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                
                                {/* Annual Margin Field */}
                                <FormField
                                  control={form.control}
                                  name="annualMargin"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Annual Gross Margin (%) <span className="text-red-500">*</span></FormLabel>
                                      <FormControl>
                                        <Input
                                          type="number"
                                          min="0"
                                          max="100"
                                          className="bg-white"
                                          {...field}
                                          onChange={(e) => {
                                            const value = parseFloat(e.target.value);
                                            field.onChange(isNaN(value) ? 0 : value);
                                          }}
                                        />
                                      </FormControl>
                                      <FormDescription>
                                        Expected gross margin percentage
                                      </FormDescription>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              </div>
                            ) : (
                              <div>
                                {/* Tiered Structure Fields */}
                                <div className="mb-4">
                                  <FormLabel>Number of Tiers</FormLabel>
                                  <Select
                                    value={String(tierCount)}
                                    onValueChange={(value) => setTierCount(parseInt(value))}
                                  >
                                    <SelectTrigger className="w-32 bg-white">
                                      <SelectValue placeholder="Select tier count" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {[1, 2, 3, 4, 5, 6].map(num => (
                                        <SelectItem key={num} value={String(num)}>
                                          {num} {num === 1 ? 'tier' : 'tiers'}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                                
                                {/* Tier Table */}
                                <div className="overflow-x-auto mt-4">
                                  <table className="w-full border-collapse">
                                    <thead>
                                      <tr className="bg-slate-100">
                                        <th className="p-3 border text-left font-medium text-slate-700 w-1/3">Tier</th>
                                        <th className="p-3 border text-right font-medium text-slate-700">Last Year</th>
                                        {revenueTiers.map(tier => (
                                          <th key={tier.tierNumber} className="p-3 border text-right font-medium text-slate-700 w-1/5">
                                            Tier {tier.tierNumber}
                                          </th>
                                        ))}
                                      </tr>
                                    </thead>
                                    <tbody>
                                      <tr>
                                        <td className="p-3 border font-medium text-slate-700">
                                          Annual Revenue ($)
                                        </td>
                                        <td className="p-3 border text-right text-slate-700">
                                          $850,000
                                        </td>
                                        {revenueTiers.map(tier => (
                                          <td key={`revenue-${tier.tierNumber}`} className="p-3 border">
                                            <Input
                                              type="number"
                                              min="0"
                                              className="text-right"
                                              value={tier.annualRevenue || ""}
                                              onChange={(e) => {
                                                const value = parseFloat(e.target.value);
                                                const newTiers = [...revenueTiers];
                                                const tierIndex = newTiers.findIndex(t => t.tierNumber === tier.tierNumber);
                                                if (tierIndex !== -1) {
                                                  newTiers[tierIndex] = {
                                                    ...newTiers[tierIndex],
                                                    annualRevenue: isNaN(value) ? 0 : value
                                                  };
                                                  setRevenueTiers(newTiers);
                                                }
                                              }}
                                            />
                                          </td>
                                        ))}
                                      </tr>
                                      <tr>
                                        <td className="p-3 border font-medium text-slate-700">
                                          Gross Margin (%)
                                        </td>
                                        <td className="p-3 border text-right text-slate-700">
                                          35%
                                        </td>
                                        {revenueTiers.map(tier => (
                                          <td key={`margin-${tier.tierNumber}`} className="p-3 border">
                                            <Input
                                              type="number"
                                              min="0"
                                              max="100"
                                              className="text-right"
                                              value={tier.annualMargin || ""}
                                              onChange={(e) => {
                                                const value = parseFloat(e.target.value);
                                                const newTiers = [...revenueTiers];
                                                const tierIndex = newTiers.findIndex(t => t.tierNumber === tier.tierNumber);
                                                if (tierIndex !== -1) {
                                                  newTiers[tierIndex] = {
                                                    ...newTiers[tierIndex],
                                                    annualMargin: isNaN(value) ? 0 : value
                                                  };
                                                  setRevenueTiers(newTiers);
                                                }
                                              }}
                                            />
                                          </td>
                                        ))}
                                      </tr>
                                      <tr>
                                        <td className="p-3 border font-medium text-slate-700">
                                          Gross Margin Value ($)
                                        </td>
                                        <td className="p-3 border text-right text-slate-700">
                                          $297,500
                                        </td>
                                        {revenueTiers.map(tier => (
                                          <td key={`margin-value-${tier.tierNumber}`} className="p-3 border text-right text-slate-700">
                                            {tier.annualRevenue && tier.annualMargin
                                              ? `$${calculateGrossMarginValue(tier.annualRevenue, tier.annualMargin).toLocaleString()}`
                                              : "-"}
                                          </td>
                                        ))}
                                      </tr>
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            )}
                          </CollapsibleContent>
                        </Collapsible>
                      </div>
                      
                      {/* Incentives Section */}
                      <div className="bg-slate-50 p-6 rounded-lg border border-slate-200 mb-6">
                        <Collapsible
                          open={incentivesExpanded}
                          onOpenChange={setIncentivesExpanded}
                          className="w-full"
                        >
                          <div className="flex items-center justify-between">
                            <h4 className="text-lg font-medium text-slate-900">Incentive Structure</h4>
                            <CollapsibleTrigger asChild>
                              <Button variant="ghost" size="sm">
                                {incentivesExpanded ? (
                                  <ChevronUp className="h-4 w-4" />
                                ) : (
                                  <ChevronDown className="h-4 w-4" />
                                )}
                              </Button>
                            </CollapsibleTrigger>
                          </div>
                          
                          <CollapsibleContent className="mt-4">
                            {/* Incentive Selector Component */}
                            <IncentiveSelector 
                              dealTiers={dealStructure === "tiered" ? revenueTiers : [{ tierNumber: 1, annualRevenue: form.getValues("annualRevenue") || 0 }]}
                              onIncentiveAdded={(incentive) => {
                                setSelectedIncentives([...selectedIncentives, incentive]);
                              }}
                              selectedIncentives={selectedIncentives}
                              onIncentiveRemoved={(index) => {
                                const newIncentives = [...selectedIncentives];
                                newIncentives.splice(index, 1);
                                setSelectedIncentives(newIncentives);
                              }}
                            />
                          </CollapsibleContent>
                        </Collapsible>
                      </div>
                      
                      {/* Non-Standard Terms Checkbox */}
                      <div className="py-4">
                        <FormField
                          control={form.control}
                          name="nonStandardTerms"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={(checked) => {
                                    field.onChange(checked);
                                    setHasNonStandardTerms(!!checked);
                                  }}
                                />
                              </FormControl>
                              <div className="space-y-1 leading-none">
                                <FormLabel>This deal includes non-standard terms</FormLabel>
                                <FormDescription>
                                  Check this if your deal requires special terms, payment schedules, or other exceptions
                                </FormDescription>
                              </div>
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      {/* Conditional Non-Standard Terms Description Field */}
                      {hasNonStandardTerms && (
                        <FormField
                          control={form.control}
                          name="nonStandardTermsDescription"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Describe Non-Standard Terms <span className="text-red-500">*</span></FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder="Please describe the non-standard terms in detail..."
                                  className="resize-none"
                                  rows={4}
                                  {...field}
                                />
                              </FormControl>
                              <FormDescription>
                                Provide details on any special terms, approval requirements, or other exceptions
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}
                    </div>
                  </div>
                  
                  {/* Navigation Buttons */}
                  <div className="mt-8 flex justify-between">
                    <Button type="button" variant="outline" onClick={prevStep}>
                      Back: Deal Details
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
                    <h2 className="text-lg font-medium text-slate-900">Review & Submit</h2>
                    <p className="mt-1 text-sm text-slate-500">Please review all deal information before submitting</p>
                  </div>
                  
                  <div className="space-y-6">
                    {/* Basic Information Summary */}
                    <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
                      <h3 className="text-base font-semibold text-slate-900 mb-4 pb-2 border-b border-slate-200">Basic Deal Information</h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <span className="text-sm font-medium text-slate-700 block">Deal Type:</span>
                          <span className="text-sm text-slate-600">
                            {form.getValues("dealType") === "grow"
                              ? "Grow (>20% YOY Growth)"
                              : form.getValues("dealType") === "protect"
                              ? "Protect (Large Account Retention)"
                              : "Custom (Special Builds/Requirements)"}
                          </span>
                        </div>
                        
                        <div>
                          <span className="text-sm font-medium text-slate-700 block">Sales Channel:</span>
                          <span className="text-sm text-slate-600">
                            {form.getValues("salesChannel") === "client_direct"
                              ? "Client Direct"
                              : form.getValues("salesChannel") === "holding_company"
                              ? "Holding Company"
                              : "Independent Agency"}
                          </span>
                        </div>
                        
                        <div>
                          <span className="text-sm font-medium text-slate-700 block">Region:</span>
                          <span className="text-sm text-slate-600 capitalize">
                            {form.getValues("region")}
                          </span>
                        </div>
                        
                        <div>
                          <span className="text-sm font-medium text-slate-700 block">
                            {form.getValues("salesChannel") === "client_direct" ? "Advertiser:" : "Agency:"}
                          </span>
                          <span className="text-sm text-slate-600">
                            {form.getValues("salesChannel") === "client_direct"
                              ? form.getValues("advertiserName")
                              : form.getValues("agencyName")}
                          </span>
                        </div>
                      </div>
                      
                      <div className="mb-4">
                        <span className="text-sm font-medium text-slate-700 block">Business Summary:</span>
                        <p className="text-sm text-slate-600 mt-1">
                          {form.getValues("businessSummary")}
                        </p>
                      </div>
                      
                      {form.getValues("email") && (
                        <div>
                          <span className="text-sm font-medium text-slate-700 block">Contact Email:</span>
                          <span className="text-sm text-slate-600">{form.getValues("email")}</span>
                        </div>
                      )}
                    </div>
                    
                    {/* Deal Structure & Financial Information */}
                    <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
                      <h3 className="text-base font-semibold text-slate-900 mb-4 pb-2 border-b border-slate-200">Deal Structure & Financial Information</h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <span className="text-sm font-medium text-slate-700 block">Deal Structure:</span>
                          <span className="text-sm text-slate-600 capitalize">
                            {form.getValues("dealStructure").replace('_', ' ')}
                          </span>
                        </div>
                        
                        <div>
                          <span className="text-sm font-medium text-slate-700 block">Contract Term:</span>
                          <span className="text-sm text-slate-600">
                            {form.getValues("contractTerm")} months
                          </span>
                        </div>
                      </div>
                      
                      {form.getValues("dealStructure") === "flat_commit" ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div>
                            <span className="text-sm font-medium text-slate-700 block">Annual Revenue:</span>
                            <span className="text-sm text-slate-600">
                              ${form.getValues("annualRevenue")?.toLocaleString()}
                            </span>
                          </div>
                          
                          <div>
                            <span className="text-sm font-medium text-slate-700 block">Annual Gross Margin:</span>
                            <span className="text-sm text-slate-600">
                              {form.getValues("annualMargin")}%
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="mb-4">
                          <span className="text-sm font-medium text-slate-700 block mb-2">Tiered Revenue Structure:</span>
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm border-collapse">
                              <thead>
                                <tr className="bg-slate-100">
                                  <th className="p-2 border text-left font-medium text-slate-700">Tier</th>
                                  <th className="p-2 border text-right font-medium text-slate-700">Annual Revenue</th>
                                  <th className="p-2 border text-right font-medium text-slate-700">Gross Margin %</th>
                                  <th className="p-2 border text-right font-medium text-slate-700">Gross Margin Value</th>
                                </tr>
                              </thead>
                              <tbody>
                                {revenueTiers.map(tier => (
                                  <tr key={tier.tierNumber}>
                                    <td className="p-2 border text-slate-600">Tier {tier.tierNumber}</td>
                                    <td className="p-2 border text-right text-slate-600">
                                      ${tier.annualRevenue?.toLocaleString() || 0}
                                    </td>
                                    <td className="p-2 border text-right text-slate-600">
                                      {tier.annualMargin}%
                                    </td>
                                    <td className="p-2 border text-right text-slate-600">
                                      ${calculateGrossMarginValue(tier.annualRevenue || 0, tier.annualMargin || 0).toLocaleString()}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                      
                      {/* Selected Incentives Display */}
                      {selectedIncentives.length > 0 && (
                        <div className="mb-4">
                          <span className="text-sm font-medium text-slate-700 block mb-2">Selected Incentives:</span>
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm border-collapse">
                              <thead>
                                <tr className="bg-slate-100">
                                  <th className="p-2 border text-left font-medium text-slate-700">Category</th>
                                  <th className="p-2 border text-left font-medium text-slate-700">Subcategory</th>
                                  <th className="p-2 border text-left font-medium text-slate-700">Option</th>
                                  <th className="p-2 border text-left font-medium text-slate-700">Tiers</th>
                                  <th className="p-2 border text-left font-medium text-slate-700">Notes</th>
                                </tr>
                              </thead>
                              <tbody>
                                {selectedIncentives.map((incentive, index) => (
                                  <tr key={index}>
                                    <td className="p-2 border text-slate-600">{incentive.categoryId}</td>
                                    <td className="p-2 border text-slate-600">{incentive.subCategoryId}</td>
                                    <td className="p-2 border text-slate-600">{incentive.option}</td>
                                    <td className="p-2 border text-slate-600">
                                      {incentive.tierIds.map(id => `Tier ${id}`).join(", ")}
                                    </td>
                                    <td className="p-2 border text-slate-600">{incentive.notes || "-"}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                      
                      {/* Non-Standard Terms */}
                      {hasNonStandardTerms && (
                        <div>
                          <span className="text-sm font-medium text-slate-700 block">Non-Standard Terms:</span>
                          <p className="text-sm text-slate-600 mt-1 mb-4">
                            {form.getValues("nonStandardTermsDescription")}
                          </p>
                        </div>
                      )}
                    </div>
                    
                    {/* Approval Requirements */}
                    <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
                      <h3 className="text-base font-semibold text-slate-900 mb-4 pb-2 border-b border-slate-200">Approval Requirements</h3>
                      
                      <div className="mb-4">
                        <span className="text-sm font-medium text-slate-700 block mb-2">Required Approvers:</span>
                        <div className="space-y-2">
                          {(form.getValues("approvals") || []).map((level: string) => {
                            const approver = getApproverDetails(level as any);
                            return (
                              <div key={level} className="bg-slate-50 rounded p-3 border border-slate-200">
                                <span className="font-medium text-slate-800">{approver.title}</span>
                                <p className="text-xs text-slate-600 mt-1">{approver.description}</p>
                                <div className="flex items-center mt-2">
                                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                                    Est. Time: {approver.estimatedTime}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                          
                          {!(form.getValues("approvals") || []).length && (
                            <div className="bg-yellow-50 rounded p-3 border border-yellow-200">
                              <span className="text-sm text-yellow-800">
                                Warning: No required approvers have been identified. This could be due to:
                              </span>
                              <ul className="text-sm text-yellow-700 mt-2 list-disc list-inside">
                                <li>Missing financial information</li>
                                <li>Incomplete deal structure details</li>
                              </ul>
                              <p className="text-sm text-yellow-800 mt-2">
                                Please go back and complete all required fields.
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <StandardDealCriteriaHelp />
                    </div>
                    
                    {/* Additional Comments */}
                    <FormField
                      control={form.control}
                      name="comments"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Additional Comments</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Add any additional comments or context for reviewers..."
                              className="resize-none"
                              rows={3}
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Optional comments for the deal review team
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  {/* Navigation Buttons */}
                  <div className="mt-8 flex justify-between">
                    <Button type="button" variant="outline" onClick={prevStep}>
                      Back: Deal Structure & Pricing
                    </Button>
                    <Button 
                      type="submit"
                      disabled={createDeal.isPending}
                      className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white"
                    >
                      {createDeal.isPending ? "Submitting..." : "Submit Deal for Approval"}
                    </Button>
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