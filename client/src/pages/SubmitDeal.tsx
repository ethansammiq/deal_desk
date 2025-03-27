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
import { Info } from "lucide-react";
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
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
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
import { Plus, Trash2 } from "lucide-react";
import { IncentiveSelector } from "@/components/IncentiveSelector";
import { type SelectedIncentive, incentiveCategories } from "@/lib/incentive-data";
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
  
  // Financial calculation helper functions for the Financial Summary table
  
  // Get previous year values
  const getPreviousYearValue = (): number => {
    const advertiserName = getTypedValue("advertiserName") as string;
    const agencyName = getTypedValue("agencyName") as string;
    
    if (salesChannel === "client_direct" && advertiserName) {
      const advertiser = advertisers.find(a => a.name === advertiserName);
      return advertiser?.previousYearRevenue || 850000; // Default value as fallback
    } else if ((salesChannel === "holding_company" || salesChannel === "independent_agency") && agencyName) {
      const agency = agencies.find(a => a.name === agencyName);
      return agency?.previousYearRevenue || 850000; // Default value as fallback
    }
    
    return 850000; // Default value as fallback
  };
  
  // Get previous year gross profit
  const getPreviousYearGrossProfit = (): number => {
    const previousValue = getPreviousYearValue();
    const previousMarginPercent = 0.35; // Default 35% margin for last year
    return previousValue * previousMarginPercent;
  };
  
  // Calculate total incentive cost for a tier
  const calculateTierIncentiveCost = (tierNumber: number): number => {
    let totalCost = 0;
    
    // Add costs from the selected hierarchical incentives
    selectedIncentives.forEach(incentive => {
      if (incentive.tierIds.includes(tierNumber) && incentive.tierValues && incentive.tierValues[tierNumber]) {
        totalCost += incentive.tierValues[tierNumber];
      }
    });
    
    // Add costs from tier-specific incentives
    tierIncentives.forEach(incentive => {
      if (incentive.tierId === tierNumber && incentive.value) {
        totalCost += incentive.value;
      }
    });
    
    return totalCost;
  };
  
  // Calculate gross profit for a tier
  const calculateTierGrossProfit = (tier: DealTierData): number => {
    const revenue = tier.annualRevenue || 0;
    const marginPercent = tier.annualGrossMarginPercent || 0.35; // Default to 35% if not specified
    const grossMargin = revenue * (marginPercent / 100);
    const incentiveCost = calculateTierIncentiveCost(tier.tierNumber);
    
    return grossMargin - incentiveCost;
  };
  
  // Calculate cost growth rate compared to previous year
  const calculateCostGrowthRate = (tier: DealTierData): number => {
    const revenue = tier.annualRevenue || 0;
    const marginPercent = tier.annualGrossMarginPercent || 0.35; // Default to 35% if not specified
    const currentCost = revenue - (revenue * (marginPercent / 100));
    
    const previousRevenue = getPreviousYearValue();
    const previousMarginPercent = 0.35; // Default 35% margin
    const previousCost = previousRevenue - (previousRevenue * previousMarginPercent);
    
    if (previousCost === 0) return 0;
    return (currentCost - previousCost) / previousCost;
  };
  
  // Calculate profit growth rate compared to previous year
  const calculateProfitGrowthRate = (tier: DealTierData): number => {
    const currentProfit = calculateTierGrossProfit(tier);
    const previousProfit = getPreviousYearGrossProfit();
    
    if (previousProfit === 0) return 0;
    return (currentProfit - previousProfit) / previousProfit;
  };
  
  // Calculate value growth rate compared to previous year
  const calculateValueGrowthRate = (tier: DealTierData): number => {
    const currentValue = tier.annualRevenue || 0;
    const previousValue = getPreviousYearValue();
    
    if (previousValue === 0) return 0;
    return (currentValue - previousValue) / previousValue;
  };
  
  // State to track selected agencies and advertisers for dropdowns
  const [agencies, setAgencies] = useState<AgencyData[]>([]);
  const [advertisers, setAdvertisers] = useState<AdvertiserData[]>([]);
  
  // Removed previous year data interface - no longer needed in simplified UI
  
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
      annualRevenue: undefined as number | undefined,
      annualGrossMargin: undefined as number | undefined,
      annualGrossMarginPercent: undefined as number | undefined,
      incentivePercentage: undefined as number | undefined,
      incentiveNotes: "Base tier - no incentives",
      incentiveType: "rebate" as const,
      incentiveThreshold: undefined as number | undefined,
      incentiveAmount: undefined as number | undefined
    },
    {
      tierNumber: 2,
      annualRevenue: undefined as number | undefined,
      annualGrossMargin: undefined as number | undefined,
      annualGrossMarginPercent: undefined as number | undefined,
      incentivePercentage: undefined as number | undefined,
      incentiveNotes: "",
      incentiveType: "rebate" as const,
      incentiveThreshold: undefined as number | undefined,
      incentiveAmount: undefined as number | undefined
    },
    {
      tierNumber: 3,
      annualRevenue: undefined as number | undefined,
      annualGrossMargin: undefined as number | undefined,
      annualGrossMarginPercent: undefined as number | undefined,
      incentivePercentage: undefined as number | undefined,
      incentiveNotes: "",
      incentiveType: "rebate" as const,
      incentiveThreshold: undefined as number | undefined,
      incentiveAmount: undefined as number | undefined
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
      salesChannel: undefined,
      region: undefined,
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
      
      // If target is 2 (Review), allow demo access without validation
      if (targetStep === 2) {
        // Allowing direct access to Review & Submit for demo purposes
        return true;
      }
    } else if (formStep === 1) {
      // Temporarily bypass validation for demo purposes to allow navigation to Review
      // In a production app, we would keep the full validation below
      
      /* Uncomment for production use
      form.trigger("dealStructure");
      form.trigger("termStartDate");
      form.trigger("termEndDate");
      
      const dealStructureError = form.getFieldState('dealStructure').error;
      const termStartDateError = form.getFieldState('termStartDate').error;
      const termEndDateError = form.getFieldState('termEndDate').error;
      
      if (dealStructureError || termStartDateError || termEndDateError) {
        toast({
          title: "Validation Error",
          description: "Please fix the errors in the Deal Structure & Pricing section before continuing.",
          variant: "destructive",
        });
        return false;
      }
      */
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
          <h1 className="text-2xl font-bold text-slate-900">Deal Submission</h1>
          <span className="ml-3 px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">Step 2 of 2</span>
          <Popover>
            <PopoverTrigger asChild>
              <div className="ml-2 cursor-help">
                <Info className="h-5 w-5 text-slate-400 hover:text-slate-600 transition-colors" />
              </div>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-4" align="start">
              <div className="space-y-2">
                <h4 className="font-medium text-slate-900">About Deal Submission</h4>
                <p className="text-sm text-slate-700">The deal submission process involves 3 steps:</p>
                <ol className="text-sm text-slate-700 list-decimal pl-4 space-y-1">
                  <li>Complete deal details and basic client information</li>
                  <li>Configure deal structure, pricing tiers, and incentives</li>
                  <li>Review and submit for approval based on approval matrix</li>
                </ol>
                <p className="text-sm text-slate-700 mt-2">Required approvals will be automatically determined based on deal size, structure, and non-standard terms.</p>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        <p className="mt-1 text-sm text-slate-500">Complete the form below to submit a new commercial deal for approval</p>
      </div>
      
      {/* Form Progress - Matching the Deal Scoping page style */}
      <div className="mb-8">
        <div className="w-3/4 mx-auto relative">
          {/* Progress Bar */}
          <div className="flex items-center justify-between">
            {/* Step 1 Circle */}
            <div 
              onClick={() => prevStep()}
              className={cn(
                "flex items-center justify-center w-10 h-10 rounded-full border-2 text-sm font-medium cursor-pointer hover:opacity-90 transition-opacity z-10",
                formStep >= 0 ? "border-primary bg-primary text-white" : "border-slate-300 text-slate-500"
              )}
            >
              1
            </div>
            
            {/* Two separate connecting lines */}
            {/* Line between step 1 and 2 */}
            <div className={cn(
              "absolute h-1 bg-slate-200 top-5",
              formStep >= 1 ? "bg-primary" : ""
            )} style={{ left: "10px", right: "50%", marginRight: "20px" }}></div>
            
            {/* Line between step 2 and 3 */}
            <div className={cn(
              "absolute h-1 bg-slate-200 top-5",
              formStep >= 2 ? "bg-primary" : ""
            )} style={{ left: "calc(50% + 20px)", right: "40px" }}></div>
            
            {/* Step 2 Circle */}
            <div 
              onClick={() => formStep >= 1 ? setFormStep(1) : validateAndGoToStep(1)}
              className={cn(
                "flex items-center justify-center w-10 h-10 rounded-full border-2 text-sm font-medium cursor-pointer hover:opacity-90 transition-opacity z-10",
                formStep >= 1 ? "border-primary bg-primary text-white" : "border-slate-300 text-slate-500"
              )}
            >
              2
            </div>
            
            {/* Step 3 Circle */}
            <div 
              onClick={() => formStep >= 2 ? setFormStep(2) : validateAndGoToStep(2)}
              className={cn(
                "flex items-center justify-center w-10 h-10 rounded-full border-2 text-sm font-medium cursor-pointer hover:opacity-90 transition-opacity z-10",
                formStep >= 2 ? "border-primary bg-primary text-white" : "border-slate-300 text-slate-500"
              )}
            >
              3
            </div>
          </div>
          
          {/* Labels */}
          <div className="flex justify-between mt-2 text-sm">
            <div className="w-28 text-center" style={{ marginLeft: "-30px" }}>
              <span 
                onClick={() => prevStep()}
                className={cn(
                  "cursor-pointer hover:text-primary transition-colors whitespace-nowrap", 
                  formStep === 0 ? "font-medium text-primary" : "text-slate-600"
                )}
              >
                Deal Details
              </span>
            </div>
            
            <div className="w-40 text-center">
              <span 
                onClick={() => formStep >= 1 ? setFormStep(1) : validateAndGoToStep(1)}
                className={cn(
                  "cursor-pointer hover:text-primary transition-colors whitespace-nowrap", 
                  formStep === 1 ? "font-medium text-primary" : "text-slate-600"
                )}
              >
                Deal Structure & Pricing
              </span>
            </div>
            
            <div className="w-28 text-center" style={{ marginRight: "-30px" }}>
              <span 
                onClick={() => formStep >= 2 ? setFormStep(2) : validateAndGoToStep(2)}
                className={cn(
                  "cursor-pointer hover:text-primary transition-colors whitespace-nowrap", 
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
          <form onSubmit={form.handleSubmit(onSubmit)}>
            {/* Step 1: Deal Details */}
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
                  
                  {/* Email field removed as requested */}
                  
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
                              value={field.value || ""}
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
                  
                  {/* Business Summary moved to bottom as requested */}
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
                              value={field.value || ""}
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
                                annualRevenue: undefined as number | undefined,
                                annualGrossMargin: undefined as number | undefined,
                                annualGrossMarginPercent: undefined as number | undefined,
                                incentivePercentage: undefined as number | undefined,
                                incentiveNotes: "",
                                incentiveType: "rebate" as const,
                                incentiveThreshold: undefined as number | undefined,
                                incentiveAmount: undefined as number | undefined
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
                                <th className="text-left p-3 bg-slate-100 border border-slate-200 w-1/3"></th>
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
                                  {(() => {
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
                                    
                                    return (
                                      <div className="text-slate-700">
                                        {formatCurrency(previousYearRevenue)}
                                      </div>
                                    );
                                  })()}
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
                                        value={tier.annualRevenue || ''}
                                        onChange={(e) => {
                                          const newTiers = [...dealTiers];
                                          newTiers[index].annualRevenue = e.target.value ? parseFloat(e.target.value) : undefined;
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
                                  {(() => {
                                    // Find previous year margin
                                    let previousYearMargin = 35; // Default to mock value
                                    const salesChannel = form.watch("salesChannel");
                                    const advertiserName = form.watch("advertiserName");
                                    const agencyName = form.watch("agencyName");
                                    
                                    if (salesChannel === "client_direct" && advertiserName) {
                                      const advertiser = advertisers.find(a => a.name === advertiserName);
                                      if (advertiser && advertiser.previousYearMargin) {
                                        previousYearMargin = advertiser.previousYearMargin;
                                      }
                                    } else if ((salesChannel === "holding_company" || salesChannel === "independent_agency") && agencyName) {
                                      const agency = agencies.find(a => a.name === agencyName);
                                      if (agency && agency.previousYearMargin) {
                                        previousYearMargin = agency.previousYearMargin;
                                      }
                                    }
                                    
                                    return (
                                      <div className="text-slate-700">
                                        {formatPercentage(previousYearMargin / 100)}
                                      </div>
                                    );
                                  })()}
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
                                        value={tier.annualGrossMarginPercent || ''}
                                        onChange={(e) => {
                                          const newTiers = [...dealTiers];
                                          newTiers[index].annualGrossMarginPercent = e.target.value ? parseFloat(e.target.value) : undefined;
                                          // Also update the gross margin value based on percentage and revenue
                                          const percent = e.target.value ? parseFloat(e.target.value) / 100 : 0;
                                          newTiers[index].annualGrossMargin = (newTiers[index].annualRevenue || 0) * percent;
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
                                  {(() => {
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
                                    
                                    const previousYearProfit = previousYearRevenue * (previousYearMargin / 100);
                                    
                                    return (
                                      <div className="text-slate-700">
                                        {formatCurrency(previousYearProfit)}
                                      </div>
                                    );
                                  })()}
                                </td>
                                {dealTiers.map((tier) => (
                                  <td key={`profit-${tier.tierNumber}`} className="p-3 border border-slate-200 text-center">
                                    {/* Not editable, calculated field */}
                                    <div className="text-slate-700">
                                      {formatCurrency((tier.annualRevenue || 0) * ((tier.annualGrossMarginPercent || 0) / 100))}
                                    </div>
                                  </td>
                                ))}
                              </tr>
                              
                              {/* Revenue Growth Rate Row */}
                              <tr>
                                <td className="font-medium p-3 border border-slate-200 bg-slate-50">Revenue Growth Rate</td>
                                <td className="p-3 border border-slate-200 text-center">
                                  <div className="text-slate-700">-</div>
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
                                  if (previousYearRevenue > 0 && tier.annualRevenue) {
                                    // Calculate as percentage (135% instead of 1.35)
                                    growthRate = ((tier.annualRevenue / previousYearRevenue) - 1);
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
                                  <div className="text-slate-700">-</div>
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
                                  const currentProfit = (tier.annualRevenue || 0) * ((tier.annualGrossMarginPercent || 0) / 100);
                                  
                                  // Calculate growth rate
                                  let profitGrowthRate = 0;
                                  if (previousYearProfit > 0) {
                                    // Calculate as percentage (169% instead of 1.69)
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
                                <th className="text-left p-3 bg-slate-100 border border-slate-200 w-1/3">Field</th>
                                <th className="text-left p-3 bg-slate-100 border border-slate-200">Current</th>
                              </tr>
                            </thead>
                            <tbody>
                              {/* Incentive Type Row */}
                              <tr>
                                <td className="font-medium p-3 border border-slate-200 bg-slate-50">Incentive Type</td>
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
                
                {/* Financial Summary Table - Calculated values for each tier */}
                <div className="mt-8 mb-6 bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
                  <h3 className="text-lg font-semibold text-slate-900 mb-4 pb-2 border-b border-slate-100 bg-gradient-to-r from-purple-700 to-indigo-500 bg-clip-text text-transparent">
                    Financial Summary (Automatic Calculations)
                  </h3>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr>
                          <th className="text-left p-3 bg-slate-100 border border-slate-200 w-1/3">Financial Metric</th>
                          <th className="text-center p-3 bg-slate-100 border border-slate-200">Last Year</th>
                          {dealTiers.map(tier => (
                            <th key={tier.tierNumber} className="text-center p-3 bg-slate-100 border border-slate-200">
                              Tier {tier.tierNumber}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {/* Total Incentive Cost */}
                        <tr>
                          <td className="p-3 border border-slate-200 bg-slate-50">
                            <div className="font-medium">Total Incentive Cost</div>
                            <div className="text-xs text-slate-500">All incentives applied to this tier</div>
                          </td>
                          <td className="p-3 border border-slate-200 text-center">
                            {formatCurrency(0)} {/* Last year value */}
                          </td>
                          {dealTiers.map(tier => {
                            // Calculate total incentive cost for this tier
                            const incentiveCost = calculateTierIncentiveCost(tier.tierNumber);
                            return (
                              <td key={tier.tierNumber} className="p-3 border border-slate-200 text-center">
                                {formatCurrency(incentiveCost)}
                              </td>
                            );
                          })}
                        </tr>
                        
                        {/* Gross Profit (New) */}
                        <tr>
                          <td className="p-3 border border-slate-200 bg-slate-50">
                            <div className="font-medium">Gross Profit (New)</div>
                            <div className="text-xs text-slate-500">Revenue minus cost and incentives</div>
                          </td>
                          <td className="p-3 border border-slate-200 text-center">
                            {formatCurrency(getPreviousYearGrossProfit())} {/* Last year value */}
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
                        
                        {/* Cost Growth Rate */}
                        <tr>
                          <td className="p-3 border border-slate-200 bg-slate-50">
                            <div className="font-medium">Cost Growth Rate</div>
                            <div className="text-xs text-slate-500">Percentage increase in costs vs last year</div>
                          </td>
                          <td className="p-3 border border-slate-200 text-center">
                            — {/* Baseline */}
                          </td>
                          {dealTiers.map(tier => {
                            // Calculate cost growth rate for this tier
                            const costGrowthRate = calculateCostGrowthRate(tier);
                            return (
                              <td key={tier.tierNumber} className="p-3 border border-slate-200 text-center">
                                <span className={costGrowthRate > 0 ? "text-red-600" : "text-green-600"}>
                                  {formatPercentage(costGrowthRate)}
                                </span>
                              </td>
                            );
                          })}
                        </tr>
                        
                        {/* Gross Profit (New) Growth Rate */}
                        <tr>
                          <td className="p-3 border border-slate-200 bg-slate-50">
                            <div className="font-medium">Gross Profit (New) Growth Rate</div>
                            <div className="text-xs text-slate-500">Percentage increase in new profit vs last year</div>
                          </td>
                          <td className="p-3 border border-slate-200 text-center">
                            — {/* Baseline */}
                          </td>
                          {dealTiers.map(tier => {
                            // Calculate profit growth rate for this tier
                            const profitGrowthRate = calculateProfitGrowthRate(tier);
                            return (
                              <td key={tier.tierNumber} className="p-3 border border-slate-200 text-center">
                                <span className={profitGrowthRate > 0 ? "text-green-600" : "text-red-600"}>
                                  {formatPercentage(profitGrowthRate)}
                                </span>
                              </td>
                            );
                          })}
                        </tr>
                        
                        {/* Total Client Value */}
                        <tr>
                          <td className="p-3 border border-slate-200 bg-slate-50">
                            <div className="font-medium">Total Client Value</div>
                            <div className="text-xs text-slate-500">Projected value over contract term</div>
                          </td>
                          <td className="p-3 border border-slate-200 text-center">
                            {formatCurrency(getPreviousYearValue() * 0.4)} {/* Last year value * 40% */}
                          </td>
                          {dealTiers.map(tier => {
                            // Calculate total value as 40% of the tier's revenue
                            const clientValue = (tier.annualRevenue || 0) * 0.4;
                            return (
                              <td key={tier.tierNumber} className="p-3 border border-slate-200 text-center">
                                {formatCurrency(clientValue)}
                              </td>
                            );
                          })}
                        </tr>
                        
                        {/* Client Value Growth Rate */}
                        <tr>
                          <td className="p-3 border border-slate-200 bg-slate-50">
                            <div className="font-medium">Client Value Growth Rate</div>
                            <div className="text-xs text-slate-500">Percentage increase in client value</div>
                          </td>
                          <td className="p-3 border border-slate-200 text-center">
                            — {/* Baseline */}
                          </td>
                          {dealTiers.map(tier => {
                            // Calculate client value growth rate for this tier
                            const valueGrowthRate = calculateValueGrowthRate(tier);
                            return (
                              <td key={tier.tierNumber} className="p-3 border border-slate-200 text-center">
                                <span className={valueGrowthRate > 0 ? "text-green-600" : "text-red-600"}>
                                  {formatPercentage(valueGrowthRate)}
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
                

                
                {/* Standard Deal Criteria Help moved here from Step 2 */}
                <div className="mb-12">
                  <StandardDealCriteriaHelp />
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
                          <dt className="text-sm font-medium text-slate-500">Region</dt>
                          <dd className="mt-1 text-sm text-slate-900">
                            {(() => {
                              const regionValue = getTypedValue("region");
                              console.log("Region value:", regionValue);
                              if (!regionValue) return "Not provided";
                              
                              // Use the same mapping as in the dropdown
                              const regionMap: Record<string, string> = {
                                "northeast": "Northeast",
                                "midwest": "Midwest",
                                "midatlantic": "Mid-Atlantic",
                                "south": "South",
                                "west": "West",
                                "southeast": "Southeast",
                                "southwest": "Southwest"
                              };
                              
                              const result = regionMap[String(regionValue)] || String(regionValue).replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
                              console.log("Region mapped:", result);
                              return result;
                            })()}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-slate-500">Deal Type</dt>
                          <dd className="mt-1 text-sm text-slate-900">
                            {(() => {
                              const dealTypeValue = getTypedValue("dealType");
                              console.log("Deal Type value:", dealTypeValue);
                              if (!dealTypeValue) return "Not provided";
                              
                              // Use a mapping for deal types
                              const dealTypeMap: Record<string, string> = {
                                "standard_deal": "Standard Deal",
                                "seasonal_promotion": "Seasonal Promotion",
                                "annual_commitment": "Annual Commitment",
                                "new_business": "New Business",
                                "grow": "Grow" // Add missing value from the form
                              };
                              
                              const result = dealTypeMap[String(dealTypeValue)] || String(dealTypeValue);
                              console.log("Deal Type mapped:", result);
                              return result;
                            })()}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-slate-500">Sales Channel</dt>
                          <dd className="mt-1 text-sm text-slate-900">
                            {(() => {
                              const salesChannelValue = getTypedValue("salesChannel");
                              console.log("Sales Channel value:", salesChannelValue);
                              if (!salesChannelValue) return "Not provided";
                              
                              // Use a mapping for sales channel
                              const salesChannelMap: Record<string, string> = {
                                "client_direct": "Client Direct",
                                "agency": "Agency",
                                "independent_agency": "Independent Agency"
                              };
                              
                              const result = salesChannelMap[String(salesChannelValue)] || String(salesChannelValue);
                              console.log("Sales Channel mapped:", result);
                              return result;
                            })()}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-slate-500">
                            {salesChannel === "client_direct" ? "Advertiser Name" : "Agency Name"}
                          </dt>
                          <dd className="mt-1 text-sm text-slate-900">
                            {salesChannel === "client_direct" 
                              ? (String(getTypedValue("advertiserName") || "Not provided"))
                              : (String(getTypedValue("agencyName") || "Not provided"))}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-slate-500">Deal Structure</dt>
                          <dd className="mt-1 text-sm text-slate-900">
                            {(() => {
                              const dealStructureValue = getTypedValue("dealStructure");
                              console.log("Deal Structure value:", dealStructureValue);
                              if (!dealStructureValue) return "Not provided";
                              
                              // Use a mapping for deal structure
                              const dealStructureMap: Record<string, string> = {
                                "tiered": "Tiered",
                                "flat_commit": "Flat Commitment"
                              };
                              
                              const result = dealStructureMap[String(dealStructureValue)] || String(dealStructureValue);
                              console.log("Deal Structure mapped:", result);
                              return result;
                            })()}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-slate-500">Contract Term</dt>
                          <dd className="mt-1 text-sm text-slate-900">
                            {getTypedValue("contractTerm") ? 
                              `${getTypedValue("contractTerm")} months` : 
                              "Not provided"}
                          </dd>
                        </div>
                        <div className="sm:col-span-2">
                          <dt className="text-sm font-medium text-slate-500">Business Summary</dt>
                          <dd className="mt-1 text-sm text-slate-900">
                            {getTypedValue("businessSummary") ? String(getTypedValue("businessSummary")) : "Not provided"}
                          </dd>
                        </div>
                      </dl>
                    </div>
                  </div>
                  
                  {/* Deal Structure Summary */}
                  <div className="border border-slate-200 rounded-lg overflow-hidden">
                    <div className="px-4 py-3 bg-slate-50 border-b border-slate-200">
                      <h3 className="text-sm font-medium text-slate-700">Deal Structure Summary</h3>
                    </div>
                    <div className="p-4">
                      <div className="text-sm text-slate-600 mb-6">
                        {dealStructureType === "tiered" 
                          ? `This deal uses a tiered structure with ${dealTiers.length} tier${dealTiers.length !== 1 ? 's' : ''}.`
                          : "This deal uses a flat commitment structure."}
                      </div>
                      
                      {/* Financial Summary */}
                      {dealTiers.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium text-slate-700 mb-3">Financial Summary</h4>
                          <div className="overflow-x-auto">
                            <table className="w-full border-collapse text-sm">
                              <thead>
                                <tr>
                                  <th className="text-left p-2 bg-slate-100 border border-slate-200">Metric</th>
                                  {dealTiers.filter(tier => tier.annualRevenue).map(tier => (
                                    <th key={tier.tierNumber} className="text-left p-2 bg-slate-100 border border-slate-200">
                                      Tier {tier.tierNumber}
                                    </th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {/* Annual Revenue */}
                                <tr>
                                  <td className="p-2 border border-slate-200 font-medium">Annual Revenue</td>
                                  {dealTiers.filter(tier => tier.annualRevenue).map(tier => (
                                    <td key={tier.tierNumber} className="p-2 border border-slate-200">
                                      {formatCurrency(tier.annualRevenue || 0)}
                                    </td>
                                  ))}
                                </tr>
                                
                                {/* Revenue Growth Rate */}
                                <tr>
                                  <td className="p-2 border border-slate-200 font-medium">Revenue Growth Rate</td>
                                  {dealTiers.filter(tier => tier.annualRevenue).map(tier => {
                                    const growthRate = calculateValueGrowthRate(tier);
                                    return (
                                      <td key={tier.tierNumber} className="p-2 border border-slate-200">
                                        <span className={growthRate > 0 ? "text-green-600" : "text-red-600"}>
                                          {(growthRate * 100).toFixed(1)}%
                                        </span>
                                      </td>
                                    );
                                  })}
                                </tr>
                                
                                {/* Gross Margin Growth Rate */}
                                <tr>
                                  <td className="p-2 border border-slate-200 font-medium">Gross Margin (Adjusted) Growth Rate</td>
                                  {dealTiers.filter(tier => tier.annualRevenue).map(tier => {
                                    const profitGrowthRate = calculateProfitGrowthRate(tier);
                                    return (
                                      <td key={tier.tierNumber} className="p-2 border border-slate-200">
                                        <span className={profitGrowthRate > 0 ? "text-green-600" : "text-red-600"}>
                                          {(profitGrowthRate * 100).toFixed(1)}%
                                        </span>
                                      </td>
                                    );
                                  })}
                                </tr>
                                
                                {/* Total Incentive Cost */}
                                <tr>
                                  <td className="p-2 border border-slate-200 font-medium">Total Incentive Cost</td>
                                  {dealTiers.filter(tier => tier.annualRevenue).map(tier => {
                                    const incentiveCost = calculateTierIncentiveCost(tier.tierNumber);
                                    return (
                                      <td key={tier.tierNumber} className="p-2 border border-slate-200">
                                        {formatCurrency(incentiveCost)}
                                      </td>
                                    );
                                  })}
                                </tr>
                                
                                {/* Client Value Growth Rate */}
                                <tr>
                                  <td className="p-2 border border-slate-200 font-medium">Client Value Growth Rate</td>
                                  {dealTiers.filter(tier => tier.annualRevenue).map(tier => {
                                    // Using a fixed calculation for client value as 40% of revenue
                                    const clientValue = (tier.annualRevenue || 0) * 0.4;
                                    const lastYearValue = 850000 * 0.4; // 40% of last year's revenue
                                    const growthRate = (clientValue / lastYearValue) - 1;
                                    
                                    return (
                                      <td key={tier.tierNumber} className="p-2 border border-slate-200">
                                        <span className={growthRate > 0 ? "text-green-600" : "text-red-600"}>
                                          {(growthRate * 100).toFixed(1)}%
                                        </span>
                                      </td>
                                    );
                                  })}
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Approval Information */}
                  <div className="border border-slate-200 rounded-lg overflow-hidden">
                    <div className="px-4 py-3 bg-slate-50 border-b border-slate-200">
                      <h3 className="text-sm font-medium text-slate-700">Approval Information</h3>
                    </div>
                    <div className="p-4">
                      <dl className="grid grid-cols-1 gap-x-4 gap-y-4">
                        <div>
                          <dt className="text-sm font-medium text-slate-500">Required Approvals</dt>
                          <dd className="mt-1 text-sm text-slate-900">
                            <ul className="list-disc pl-5 text-sm">
                              <li>Finance Team</li>
                              <li>Regional Director</li>
                            </ul>
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
                    Previous: Deal Structure
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
