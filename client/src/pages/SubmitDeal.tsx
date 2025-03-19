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
import { Checkbox } from "@/components/ui/checkbox";
import { ApprovalAlert, ApprovalHelpText, StandardDealCriteriaHelp } from "@/components/ApprovalAlert";
import { ApprovalRule } from "@/lib/approval-matrix";
import { Plus, Trash2, Info } from "lucide-react";

// Extend the deal schema with additional validations
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

  // Financial data
  annualRevenue: z.coerce.number().positive("Annual revenue must be positive"),
  annualGrossMargin: z.coerce.number().min(0).max(100, "Annual gross margin must be between 0 and 100%"),
  previousYearRevenue: z.coerce.number().min(0, "Previous year revenue must be non-negative").default(0),
  previousYearMargin: z.coerce.number().min(0).max(100, "Previous year margin must be between 0 and 100%").default(0),
  
  // Standard deal criteria fields
  hasTradeAMImplications: z.boolean().default(false),
  yearlyRevenueGrowthRate: z.coerce.number().default(0),
  forecastedMargin: z.coerce.number().min(0).max(100, "Forecasted margin must be between 0 and 100%").default(0),
  yearlyMarginGrowthRate: z.coerce.number().default(0),
  addedValueBenefitsCost: z.coerce.number().min(0).default(0),
  analyticsTier: z.enum(["bronze", "silver", "gold", "platinum"]).default("silver"),
  requiresCustomMarketing: z.boolean().default(false),
  
  // Deal tiers (for tiered structure only)
  // We'll handle tiers as a separate form/state
  
  email: z.string().email().optional(),
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
  const [dealStructureType, setDealStructure] = useState<"tiered" | "flat_commit">("flat_commit");
  
  // Handle approval level changes
  const handleApprovalChange = (level: string, approvalInfo: ApprovalRule) => {
    setCurrentApprover(approvalInfo);
  };
  
  // State to track selected agencies and advertisers for dropdowns
  const [agencies, setAgencies] = useState([]);
  const [advertisers, setAdvertisers] = useState([]);
  
  // State for tiered deal structure
  const [dealTiers, setDealTiers] = useState([
    {
      tierNumber: 1,
      annualRevenue: 0,
      annualGrossMargin: 0,
      incentivePercentage: 0,
      incentiveNotes: "Base tier - no incentives"
    },
    {
      tierNumber: 2,
      annualRevenue: 0,
      annualGrossMargin: 0,
      incentivePercentage: 0,
      incentiveNotes: ""
    },
    {
      tierNumber: 3,
      annualRevenue: 0,
      annualGrossMargin: 0,
      incentivePercentage: 0,
      incentiveNotes: ""
    },
    {
      tierNumber: 4,
      annualRevenue: 0,
      annualGrossMargin: 0,
      incentivePercentage: 0,
      incentiveNotes: ""
    }
  ]);

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
      dealStructure: "flat_commit",
      
      // Timeframe
      termStartDate: new Date(),
      termEndDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
      
      // Financial data
      annualRevenue: 0,
      annualGrossMargin: 0,
      previousYearRevenue: 0,
      previousYearMargin: 0,
      
      // Standard deal criteria fields
      hasTradeAMImplications: false,
      yearlyRevenueGrowthRate: 0,
      forecastedMargin: 0,
      yearlyMarginGrowthRate: 0,
      addedValueBenefitsCost: 0,
      analyticsTier: "silver",
      requiresCustomMarketing: false,
      
      // Status
      status: "submitted",
      email: "",
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
  const salesChannel = form.watch("salesChannel");
  const dealStructure = form.watch("dealStructure");
  
  // Update dealStructureType when form value changes
  useEffect(() => {
    if (dealStructure) {
      setDealStructure(dealStructure as "tiered" | "flat_commit");
    }
  }, [dealStructure]);

  // Auto-populate historical data when selecting advertiser or agency
  useEffect(() => {
    const updateHistoricalData = async () => {
      const advertiserName = form.getValues("advertiserName");
      const agencyName = form.getValues("agencyName");
      
      if (salesChannel === "client_direct" && advertiserName) {
        const advertiser = advertisers.find(a => a.name === advertiserName);
        if (advertiser) {
          form.setValue("previousYearRevenue", advertiser.previousYearRevenue || 0);
          form.setValue("previousYearMargin", advertiser.previousYearMargin || 0);
          form.setValue("region", advertiser.region || "northeast");
        }
      } else if ((salesChannel === "holding_company" || salesChannel === "independent_agency") && agencyName) {
        const agency = agencies.find(a => a.name === agencyName);
        if (agency) {
          form.setValue("previousYearRevenue", agency.previousYearRevenue || 0);
          form.setValue("previousYearMargin", agency.previousYearMargin || 0);
          form.setValue("region", agency.region || "northeast");
        }
      }
    };
    
    updateHistoricalData();
  }, [form.watch("advertiserName"), form.watch("agencyName"), salesChannel, agencies, advertisers, form]);

  // Calculate growth rates automatically
  useEffect(() => {
    const annualRevenue = form.getValues("annualRevenue");
    const previousYearRevenue = form.getValues("previousYearRevenue");
    const annualGrossMargin = form.getValues("annualGrossMargin");
    const previousYearMargin = form.getValues("previousYearMargin");
    
    if (annualRevenue && previousYearRevenue && previousYearRevenue > 0) {
      const growthRate = ((annualRevenue - previousYearRevenue) / previousYearRevenue) * 100;
      form.setValue("yearlyRevenueGrowthRate", parseFloat(growthRate.toFixed(1)));
    }
    
    if (annualGrossMargin && previousYearMargin && previousYearMargin > 0) {
      const marginGrowthRate = ((annualGrossMargin - previousYearMargin) / previousYearMargin) * 100;
      form.setValue("yearlyMarginGrowthRate", parseFloat(marginGrowthRate.toFixed(1)));
    }
  }, [
    form.watch("annualRevenue"), 
    form.watch("previousYearRevenue"),
    form.watch("annualGrossMargin"),
    form.watch("previousYearMargin"),
    form
  ]);

  function nextStep() {
    // Validate current step fields
    if (formStep === 0) {
      form.trigger(['dealType', 'businessSummary', 'salesChannel', 'region']);
      const dealTypeError = form.getFieldState('dealType').error;
      const businessSummaryError = form.getFieldState('businessSummary').error;
      const salesChannelError = form.getFieldState('salesChannel').error;
      const regionError = form.getFieldState('region').error;
      
      // Check conditional field validation based on salesChannel
      let conditionalError = false;
      if (salesChannel === "client_direct") {
        form.trigger(['advertiserName']);
        conditionalError = !!form.getFieldState('advertiserName').error;
      } else if (salesChannel === "holding_company" || salesChannel === "independent_agency") {
        form.trigger(['agencyName']);
        conditionalError = !!form.getFieldState('agencyName').error;
      }
      
      if (dealTypeError || businessSummaryError || salesChannelError || regionError || conditionalError) {
        return;
      }
    } else if (formStep === 1) {
      form.trigger(['dealStructure', 'termStartDate', 'termEndDate', 'annualRevenue', 'annualGrossMargin']);
      const dealStructureError = form.getFieldState('dealStructure').error;
      const termStartDateError = form.getFieldState('termStartDate').error;
      const termEndDateError = form.getFieldState('termEndDate').error;
      const annualRevenueError = form.getFieldState('annualRevenue').error;
      const annualGrossMarginError = form.getFieldState('annualGrossMargin').error;
      
      if (dealStructureError || termStartDateError || termEndDateError || annualRevenueError || annualGrossMarginError) {
        return;
      }
    }
    
    setFormStep(prev => Math.min(prev + 1, 2));
  }
  
  function prevStep() {
    setFormStep(prev => Math.max(prev - 1, 0));
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
    
    // Include generated deal name and deal tiers data for tiered structure
    const dealData = {
      ...data,
      dealName: dealName,
      // Only include dealTiers if the structure is tiered
      ...(dealStructureType === "tiered" ? { dealTiers } : {})
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
                  <p className="mt-1 text-sm text-slate-500">Define the structure and financial terms of this deal</p>
                </div>
                
                <div className="space-y-6">
                  
                  {/* Fields for industry, region, and companySize were removed for form simplification */}
                  
                  <hr className="my-4" />
                  
                  <div className="mb-6">
                    <h3 className="text-lg font-medium text-slate-900">Pricing Information</h3>
                  </div>
                  
                  {/* Approval alert will display here based on deal parameters */}
                  {form.watch("totalValue") && form.watch("contractTerm") && (
                    <ApprovalAlert 
                      totalValue={form.watch("totalValue") || 0}
                      contractTerm={form.watch("contractTerm") || 0}
                      discountPercentage={form.watch("discountPercentage") || 0}
                      hasNonStandardTerms={hasNonStandardTerms}
                      dealType={form.watch("dealType") || "grow"}
                      salesChannel={form.watch("salesChannel") || "independent_agency"}
                      hasTradeAMImplications={form.watch("hasTradeAMImplications") || false}
                      yearlyRevenueGrowthRate={calculateYOYGrowth(
                        form.watch("totalValue") ?? 0,
                        form.watch("previousYearValue") ?? 0
                      )}
                      forecastedMargin={calculateProfitMargin(
                        form.watch("totalValue") ?? 0,
                        form.watch("discountPercentage") ?? 0,
                        form.watch("costPercentage") ?? 30
                      )}
                      yearlyMarginGrowthRate={form.watch("yearlyMarginGrowthRate") ?? 0}
                      addedValueBenefitsCost={form.watch("addedValueBenefitsCost") ?? 0}
                      analyticsTier={form.watch("analyticsTier") ?? "silver"}
                      requiresCustomMarketing={form.watch("requiresCustomMarketing") ?? false}
                      onChange={handleApprovalChange}
                    />
                  )}
                  
                  {/* Standard Deal Criteria Help Info moved to Review & Submit tab */}
                  
                  {/* Deal Structure Field - Moved from Deal Details tab */}
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
                            <SelectTrigger>
                              <SelectValue placeholder="Select deal structure" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="flat">Flat Commit</SelectItem>
                            <SelectItem value="tiered">Tiered Revenue</SelectItem>
                            <SelectItem value="hybrid">Hybrid Model</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          The revenue structure for this deal
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Tiered Deal Structure Section - Only shown when "tiered" is selected */}
                  {dealStructureType === "tiered" && (
                    <div className="mt-8 bg-slate-50 p-6 rounded-lg border border-slate-200">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-medium text-slate-900">Tiered Revenue Structure</h3>
                        <Button 
                          variant="outline" 
                          size="sm"
                          type="button"
                          onClick={() => {
                            // Add a new tier to the dealTiers state
                            if (dealTiers.length < 6) {
                              setDealTiers([
                                ...dealTiers,
                                {
                                  tierNumber: dealTiers.length + 1,
                                  annualRevenue: 0,
                                  annualGrossMargin: 0,
                                  incentivePercentage: 0,
                                  incentiveNotes: ""
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
                      
                      <div className="space-y-4">
                        <div className="grid grid-cols-12 gap-4 bg-slate-100 p-3 rounded font-medium text-sm text-slate-600">
                          <div className="col-span-1">Tier</div>
                          <div className="col-span-3">Annual Revenue</div>
                          <div className="col-span-3">Gross Margin</div>
                          <div className="col-span-2">Incentive %</div>
                          <div className="col-span-3">Incentive Details</div>
                        </div>
                        
                        {dealTiers.map((tier, index) => (
                          <div key={tier.tierNumber} className="grid grid-cols-12 gap-4 items-center bg-white p-3 rounded border border-slate-200">
                            <div className="col-span-1 font-medium">{tier.tierNumber}</div>
                            <div className="col-span-3">
                              <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                  <span className="text-slate-500 sm:text-sm">$</span>
                                </div>
                                <Input
                                  type="number"
                                  className="pl-7"
                                  placeholder="0.00"
                                  value={tier.annualRevenue}
                                  onChange={(e) => {
                                    const newTiers = [...dealTiers];
                                    newTiers[index].annualRevenue = parseFloat(e.target.value);
                                    setDealTiers(newTiers);
                                  }}
                                />
                              </div>
                            </div>
                            <div className="col-span-3">
                              <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                  <span className="text-slate-500 sm:text-sm">$</span>
                                </div>
                                <Input
                                  type="number"
                                  className="pl-7"
                                  placeholder="0.00"
                                  value={tier.annualGrossMargin}
                                  onChange={(e) => {
                                    const newTiers = [...dealTiers];
                                    newTiers[index].annualGrossMargin = parseFloat(e.target.value);
                                    setDealTiers(newTiers);
                                  }}
                                />
                              </div>
                            </div>
                            <div className="col-span-2">
                              <div className="relative">
                                <Input
                                  type="number"
                                  min="0"
                                  max="100"
                                  placeholder="0"
                                  value={tier.incentivePercentage}
                                  onChange={(e) => {
                                    const newTiers = [...dealTiers];
                                    newTiers[index].incentivePercentage = parseFloat(e.target.value);
                                    setDealTiers(newTiers);
                                  }}
                                />
                                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                  <span className="text-slate-500 sm:text-sm">%</span>
                                </div>
                              </div>
                            </div>
                            <div className="col-span-3 flex items-center gap-2">
                              <Input
                                placeholder="Incentive notes"
                                value={tier.incentiveNotes || ""}
                                onChange={(e) => {
                                  const newTiers = [...dealTiers];
                                  newTiers[index].incentiveNotes = e.target.value;
                                  setDealTiers(newTiers);
                                }}
                              />
                              {index > 0 && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  type="button"
                                  onClick={() => {
                                    const newTiers = dealTiers.filter((_, i) => i !== index);
                                    // Renumber the tiers
                                    newTiers.forEach((t, i) => {
                                      t.tierNumber = i + 1;
                                    });
                                    setDealTiers(newTiers);
                                  }}
                                >
                                  <Trash2 className="h-4 w-4 text-red-500" />
                                </Button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded text-sm text-blue-800">
                        <Info className="h-4 w-4 inline mr-2" />
                        The tier structure represents revenue commitments and associated incentives.
                        Each tier should have a progressive revenue target and corresponding margin impact.
                      </div>
                    </div>
                  )}
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
                              const dealType = form.getValues("dealType");
                              const salesChannel = form.getValues("salesChannel");
                              const termStartDate = form.getValues("termStartDate");
                              const termEndDate = form.getValues("termEndDate");
                              const dealStructure = form.getValues("dealStructure");
                              
                              if (!dealType || !salesChannel || !termStartDate || !termEndDate || !dealStructure) {
                                return "Will be auto-generated on submission";
                              }
                              
                              // Get client name
                              let clientName = "";
                              if (salesChannel === "client_direct" && form.getValues("advertiserName")) {
                                clientName = form.getValues("advertiserName");
                              } else if ((salesChannel === "holding_company" || salesChannel === "independent_agency") 
                                        && form.getValues("agencyName")) {
                                clientName = form.getValues("agencyName");
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
                            {form.getValues("clientType") 
                              ? String(form.getValues("clientType"))
                                  .replace("_", " ")
                                  .replace(/\b\w/g, char => char.toUpperCase()) 
                              : "Not provided"}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-slate-500">Industry</dt>
                          <dd className="mt-1 text-sm text-slate-900">
                            {form.getValues("industry") 
                              ? String(form.getValues("industry"))
                                  .replace("_", " ")
                                  .replace(/\b\w/g, char => char.toUpperCase()) 
                              : "Not provided"}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-slate-500">Region</dt>
                          <dd className="mt-1 text-sm text-slate-900">
                            {form.getValues("region") 
                              ? String(form.getValues("region"))
                                  .replace("_", " ")
                                  .replace(/\b\w/g, char => char.toUpperCase()) 
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
                            {form.getValues("paymentTerms") 
                              ? String(form.getValues("paymentTerms"))
                                  .replace("_", " ")
                                  .replace(/\b\w/g, char => char.toUpperCase()) 
                              : "Not provided"}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-slate-500">Discount</dt>
                          <dd className="mt-1 text-sm text-slate-900">
                            {`${form.getValues("discountPercentage") || 0}%`}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-slate-500">Cost Percentage</dt>
                          <dd className="mt-1 text-sm text-slate-900">
                            {`${form.getValues("costPercentage") || 30}%`}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-slate-500">Incentive Percentage</dt>
                          <dd className="mt-1 text-sm text-slate-900">
                            {`${form.getValues("incentivePercentage") || 0}%`}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-slate-500">Previous Year Revenue</dt>
                          <dd className="mt-1 text-sm text-slate-900">
                            {form.getValues("previousYearValue") 
                              ? formatCurrency(form.getValues("previousYearValue")) 
                              : "$0"}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-slate-500">YOY Growth</dt>
                          <dd className="mt-1 text-sm text-slate-900 font-semibold">
                            {Math.round(calculateYOYGrowth(
                              form.getValues("totalValue") ?? 0,
                              form.getValues("previousYearValue") ?? 0
                            ))}%
                          </dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-slate-500">Profit Margin</dt>
                          <dd className="mt-1 text-sm font-semibold text-green-600">
                            {Math.round(calculateProfitMargin(
                              form.getValues("totalValue") ?? 0,
                              form.getValues("discountPercentage") ?? 0,
                              form.getValues("costPercentage") ?? 30
                            ))}%
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
