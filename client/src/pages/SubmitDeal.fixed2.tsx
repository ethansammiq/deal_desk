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
import { Calendar } from "@/components/ui/calendar";
import { 
  Popover as DatePopover,
  PopoverContent as DatePopoverContent,
  PopoverTrigger as DatePopoverTrigger,
} from "@/components/ui/popover";

// Custom Components
import { IncentiveSelector } from "@/components/IncentiveSelector";
import { DealGenieAssessment } from "@/components/DealGenieAssessment";
import { ApprovalAlert } from "@/components/ApprovalAlert";

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
      setLocation("/");
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
      const advertiser = (advertisers as any[]).find((a: any) => a.name === advertiserName);
      return advertiser?.previousYearRevenue || 250000;
    } else if ((salesChannel === "holding_company" || salesChannel === "independent_agency") && agencyName) {
      const agency = (agencies as any[]).find((a: any) => a.name === agencyName);
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
      const advertiser = (advertisers as any[]).find((a: any) => a.name === advertiserName);
      return advertiser?.previousYearMargin || 30;
    } else if ((salesChannel === "holding_company" || salesChannel === "independent_agency") && agencyName) {
      const agency = (agencies as any[]).find((a: any) => a.name === agencyName);
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
        // Validate second step fields
        if (getTypedValue("dealStructure") === "tiered") {
          // Check if tiered fields are valid
          let valid = true;
          dealTiers.forEach(tier => {
            if (!tier.annualRevenue || tier.annualRevenue <= 0) {
              toast({
                title: `Tier ${tier.tierNumber} Revenue Required`,
                description: "Please enter a valid revenue amount for each tier.",
                variant: "destructive",
              });
              valid = false;
            }
            
            if (!tier.annualGrossMarginPercent || tier.annualGrossMarginPercent <= 0) {
              toast({
                title: `Tier ${tier.tierNumber} Margin Required`,
                description: "Please enter a valid margin percentage for each tier.",
                variant: "destructive",
              });
              valid = false;
            }
          });
          
          if (!valid) return false;
        } else {
          // Check if flat commitment fields are valid
          form.trigger(['annualRevenue', 'annualGrossMargin']);
          const annualRevenue = getTypedValue("annualRevenue");
          const annualGrossMargin = getTypedValue("annualGrossMargin");
          
          if (!annualRevenue || annualRevenue <= 0) {
            toast({
              title: "Annual Revenue Required",
              description: "Please enter a valid annual revenue amount.",
              variant: "destructive",
            });
            return false;
          }
          
          if (!annualGrossMargin || annualGrossMargin <= 0) {
            toast({
              title: "Gross Margin Required",
              description: "Please enter a valid gross margin percentage.",
              variant: "destructive",
            });
            return false;
          }
        }
      }
    }
    
    return true;
  }
  
  function nextStep() {
    if (validateAndGoToStep(formStep + 1)) {
      setFormStep(curr => curr + 1);
    }
  }
  
  function prevStep() {
    setFormStep(curr => Math.max(0, curr - 1));
  }
  
  function onSubmit(data: DealFormValues) {
    if (formStep < 2) {
      nextStep();
    } else {
      createDeal.mutate(data);
    }
  }
  
  const updateTierData = (tierNumber: number, field: string, value: any) => {
    const updatedTiers = dealTiers.map(tier => {
      if (tier.tierNumber === tierNumber) {
        return { ...tier, [field]: value };
      }
      return tier;
    });
    setDealTiers(updatedTiers);
  };
  
  // Update dealStructure state when form value changes
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === "dealStructure") {
        setDealStructure(value.dealStructure as "tiered" | "flat_commit");
      }
    });
    return () => subscription.unsubscribe();
  }, [form.watch]);
  
  useEffect(() => {
    // Trigger AI assessment when certain conditions are met
    if (formStep === 2 && !aiAssessmentVisible) {
      // Show AI assessment for review step
      setAiAssessmentVisible(true);
    }
  }, [formStep, aiAssessmentVisible]);
  
  return (
    <div className="container mx-auto">
      <Card className="mb-8">
        <CardHeader className="border-b border-gray-200">
          <CardTitle className="text-2xl font-semibold">Submit Deal Request</CardTitle>
          <CardDescription>
            Create and submit a new deal for approval.
          </CardDescription>
          
          {/* Step indicators */}
          <div className="mt-6 flex items-center">
            <div className={`transition-all ${formStep >= 0 ? "text-purple-700 font-medium" : "text-gray-400"}`}>
              Deal Overview
            </div>
            <div className="mx-2 text-gray-300">→</div>
            <div className={`transition-all ${formStep >= 1 ? "text-purple-700 font-medium" : "text-gray-400"}`}>
              Value Structure
            </div>
            <div className="mx-2 text-gray-300">→</div>
            <div className={`transition-all ${formStep >= 2 ? "text-purple-700 font-medium" : "text-gray-400"}`}>
              Review & Submit
            </div>
          </div>
        </CardHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            {/* Step 1: Deal Overview */}
            {formStep === 0 && (
              <CardContent className="p-6">
                <div className="mb-6">
                  <h2 className="text-lg font-medium text-slate-900">Deal Overview</h2>
                  <p className="mt-1 text-sm text-slate-500">Provide basic information about the deal</p>
                </div>
                
                {/* Deal Type Selection */}
                <div className="mb-8">
                  <FormField
                    control={form.control}
                    name="dealType"
                    render={({ field }) => (
                      <FormItem className="space-y-4">
                        <FormLabel>Deal Type</FormLabel>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div 
                            className={`
                              cursor-pointer rounded-lg border p-4 hover:border-purple-500 hover:bg-purple-50
                              ${field.value === 'grow' ? 'border-purple-500 bg-purple-50 ring-2 ring-purple-500 ring-opacity-50' : 'border-gray-200'}
                            `}
                            onClick={() => field.onChange('grow')}
                          >
                            <div className="flex items-center justify-between mb-3">
                              <h3 className="font-medium">Grow</h3>
                              <Badge variant="outline" className="bg-green-50 text-green-700 hover:bg-green-50">
                                Growth
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-500">
                              Increase revenue and expand market share with existing or new clients
                            </p>
                          </div>
                          
                          <div 
                            className={`
                              cursor-pointer rounded-lg border p-4 hover:border-purple-500 hover:bg-purple-50
                              ${field.value === 'protect' ? 'border-purple-500 bg-purple-50 ring-2 ring-purple-500 ring-opacity-50' : 'border-gray-200'}
                            `}
                            onClick={() => field.onChange('protect')}
                          >
                            <div className="flex items-center justify-between mb-3">
                              <h3 className="font-medium">Protect</h3>
                              <Badge variant="outline" className="bg-blue-50 text-blue-700 hover:bg-blue-50">
                                Retention
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-500">
                              Defend existing revenue by securing renewals and preventing churn
                            </p>
                          </div>
                          
                          <div 
                            className={`
                              cursor-pointer rounded-lg border p-4 hover:border-purple-500 hover:bg-purple-50
                              ${field.value === 'custom' ? 'border-purple-500 bg-purple-50 ring-2 ring-purple-500 ring-opacity-50' : 'border-gray-200'}
                            `}
                            onClick={() => field.onChange('custom')}
                          >
                            <div className="flex items-center justify-between mb-3">
                              <h3 className="font-medium">Custom</h3>
                              <Badge variant="outline" className="bg-purple-50 text-purple-700 hover:bg-purple-50">
                                Special
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-500">
                              Unique arrangement requiring special consideration and approval
                            </p>
                          </div>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                {/* Region & Sales Channel */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <FormField
                    control={form.control}
                    name="region"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Region</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a region" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="northeast">Northeast</SelectItem>
                            <SelectItem value="midwest">Midwest</SelectItem>
                            <SelectItem value="midatlantic">Mid-Atlantic</SelectItem>
                            <SelectItem value="south">South</SelectItem>
                            <SelectItem value="west">West</SelectItem>
                            <SelectItem value="southeast">Southeast</SelectItem>
                            <SelectItem value="southwest">Southwest</SelectItem>
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
                        <FormLabel>Sales Channel</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a sales channel" />
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
                
                {/* Deal Structure & Contract Term */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <FormField
                    control={form.control}
                    name="dealStructure"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Deal Structure</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select structure type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="tiered">Tiered Revenue</SelectItem>
                            <SelectItem value="flat_commit">Flat Commitment</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="contractTerm"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contract Term (Months)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="Enter contract length" 
                            onChange={(e) => field.onChange(parseInt(e.target.value) || undefined)}
                            value={field.value ?? ''} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                {/* Advertiser/Agency Selection based on Sales Channel */}
                {form.watch("salesChannel") === "client_direct" ? (
                  <div className="mb-6">
                    <FormField
                      control={form.control}
                      name="advertiserName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Advertiser</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select an advertiser" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {(advertisers as any[]).map((advertiser: any, index: number) => (
                                <SelectItem key={index} value={advertiser.name}>
                                  {advertiser.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                ) : (
                  form.watch("salesChannel") === "holding_company" || form.watch("salesChannel") === "independent_agency"
                ) ? (
                  <div className="mb-6">
                    <FormField
                      control={form.control}
                      name="agencyName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Agency</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select an agency" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {(agencies as any[]).filter(agency => 
                                form.watch("salesChannel") === "holding_company" 
                                  ? agency.type === "holding"
                                  : agency.type === "independent"
                              ).map((agency: any, index: number) => (
                                <SelectItem key={index} value={agency.name}>
                                  {agency.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                ) : null}
                
                {/* Term Duration */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <FormField
                    control={form.control}
                    name="termStartDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Start Date</FormLabel>
                        <DatePopover>
                          <DatePopoverTrigger asChild>
                            <FormControl>
                              <Button 
                                variant="outline"
                                className={cn(
                                  "w-full pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value ? (
                                  format(field.value, "PPP")
                                ) : (
                                  <span>Pick a date</span>
                                )}
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
                        <FormLabel>End Date</FormLabel>
                        <DatePopover>
                          <DatePopoverTrigger asChild>
                            <FormControl>
                              <Button 
                                variant="outline"
                                className={cn(
                                  "w-full pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value ? (
                                  format(field.value, "PPP")
                                ) : (
                                  <span>Pick a date</span>
                                )}
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
                <div className="mb-6">
                  <FormField
                    control={form.control}
                    name="businessSummary"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Business Summary</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Provide a brief summary of the business opportunity and strategic rationale..." 
                            className="min-h-32"
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>
                          Include key information about the client, business goals, and any competitive context.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                {/* Next Step Button */}
                <div className="flex justify-end">
                  <Button type="button" onClick={nextStep}>
                    Next: Value Structure
                  </Button>
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
                                      },
                                    ]);
                                  }
                                }}
                                disabled={dealTiers.length >= 6}
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
                                  }
                                }}
                                disabled={dealTiers.length <= 1}
                              >
                                Remove Tier
                              </Button>
                            </div>
                          </div>
                          
                          {/* Tiered Revenue Table */}
                          <div className="border rounded-md overflow-x-auto">
                            <table className="w-full table-fixed border-collapse">
                              <colgroup>
                                <col style={{ width: '15%' }} />
                                <col style={{ width: '25%' }} />
                                <col style={{ width: '25%' }} />
                                <col style={{ width: '17.5%' }} />
                                <col style={{ width: '17.5%' }} />
                              </colgroup>
                              <thead>
                                <tr>
                                  <th className="p-3 border bg-slate-50 text-center">Tier</th>
                                  <th className="p-3 border bg-slate-50 text-center">Annual Revenue ($)</th>
                                  <th className="p-3 border bg-slate-50 text-center">Last Year Revenue ($)</th>
                                  <th className="p-3 border bg-slate-50 text-center">Gross Margin (%)</th>
                                  <th className="p-3 border bg-slate-50 text-center">Growth (%)</th>
                                </tr>
                              </thead>
                              <tbody>
                                {dealTiers.map((tier, index) => {
                                  const previousYearRevenue = getPreviousYearRevenue();
                                  const growthRate = (previousYearRevenue > 0 && tier.annualRevenue > 0)
                                    ? ((tier.annualRevenue - previousYearRevenue) / previousYearRevenue)
                                    : 0;
                                  
                                  return (
                                    <tr key={tier.tierNumber} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                                      <td className="p-3 border text-center">
                                        Tier {tier.tierNumber}
                                      </td>
                                      <td className="p-3 border text-center">
                                        <Input
                                          type="number"
                                          value={tier.annualRevenue || ''}
                                          onChange={(e) => {
                                            updateTierData(tier.tierNumber, 'annualRevenue', parseFloat(e.target.value) || 0);
                                          }}
                                          className="text-center"
                                        />
                                      </td>
                                      <td className="p-3 border text-center text-gray-600">
                                        {formatCurrency(previousYearRevenue)}
                                      </td>
                                      <td className="p-3 border text-center">
                                        <Input
                                          type="number"
                                          value={tier.annualGrossMarginPercent || ''}
                                          onChange={(e) => {
                                            updateTierData(tier.tierNumber, 'annualGrossMarginPercent', parseFloat(e.target.value) || 0);
                                          }}
                                          className="text-center"
                                        />
                                      </td>
                                      <td className={`p-3 border text-center ${growthRate >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        {formatPercentage(growthRate)}
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                          
                          {/* Financial Summary Table */}
                          <div className="mt-8">
                            <h4 className="text-md font-medium text-slate-800 mb-4">Financial Summary</h4>
                            
                            <div className="border rounded-md overflow-x-auto">
                              <table className="w-full table-fixed border-collapse">
                                <colgroup>
                                  <col style={{ width: '30%' }} />
                                  {dealTiers.map((tier) => (
                                    <col key={`col-tier-${tier.tierNumber}`} style={{ width: `${70 / dealTiers.length}%` }} />
                                  ))}
                                </colgroup>
                                <thead>
                                  <tr>
                                    <th className="p-3 border bg-slate-50 text-left">Metric</th>
                                    {dealTiers.map((tier) => (
                                      <th key={`header-tier-${tier.tierNumber}`} className="p-3 border bg-slate-50 text-center">
                                        Tier {tier.tierNumber}
                                      </th>
                                    ))}
                                  </tr>
                                </thead>
                                <tbody>
                                  {/* Revenue */}
                                  <tr>
                                    <td className="p-3 border font-medium text-slate-700">
                                      Revenue
                                      <div className="text-xs text-slate-500 mt-1">
                                        Total annual revenue for this tier
                                      </div>
                                    </td>
                                    {dealTiers.map((tier) => (
                                      <td key={`revenue-tier-${tier.tierNumber}`} className="p-3 border text-center">
                                        {formatCurrency(tier.annualRevenue || 0)}
                                      </td>
                                    ))}
                                  </tr>
                                  
                                  {/* Revenue Growth */}
                                  <tr className="bg-gray-50">
                                    <td className="p-3 border font-medium text-slate-700">
                                      Revenue Growth
                                      <div className="text-xs text-slate-500 mt-1">
                                        Year-over-year change in total revenue
                                      </div>
                                    </td>
                                    {dealTiers.map((tier) => {
                                      const growthRate = calculateRevenueGrowthRate(tier);
                                      return (
                                        <td 
                                          key={`revenue-growth-tier-${tier.tierNumber}`} 
                                          className={`p-3 border text-center ${growthRate >= 0 ? 'text-green-600' : 'text-red-600'}`}
                                        >
                                          {formatPercentage(growthRate)}
                                        </td>
                                      );
                                    })}
                                  </tr>
                                  
                                  {/* Gross Margin */}
                                  <tr>
                                    <td className="p-3 border font-medium text-slate-700">
                                      Gross Margin
                                      <div className="text-xs text-slate-500 mt-1">
                                        Revenue minus direct costs as a percentage
                                      </div>
                                    </td>
                                    {dealTiers.map((tier) => (
                                      <td key={`margin-tier-${tier.tierNumber}`} className="p-3 border text-center">
                                        {formatPercentage(tier.annualGrossMarginPercent ? tier.annualGrossMarginPercent / 100 : 0)}
                                      </td>
                                    ))}
                                  </tr>
                                  
                                  {/* Gross Margin Change */}
                                  <tr className="bg-gray-50">
                                    <td className="p-3 border font-medium text-slate-700">
                                      Gross Margin Change
                                      <div className="text-xs text-slate-500 mt-1">
                                        Year-over-year percentage point change in margin
                                      </div>
                                    </td>
                                    {dealTiers.map((tier) => {
                                      const marginChange = calculateGrossMarginGrowthRate(tier);
                                      return (
                                        <td 
                                          key={`margin-change-tier-${tier.tierNumber}`} 
                                          className={`p-3 border text-center ${marginChange >= 0 ? 'text-green-600' : 'text-red-600'}`}
                                        >
                                          {marginChange >= 0 ? '+' : ''}{(marginChange * 100).toFixed(1)}pp
                                        </td>
                                      );
                                    })}
                                  </tr>
                                  
                                  {/* Gross Profit */}
                                  <tr>
                                    <td className="p-3 border font-medium text-slate-700">
                                      Gross Profit
                                      <div className="text-xs text-slate-500 mt-1">
                                        Revenue multiplied by gross margin percentage
                                      </div>
                                    </td>
                                    {dealTiers.map((tier) => {
                                      const revenue = tier.annualRevenue || 0;
                                      const marginPercent = tier.annualGrossMarginPercent ? tier.annualGrossMarginPercent / 100 : 0;
                                      const grossProfit = revenue * marginPercent;
                                      return (
                                        <td key={`profit-tier-${tier.tierNumber}`} className="p-3 border text-center">
                                          {formatCurrency(grossProfit)}
                                        </td>
                                      );
                                    })}
                                  </tr>
                                  
                                  {/* Gross Profit Growth */}
                                  <tr className="bg-gray-50">
                                    <td className="p-3 border font-medium text-slate-700">
                                      Gross Profit Growth
                                      <div className="text-xs text-slate-500 mt-1">
                                        Year-over-year change in gross profit
                                      </div>
                                    </td>
                                    {dealTiers.map((tier) => {
                                      const growthRate = calculateGrossProfitGrowthRate(tier);
                                      return (
                                        <td 
                                          key={`profit-growth-tier-${tier.tierNumber}`} 
                                          className={`p-3 border text-center ${growthRate >= 0 ? 'text-green-600' : 'text-red-600'}`}
                                        >
                                          {formatPercentage(growthRate)}
                                        </td>
                                      );
                                    })}
                                  </tr>
                                  
                                  {/* Adjusted Gross Margin */}
                                  <tr>
                                    <td className="p-3 border font-medium text-slate-700">
                                      Adjusted Gross Margin
                                      <div className="text-xs text-slate-500 mt-1">
                                        Gross margin after accounting for incentives
                                      </div>
                                    </td>
                                    {dealTiers.map((tier) => {
                                      const adjustedMargin = calculateAdjustedGrossMargin(tier);
                                      return (
                                        <td key={`adj-margin-tier-${tier.tierNumber}`} className="p-3 border text-center">
                                          {formatPercentage(adjustedMargin)}
                                        </td>
                                      );
                                    })}
                                  </tr>
                                  
                                  {/* Client Value */}
                                  <tr className="bg-gray-50">
                                    <td className="p-3 border font-medium text-slate-700">
                                      Client Value
                                      <div className="text-xs text-slate-500 mt-1">
                                        Overall deal value accounting for all factors
                                      </div>
                                    </td>
                                    {dealTiers.map((tier) => {
                                      const clientValue = calculateClientValue(tier);
                                      return (
                                        <td key={`client-value-tier-${tier.tierNumber}`} className="p-3 border text-center">
                                          {formatCurrency(clientValue)}
                                        </td>
                                      );
                                    })}
                                  </tr>
                                  
                                  {/* Client Value Growth */}
                                  <tr>
                                    <td className="p-3 border font-medium text-slate-700">
                                      Client Value Growth
                                      <div className="text-xs text-slate-500 mt-1">
                                        Year-over-year change in client value
                                      </div>
                                    </td>
                                    {dealTiers.map((tier) => {
                                      const growthRate = calculateClientValueGrowthRate(tier);
                                      return (
                                        <td 
                                          key={`value-growth-tier-${tier.tierNumber}`} 
                                          className={`p-3 border text-center ${growthRate >= 0 ? 'text-green-600' : 'text-red-600'}`}
                                        >
                                          {formatPercentage(growthRate)}
                                        </td>
                                      );
                                    })}
                                  </tr>
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </div>
                      ) : (
                        /* Flat Commitment Structure */
                        <div className="space-y-6">
                          <h4 className="text-md font-medium text-slate-800">Flat Commitment Structure</h4>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField
                              control={form.control}
                              name="annualRevenue"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Annual Revenue ($)</FormLabel>
                                  <FormControl>
                                    <Input 
                                      type="number" 
                                      {...field}
                                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                      value={field.value || ''}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={form.control}
                              name="annualGrossMargin"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Gross Margin (%)</FormLabel>
                                  <FormControl>
                                    <Input 
                                      type="number" 
                                      {...field}
                                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                      value={field.value || ''}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                          
                          {/* Financial Summary */}
                          <div className="mt-6">
                            <h4 className="text-md font-medium text-slate-800 mb-4">Financial Summary</h4>
                            
                            <div className="border rounded-md overflow-hidden">
                              <table className="w-full border-collapse">
                                <thead>
                                  <tr>
                                    <th className="p-3 border bg-slate-50 text-left">Metric</th>
                                    <th className="p-3 border bg-slate-50 text-left">Current Deal</th>
                                    <th className="p-3 border bg-slate-50 text-left">Last Year</th>
                                    <th className="p-3 border bg-slate-50 text-left">Change</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  <tr>
                                    <td className="p-3 border font-medium text-slate-700">
                                      Revenue
                                      <div className="text-xs text-slate-500 mt-1">
                                        Total annual revenue
                                      </div>
                                    </td>
                                    <td className="p-3 border">
                                      {formatCurrency(form.watch("annualRevenue") || 0)}
                                    </td>
                                    <td className="p-3 border text-gray-600">
                                      {formatCurrency(getPreviousYearRevenue())}
                                    </td>
                                    <td className={`p-3 border ${(form.watch("annualRevenue") || 0) >= getPreviousYearRevenue() ? 'text-green-600' : 'text-red-600'}`}>
                                      {formatPercentage(((form.watch("annualRevenue") || 0) - getPreviousYearRevenue()) / getPreviousYearRevenue())}
                                    </td>
                                  </tr>
                                  
                                  <tr className="bg-gray-50">
                                    <td className="p-3 border font-medium text-slate-700">
                                      Gross Margin
                                      <div className="text-xs text-slate-500 mt-1">
                                        Revenue minus direct costs as a percentage
                                      </div>
                                    </td>
                                    <td className="p-3 border">
                                      {form.watch("annualGrossMargin") ? `${form.watch("annualGrossMargin")}%` : '0%'}
                                    </td>
                                    <td className="p-3 border text-gray-600">
                                      {`${getPreviousYearMargin()}%`}
                                    </td>
                                    <td className={`p-3 border ${(form.watch("annualGrossMargin") || 0) >= getPreviousYearMargin() ? 'text-green-600' : 'text-red-600'}`}>
                                      {((form.watch("annualGrossMargin") || 0) - getPreviousYearMargin()).toFixed(1)}pp
                                    </td>
                                  </tr>
                                  
                                  <tr>
                                    <td className="p-3 border font-medium text-slate-700">
                                      Gross Profit
                                      <div className="text-xs text-slate-500 mt-1">
                                        Revenue multiplied by gross margin percentage
                                      </div>
                                    </td>
                                    <td className="p-3 border">
                                      {formatCurrency(((form.watch("annualRevenue") || 0) * (form.watch("annualGrossMargin") || 0)) / 100)}
                                    </td>
                                    <td className="p-3 border text-gray-600">
                                      {formatCurrency(getPreviousYearGrossProfit())}
                                    </td>
                                    <td className={`p-3 border ${((form.watch("annualRevenue") || 0) * (form.watch("annualGrossMargin") || 0)) / 100 >= getPreviousYearGrossProfit() ? 'text-green-600' : 'text-red-600'}`}>
                                      {formatPercentage((((form.watch("annualRevenue") || 0) * (form.watch("annualGrossMargin") || 0)) / 100 - getPreviousYearGrossProfit()) / getPreviousYearGrossProfit())}
                                    </td>
                                  </tr>
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Incentive Structure */}
                  <div className="space-y-6">
                    <h3 className="text-md font-semibold text-slate-900 bg-gradient-to-r from-purple-700 to-indigo-500 bg-clip-text text-transparent">
                      Incentive Structure
                    </h3>
                    
                    <div className="p-3 bg-blue-50 border border-blue-100 rounded text-sm text-blue-800">
                      <Info className="h-4 w-4 inline mr-2" />
                      Define the incentives that will be offered as part of this deal. Consider rebates, discounts, bonuses, or other incentives that may impact the deal value.
                    </div>
                    
                    {/* Incentive Selector */}
                    <IncentiveSelector 
                      dealTiers={dealTiers}
                      selectedIncentives={[]}
                      onChange={(incentives) => {
                        // Handle incentive changes
                        console.log("Incentives updated:", incentives);
                      }}
                      showAddForm={true}
                    />
                  </div>
                </div>
                
                {/* AI-powered Deal Assessment */}
                {aiAssessmentVisible && (
                  <div className="mt-8 mb-8">
                    <DealGenieAssessment 
                      dealData={{
                        dealType: form.watch("dealType"),
                        salesChannel: form.watch("salesChannel"),
                        clientName: form.watch("salesChannel") === "client_direct" 
                          ? form.watch("advertiserName") 
                          : form.watch("agencyName"),
                        dealStructure: form.watch("dealStructure"),
                        dealTiers: dealTiers,
                        annualRevenue: form.watch("annualRevenue") || 0,
                        annualGrossMargin: form.watch("annualGrossMargin") || 0,
                        contractTerm: form.watch("contractTerm") || 0
                      }}
                      revenueGrowthRate={0.1} // Example value
                      grossProfitGrowthRate={0.08} // Example value
                    />
                  </div>
                )}
                
                {/* Step Navigation */}
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
                </div>
              </CardContent>
            )}
          </form>
        </Form>
      </Card>
    </div>
  );
}