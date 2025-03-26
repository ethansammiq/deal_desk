import { useState, useEffect } from "react";
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
  CardContent,
  CardHeader
} from "@/components/ui/card";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { ApprovalAlert, ApprovalHelpText, StandardDealCriteriaHelp } from "@/components/ApprovalAlert";
import { ApprovalRule } from "@/lib/approval-matrix";
import { Plus, Trash2, Info } from "lucide-react";
import { IncentiveSelector, type SelectedIncentive, incentiveCategories } from "@/components/IncentiveSelector";
import TierSpecificIncentives, { type TierIncentive } from "@/components/TierSpecificIncentives";

// Simplified deal schema with only essential fields
const dealFormSchema = z.object({
  // Basic deal information
  dealType: z.enum(["grow", "protect", "custom"], {
    required_error: "Deal type is required",
    invalid_type_error: "Deal type must be one of: Grow, Protect, Custom",
  }),
  
  // Business information
  businessSummary: z.string().min(10, "Business summary should be at least 10 characters"),
  
  // Client/Agency information
  salesChannel: z.enum(["holding_company", "independent_agency", "client_direct"], {
    required_error: "Sales channel is required",
  }),
  region: z.enum(["northeast", "midwest", "midatlantic", "west", "south"], {
    required_error: "Region is required",
  }),
  
  // Conditional fields based on salesChannel
  advertiserName: z.string().optional(),
  agencyName: z.string().optional(),
  
  // Deal structure
  dealStructure: z.enum(["tiered", "flat_commit"], {
    required_error: "Deal structure is required",
  }),
  
  // Timeframe
  termStartDate: z.date({
    required_error: "Start date is required",
    invalid_type_error: "Start date must be a valid date",
  }),
  termEndDate: z.date({
    required_error: "End date is required",
    invalid_type_error: "End date must be a valid date",
  }),

  // Essential financial data only
  annualRevenue: z.coerce.number().positive("Annual revenue must be positive"),
  annualGrossMargin: z.coerce.number().min(0).max(100, "Annual gross margin must be between 0 and 100%"),
  
  // Contract term (in months)
  contractTerm: z.coerce.number().min(1, "Contract term must be at least 1 month").default(12),
  
  // Contact information
  email: z.string().email().optional(),
  
  // System fields
  status: z.string().default("submitted"),
  referenceNumber: z.string().optional(),
})
// Add conditional validation - if salesChannel is client_direct, advertiserName is required
.refine(
  (data) => !(data.salesChannel === "client_direct" && !data.advertiserName),
  {
    message: "Advertiser name is required for Client Direct sales channel",
    path: ["advertiserName"],
  }
)
// Add conditional validation - if salesChannel is agency type, agencyName is required
.refine(
  (data) => !((data.salesChannel === "holding_company" || data.salesChannel === "independent_agency") && !data.agencyName),
  {
    message: "Agency name is required for Agency sales channels",
    path: ["agencyName"],
  }
)
// Validate that termEndDate is after termStartDate
.refine(
  (data) => data.termEndDate > data.termStartDate,
  {
    message: "End date must be after start date",
    path: ["termEndDate"],
  }
);

type DealFormValues = z.infer<typeof dealFormSchema>;

export default function SubmitDeal() {
  const [formStep, setFormStep] = useState(0);
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [hasNonStandardTerms, setHasNonStandardTerms] = useState(false);
  const [currentApprover, setCurrentApprover] = useState<ApprovalRule | null>(null);
  const [dealStructureType, setDealStructure] = useState<"tiered" | "flat_commit">("tiered");
  const [financialSummary, setFinancialSummary] = useState<DealFinancialSummary>({
    totalAnnualRevenue: 0,
    totalGrossMargin: 0,
    averageGrossMarginPercent: 0,
    totalIncentiveValue: 0,
    effectiveDiscountRate: 0,
    monthlyValue: 0,
    yearOverYearGrowth: 0,
    projectedNetValue: 0
  });
  
  // Type-safe helper functions for getting form values
  function getTypedValue<T extends string>(
    field: T
  ): string | number | boolean | Date | undefined {
    // Using type assertion to ensure correct typing
    return form.getValues(field as any);
  }
  
  // Type-safe helper function for watching form values
  function watchTypedValue<T extends string>(
    field: T
  ): string | number | boolean | Date | undefined {
    // Using type assertion to ensure correct typing
    return form.watch(field as any);
  }
  
  // Handle approval level changes
  const handleApprovalChange = (level: string, approvalInfo: ApprovalRule) => {
    setCurrentApprover(approvalInfo);
  };
  
  // Handle incentive selection changes
  const handleIncentiveChange = (incentives: SelectedIncentive[]) => {
    setSelectedIncentives(incentives);
  };
  
  // Handle tier-specific incentive changes
  const handleTierIncentiveChange = (incentives: TierIncentive[]) => {
    setTierIncentives(incentives);
  };
  
  // State to track selected agencies and advertisers for dropdowns
  const [agencies, setAgencies] = useState<AgencyData[]>([]);
  const [advertisers, setAdvertisers] = useState<AdvertiserData[]>([]);
  
  // Removed previous year data interface - no longer needed in simplified UI
  
  interface DealTierData {
    tierNumber: number;
    annualRevenue: number;
    annualGrossMargin: number;
    annualGrossMarginPercent: number;
    incentivePercentage: number;
    incentiveNotes: string;
    incentiveType: "rebate" | "discount" | "bonus" | "other";
    incentiveThreshold: number; // Revenue threshold to achieve this incentive
    incentiveAmount: number; // Monetary value of the incentive
  }
  
  // Type definitions for advertisers and agencies (simplified)
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
  
  // Removed previous year data state as it's no longer needed for simplified UI
  
  // State for tiered deal structure
  const [dealTiers, setDealTiers] = useState([
    {
      tierNumber: 1,
      annualRevenue: 0,
      annualGrossMargin: 0,
      annualGrossMarginPercent: 0,
      incentivePercentage: 0,
      incentiveNotes: "Base tier - no incentives",
      incentiveType: "rebate" as const,
      incentiveThreshold: 0,
      incentiveAmount: 0
    },
    {
      tierNumber: 2,
      annualRevenue: 0,
      annualGrossMargin: 0,
      annualGrossMarginPercent: 0,
      incentivePercentage: 0,
      incentiveNotes: "",
      incentiveType: "rebate" as const,
      incentiveThreshold: 0,
      incentiveAmount: 0
    },
    {
      tierNumber: 3,
      annualRevenue: 0,
      annualGrossMargin: 0,
      annualGrossMarginPercent: 0,
      incentivePercentage: 0,
      incentiveNotes: "",
      incentiveType: "rebate" as const,
      incentiveThreshold: 0,
      incentiveAmount: 0
    }
  ]);
  
  // State for selected incentives from the hierarchical selector
  const [selectedIncentives, setSelectedIncentives] = useState<SelectedIncentive[]>([]);
  
  // State for tier-specific incentives (volume discount, rebates, etc.)
  const [tierIncentives, setTierIncentives] = useState<TierIncentive[]>([]);

  const form = useForm<DealFormValues>({
    resolver: zodResolver(dealFormSchema),
    defaultValues: {
      // Basic deal information
      dealType: "grow",
      
      // Business information
      businessSummary: "",
      
      // Client/Agency information
      salesChannel: "client_direct",
      region: "northeast",
      advertiserName: "",
      agencyName: "",
      
      // Deal structure
      dealStructure: "tiered",
      
      // Timeframe
      termStartDate: new Date(),
      termEndDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
      
      // Financial data (simplified)
      annualRevenue: 0,
      annualGrossMargin: 0,
      
      // Contract term (in months)
      contractTerm: 12,
      
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
  
  // Fetch agencies and advertisers for dropdowns
  useEffect(() => {
    const fetchAgencies = async () => {
      try {
        const response = await apiRequest("GET", "/api/agencies");
        const data = await response.json();
        setAgencies(data);
      } catch (error) {
        console.error("Failed to fetch agencies:", error);
        toast({
          title: "Error",
          description: "Failed to load agencies data",
          variant: "destructive",
        });
      }
    };

    const fetchAdvertisers = async () => {
      try {
        const response = await apiRequest("GET", "/api/advertisers");
        const data = await response.json();
        setAdvertisers(data);
      } catch (error) {
        console.error("Failed to fetch advertisers:", error);
        toast({
          title: "Error",
          description: "Failed to load advertisers data",
          variant: "destructive",
        });
      }
    };

    fetchAgencies();
    fetchAdvertisers();
  }, [toast]);

  // Watch for salesChannel and dealStructure changes to handle conditional fields
  const salesChannel = watchTypedValue("salesChannel");
  const dealStructureValue = watchTypedValue("dealStructure");
  
  // Update dealStructureType when form value changes
  useEffect(() => {
    if (dealStructureValue) {
      setDealStructure(dealStructureValue as "tiered" | "flat_commit");
    }
  }, [dealStructureValue]);

  // Auto-populate region when selecting advertiser or agency
  useEffect(() => {
    const updateRegionData = async () => {
      const advertiserName = getTypedValue("advertiserName");
      const agencyName = getTypedValue("agencyName");
      
      if (salesChannel === "client_direct" && advertiserName) {
        const advertiser = advertisers.find((a: AdvertiserData) => a.name === advertiserName);
        if (advertiser) {
          // Only set the region value
          const regionValue = (advertiser.region as "northeast" | "midwest" | "midatlantic" | "west" | "south") || "northeast";
          form.setValue("region", regionValue);
        }
      } else if ((salesChannel === "holding_company" || salesChannel === "independent_agency") && agencyName) {
        const agency = agencies.find((a: AgencyData) => a.name === agencyName);
        if (agency) {
          // Only set the region value
          const regionValue = (agency.region as "northeast" | "midwest" | "midatlantic" | "west" | "south") || "northeast";
          form.setValue("region", regionValue);
        }
      }
    };
    
    updateRegionData();
  }, [form, salesChannel, agencies, advertisers]);

  // Calculate contract term automatically based on start and end dates
  useEffect(() => {
    const startDate = getTypedValue("termStartDate") as Date;
    const endDate = getTypedValue("termEndDate") as Date;
    
    if (startDate && endDate) {
      // Calculate difference in months
      const diffMonths = (endDate.getFullYear() - startDate.getFullYear()) * 12 + 
                         (endDate.getMonth() - startDate.getMonth());
      form.setValue("contractTerm", Math.max(1, diffMonths));
    }
  }, [
    form, // Include the entire form as a dependency
  ]);
  
  // Calculate real-time financial impact based on changes to dealTiers and contract term
  useEffect(() => {
    // Get current contract term
    const contractTerm = Number(getTypedValue("contractTerm")) || 12;
    
    // Get advertiser/agency to find previous year revenue
    const advertiserName = getTypedValue("advertiserName") as string;
    const agencyName = getTypedValue("agencyName") as string;
    
    // Find the previous year revenue for YoY calculations
    let previousYearRevenue = 0;
    
    if (salesChannel === "client_direct" && advertiserName) {
      const advertiser = advertisers.find(a => a.name === advertiserName);
      if (advertiser && advertiser.previousYearRevenue) {
        previousYearRevenue = advertiser.previousYearRevenue;
      }
    } else if ((salesChannel === "holding_company" || salesChannel === "independent_agency") && agencyName) {
      const agency = agencies.find(a => a.name === agencyName);
      if (agency && agency.previousYearRevenue) {
        previousYearRevenue = agency.previousYearRevenue;
      }
    }
    
    // Calculate financial summary
    const summary = calculateDealFinancialSummary(dealTiers, contractTerm, previousYearRevenue);
    
    // Update the financial summary state
    setFinancialSummary(summary);
  }, [dealTiers, form, salesChannel, advertisers, agencies]);

  // Validates the current step and allows or prevents navigation
  function validateAndGoToStep(targetStep: number): boolean {
    // If going to a step we've already completed or the current step, allow it
    if (formStep >= targetStep) {
      setFormStep(targetStep);
      return true;
    }
    
    // Validate current step fields before allowing navigation
    if (formStep === 0) {
      // Use individual triggers for each field instead of array syntax
      form.trigger("dealType");
      form.trigger("businessSummary");
      form.trigger("salesChannel");
      form.trigger("region");
      
      const dealTypeError = form.getFieldState('dealType').error;
      const businessSummaryError = form.getFieldState('businessSummary').error;
      const salesChannelError = form.getFieldState('salesChannel').error;
      const regionError = form.getFieldState('region').error;
      
      // Check conditional field validation based on salesChannel
      let conditionalError = false;
      if (salesChannel === "client_direct") {
        form.trigger("advertiserName");
        conditionalError = !!form.getFieldState('advertiserName').error;
      } else if (salesChannel === "holding_company" || salesChannel === "independent_agency") {
        form.trigger("agencyName");
        conditionalError = !!form.getFieldState('agencyName').error;
      }
      
      if (dealTypeError || businessSummaryError || salesChannelError || regionError || conditionalError) {
        toast({
          title: "Validation Error",
          description: "Please fix the errors in the Deal Details section before continuing.",
          variant: "destructive",
        });
        return false;
      }
      
      // If target is 2 (Review), also validate step 1
      if (targetStep === 2) {
        // Continue validation for step 1
        form.trigger("dealStructure");
        form.trigger("termStartDate");
        form.trigger("termEndDate");
        form.trigger("annualRevenue");
        form.trigger("annualGrossMargin");
        
        const dealStructureError = form.getFieldState('dealStructure').error;
        const termStartDateError = form.getFieldState('termStartDate').error;
        const termEndDateError = form.getFieldState('termEndDate').error;
        const annualRevenueError = form.getFieldState('annualRevenue').error;
        const annualGrossMarginError = form.getFieldState('annualGrossMargin').error;
        
        if (dealStructureError || termStartDateError || termEndDateError || annualRevenueError || annualGrossMarginError) {
          // Stop at Step 1 to fix the errors
          setFormStep(1);
          toast({
            title: "Validation Error",
            description: "Please fix the errors in the Deal Structure & Pricing section before continuing to Review.",
            variant: "destructive",
          });
          return false;
        }
      }
    } else if (formStep === 1) {
      form.trigger("dealStructure");
      form.trigger("termStartDate");
      form.trigger("termEndDate");
      form.trigger("annualRevenue");
      form.trigger("annualGrossMargin");
      
      const dealStructureError = form.getFieldState('dealStructure').error;
      const termStartDateError = form.getFieldState('termStartDate').error;
      const termEndDateError = form.getFieldState('termEndDate').error;
      const annualRevenueError = form.getFieldState('annualRevenue').error;
      const annualGrossMarginError = form.getFieldState('annualGrossMargin').error;
      
      if (dealStructureError || termStartDateError || termEndDateError || annualRevenueError || annualGrossMarginError) {
        toast({
          title: "Validation Error",
          description: "Please fix the errors in the Deal Structure & Pricing section before continuing.",
          variant: "destructive",
        });
        return false;
      }
    }
    
    // If all validations pass, go to the target step
    setFormStep(targetStep);
    return true;
  }

  function nextStep() {
    const targetStep = Math.min(formStep + 1, 2);
    validateAndGoToStep(targetStep);
  }
  
  function prevStep() {
    // For going back, we don't need validation - we can simply navigate to the previous step
    // Only navigate if we're not already on the first step
    if (formStep > 0) {
      const targetStep = formStep - 1;
      setFormStep(targetStep);
    }
  }
  
  function onSubmit(data: DealFormValues) {
    // Format dates for deal name
    const startDateFormatted = format(data.termStartDate, 'yyyyMMdd');
    const endDateFormatted = format(data.termEndDate, 'yyyyMMdd');
    
    // Determine client/agency name
    let clientName = "";
    if (data.salesChannel === "client_direct" && data.advertiserName) {
      clientName = data.advertiserName;
    } else if ((data.salesChannel === "holding_company" || data.salesChannel === "independent_agency") && data.agencyName) {
      clientName = data.agencyName;
    }
    
    // Generate deal name format: 
    // Deal Type_Sales Channel_Advertiser Name/Agency Name_Deal Structure_Deal Start Date-Deal End Date
    const dealTypeMap = {
      grow: "Grow",
      protect: "Protect",
      custom: "Custom"
    };
    
    const salesChannelMap = {
      client_direct: "Direct",
      holding_company: "Holding",
      independent_agency: "Indep"
    };
    
    const dealStructureMap = {
      tiered: "Tiered",
      flat_commit: "Flat"
    };
    
    const dealName = `${dealTypeMap[data.dealType]}_${salesChannelMap[data.salesChannel]}_${clientName}_${dealStructureMap[data.dealStructure]}_${startDateFormatted}-${endDateFormatted}`;
    
    // Include generated deal name, deal tiers data for tiered structure, and selected incentives
    const dealData = {
      ...data,
      dealName: dealName,
      // Only include dealTiers if the structure is tiered
      ...(dealStructureType === "tiered" ? { dealTiers } : {}),
      // Include selected incentives
      selectedIncentives,
      // Include tier-specific incentives
      tierIncentives
    };
    
    createDeal.mutate(dealData);
  }
  
  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex items-center mb-2">
          <h1 className="text-2xl font-bold text-slate-900">Deal Process</h1>
          <span className="ml-3 px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">Step 2 of 2</span>
        </div>
        <h2 className="text-xl font-medium text-slate-800 mb-1">Submit New Deal</h2>
        <p className="mt-1 text-sm text-slate-500">Complete the form below to submit a new commercial deal for approval</p>
      </div>
      
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
      <Card>
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
                    <div className="bg-slate-50 p-6 rounded-lg border border-slate-200 transition-all">
                    {/* Revenue section header with collapsible control */}
                    <div className="flex items-center justify-between mb-4">
                      <div 
                        className="flex items-center cursor-pointer" 
                        onClick={() => {
                          // Toggle collapse state using a new state variable
                          const revenueSection = document.getElementById('revenue-section');
                          const chevron = document.getElementById('revenue-chevron');
                          if (revenueSection?.classList.contains('h-0')) {
                            revenueSection.classList.remove('h-0', 'overflow-hidden', 'py-0');
                            revenueSection.classList.add('h-auto');
                            chevron?.classList.remove('transform', 'rotate-180');
                          } else {
                            revenueSection?.classList.add('h-0', 'overflow-hidden', 'py-0');
                            revenueSection?.classList.remove('h-auto');
                            chevron?.classList.add('transform', 'rotate-180');
                          }
                        }}
                      >
                        <h3 className="text-lg font-medium text-slate-900 bg-gradient-to-r from-purple-700 to-indigo-500 bg-clip-text text-transparent">Revenue Structure</h3>
                        <svg 
                          id="revenue-chevron"
                          xmlns="http://www.w3.org/2000/svg" 
                          width="20" 
                          height="20" 
                          viewBox="0 0 24 24" 
                          fill="none" 
                          stroke="currentColor" 
                          strokeWidth="2" 
                          strokeLinecap="round" 
                          strokeLinejoin="round" 
                          className="ml-2 text-slate-500 transition-transform"
                        >
                          <polyline points="6 9 12 15 18 9"></polyline>
                        </svg>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        type="button"
                        className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white border-0 hover:from-purple-700 hover:to-indigo-700"
                        onClick={() => {
                          // Add a new tier to the dealTiers state
                          if (dealTiers.length < 6) {
                            setDealTiers([
                              ...dealTiers,
                              {
                                tierNumber: dealTiers.length + 1,
                                annualRevenue: 0,
                                annualGrossMargin: 0,
                                annualGrossMarginPercent: 0,
                                incentivePercentage: 0,
                                incentiveNotes: "",
                                incentiveType: "rebate" as const,
                                incentiveThreshold: 0,
                                incentiveAmount: 0
                              }
                            ]);
                          } else {
                            toast({
                              title: "Maximum tiers reached",
                              description: "You can add a maximum of 6 revenue tiers",
                              variant: "destructive",
                            });
                          }
                        }}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add Tier
                      </Button>
                    </div>
                    
                    {/* Collapsible content section */}
                    <div id="revenue-section" className="transition-all h-auto">
                        
                        <div className="overflow-x-auto">
                          <table className="w-full border-collapse">
                            <thead>
                              <tr>
                                <th className="text-left p-3 bg-slate-100 border border-slate-200"></th>
                                <th className="text-center p-3 bg-slate-100 border border-slate-200 w-1/5">Last Year</th>
                                {dealTiers.map((tier) => (
                                  <th key={`th-${tier.tierNumber}`} className="text-center p-3 bg-slate-100 border border-slate-200 w-1/5">
                                    <div className="flex justify-between items-center">
                                      <span className="flex-1">Tier {tier.tierNumber} (Projected)</span>
                                      {tier.tierNumber > 1 && (
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          type="button"
                                          className="h-6 w-6"
                                          onClick={() => {
                                            const newTiers = dealTiers.filter((t) => t.tierNumber !== tier.tierNumber);
                                            // Renumber the tiers
                                            newTiers.forEach((t, i) => {
                                              t.tierNumber = i + 1;
                                            });
                                            setDealTiers(newTiers);
                                          }}
                                        >
                                          <Trash2 className="h-3 w-3 text-red-500" />
                                        </Button>
                                      )}
                                    </div>
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {/* Annual Revenue Row */}
                              <tr>
                                <td className="font-medium p-3 border border-slate-200 bg-slate-50">Annual Revenue</td>
                                <td className="p-3 border border-slate-200 text-center">
                                  {/* Base value column - simplified UI */}
                                  <div className="text-slate-700">
                                    {formatCurrency(850000)}
                                  </div>
                                </td>
                                {dealTiers.map((tier, index) => (
                                  <td key={`revenue-${tier.tierNumber}`} className="p-3 border border-slate-200">
                                    <div className="relative">
                                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <span className="text-slate-500 sm:text-sm">$</span>
                                      </div>
                                      <Input
                                        type="number"
                                        className="pl-7 w-full"
                                        placeholder="0.00"
                                        value={tier.annualRevenue}
                                        onChange={(e) => {
                                          const newTiers = [...dealTiers];
                                          newTiers[index].annualRevenue = parseFloat(e.target.value);
                                          setDealTiers(newTiers);
                                        }}
                                      />
                                    </div>
                                  </td>
                                ))}
                              </tr>
                              
                              {/* Annual Gross Margin (Base) Row */}
                              <tr>
                                <td className="font-medium p-3 border border-slate-200 bg-slate-50">Annual Gross Margin (Base)</td>
                                <td className="p-3 border border-slate-200 text-center">
                                  {/* Base value column - simplified UI */}
                                  <div className="text-slate-700">
                                    35%
                                  </div>
                                </td>
                                {dealTiers.map((tier, index) => (
                                  <td key={`margin-${tier.tierNumber}`} className="p-3 border border-slate-200">
                                    <div className="relative">
                                      <Input
                                        type="number"
                                        className="pr-8 w-full"
                                        placeholder="0.00"
                                        min="0"
                                        max="100"
                                        value={tier.annualGrossMarginPercent || 0}
                                        onChange={(e) => {
                                          const newTiers = [...dealTiers];
                                          newTiers[index].annualGrossMarginPercent = parseFloat(e.target.value);
                                          // Also update the gross margin value based on percentage and revenue
                                          const percent = parseFloat(e.target.value) / 100;
                                          newTiers[index].annualGrossMargin = newTiers[index].annualRevenue * percent;
                                          setDealTiers(newTiers);
                                        }}
                                      />
                                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                        <span className="text-slate-500 sm:text-sm">%</span>
                                      </div>
                                    </div>
                                  </td>
                                ))}
                              </tr>
                              
                              {/* Gross Profit (Base) Row */}
                              <tr>
                                <td className="font-medium p-3 border border-slate-200 bg-slate-50">Gross Profit (Base)</td>
                                <td className="p-3 border border-slate-200 text-center">
                                  {/* Base value column - calculated from mock values */}
                                  <div className="text-slate-700">
                                    {formatCurrency(850000 * 0.35)}
                                  </div>
                                </td>
                                {dealTiers.map((tier) => (
                                  <td key={`profit-${tier.tierNumber}`} className="p-3 border border-slate-200 text-center">
                                    {/* Not editable, calculated field */}
                                    <div className="text-slate-700">
                                      {formatCurrency(tier.annualRevenue * ((tier.annualGrossMarginPercent || 0) / 100))}
                                    </div>
                                  </td>
                                ))}
                              </tr>
                              
                              {/* Revenue Growth Rate Row */}
                              <tr>
                                <td className="font-medium p-3 border border-slate-200 bg-slate-50">Revenue Growth Rate</td>
                                <td className="p-3 border border-slate-200 text-center">
                                  {/* Base value column - not applicable */}
                                  <div className="text-slate-700">
                                    N/A
                                  </div>
                                </td>
                                {dealTiers.map((tier) => {
                                  // Find previous year revenue
                                  let previousYearRevenue = 850000; // Default to mock value
                                  const salesChannel = form.watch("salesChannel");
                                  const advertiserName = form.watch("advertiserName");
                                  const agencyName = form.watch("agencyName");
                                  
                                  if (salesChannel === "client_direct" && advertiserName) {
                                    const advertiser = advertisers.find(a => a.name === advertiserName);
                                    if (advertiser && advertiser.previousYearRevenue) {
                                      previousYearRevenue = advertiser.previousYearRevenue;
                                    }
                                  } else if ((salesChannel === "holding_company" || salesChannel === "independent_agency") && agencyName) {
                                    const agency = agencies.find(a => a.name === agencyName);
                                    if (agency && agency.previousYearRevenue) {
                                      previousYearRevenue = agency.previousYearRevenue;
                                    }
                                  }
                                  
                                  // Calculate growth rate
                                  let growthRate = 0;
                                  if (previousYearRevenue > 0) {
                                    growthRate = (tier.annualRevenue / previousYearRevenue) - 1;
                                  }
                                  
                                  return (
                                    <td key={`revenue-growth-${tier.tierNumber}`} className="p-3 border border-slate-200 text-center">
                                      {/* Not editable, calculated field */}
                                      <div className={cn(
                                        "text-slate-700",
                                        growthRate > 0 ? "text-green-600" : growthRate < 0 ? "text-red-600" : ""
                                      )}>
                                        {formatPercentage(growthRate)}
                                      </div>
                                    </td>
                                  );
                                })}
                              </tr>
                              
                              {/* Gross Profit Growth Rate Row */}
                              <tr>
                                <td className="font-medium p-3 border border-slate-200 bg-slate-50">Gross Profit Growth Rate</td>
                                <td className="p-3 border border-slate-200 text-center">
                                  {/* Base value column - not applicable */}
                                  <div className="text-slate-700">
                                    N/A
                                  </div>
                                </td>
                                {dealTiers.map((tier) => {
                                  // Find previous year revenue and margin
                                  let previousYearRevenue = 850000; // Default to mock value
                                  let previousYearMargin = 35; // Default to mock value
                                  const salesChannel = form.watch("salesChannel");
                                  const advertiserName = form.watch("advertiserName");
                                  const agencyName = form.watch("agencyName");
                                  
                                  if (salesChannel === "client_direct" && advertiserName) {
                                    const advertiser = advertisers.find(a => a.name === advertiserName);
                                    if (advertiser) {
                                      previousYearRevenue = advertiser.previousYearRevenue || previousYearRevenue;
                                      previousYearMargin = advertiser.previousYearMargin || previousYearMargin;
                                    }
                                  } else if ((salesChannel === "holding_company" || salesChannel === "independent_agency") && agencyName) {
                                    const agency = agencies.find(a => a.name === agencyName);
                                    if (agency) {
                                      previousYearRevenue = agency.previousYearRevenue || previousYearRevenue;
                                      previousYearMargin = agency.previousYearMargin || previousYearMargin;
                                    }
                                  }
                                  
                                  // Calculate previous year profit and current profit
                                  const previousYearProfit = previousYearRevenue * (previousYearMargin / 100);
                                  const currentProfit = tier.annualRevenue * ((tier.annualGrossMarginPercent || 0) / 100);
                                  
                                  // Calculate growth rate
                                  let profitGrowthRate = 0;
                                  if (previousYearProfit > 0) {
                                    profitGrowthRate = (currentProfit / previousYearProfit) - 1;
                                  }
                                  
                                  return (
                                    <td key={`profit-growth-${tier.tierNumber}`} className="p-3 border border-slate-200 text-center">
                                      {/* Not editable, calculated field */}
                                      <div className={cn(
                                        "text-slate-700",
                                        profitGrowthRate > 0 ? "text-green-600" : profitGrowthRate < 0 ? "text-red-600" : ""
                                      )}>
                                        {formatPercentage(profitGrowthRate)}
                                      </div>
                                    </td>
                                  );
                                })}
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      
                        <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded text-sm text-blue-800">
                          <Info className="h-4 w-4 inline mr-2" />
                          The tier structure represents revenue commitments and associated margin impact.
                          Each tier should have a progressive revenue target and corresponding margin impact.
                        </div>
                      </div>
                    </div> {/* Close revenue-section div */}
                    
                    {/* Incentives Section - Separate Box - Now at the same level as Revenue Structure */}
                    <div className="mt-8 bg-slate-50 p-6 rounded-lg border border-slate-200 transition-all">
                      {/* Incentives section header with collapsible control */}
                      <div className="flex items-center justify-between mb-4">
                        <div 
                          className="flex items-center cursor-pointer" 
                          onClick={() => {
                            // Toggle collapse state
                            const incentivesSection = document.getElementById('incentives-section');
                            const chevron = document.getElementById('incentives-chevron');
                            if (incentivesSection?.classList.contains('h-0')) {
                              incentivesSection.classList.remove('h-0', 'overflow-hidden', 'py-0');
                              incentivesSection.classList.add('h-auto');
                              chevron?.classList.remove('transform', 'rotate-180');
                            } else {
                              incentivesSection?.classList.add('h-0', 'overflow-hidden', 'py-0');
                              incentivesSection?.classList.remove('h-auto');
                              chevron?.classList.add('transform', 'rotate-180');
                            }
                          }}
                        >
                          <h3 className="text-lg font-medium text-slate-900 bg-gradient-to-r from-purple-700 to-indigo-500 bg-clip-text text-transparent">Incentive Structure</h3>
                          <svg 
                            id="incentives-chevron"
                            xmlns="http://www.w3.org/2000/svg" 
                            width="20" 
                            height="20" 
                            viewBox="0 0 24 24" 
                            fill="none" 
                            stroke="currentColor" 
                            strokeWidth="2" 
                            strokeLinecap="round" 
                            strokeLinejoin="round" 
                            className="ml-2 text-slate-500 transition-transform"
                          >
                            <polyline points="6 9 12 15 18 9"></polyline>
                          </svg>
                        </div>
                      </div>
                      
                      {/* Incentive Values section - using only IncentiveSelector component */}
                      <div id="incentives-section" className="transition-all h-auto">
                        {/* Hierarchical Incentive Selector */}
                        <div>
                          <IncentiveSelector 
                            selectedIncentives={selectedIncentives}
                            dealTiers={dealTiers}
                            onChange={handleIncentiveChange}
                          />
                        </div>
                      </div>
                    </div> {/* Close the main incentives section container div */}
                  
                  {/* This section is hidden - we use tiered view for all deal types */}
                  {false && dealStructureType === "flat_commit" && (
                    <div className="mt-8 bg-slate-50 p-6 rounded-lg border border-slate-200">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-medium text-slate-900">Flat Commitment Structure</h3>
                      </div>
                      
                      <div className="space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {/* Annual Revenue */}
                          <FormField
                            control={form.control}
                            name="annualRevenue"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Annual Revenue <span className="text-red-500">*</span></FormLabel>
                                <div className="relative">
                                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <span className="text-slate-500 sm:text-sm">$</span>
                                  </div>
                                  <FormControl>
                                    <Input 
                                      type="number" 
                                      placeholder="0.00" 
                                      className="pl-7" 
                                      min="0"
                                      {...field} 
                                      onChange={e => {
                                        const value = e.target.value ? parseFloat(e.target.value) : 0;
                                        field.onChange(value);
                                      }}
                                    />
                                  </FormControl>
                                </div>
                                <FormDescription>
                                  Total annual revenue expectation for this deal
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          {/* Annual Gross Margin Percentage */}
                          <FormField
                            control={form.control}
                            name="annualGrossMargin"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Annual Gross Margin (%) <span className="text-red-500">*</span></FormLabel>
                                <div className="relative">
                                  <FormControl>
                                    <Input 
                                      type="number" 
                                      placeholder="0" 
                                      className="pr-8"
                                      min="0"
                                      max="100" 
                                      {...field} 
                                      onChange={e => {
                                        const value = e.target.value ? parseFloat(e.target.value) : 0;
                                        field.onChange(value);
                                      }}
                                    />
                                  </FormControl>
                                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                    <span className="text-slate-500 sm:text-sm">%</span>
                                  </div>
                                </div>
                                <FormDescription>
                                  Expected gross margin percentage for this revenue
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        {/* Calculated Values */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-white rounded-lg border border-slate-200">
                          <div>
                            <h4 className="text-sm font-medium text-slate-700 mb-1">Total Revenue</h4>
                            <div className="text-xl font-semibold text-slate-900">
                              {formatCurrency(Number(watchTypedValue("annualRevenue")) || 0)}
                            </div>
                          </div>
                          <div>
                            <h4 className="text-sm font-medium text-slate-700 mb-1">Gross Margin</h4>
                            <div className="text-xl font-semibold text-slate-900">
                              {formatCurrency((Number(watchTypedValue("annualRevenue")) || 0) * (Number(watchTypedValue("annualGrossMargin")) || 0) / 100)}
                            </div>
                          </div>
                          <div>
                            <h4 className="text-sm font-medium text-slate-700 mb-1">Monthly Revenue</h4>
                            <div className="text-xl font-semibold text-slate-900">
                              {formatCurrency((Number(watchTypedValue("annualRevenue")) || 0) / (Number(watchTypedValue("contractTerm")) || 12))}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Incentive Value for Flat Commit - No header as requested */}
                      <div className="mt-6">
                        <div className="overflow-x-auto">
                          <table className="w-full border-collapse">
                            <thead>
                              <tr>
                                <th className="text-left p-3 bg-slate-100 border border-slate-200">Field</th>
                                <th className="text-center p-3 bg-slate-100 border border-slate-200">Last Year</th>
                                <th className="text-left p-3 bg-slate-100 border border-slate-200">Current</th>
                              </tr>
                            </thead>
                            <tbody>
                              {/* Incentive Type Row */}
                              <tr>
                                <td className="font-medium p-3 border border-slate-200 bg-slate-50">Incentive Type</td>
                                <td className="p-3 border border-slate-200 text-center">
                                  <div className="text-slate-700">Base</div>
                                </td>
                                <td className="p-3 border border-slate-200">
                                  <Select 
                                    defaultValue="rebate"
                                    onValueChange={(value) => {
                                      const newTier = {...dealTiers[0]};
                                      newTier.incentiveType = value as any;
                                      const newTiers = [newTier, ...dealTiers.slice(1)];
                                      setDealTiers(newTiers);
                                    }}
                                  >
                                    <SelectTrigger className="w-full">
                                      <SelectValue placeholder="Select type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="rebate">Rebate</SelectItem>
                                      <SelectItem value="discount">Discount</SelectItem>
                                      <SelectItem value="bonus">Bonus</SelectItem>
                                      <SelectItem value="other">Other</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </td>
                              </tr>
                              
                              {/* Incentive Percentage Row */}
                              <tr>
                                <td className="font-medium p-3 border border-slate-200 bg-slate-50">Incentive Percentage</td>
                                <td className="p-3 border border-slate-200 text-center">
                                  <div className="text-slate-700">0%</div>
                                </td>
                                <td className="p-3 border border-slate-200">
                                  <div className="relative">
                                    <Input
                                      type="number"
                                      className="pr-8 w-full"
                                      placeholder="0.00"
                                      min="0"
                                      max="100"
                                      value={dealTiers[0].incentivePercentage || 0}
                                      onChange={(e) => {
                                        const newTier = {...dealTiers[0]};
                                        newTier.incentivePercentage = parseFloat(e.target.value);
                                        
                                        // Calculate incentive amount based on percentage and total revenue
                                        const annualRevenue = Number(watchTypedValue("annualRevenue")) || 0;
                                        const percent = parseFloat(e.target.value) / 100;
                                        newTier.incentiveAmount = annualRevenue * percent;
                                        
                                        const newTiers = [newTier, ...dealTiers.slice(1)];
                                        setDealTiers(newTiers);
                                      }}
                                    />
                                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                      <span className="text-slate-500 sm:text-sm">%</span>
                                    </div>
                                  </div>
                                </td>
                              </tr>
                              
                              {/* Incentive Amount Row */}
                              <tr>
                                <td className="font-medium p-3 border border-slate-200 bg-slate-50">Incentive Amount</td>
                                <td className="p-3 border border-slate-200 text-center">
                                  <div className="text-slate-700">{formatCurrency(0)}</div>
                                </td>
                                <td className="p-3 border border-slate-200">
                                  <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                      <span className="text-slate-500 sm:text-sm">$</span>
                                    </div>
                                    <Input
                                      type="number"
                                      className="pl-7 w-full"
                                      placeholder="0.00"
                                      value={dealTiers[0].incentiveAmount || 0}
                                      onChange={(e) => {
                                        const newTier = {...dealTiers[0]};
                                        newTier.incentiveAmount = parseFloat(e.target.value);
                                        
                                        // Calculate percentage if revenue is not zero
                                        const annualRevenue = Number(watchTypedValue("annualRevenue")) || 0;
                                        if (annualRevenue > 0) {
                                          newTier.incentivePercentage = 
                                            (parseFloat(e.target.value) / annualRevenue) * 100;
                                        }
                                        
                                        const newTiers = [newTier, ...dealTiers.slice(1)];
                                        setDealTiers(newTiers);
                                      }}
                                    />
                                  </div>
                                </td>
                              </tr>
                              
                              {/* Incentive Notes Row */}
                              <tr>
                                <td className="font-medium p-3 border border-slate-200 bg-slate-50">Notes</td>
                                <td className="p-3 border border-slate-200 text-center">
                                  <div className="text-slate-700">N/A</div>
                                </td>
                                <td className="p-3 border border-slate-200">
                                  <Textarea
                                    placeholder="Enter any notes about this incentive..."
                                    value={dealTiers[0].incentiveNotes || ""}
                                    onChange={(e) => {
                                      const newTier = {...dealTiers[0]};
                                      newTier.incentiveNotes = e.target.value;
                                      const newTiers = [newTier, ...dealTiers.slice(1)];
                                      setDealTiers(newTiers);
                                    }}
                                    className="min-h-[80px]"
                                  />
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                        
                        <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded text-sm text-blue-800">
                          <Info className="h-4 w-4 inline mr-2" />
                          Flat commitment deals typically have a single incentive structure based on the total annual revenue.
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                </div> {/* This is the closing tag for the div that opened on line 869 */}
                
                {/* Financial Impact Summary Card */}
                <Card className="mt-6 mb-6 bg-gradient-to-br from-slate-50 to-white border-slate-200 shadow-sm">
                  <CardHeader>
                    <h3 className="text-lg font-semibold bg-gradient-to-r from-purple-700 to-indigo-500 bg-clip-text text-transparent">
                      Real-Time Financial Impact
                    </h3>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-slate-500">Total Annual Revenue</p>
                        <p className="text-xl font-bold text-slate-900">{formatCurrency(financialSummary.totalAnnualRevenue)}</p>
                      </div>
                      
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-slate-500">Total Gross Margin</p>
                        <p className="text-xl font-bold text-slate-900">{formatCurrency(financialSummary.totalGrossMargin)}</p>
                        <p className="text-xs text-slate-400">{formatPercentage(financialSummary.averageGrossMarginPercent)} margin</p>
                      </div>
                      
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-slate-500">Total Incentives</p>
                        <p className="text-xl font-bold text-slate-900">{formatCurrency(financialSummary.totalIncentiveValue)}</p>
                        <p className="text-xs text-slate-400">{formatPercentage(financialSummary.effectiveDiscountRate)} effective rate</p>
                      </div>
                      
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-slate-500">Monthly Value</p>
                        <p className="text-xl font-bold text-slate-900">{formatCurrency(financialSummary.monthlyValue)}</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mt-6">
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-slate-500">Year-over-Year Growth</p>
                        <p className={cn(
                          "text-xl font-bold",
                          financialSummary.yearOverYearGrowth > 0 ? "text-green-600" : "text-red-600"
                        )}>
                          {formatPercentage(financialSummary.yearOverYearGrowth)}
                        </p>
                        <p className="text-xs text-slate-400">vs. last year</p>
                      </div>
                      
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-slate-500">Projected Net Value</p>
                        <p className="text-xl font-bold text-slate-900">{formatCurrency(financialSummary.projectedNetValue)}</p>
                        <p className="text-xs text-slate-400">Full contract term</p>
                      </div>
                      
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-slate-500">Deal Term</p>
                        <p className="text-xl font-bold text-slate-900">{form.watch("contractTerm")} months</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <div className="mt-8 flex justify-between">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={prevStep}
                  >
                    Previous: Deal Details
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
                  <h2 className="text-lg font-medium text-slate-900">Review and Submit</h2>
                  <p className="mt-1 text-sm text-slate-500">Please review all information before submitting</p>
                </div>
                
                <div className="bg-slate-50 p-4 rounded-lg mb-6">
                  <div className="text-sm text-slate-500 italic">
                    By submitting this deal, you confirm that all information is accurate and complete. The deal will be reviewed by the appropriate team members based on your department and deal value.
                  </div>
                </div>
                
                {/* Non-standard terms checkbox - moved here from Client & Pricing tab */}
                <div className="mb-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="nonStandardTerms" 
                      checked={hasNonStandardTerms} 
                      onCheckedChange={(checked) => {
                        setHasNonStandardTerms(checked === true);
                      }}
                    />
                    <label
                      htmlFor="nonStandardTerms"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      This deal includes non-standard terms
                    </label>
                  </div>
                  <p className="mt-1 text-xs text-slate-500 ml-6">
                    Any modifications to standard contract language, special provisions, or custom pricing structures
                  </p>
                </div>
                
                {/* Standard Deal Criteria Help moved here from Step 2 */}
                <StandardDealCriteriaHelp />
                
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
                              const dealTypeMap = {
                                grow: "Grow",
                                protect: "Protect",
                                custom: "Custom"
                              };
                              
                              const salesChannelMap = {
                                client_direct: "Direct",
                                holding_company: "Holding",
                                independent_agency: "Indep"
                              };
                              
                              const dealStructureMap = {
                                tiered: "Tiered",
                                flat_commit: "Flat"
                              };
                              
                              // Format dates - ensure we're working with Date objects
                              const startDateObj = typeof termStartDate === 'string' ? new Date(termStartDate) : (termStartDate as Date);
                              const endDateObj = typeof termEndDate === 'string' ? new Date(termEndDate) : (termEndDate as Date);
                              
                              const startDateFormatted = format(startDateObj, 'yyyyMMdd');
                              const endDateFormatted = format(endDateObj, 'yyyyMMdd');
                              
                              // Safely access map values with type casting
                              const dealTypeKey = typeof dealType === 'string' ? dealType as keyof typeof dealTypeMap : 'grow';
                              const salesChannelKey = typeof salesChannel === 'string' ? salesChannel as keyof typeof salesChannelMap : 'client_direct';
                              const dealStructureKey = typeof dealStructure === 'string' ? dealStructure as keyof typeof dealStructureMap : 'flat_commit';
                              
                              return `${dealTypeMap[dealTypeKey]}_${salesChannelMap[salesChannelKey]}_${clientName}_${dealStructureMap[dealStructureKey]}_${startDateFormatted}-${endDateFormatted}`;
                            })()}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-slate-500">Deal Type</dt>
                          <dd className="mt-1 text-sm text-slate-900">
                            {getTypedValue("dealType") ? 
                              String(getTypedValue("dealType"))
                                .replace("_", " ")
                                .replace(/\b\w/g, (char) => char.toUpperCase()) : 
                              "Not provided"}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-slate-500">Expected Close Date</dt>
                          <dd className="mt-1 text-sm text-slate-900">
                            {getTypedValue("expectedCloseDate") ? 
                              new Date(getTypedValue("expectedCloseDate") as string).toLocaleDateString() : 
                              "Not provided"}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-slate-500">Department</dt>
                          <dd className="mt-1 text-sm text-slate-900">
                            {getTypedValue("department") ? 
                              String(getTypedValue("department"))
                                .replace("_", " ")
                                .replace(/\b\w/g, (char) => char.toUpperCase()) : 
                              "Not provided"}
                          </dd>
                        </div>
                        <div className="sm:col-span-2">
                          <dt className="text-sm font-medium text-slate-500">Deal Description</dt>
                          <dd className="mt-1 text-sm text-slate-900">
                            {getTypedValue("description") ? String(getTypedValue("description")) : "Not provided"}
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
                            {getTypedValue("clientName") ? String(getTypedValue("clientName")) : "Not provided"}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-slate-500">Client Type</dt>
                          <dd className="mt-1 text-sm text-slate-900">
                            {getTypedValue("clientType") 
                              ? String(getTypedValue("clientType"))
                                  .replace("_", " ")
                                  .replace(/\b\w/g, (char) => char.toUpperCase()) 
                              : "Not provided"}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-slate-500">Industry</dt>
                          <dd className="mt-1 text-sm text-slate-900">
                            {getTypedValue("industry") 
                              ? String(getTypedValue("industry"))
                                  .replace("_", " ")
                                  .replace(/\b\w/g, (char) => char.toUpperCase()) 
                              : "Not provided"}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-slate-500">Region</dt>
                          <dd className="mt-1 text-sm text-slate-900">
                            {getTypedValue("region") 
                              ? String(getTypedValue("region"))
                                  .replace("_", " ")
                                  .replace(/\b\w/g, (char) => char.toUpperCase()) 
                              : "Not provided"}
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
                            {getTypedValue("totalValue") ? 
                              formatCurrency(Number(getTypedValue("totalValue"))) : 
                              "Not provided"}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-slate-500">Contract Term</dt>
                          <dd className="mt-1 text-sm text-slate-900">
                            {getTypedValue("contractTerm") ? 
                              `${getTypedValue("contractTerm")} Months` : 
                              "Not provided"}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-slate-500">Payment Terms</dt>
                          <dd className="mt-1 text-sm text-slate-900">
                            {getTypedValue("paymentTerms") 
                              ? String(getTypedValue("paymentTerms"))
                                  .replace("_", " ")
                                  .replace(/\b\w/g, (char) => char.toUpperCase()) 
                              : "Not provided"}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-slate-500">Discount</dt>
                          <dd className="mt-1 text-sm text-slate-900">
                            {`${getTypedValue("discountPercentage") || 0}%`}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-slate-500">Cost Percentage</dt>
                          <dd className="mt-1 text-sm text-slate-900">
                            {`${getTypedValue("costPercentage") || 30}%`}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-slate-500">Incentive Percentage</dt>
                          <dd className="mt-1 text-sm text-slate-900">
                            {`${getTypedValue("incentivePercentage") || 0}%`}
                          </dd>
                        </div>
                        {/* Removed Previous Year Revenue and YOY Growth display - simplified UI */}
                        <div>
                          <dt className="text-sm font-medium text-slate-500">Annual Revenue Target</dt>
                          <dd className="mt-1 text-sm text-slate-900">
                            {getTypedValue("annualRevenue") 
                              ? formatCurrency(getTypedValue("annualRevenue") as number) 
                              : "$0"}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-slate-500">Profit Margin</dt>
                          <dd className="mt-1 text-sm font-semibold text-green-600">
                            {Math.round(calculateProfitMargin(
                              getTypedValue("totalValue") as number ?? 0,
                              getTypedValue("discountPercentage") as number ?? 0,
                              getTypedValue("costPercentage") as number ?? 30
                            ))}%
                          </dd>
                        </div>
                        <div className="sm:col-span-2">
                          <dt className="text-sm font-medium text-slate-500">Special Pricing Notes</dt>
                          <dd className="mt-1 text-sm text-slate-900">
                            {getTypedValue("pricingNotes") ? String(getTypedValue("pricingNotes")) : "None"}
                          </dd>
                        </div>
                      </dl>
                    </div>
                  </div>
                  
                  {/* Section removed as requested */}
                  {false && selectedIncentives.length > 0 && (
                    <div className="border border-slate-200 rounded-lg overflow-hidden mt-6">
                      <div className="px-4 py-3 bg-slate-50 border-b border-slate-200">
                        <h3 className="text-sm font-medium text-slate-700">Additional Incentives</h3>
                      </div>
                      <div className="p-4">
                        {/* Group incentives by tier */}
                        {dealTiers.map((tier) => {
                          const tierIncentives = selectedIncentives.filter(
                            incentive => incentive.tierIds.includes(tier.tierNumber)
                          );
                          
                          if (tierIncentives.length === 0) return null;
                          
                          return (
                            <div key={`tier-${tier.tierNumber}`} className="mb-4 last:mb-0">
                              <h4 className="text-sm font-medium text-slate-700 mb-2">
                                Tier {tier.tierNumber} Incentives
                              </h4>
                              <div className="space-y-2">
                                {tierIncentives.map((incentive, idx) => {
                                  // Find category and subcategory info
                                  const category = incentiveCategories.find((c: { id: string }) => c.id === incentive.categoryId);
                                  const subCategory = category?.subCategories.find((s: { id: string }) => s.id === incentive.subCategoryId);
                                  
                                  return (
                                    <div key={idx} className="flex justify-between items-center bg-slate-50 p-3 rounded-md">
                                      <div>
                                        <div className="text-sm font-medium">{incentive.option}</div>
                                        <div className="text-xs text-slate-500">
                                          {category?.name} &gt; {subCategory?.name}
                                        </div>
                                        {incentive.notes && (
                                          <div className="text-xs italic text-slate-500 mt-1">
                                            Note: {incentive.notes}
                                          </div>
                                        )}
                                      </div>
                                      <div className="text-sm font-medium">
                                        {formatCurrency(
                                          incentive.tierIds.length > 0 && 
                                          incentive.tierValues && 
                                          incentive.tierValues[tier.tierNumber] ? 
                                          incentive.tierValues[tier.tierNumber] : 0
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="mt-8 flex justify-between">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={prevStep}
                  >
                    Previous: Deal Structure & Pricing
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
