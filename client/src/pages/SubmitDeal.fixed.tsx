import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { format } from "date-fns";
import { Info, HelpCircle } from "lucide-react";

// UI Components
import { 
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
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
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "@/components/ui/tooltip";
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from "@/components/ui/popover";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { CalendarIcon } from "@radix-ui/react-icons";
import { Calendar } from "@/components/ui/calendar";
import { 
  Popover as DatePopover,
  PopoverContent as DatePopoverContent,
  PopoverTrigger as DatePopoverTrigger,
} from "@/components/ui/popover";

// Custom Components
import IncentiveSelector from "@/components/IncentiveSelector";
import DealGenieAssessment from "@/components/DealGenieAssessment";
import ApprovalAlert from "@/components/ApprovalAlert";

// Utilities
import { 
  formatCurrency,
  formatPercentage,
  calculateMonthlyValue,
  calculateNetValue,
  calculateProfit,
  calculateProfitMargin,
  calculateYOYGrowth,
  calculateIncentiveImpact,
  calculateDealFinancialSummary,
  calculateGrossMarginValue,
  calculateTierContribution,
  calculateEffectiveDiscountRate,
  type DealFinancialSummary,
  cn
} from "@/lib/utils";

// Define the form schema using Zod
const dealFormSchema = z.object({
  // Basic deal information
  dealType: z.string(),
  
  // Business information
  businessSummary: z.string().optional(),
  
  // Client/Agency information
  salesChannel: z.string(),
  region: z.string(),
  advertiserName: z.string().optional(),
  agencyName: z.string().optional(),
  
  // Deal structure
  dealStructure: z.string(),
  
  // Timeframe
  termStartDate: z.date(),
  termEndDate: z.date(),
  
  // Financial data
  annualRevenue: z.number().default(0),
  annualGrossMargin: z.number().default(0),
  
  // Contract term (in months)
  contractTerm: z.number().optional(),
  
  // Contact information
  email: z.string().email().optional(),
  
  // Status
  status: z.string().default("submitted"),
  referenceNumber: z.string().optional(),
});

// Define the form values type
type DealFormValues = z.infer<typeof dealFormSchema>;

export default function SubmitDeal() {
  const [navigate, setLocation] = useLocation();
  const { toast } = useToast();
  const [formStep, setFormStep] = useState(0);
  const [dealStructure, setDealStructure] = useState<"tiered" | "flat_commit">("tiered");
  const [incentiveTrigger, setIncentiveTrigger] = useState(0);
  const [tiersExpanded, setTiersExpanded] = useState(true);
  const [currentTier, setCurrentTier] = useState<number | null>(null);
  const [aiAssessmentVisible, setAiAssessmentVisible] = useState(false);
  const [approvalData, setApprovalData] = useState<any>(null);
  
  // Initial tiers setup
  const [dealTiers, setDealTiers] = useState([
    { tierNumber: 1, annualRevenue: 0, annualGrossMargin: 0, annualGrossMarginPercent: 0, incentivePercentage: 0, incentiveType: "rebate" as "rebate" | "discount" | "bonus" | "other", incentiveThreshold: 0, incentiveAmount: 0, incentiveNotes: "" },
    { tierNumber: 2, annualRevenue: 0, annualGrossMargin: 0, annualGrossMarginPercent: 0, incentivePercentage: 0, incentiveType: "rebate" as "rebate" | "discount" | "bonus" | "other", incentiveThreshold: 0, incentiveAmount: 0, incentiveNotes: "" },
  ]);
  
  // Define form with validation
  const form = useForm<DealFormValues>({
    resolver: zodResolver(dealFormSchema),
    defaultValues: {
      // Basic deal information
      dealType: "grow",
      
      // Business information
      businessSummary: "",
      
      // Client/Agency information
      salesChannel: undefined,
      region: undefined,
      advertiserName: "",
      agencyName: "",
      
      // Deal structure
      dealStructure: undefined,
      
      // Timeframe
      termStartDate: new Date(),
      termEndDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
      
      // Financial data (simplified)
      annualRevenue: 0,
      annualGrossMargin: 0,
      
      // Contract term (in months)
      contractTerm: undefined,
      
      // Contact information
      email: "",
      
      // Status
      status: "submitted",
      referenceNumber: `DEAL-${new Date().getFullYear()}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
    },
    mode: "onChange"
  });
  
  // Create deal mutation
  const createDeal = useMutation({
    mutationFn: async (data: DealFormValues) => {
      // Transform data for API
      const apiData = {
        ...data,
        // Add additional data transformations here if needed
        dealTiers: dealTiers, // Include the tier data
        referenceNumber: data.referenceNumber || `DEAL-${new Date().getFullYear()}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
      };
      
      console.log("Submitting deal data:", apiData);
      
      return apiRequest("/api/deals", {
        method: "POST",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(apiData)
      });
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
    onError: (error) => {
      console.error("Error submitting deal:", error);
      toast({
        title: "Error",
        description: "Failed to submit deal. Please try again.",
        variant: "destructive",
      });
    }
  });
  
  // Fetch advertisers and agencies for dropdowns
  const { data: advertisers = [] } = useQuery({
    queryKey: ['/api/advertisers'],
    enabled: true,
  });
  
  const { data: agencies = [] } = useQuery({
    queryKey: ['/api/agencies'],
    enabled: true,
  });
  
  // Get typed value from form
  function getTypedValue<T extends keyof DealFormValues>(
    field: T
  ): DealFormValues[T] | undefined {
    return form.getValues(field);
  }
  
  // Watch values from form
  function watchTypedValue<T extends keyof DealFormValues>(
    field: T
  ): DealFormValues[T] | undefined {
    return form.watch(field);
  }
  
  // Helper functions to get previous year values for comparisons
  const getPreviousYearRevenue = () => {
    const salesChannel = getTypedValue("salesChannel");
    const advertiserName = getTypedValue("advertiserName");
    const agencyName = getTypedValue("agencyName");
    
    if (salesChannel === "client_direct" && advertiserName) {
      const advertiser = advertisers.find((a: any) => a.name === advertiserName);
      return advertiser?.previousYearRevenue || 250000;
    } else if ((salesChannel === "holding_company" || salesChannel === "independent_agency") && agencyName) {
      const agency = agencies.find((a: any) => a.name === agencyName);
      return agency?.previousYearRevenue || 350000;
    }
    
    // Default value if no match is found
    return 300000;
  };
  
  const getPreviousYearMargin = () => {
    const salesChannel = getTypedValue("salesChannel");
    const advertiserName = getTypedValue("advertiserName");
    const agencyName = getTypedValue("agencyName");
    
    if (salesChannel === "client_direct" && advertiserName) {
      const advertiser = advertisers.find((a: any) => a.name === advertiserName);
      return advertiser?.previousYearMargin || 30;
    } else if ((salesChannel === "holding_company" || salesChannel === "independent_agency") && agencyName) {
      const agency = agencies.find((a: any) => a.name === agencyName);
      return agency?.previousYearMargin || 25;
    }
    
    // Default value if no match is found
    return 27.5;
  };
  
  const getPreviousYearGrossProfit = () => {
    const revenue = getPreviousYearRevenue();
    const marginPercent = getPreviousYearMargin() / 100;
    return revenue * marginPercent;
  };
  
  const getPreviousYearAdjustedGrossProfit = () => {
    // For simplicity, assuming previous year had a 1% incentive cost
    const grossProfit = getPreviousYearGrossProfit();
    return grossProfit * 0.99; // Adjusted for incentives
  };
  
  // Various financial calculation functions
  const calculateTierGrossProfit = (tier: any): number => {
    const revenue = tier.annualRevenue || 0;
    const marginPercent = tier.annualGrossMarginPercent ? tier.annualGrossMarginPercent / 100 : 0;
    let grossProfit = revenue * marginPercent;
    
    // Adjust for incentives
    if (tier.incentiveType === "rebate" || tier.incentiveType === "discount") {
      const incentivePercent = tier.incentivePercentage ? tier.incentivePercentage / 100 : 0;
      grossProfit = grossProfit - (revenue * incentivePercent);
    } else if (tier.incentiveType === "bonus" && tier.incentiveAmount) {
      grossProfit = grossProfit - tier.incentiveAmount;
    }
    
    return grossProfit;
  };
  
  const calculateRevenueGrowthRate = (tier: any): number => {
    const previousRevenue = getPreviousYearRevenue();
    const currentRevenue = tier.annualRevenue || 0;
    
    if (previousRevenue <= 0) return 0;
    return (currentRevenue - previousRevenue) / previousRevenue;
  };
  
  const calculateGrossMarginGrowthRate = (tier: any): number => {
    const previousMargin = getPreviousYearMargin() / 100;
    const currentMargin = tier.annualGrossMarginPercent ? tier.annualGrossMarginPercent / 100 : 0;
    
    // This is percentage point change, not percentage change
    return currentMargin - previousMargin;
  };
  
  const calculateGrossProfitGrowthRate = (tier: any): number => {
    const previousProfit = getPreviousYearGrossProfit();
    const currentRevenue = tier.annualRevenue || 0;
    const currentMarginPercent = tier.annualGrossMarginPercent ? tier.annualGrossMarginPercent / 100 : 0;
    const currentProfit = currentRevenue * currentMarginPercent;
    
    if (previousProfit <= 0) return 0;
    return (currentProfit - previousProfit) / previousProfit;
  };
  
  const calculateAdjustedGrossProfitGrowthRate = (tier: any): number => {
    const previousAdjustedProfit = getPreviousYearAdjustedGrossProfit();
    const currentAdjustedProfit = calculateTierGrossProfit(tier);
    
    if (previousAdjustedProfit <= 0) return 0;
    return (currentAdjustedProfit - previousAdjustedProfit) / previousAdjustedProfit;
  };
  
  const calculateAdjustedGrossMargin = (tier: any): number => {
    const revenue = tier.annualRevenue || 0;
    const grossProfit = calculateTierGrossProfit(tier);
    
    if (revenue <= 0) return 0;
    return grossProfit / revenue;
  };
  
  const calculateAdjustedGrossMarginGrowthRate = (tier: any): number => {
    const previousMargin = getPreviousYearMargin() / 100 * 0.99; // Adjusted for historical incentives
    const currentMargin = calculateAdjustedGrossMargin(tier);
    
    // This is percentage point change, not percentage change
    return currentMargin - previousMargin;
  };
  
  const calculateClientValue = (tier: any): number => {
    // Client value is a composite metric - here using adjusted gross profit
    return calculateTierGrossProfit(tier);
  };
  
  const calculateClientValueGrowthRate = (tier: any): number => {
    const previousValue = getPreviousYearAdjustedGrossProfit();
    const currentValue = calculateClientValue(tier);
    
    if (previousValue <= 0) return 0;
    return (currentValue - previousValue) / previousValue;
  };
  
  const calculateCostGrowthRate = (tier: any): number => {
    // Calculate cost growth rate relative to previous year
    const previousRevenue = getPreviousYearRevenue();
    const previousMargin = getPreviousYearMargin() / 100;
    const previousCost = previousRevenue * (1 - previousMargin);
    
    const currentRevenue = tier.annualRevenue || 0;
    const currentMarginPercent = tier.annualGrossMarginPercent ? tier.annualGrossMarginPercent / 100 : 0;
    const currentCost = currentRevenue * (1 - currentMarginPercent);
    
    if (previousCost <= 0) return 0;
    return (currentCost - previousCost) / previousCost;
  };
  
  // Validation and step navigation
  function validateAndGoToStep(targetStep: number): boolean {
    // Only validate when moving forward
    if (targetStep > formStep) {
      // Step-specific validation
      if (formStep === 0) {
        // Validate first step fields
        form.trigger(['region', 'salesChannel', 'dealType']);
        
        // Check if sales channel is selected and proper client/agency is selected
        const salesChannel = getTypedValue("salesChannel");
        const hasErrors = Object.keys(form.formState.errors).length > 0;
        
        if (hasErrors) {
          toast({
            title: "Please fix the errors before proceeding",
            description: "Some required fields are missing or invalid.",
            variant: "destructive",
          });
          return false;
        }
        
        if (salesChannel === "client_direct") {
          const valid = form.trigger(['advertiserName']);
          if (!getTypedValue("advertiserName")) {
            toast({
              title: "Advertiser Required",
              description: "Please select an advertiser for this direct client deal.",
              variant: "destructive",
            });
            return false;
          }
          if (!valid) return false;
        } else if (salesChannel === "holding_company" || salesChannel === "independent_agency") {
          const valid = form.trigger(['agencyName']);
          if (!getTypedValue("agencyName")) {
            toast({
              title: "Agency Required",
              description: "Please select an agency for this agency deal.",
              variant: "destructive",
            });
            return false;
          }
          if (!valid) return false;
        } else {
          toast({
            title: "Sales Channel Required",
            description: "Please select a sales channel before proceeding.",
            variant: "destructive",
          });
          return false;
        }
        
        // Validate deal structure and contract term
        form.trigger(['dealStructure', 'contractTerm']);
        const dealStructure = getTypedValue("dealStructure");
        const contractTerm = getTypedValue("contractTerm");
        
        if (!dealStructure) {
          toast({
            title: "Deal Structure Required",
            description: "Please select either Tiered or Flat Commit structure.",
            variant: "destructive",
          });
          return false;
        }
        
        if (!contractTerm) {
          toast({
            title: "Contract Term Required",
            description: "Please enter the contract term in months.",
            variant: "destructive",
          });
          return false;
        }
      } else if (formStep === 1) {
        // Validate second step fields - financial data
        if (dealStructure === "tiered") {
          // Check if tiers have revenue values
          const hasRevenue = dealTiers.every(tier => (tier.annualRevenue || 0) > 0);
          if (!hasRevenue) {
            toast({
              title: "Revenue Required",
              description: "Please enter annual revenue targets for all tiers.",
              variant: "destructive",
            });
            return false;
          }
          
          // Check if tiers have margin values
          const hasMargin = dealTiers.every(tier => (tier.annualGrossMarginPercent || 0) > 0);
          if (!hasMargin) {
            toast({
              title: "Margin Required",
              description: "Please enter gross margin percentages for all tiers.",
              variant: "destructive",
            });
            return false;
          }
        } else {
          // Flat commitment structure
          form.trigger(['annualRevenue', 'annualGrossMargin']);
          
          const annualRevenue = getTypedValue("annualRevenue");
          const annualGrossMargin = getTypedValue("annualGrossMargin");
          
          if (!annualRevenue || annualRevenue <= 0) {
            toast({
              title: "Revenue Required",
              description: "Please enter a valid annual revenue for the deal.",
              variant: "destructive",
            });
            return false;
          }
          
          if (!annualGrossMargin || annualGrossMargin <= 0) {
            toast({
              title: "Margin Required",
              description: "Please enter a valid annual gross margin for the deal.",
              variant: "destructive",
            });
            return false;
          }
        }
      }
    }
    
    // If validation passes, go to the target step
    setFormStep(targetStep);
    return true;
  }
  
  function nextStep() {
    if (validateAndGoToStep(formStep + 1)) {
      window.scrollTo(0, 0);
    }
  }
  
  function prevStep() {
    if (formStep > 0) {
      setFormStep(formStep - 1);
      window.scrollTo(0, 0);
    }
  }
  
  // Form submission handler
  function onSubmit(data: DealFormValues) {
    // Combine form data with tier data
    const combinedData = {
      ...data,
      dealTiers: dealTiers
    };
    
    console.log("Submitting combined data:", combinedData);
    createDeal.mutate(data);
  }
  
  return (
    <div className="max-w-5xl mx-auto">
      {/* Step indicators */}
      <div className="mb-8">
        <div className="relative">
          {/* Progress bar */}
          <div className="absolute left-0 top-1/2 w-full h-1 bg-slate-200 -translate-y-1/2 rounded-full"></div>
          <div
            className="absolute left-0 top-1/2 h-1 bg-primary -translate-y-1/2 rounded-full transition-all"
            style={{ width: `${((formStep + 1) / 3) * 100}%` }}
          ></div>
          
          {/* Step circles */}
          <div className="relative z-10 flex justify-between">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "flex items-center justify-center w-10 h-10 rounded-full border-2 bg-white transition-colors",
                  formStep >= 0 ? "border-primary text-primary" : "border-slate-300 text-slate-500"
                )}
                onClick={() => formStep >= 0 ? setFormStep(0) : null}
              >
                1
              </div>
              <span 
                onClick={() => formStep >= 0 ? setFormStep(0) : null}
                className={cn(
                  "mt-2 text-sm cursor-pointer hover:text-primary transition-colors whitespace-nowrap", 
                  formStep === 0 ? "font-medium text-primary" : "text-slate-600"
                )}
              >
                Deal Overview
              </span>
            </div>
            
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "flex items-center justify-center w-10 h-10 rounded-full border-2 bg-white transition-colors",
                  formStep >= 1 ? "border-primary text-primary" : "border-slate-300 text-slate-500"
                )}
                onClick={() => formStep >= 1 ? setFormStep(1) : validateAndGoToStep(1)}
              >
                2
              </div>
              <span 
                onClick={() => formStep >= 1 ? setFormStep(1) : validateAndGoToStep(1)}
                className={cn(
                  "mt-2 text-sm cursor-pointer hover:text-primary transition-colors whitespace-nowrap", 
                  formStep === 1 ? "font-medium text-primary" : "text-slate-600"
                )}
              >
                Value Structure
              </span>
            </div>
            
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "flex items-center justify-center w-10 h-10 rounded-full border-2 bg-white transition-colors",
                  formStep >= 2 ? "border-primary text-primary" : "border-slate-300 text-slate-500"
                )}
                onClick={() => formStep >= 2 ? setFormStep(2) : validateAndGoToStep(2)}
              >
                3
              </div>
              <span 
                onClick={() => formStep >= 2 ? setFormStep(2) : validateAndGoToStep(2)}
                className={cn(
                  "mt-2 text-sm cursor-pointer hover:text-primary transition-colors whitespace-nowrap", 
                  formStep === 2 ? "font-medium text-primary" : "text-slate-600"
                )}
              >
                Review & Submit
              </span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Form Container */}
      <Card>
        <Form {...form}>
          {/* Step 1: Deal Overview */}
          {formStep === 0 && (
            <CardContent className="p-6">
              <div className="mb-6">
                <h2 className="text-lg font-medium text-slate-900">Basic Deal Information</h2>
                <p className="mt-1 text-sm text-slate-500">Provide the basic details about this commercial deal</p>
              </div>
              
              <div className="space-y-6">
                {/* Region and Sales Channel at the top */}
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="region"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Region <span className="text-red-500">*</span></FormLabel>
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
                  
                  <FormField
                    control={form.control}
                    name="salesChannel"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sales Channel <span className="text-red-500">*</span></FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          value={field.value || ""}
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
                </div>
                
                {/* Conditional fields based on sales channel */}
                <div className="grid grid-cols-1 gap-6">
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
                              {advertisers.map((advertiser: any) => (
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
                  
                  {(form.watch("salesChannel") === "holding_company" || form.watch("salesChannel") === "independent_agency") && (
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
                              {agencies
                                .filter((agency: any) => 
                                  form.watch("salesChannel") === "holding_company" 
                                    ? agency.type === "holding_company" 
                                    : agency.type === "independent"
                                )
                                .map((agency: any) => (
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
                
                {/* Deal Type as card-style selection */}
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="dealType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Deal Type <span className="text-red-500">*</span></FormLabel>
                        <FormControl>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* Grow Deal Type Card */}
                            <Card 
                              className={`cursor-pointer transition-all hover:shadow-md ${field.value === 'grow' ? 'ring-2 ring-purple-600 shadow-md' : 'border border-slate-200'}`}
                              onClick={() => field.onChange('grow')}
                            >
                              <CardHeader className="p-4 pb-2">
                                <CardTitle className="text-md flex items-center space-x-2">
                                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-600">
                                    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
                                    <polyline points="17 6 23 6 23 12"></polyline>
                                  </svg>
                                  <span>Grow</span>
                                </CardTitle>
                                <CardDescription>20%+ YOY Growth</CardDescription>
                              </CardHeader>
                              <CardContent className="p-4 pt-0">
                                <p className="text-sm text-slate-600">
                                  For existing clients with strong growth potential. 
                                  Focuses on exceeding 20% year-over-year revenue growth 
                                  through expanded product usage or new business units.
                                </p>
                              </CardContent>
                            </Card>
                            
                            {/* Protect Deal Type Card */}
                            <Card 
                              className={`cursor-pointer transition-all hover:shadow-md ${field.value === 'protect' ? 'ring-2 ring-purple-600 shadow-md' : 'border border-slate-200'}`}
                              onClick={() => field.onChange('protect')}
                            >
                              <CardHeader className="p-4 pb-2">
                                <CardTitle className="text-md flex items-center space-x-2">
                                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600">
                                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                    <circle cx="12" cy="7" r="4"></circle>
                                  </svg>
                                  <span>Protect</span>
                                </CardTitle>
                                <CardDescription>Large Account Retention</CardDescription>
                              </CardHeader>
                              <CardContent className="p-4 pt-0">
                                <p className="text-sm text-slate-600">
                                  Designed for strategic account retention, especially for 
                                  large enterprise clients. Focuses on maintaining current 
                                  revenue levels while ensuring long-term partnership stability.
                                </p>
                              </CardContent>
                            </Card>
                            
                            {/* Custom Deal Type Card */}
                            <Card 
                              className={`cursor-pointer transition-all hover:shadow-md ${field.value === 'custom' ? 'ring-2 ring-purple-600 shadow-md' : 'border border-slate-200'}`}
                              onClick={() => field.onChange('custom')}
                            >
                              <CardHeader className="p-4 pb-2">
                                <CardTitle className="text-md flex items-center space-x-2">
                                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-purple-600">
                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                  </svg>
                                  <span>Custom</span>
                                </CardTitle>
                                <CardDescription>Special Requirements</CardDescription>
                              </CardHeader>
                              <CardContent className="p-4 pt-0">
                                <p className="text-sm text-slate-600">
                                  For specialized deals requiring custom implementation,
                                  non-standard terms, or unique technical requirements.
                                  Typically used for strategic partnerships and innovative projects.
                                </p>
                              </CardContent>
                            </Card>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Deal Structure moved from Value Structure as requested */}
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 mt-6">
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
                          value={field.value || ""}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Choose tiered or flat commit structure" />
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
                  
                  {/* Contract Term Field moved from Value Structure */}
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
                            placeholder="Enter contract duration in months (e.g., 12, 24, 36)"
                            {...field}
                            onChange={(e) => field.onChange(e.target.valueAsNumber)}
                          />
                        </FormControl>
                        <FormDescription>
                          How long the contract will run (in months)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                {/* Date Range */}
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="termStartDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Start Date <span className="text-red-500">*</span></FormLabel>
                        <DatePopover>
                          <DatePopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={"outline"}
                                className={cn(
                                  "pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value ? (
                                  format(field.value, "PPP")
                                ) : (
                                  <span>Pick a date</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </DatePopoverTrigger>
                          <DatePopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              initialFocus
                            />
                          </DatePopoverContent>
                        </DatePopover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="termEndDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>End Date <span className="text-red-500">*</span></FormLabel>
                        <DatePopover>
                          <DatePopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={"outline"}
                                className={cn(
                                  "pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value ? (
                                  format(field.value, "PPP")
                                ) : (
                                  <span>Pick a date</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </DatePopoverTrigger>
                          <DatePopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              initialFocus
                            />
                          </DatePopoverContent>
                        </DatePopover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                {/* Business Summary */}
                <div className="space-y-2">
                  <FormField
                    control={form.control}
                    name="businessSummary"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Business Summary <span className="text-red-500">*</span></FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Briefly describe the commercial opportunity and business context"
                            className="min-h-[100px]"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Provide a brief overview of the deal and its strategic importance
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="pt-6">
                  <Button 
                    type="button"
                    onClick={nextStep}
                  >
                    Next: Value Structure
                  </Button>
                </div>
              </div>
            </CardContent>
          )}
          
          {/* Step 2: Value Structure */}
          {formStep === 1 && (
            <CardContent className="p-6">
              <div className="mb-6">
                <h2 className="text-lg font-medium text-slate-900">Deal Value Structure</h2>
                <p className="mt-1 text-sm text-slate-500">Define the financial framework and incentive structure</p>
              </div>
              
              {/* Main Value Structure Container */}
              <div className="space-y-8">
                {/* Revenue & Profitability Section */}
                <div className="space-y-6">
                  <h3 className="text-md font-semibold text-slate-900 bg-gradient-to-r from-purple-700 to-indigo-500 bg-clip-text text-transparent">
                    Revenue & Profitability
                  </h3>
                  
                  <div className="p-3 bg-blue-50 border border-blue-100 rounded text-sm text-blue-800">
                    <Info className="h-4 w-4 inline mr-2" />
                    This section captures the revenue and profitability structure of the deal. For tiered deals, enter data for each tier. For flat commitment deals, enter a single value.
                  </div>
                  
                  {/* Deal Structure Selection - Tiered or Flat Commit */}
                  <div className="mb-6">
                    {dealStructure === "tiered" ? (
                      <div className="space-y-6">
                        <div className="flex items-center justify-between">
                          <h4 className="text-md font-medium text-slate-800">Tiered Revenue Structure</h4>
                          
                          <div className="flex items-center space-x-4">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                if (dealTiers.length < 6) {
                                  const nextTierNumber = dealTiers.length + 1;
                                  setDealTiers([
                                    ...dealTiers,
                                    { 
                                      tierNumber: nextTierNumber, 
                                      annualRevenue: 0, 
                                      annualGrossMargin: 0, 
                                      annualGrossMarginPercent: 0,
                                      incentivePercentage: 0,
                                      incentiveType: "rebate" as "rebate" | "discount" | "bonus" | "other",
                                      incentiveThreshold: 0,
                                      incentiveAmount: 0,
                                      incentiveNotes: ""
                                    }
                                  ]);
                                } else {
                                  toast({
                                    title: "Maximum Tiers Reached",
                                    description: "You can only add up to 6 tiers for a deal.",
                                    variant: "destructive",
                                  });
                                }
                              }}
                              className="h-8"
                            >
                              Add Tier
                            </Button>
                            
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                if (dealTiers.length > 1) {
                                  setDealTiers(dealTiers.slice(0, -1));
                                } else {
                                  toast({
                                    title: "Minimum Tiers Required",
                                    description: "You need at least one tier for the deal.",
                                    variant: "destructive",
                                  });
                                }
                              }}
                              className="h-8"
                            >
                              Remove Tier
                            </Button>
                          </div>
                        </div>
                        
                        <div className="overflow-x-auto">
                          <table className="w-full border-collapse table-fixed">
                            <colgroup>
                              <col className="w-[30%]" />
                              <col className="w-[14%]" />
                              {dealTiers.map((tier) => (
                                <col key={`col-${tier.tierNumber}`} className="w-[14%]" />
                              ))}
                            </colgroup>
                            <thead>
                              <tr>
                                <th className="text-left p-3 bg-slate-100 border border-slate-200">Metric</th>
                                <th className="text-center p-3 bg-slate-100 border border-slate-200">Last Year</th>
                                {dealTiers.map(tier => (
                                  <th key={tier.tierNumber} className="text-center p-3 bg-slate-100 border border-slate-200">
                                    Tier {tier.tierNumber}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {/* Annual Revenue Row */}
                              <tr>
                                <td className="p-3 border border-slate-200 bg-slate-50">
                                  <div className="font-medium">Annual Revenue</div>
                                  <div className="text-xs text-slate-500">Total annual revenue target</div>
                                </td>
                                <td className="p-3 border border-slate-200 text-center">
                                  {formatCurrency(getPreviousYearRevenue())} {/* Last year value */}
                                </td>
                                {dealTiers.map(tier => (
                                  <td key={tier.tierNumber} className="p-3 border border-slate-200">
                                    <Input
                                      type="number"
                                      className="text-right"
                                      value={tier.annualRevenue || ""}
                                      onChange={(e) => {
                                        const newValue = parseFloat(e.target.value) || 0;
                                        const newTiers = dealTiers.map(t => 
                                          t.tierNumber === tier.tierNumber 
                                            ? { ...t, annualRevenue: newValue } 
                                            : t
                                        );
                                        setDealTiers(newTiers);
                                      }}
                                    />
                                  </td>
                                ))}
                              </tr>
                              
                              {/* Revenue Growth Rate Row */}
                              <tr>
                                <td className="p-3 border border-slate-200 bg-slate-50">
                                  <div className="font-medium">Revenue Growth Rate</div>
                                  <div className="text-xs text-slate-500">Year-over-year growth percentage</div>
                                </td>
                                <td className="p-3 border border-slate-200 text-center">
                                  — {/* Baseline */}
                                </td>
                                {dealTiers.map(tier => {
                                  const growthRate = calculateRevenueGrowthRate(tier);
                                  return (
                                    <td key={tier.tierNumber} className="p-3 border border-slate-200 text-center">
                                      <span className={growthRate > 0 ? "text-green-600" : "text-red-600"}>
                                        {formatPercentage(growthRate)}
                                      </span>
                                    </td>
                                  );
                                })}
                              </tr>
                              
                              {/* Gross Margin Percentage Row */}
                              <tr>
                                <td className="p-3 border border-slate-200 bg-slate-50">
                                  <div className="font-medium">Gross Margin (%)</div>
                                  <div className="text-xs text-slate-500">Margin as a percentage of revenue</div>
                                </td>
                                <td className="p-3 border border-slate-200 text-center">
                                  {formatPercentage(getPreviousYearMargin() / 100)} {/* Last year value */}
                                </td>
                                {dealTiers.map(tier => (
                                  <td key={tier.tierNumber} className="p-3 border border-slate-200">
                                    <div className="flex items-center">
                                      <Input
                                        type="number"
                                        className="text-right"
                                        min="0"
                                        max="100"
                                        value={tier.annualGrossMarginPercent || ""}
                                        onChange={(e) => {
                                          const newValue = parseFloat(e.target.value) || 0;
                                          // Ensure value is between 0-100
                                          const constrainedValue = Math.min(100, Math.max(0, newValue));
                                          
                                          // Update the percent value
                                          const newTiers = dealTiers.map(t => 
                                            t.tierNumber === tier.tierNumber 
                                              ? { 
                                                  ...t, 
                                                  annualGrossMarginPercent: constrainedValue,
                                                  // Calculate and update the dollar amount too
                                                  annualGrossMargin: (t.annualRevenue || 0) * (constrainedValue / 100)
                                                } 
                                              : t
                                          );
                                          setDealTiers(newTiers);
                                        }}
                                      />
                                      <span className="ml-2">%</span>
                                    </div>
                                  </td>
                                ))}
                              </tr>
                              
                              {/* Gross Margin Dollar Value Row */}
                              <tr>
                                <td className="p-3 border border-slate-200 bg-slate-50">
                                  <div className="font-medium">Gross Margin ($)</div>
                                  <div className="text-xs text-slate-500">Margin in dollar amount</div>
                                </td>
                                <td className="p-3 border border-slate-200 text-center">
                                  {formatCurrency(getPreviousYearGrossProfit())} {/* Last year value */}
                                </td>
                                {dealTiers.map(tier => {
                                  // Calculate gross margin in dollars
                                  const revenue = tier.annualRevenue || 0;
                                  const marginPercent = tier.annualGrossMarginPercent ? tier.annualGrossMarginPercent / 100 : 0;
                                  const marginDollar = revenue * marginPercent;
                                  
                                  return (
                                    <td key={tier.tierNumber} className="p-3 border border-slate-200 text-center">
                                      {formatCurrency(marginDollar)}
                                    </td>
                                  );
                                })}
                              </tr>
                              
                              {/* Margin Growth Rate Row */}
                              <tr>
                                <td className="p-3 border border-slate-200 bg-slate-50">
                                  <div className="font-medium">Margin Growth Rate</div>
                                  <div className="text-xs text-slate-500">Change in margin percentage points</div>
                                </td>
                                <td className="p-3 border border-slate-200 text-center">
                                  — {/* Baseline */}
                                </td>
                                {dealTiers.map(tier => {
                                  const growthRate = calculateGrossMarginGrowthRate(tier);
                                  return (
                                    <td key={tier.tierNumber} className="p-3 border border-slate-200 text-center">
                                      <span className={growthRate > 0 ? "text-green-600" : "text-red-600"}>
                                        {formatPercentage(growthRate)}
                                      </span>
                                    </td>
                                  );
                                })}
                              </tr>
                            </tbody>
                          </table>
                        </div>
                        
                        <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded text-sm text-blue-800">
                          <Info className="h-4 w-4 inline mr-2" />
                          Tiered deals require revenue and margin data for each tier. Each tier represents a revenue threshold that qualifies for specific incentives.
                        </div>
                      </div>
                    ) : (
                      // Flat Commitment Structure
                      <div className="space-y-6">
                        <h4 className="text-md font-medium text-slate-800">Flat Commitment Structure</h4>
                        
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                          <FormField
                            control={form.control}
                            name="annualRevenue"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Annual Revenue <span className="text-red-500">*</span></FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    min="0"
                                    placeholder="Enter annual revenue target"
                                    {...field}
                                    onChange={(e) => field.onChange(e.target.valueAsNumber)}
                                  />
                                </FormControl>
                                <FormDescription>
                                  Total annual revenue commitment
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="annualGrossMargin"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Gross Margin (%) <span className="text-red-500">*</span></FormLabel>
                                <FormControl>
                                  <div className="flex items-center">
                                    <Input
                                      type="number"
                                      min="0"
                                      max="100"
                                      placeholder="Enter gross margin percentage"
                                      {...field}
                                      onChange={(e) => field.onChange(e.target.valueAsNumber)}
                                    />
                                    <span className="ml-2">%</span>
                                  </div>
                                </FormControl>
                                <FormDescription>
                                  Expected margin as a percentage
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded text-sm text-blue-800">
                          <Info className="h-4 w-4 inline mr-2" />
                          Flat commitment deals typically have a single incentive structure based on the total annual revenue.
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Financial Summary Table - Calculated values for each tier */}
                <div className="mt-8 mb-6 bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
                  <h3 className="text-lg font-semibold text-slate-900 mb-4 pb-2 border-b border-slate-100 bg-gradient-to-r from-purple-700 to-indigo-500 bg-clip-text text-transparent">
                    Financial Summary (Automatic Calculations)
                  </h3>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse table-fixed">
                      <colgroup>
                        <col className="w-[30%]" />
                        <col className="w-[14%]" />
                        {dealTiers.map((tier) => (
                          <col key={`col-summary-${tier.tierNumber}`} className="w-[14%]" />
                        ))}
                      </colgroup>
                      <thead>
                        <tr>
                          <th className="text-left p-3 bg-slate-100 border border-slate-200">Financial Metric</th>
                          <th className="text-center p-3 bg-slate-100 border border-slate-200">Last Year</th>
                          {dealTiers.map(tier => (
                            <th key={tier.tierNumber} className="text-center p-3 bg-slate-100 border border-slate-200">
                              Tier {tier.tierNumber}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        
                        {/* Adjusted Gross Margin */}
                        <tr>
                          <td className="p-3 border border-slate-200 bg-slate-50">
                            <div className="font-medium">Adjusted Gross Margin</div>
                            <div className="text-xs text-slate-500">Gross margin after incentives</div>
                          </td>
                          <td className="p-3 border border-slate-200 text-center">
                            {formatPercentage(getPreviousYearMargin() / 100)} {/* Last year value */}
                          </td>
                          {dealTiers.map(tier => {
                            // Calculate the adjusted gross margin (%) for this tier
                            // This takes into account the incentive cost
                            const grossProfit = calculateTierGrossProfit(tier);
                            const revenue = tier.annualRevenue || 0;
                            const adjustedMargin = revenue > 0 ? grossProfit / revenue : 0;
                            
                            return (
                              <td key={tier.tierNumber} className="p-3 border border-slate-200 text-center">
                                {formatPercentage(adjustedMargin)}
                              </td>
                            );
                          })}
                        </tr>
                        
                        {/* Adjusted Gross Profit */}
                        <tr>
                          <td className="p-3 border border-slate-200 bg-slate-50">
                            <div className="font-medium">Adjusted Gross Profit</div>
                            <div className="text-xs text-slate-500">Revenue minus cost and incentives</div>
                          </td>
                          <td className="p-3 border border-slate-200 text-center">
                            {formatCurrency(getPreviousYearAdjustedGrossProfit())} {/* Last year value - 247,500 */}
                          </td>
                          {dealTiers.map(tier => {
                            // Calculate gross profit for this tier
                            const grossProfit = calculateTierGrossProfit(tier);
                            return (
                              <td key={tier.tierNumber} className="p-3 border border-slate-200 text-center">
                                {formatCurrency(grossProfit)}
                              </td>
                            );
                          })}
                        </tr>
                        
                        {/* Adjusted Gross Margin Growth Rate */}
                        <tr>
                          <td className="p-3 border border-slate-200 bg-slate-50">
                            <div className="font-medium">Adjusted Gross Margin Growth Rate</div>
                            <div className="text-xs text-slate-500">Percentage change in adjusted margin</div>
                          </td>
                          <td className="p-3 border border-slate-200 text-center">
                            — {/* Baseline */}
                          </td>
                          {dealTiers.map(tier => {
                            // Calculate the adjusted gross margin (%) for this tier
                            // This takes into account the incentive cost
                            const grossProfit = calculateTierGrossProfit(tier);
                            const revenue = tier.annualRevenue || 0;
                            const adjustedMargin = revenue > 0 ? grossProfit / revenue : 0;
                            
                            // Get previous year margin for comparison
                            const previousYearMargin = getPreviousYearMargin() / 100;
                            
                            // Calculate growth rate (difference in percentage points)
                            const marginGrowthRate = adjustedMargin - previousYearMargin;
                            
                            return (
                              <td key={tier.tierNumber} className="p-3 border border-slate-200 text-center">
                                <span className={marginGrowthRate > 0 ? "text-green-600" : "text-red-600"}>
                                  {formatPercentage(marginGrowthRate)}
                                </span>
                              </td>
                            );
                          })}
                        </tr>
                        
                        {/* Adjusted Gross Profit Growth Rate */}
                        <tr>
                          <td className="p-3 border border-slate-200 bg-slate-50">
                            <div className="font-medium">Adjusted Gross Profit Growth Rate</div>
                            <div className="text-xs text-slate-500">Percentage increase in adjusted profit vs last year</div>
                          </td>
                          <td className="p-3 border border-slate-200 text-center">
                            — {/* Baseline */}
                          </td>
                          {dealTiers.map(tier => {
                            // Calculate adjusted profit growth rate for this tier
                            const profitGrowthRate = calculateAdjustedGrossProfitGrowthRate(tier);
                            return (
                              <td key={tier.tierNumber} className="p-3 border border-slate-200 text-center">
                                <span className={profitGrowthRate > 0 ? "text-green-600" : "text-red-600"}>
                                  {formatPercentage(profitGrowthRate)}
                                </span>
                              </td>
                            );
                          })}
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
                
                <div className="mt-8 flex justify-between">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={prevStep}
                  >
                    Previous: Deal Overview
                  </Button>
                  <Button 
                    type="button"
                    onClick={nextStep}
                  >
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
              </div>
              
              <div className="bg-slate-50 p-4 rounded-lg mb-6">
                <div className="text-sm text-slate-500 italic">
                  By submitting this deal, you confirm that all information is accurate and complete. The deal will be reviewed by the appropriate team members based on your department and deal value.
                </div>
              </div>
              
              {/* Review Sections */}
              <div className="space-y-10">
                {/* Deal Information Section */}
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <div className="px-4 py-3 bg-slate-50 border-b border-slate-200">
                    <h3 className="text-sm font-medium text-slate-700">Deal Information</h3>
                  </div>
                  <div className="p-4">
                    <dl className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
                      <div className="sm:col-span-2">
                        <dt className="text-sm font-medium text-slate-500">Deal Name</dt>
                        <dd className="mt-1 text-sm text-slate-900">
                          {(() => {
                            // Preview the auto-generated deal name
                            const dealType = getTypedValue("dealType");
                            const salesChannel = getTypedValue("salesChannel");
                            const termStartDate = getTypedValue("termStartDate");
                            const termEndDate = getTypedValue("termEndDate");
                            const dealStructure = getTypedValue("dealStructure");
                            
                            if (!dealType || !salesChannel || !termStartDate || !termEndDate || !dealStructure) {
                              return "Will be auto-generated on submission";
                            }
                            
                            // Get client name
                            let clientName = "";
                            if (salesChannel === "client_direct" && getTypedValue("advertiserName")) {
                              clientName = String(getTypedValue("advertiserName"));
                            } else if ((salesChannel === "holding_company" || salesChannel === "independent_agency") 
                                      && getTypedValue("agencyName")) {
                              clientName = String(getTypedValue("agencyName"));
                            }
                            
                            if (!clientName) return "Will be auto-generated on submission";
                            
                            // Format mapping
                            const dealTypeMap: Record<string, string> = {
                              grow: "Grow",
                              protect: "Protect",
                              custom: "Custom"
                            };
                            
                            const salesChannelMap: Record<string, string> = {
                              client_direct: "Direct",
                              holding_company: "Holding",
                              independent_agency: "Indep"
                            };
                            
                            const dealStructureMap: Record<string, string> = {
                              tiered: "Tiered",
                              flat_commit: "Flat"
                            };
                            
                            // Format dates
                            const startDateFormatted = format(termStartDate, 'yyyyMMdd');
                            const endDateFormatted = format(termEndDate, 'yyyyMMdd');
                            
                            return `${dealTypeMap[dealType]}_${salesChannelMap[salesChannel]}_${clientName}_${dealStructureMap[dealStructure]}_${startDateFormatted}-${endDateFormatted}`;
                          })()}
                        </dd>
                      </div>
                      
                      <div>
                        <dt className="text-sm font-medium text-slate-500">Deal Type</dt>
                        <dd className="mt-1 text-sm text-slate-900">
                          {(() => {
                            const dealTypeValue = getTypedValue("dealType");
                            if (!dealTypeValue) return "Not provided";
                            
                            const dealTypeMap: Record<string, string> = {
                              grow: "Grow",
                              protect: "Protect",
                              custom: "Custom"
                            };
                            
                            return dealTypeMap[dealTypeValue] || dealTypeValue.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
                          })()}
                        </dd>
                      </div>
                      
                      <div>
                        <dt className="text-sm font-medium text-slate-500">Region</dt>
                        <dd className="mt-1 text-sm text-slate-900">
                          {(() => {
                            const regionValue = getTypedValue("region");
                            if (!regionValue) return "Not provided";
                            
                            const regionMap: Record<string, string> = {
                              "northeast": "Northeast",
                              "midwest": "Midwest",
                              "midatlantic": "Mid-Atlantic",
                              "south": "South",
                              "west": "West",
                              "southeast": "Southeast",
                              "southwest": "Southwest"
                            };
                            
                            return regionMap[regionValue] || regionValue.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
                          })()}
                        </dd>
                      </div>
                      
                      <div>
                        <dt className="text-sm font-medium text-slate-500">Sales Channel</dt>
                        <dd className="mt-1 text-sm text-slate-900">
                          {(() => {
                            const salesChannelValue = getTypedValue("salesChannel");
                            if (!salesChannelValue) return "Not provided";
                            
                            const salesChannelMap: Record<string, string> = {
                              "client_direct": "Client Direct",
                              "holding_company": "Holding Company",
                              "independent_agency": "Independent Agency"
                            };
                            
                            return salesChannelMap[salesChannelValue] || salesChannelValue.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
                          })()}
                        </dd>
                      </div>
                      
                      <div>
                        <dt className="text-sm font-medium text-slate-500">
                          {form.watch("salesChannel") === "client_direct" ? "Advertiser" : "Agency"}
                        </dt>
                        <dd className="mt-1 text-sm text-slate-900">
                          {form.watch("salesChannel") === "client_direct" 
                            ? getTypedValue("advertiserName") || "Not provided"
                            : getTypedValue("agencyName") || "Not provided"
                          }
                        </dd>
                      </div>
                      
                      <div>
                        <dt className="text-sm font-medium text-slate-500">Deal Structure</dt>
                        <dd className="mt-1 text-sm text-slate-900">
                          {(() => {
                            const dealStructureValue = getTypedValue("dealStructure");
                            if (!dealStructureValue) return "Not provided";
                            
                            const structureMap: Record<string, string> = {
                              "flat_commit": "Flat Commitment",
                              "tiered": "Tiered Revenue"
                            };
                            
                            return structureMap[dealStructureValue] || dealStructureValue.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
                          })()}
                        </dd>
                      </div>
                      
                      <div>
                        <dt className="text-sm font-medium text-slate-500">Term Length</dt>
                        <dd className="mt-1 text-sm text-slate-900">
                          {getTypedValue("contractTerm") 
                            ? `${getTypedValue("contractTerm")} months` 
                            : "Not provided"
                          }
                        </dd>
                      </div>
                      
                      <div className="sm:col-span-2">
                        <dt className="text-sm font-medium text-slate-500">Business Summary</dt>
                        <dd className="mt-1 text-sm text-slate-900 whitespace-pre-wrap">
                          {getTypedValue("businessSummary") || "Not provided"}
                        </dd>
                      </div>
                    </dl>
                  </div>
                </div>
                
                {/* Financial Information Section */}
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <div className="px-4 py-3 bg-slate-50 border-b border-slate-200">
                    <h3 className="text-sm font-medium text-slate-700">Financial Information</h3>
                  </div>
                  <div className="p-4">
                    {form.watch("dealStructure") === "tiered" ? (
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-200">
                          <thead>
                            <tr>
                              <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Tier</th>
                              <th className="px-3 py-2 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Revenue</th>
                              <th className="px-3 py-2 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Margin (%)</th>
                              <th className="px-3 py-2 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Gross Profit</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-slate-200">
                            {dealTiers.map((tier) => {
                              const revenue = tier.annualRevenue || 0;
                              const marginPercent = tier.annualGrossMarginPercent ? tier.annualGrossMarginPercent / 100 : 0;
                              const grossProfit = revenue * marginPercent;
                              
                              return (
                                <tr key={tier.tierNumber}>
                                  <td className="px-3 py-2 whitespace-nowrap text-sm text-slate-900">Tier {tier.tierNumber}</td>
                                  <td className="px-3 py-2 whitespace-nowrap text-sm text-slate-900 text-right">{formatCurrency(revenue)}</td>
                                  <td className="px-3 py-2 whitespace-nowrap text-sm text-slate-900 text-right">{formatPercentage(marginPercent)}</td>
                                  <td className="px-3 py-2 whitespace-nowrap text-sm text-slate-900 text-right">{formatCurrency(grossProfit)}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <dl className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
                        <div>
                          <dt className="text-sm font-medium text-slate-500">Annual Revenue</dt>
                          <dd className="mt-1 text-sm text-slate-900">
                            {getTypedValue("annualRevenue") 
                              ? formatCurrency(getTypedValue("annualRevenue") as number)
                              : "Not provided"
                            }
                          </dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-slate-500">Gross Margin</dt>
                          <dd className="mt-1 text-sm text-slate-900">
                            {getTypedValue("annualGrossMargin") 
                              ? `${getTypedValue("annualGrossMargin")}%`
                              : "Not provided"
                            }
                          </dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-slate-500">Gross Profit</dt>
                          <dd className="mt-1 text-sm text-slate-900">
                            {(getTypedValue("annualRevenue") && getTypedValue("annualGrossMargin"))
                              ? formatCurrency((getTypedValue("annualRevenue") as number) * (getTypedValue("annualGrossMargin") as number) / 100)
                              : "Not calculated"
                            }
                          </dd>
                        </div>
                      </dl>
                    )}
                  </div>
                </div>
                
                {/* Submit Buttons */}
                <div className="mt-8 flex justify-between">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={prevStep}
                  >
                    Previous: Value Structure
                  </Button>
                  <Button type="submit" disabled={createDeal.isPending}>
                    {createDeal.isPending ? "Submitting..." : "Submit Deal for Approval"}
                  </Button>
                </div>
              </CardContent>
            )}
        </Form>
      </Card>
    </div>
  );
}