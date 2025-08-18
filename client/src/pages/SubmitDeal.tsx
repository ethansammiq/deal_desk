import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
// Date formatting no longer needed - using ISO 8601 strings directly
import { Info } from "lucide-react";
import { FormSectionHeader, FormProgressTracker, FormHelpPopover, StyledFormField, FormStyles } from "@/components/ui/form-style-guide";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
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
  cn,
} from "@/lib/utils";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
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
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import {
  ApprovalAlert,
  ApprovalHelpText,
  StandardDealCriteriaHelp,
} from "@/components/ApprovalAlert";
import { ApprovalRule } from "@/lib/approval-matrix";
import { Plus, Trash2 } from "lucide-react";
import { StepByStepDraftManager } from "@/components/draft/StepByStepDraftManager";
import { DealOverviewStep } from "@/components/shared/DealOverviewStep";
import { IncentiveSelector } from "@/components/IncentiveSelector";
import { 
  processDealSubmissionData, 
  calculateContractTerm, 
  getRegionFromSelection, 
  createPreFillMapping
} from "@/utils/form-data-processing";
import { AdvertiserData, AgencyData } from "@shared/types";
// ✅ PHASE 3: All incentive UI state now managed locally within components
import { incentiveCategories } from "@/lib/incentive-data";

import { ApprovalMatrixDisplay } from "@/components/deal-form/ApprovalMatrixDisplay";
import { ClientInfoSection } from "@/components/shared/ClientInfoSection";
import { DealDetailsSection } from "@/components/deal-form/DealDetailsSection";

import { FinancialTierTable } from "@/components/deal-form/FinancialTierTable";
import { IncentiveStructureSection } from "@/components/deal-form/IncentiveStructureSection";
import { CostValueAnalysisSection } from "@/components/deal-form/CostValueAnalysisSection";
import { FinancialSummarySection } from "@/components/deal-form/FinancialSummarySection";
import { ReviewSubmitSection } from "@/components/deal-form/ReviewSubmitSection";
import { BusinessContextSection } from "@/components/deal-form/BusinessContextSection";
import { useDealCalculations } from "@/hooks/useDealCalculations";
import { DataMappingService } from "@/services/dataMappingService";
import { useAIAnalysis } from "@/hooks/useAIAnalysis";
import { AIAnalysisCard } from "@/components/ai/AIAnalysisCard";
import { useDealTiers, type DealTier } from "@/hooks/useDealTiers";
// ✅ PHASE 2: Removed useTierManagement - functionality absorbed into useDealTiers
import { useDealFormValidation, type DealFormData } from "@/hooks/useDealFormValidation";
import { FormErrorBoundary } from "@/components/ui/form-error-boundary";
import { FormLoading } from "@/components/ui/loading-states";
import { useClientData } from "@/hooks/useClientData";
import { useTabNavigation } from "@/hooks/useTabNavigation";
// Auto-save import removed as requested
import { DraftManager } from "@/components/draft/DraftManager";
import { FormPageHeader, FormNavigation } from "@/components/ui/form-style-guide";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { SUBMIT_DEAL_TABS, createTabToStepMap, getNextTabId, getPreviousTabId, getTabLabel } from "@/lib/tab-config";
// DealSummary removed - consolidated into DealSummaryCard

import { migrateLegacyTiers, toLegacyFormat } from "@/lib/tier-migration";
import { DEAL_CONSTANTS, INCENTIVE_CONSTANTS, FORM_CONSTANTS } from "@/config/businessConstants";

// Simplified deal schema with only essential fields
// Simplified schema - fields now handled by shared components
const dealFormSchema = z.object({
  // Business summary is in ReviewSubmitSection
  businessSummary: z.string().optional(),
  
  // Business Context fields (required for SubmitDeal)
  growthOpportunityMIQ: z.string().min(1, "Growth Opportunity (MIQ) is required"),
  growthOpportunityClient: z.string().min(1, "Growth Opportunity (Client) is required"),
  clientAsks: z.string().min(1, "Client Asks is required"),
  
  // Priority field (required for SubmitDeal only)
  priority: z.enum(["critical", "high", "medium", "low"], {
    required_error: "Priority is required for deal submission"
  }),
  
  // Optional fields that may come from shared components
  // Note: growthAmbition removed - only exists in scoping form
  contractTermMonths: z.number().optional(),
  
  // Essential financial data for calculations
  annualRevenue: z.coerce.number().positive("Annual revenue must be positive").optional(),
  annualGrossMarginPercent: z.coerce.number().min(0).max(100, "Annual gross margin must be between 0 and 100%").optional(),
  
  // System fields
  status: z.string().default("submitted"),
  referenceNumber: z.string().optional(),
}).passthrough(); // Allow any fields from shared components

type DealFormValues = any; // Allow any fields from shared components

export default function SubmitDeal() {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  
  // Check for pre-fill from scoping request or draft loading
  const urlParams = new URLSearchParams(window.location.search);
  const fromScopingId = urlParams.get('from-scoping');
  const draftId = urlParams.get('draft');
  const [isPreFilling, setIsPreFilling] = useState(!!fromScopingId || !!draftId);
  const [scopingDealData, setScopingDealData] = useState<any>(null);
  const [currentApprover, setCurrentApprover] = useState<ApprovalRule | null>(
    null,
  );
  const [dealStructureType, setDealStructure] = useState<
    "tiered" | "flat_commit" | ""
  >("");
  const [financialSummary, setFinancialSummary] =
    useState<DealFinancialSummary>({
      totalAnnualRevenue: 0,
      totalGrossMargin: 0,
      averageGrossMarginPercent: 0,
      totalIncentiveValue: 0,
      effectiveDiscountRate: 0,
      monthlyValue: 0,
      yearOverYearGrowth: 0,
      projectedNetValue: 0,
    });

  // ✅ Phase 2.3: Legacy helper functions removed - using form.watch() and form.getValues() directly

  // Handle approval level changes
  const handleApprovalChange = (level: string, approvalInfo: ApprovalRule) => {
    setCurrentApprover(approvalInfo);
  };

  // ❌ ELIMINATED: Incentive change handlers - DealTier manages its own data

  // ✅ PHASE 2: Using shared client data hook  
  const { agencies, advertisers, isLoading: isLoadingClientData, error: clientDataError } = useClientData();
  
  // Memoize arrays to prevent infinite loops in useEffect dependencies
  const stableAdvertisers = React.useMemo(() => advertisers, [advertisers.length]);
  const stableAgencies = React.useMemo(() => agencies, [agencies.length]);

  // Initialize calculation service with current advertiser/agency data
  const dealCalculations = useDealCalculations(advertisers, agencies);

  // ✅ MIGRATED: Using shared type definitions from form-data-processing utility

  // ✅ PHASE 2.3: Legacy interface removal target
  // This DealTier interface should be removed once all references are migrated to DealTier

  // ✅ NEW: Using tierManager hook instead of manual state
  // dealTiers replaced by tierManager.tiers

  // ✅ PHASE 3: Removed showAddIncentiveForm state - now managed internally by IncentiveStructureSection

  // Initialize the form
  const form = useForm<DealFormValues>({
    resolver: zodResolver(dealFormSchema),
    defaultValues: {
      // Basic deal information
      dealType: "grow",

      // Business information
      businessSummary: "",

      // Growth opportunity fields (partial move from RequestSupport)
      growthOpportunityMIQ: "",
      growthOpportunityClient: "",
      clientAsks: "",
      
      // Note: growthAmbition field removed - only exists in scoping form
      contractTermMonths: 12,

      // Client/Agency information
      salesChannel: undefined,
      region: undefined,
      advertiserName: "",
      agencyName: "",

      // Deal structure
      dealStructure: undefined,

      // Timeframe - ISO 8601 strings
      termStartDate: new Date().toISOString().split('T')[0],
      termEndDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],

      // Financial data (simplified)
      annualRevenue: 0,
      annualGrossMargin: 0,

      // Contact information
      email: "",
      
      // Priority (required for SubmitDeal)
      priority: "medium",

      // Status
      status: "submitted",
      referenceNumber: `DEAL-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000)}`,
    },
  });

  // AI Analysis Integration
  const aiAnalysis = useAIAnalysis();
  
  // ✅ PHASE 2: Enhanced tier management using consolidated useDealTiers hook
  const tierManager = useDealTiers({
    maxTiers: 5,
    minTiers: 1,
    supportFlatDeals: true,
    dealStructure: dealStructureType
  });
  
  // Direct access to tiers and operations (no more redundant wrapper)
  const dealTiers = tierManager.tiers;
  const setDealTiers = tierManager.setTiers;
  
  // ✅ OPTIMIZED: Tab-based validation mapping
  const tabToStepMap = createTabToStepMap(SUBMIT_DEAL_TABS);
  const formValidation = useDealFormValidation(form, {
    enableAutoAdvance: false,
    validateOnChange: true,
    formType: 'submitDeal' // ✅ SYNCHRONIZED: Use SubmitDeal form steps
  });

  // ✅ PHASE 3: Using shared tab navigation hook
  const {
    activeTab,
    setActiveTab,
    goToNextTab,
    goToPrevTab,
    goToTab,
    getNextTabLabel,
    getPreviousTabLabel,
    isLastTab
  } = useTabNavigation(
    SUBMIT_DEAL_TABS,
    SUBMIT_DEAL_TABS[0].id,
    (targetStep) => formValidation.canAdvanceToStep(targetStep)
  );

  // Auto-save functionality removed as requested by user

  // Load draft data when resuming from Priority Actions
  useEffect(() => {
    if (draftId) {
      handleLoadDraft(parseInt(draftId));
    } else if (!fromScopingId) {
      // Reset to clean form state for new submissions
      form.reset({
        // Basic deal information
        dealType: "grow",
        businessSummary: "",
        growthOpportunityMIQ: "",
        growthOpportunityClient: "",
        clientAsks: "",
        // growthAmbition field excluded - only in scoping form
        contractTermMonths: 12,
        salesChannel: undefined,
        region: undefined,
        advertiserName: "",
        agencyName: "",
        dealStructure: undefined,
        termStartDate: new Date().toISOString().split('T')[0],
        termEndDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        annualRevenue: 0,
        annualGrossMargin: 0,
        email: "",
        status: "submitted",
        referenceNumber: `DEAL-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000)}`,
      });
    }
  }, [fromScopingId, draftId]);

  // Draft management handlers
  const handleSaveDraft = async (draftName: string, description?: string) => {
    try {
      const formData = form.getValues();
      
      // Save to server as proper draft deal
      await apiRequest('/api/deals/drafts', {
        method: 'POST',
        body: JSON.stringify({
          name: draftName,
          description,
          formData
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      // Auto-save functionality removed

      toast({
        title: "Draft Saved",
        description: `"${draftName}" has been saved and will appear in the deals table.`,
        duration: 4000,
      });
    } catch (error) {
      console.error('Failed to save draft:', error);
      toast({
        title: "Save Failed",
        description: "Unable to save draft. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleLoadDraft = async (draftId: number) => {
    try {
      const response = await apiRequest(`/api/deals/${draftId}`);
      form.reset(response);
      
      // If the draft has a deal structure, update our state
      if (response.dealStructure) {
        setDealStructure(response.dealStructure);
      }

      // Load tier data if available
      if (response.dealTiers && Array.isArray(response.dealTiers)) {
        setDealTiers(response.dealTiers);
      } else {
        // Try to fetch tier data separately
        try {
          const tierData = await apiRequest(`/api/deals/${draftId}/tiers`);
          if (tierData && Array.isArray(tierData)) {
            setDealTiers(tierData);
          }
        } catch (tierError) {
          console.warn('No tier data found for draft, using empty array');
          setDealTiers([]); // Set empty array if no tier data
        }
      }
    } catch (error) {
      console.error('Error loading draft:', error);
    }
  };
  
  // ✅ MIGRATED: Use hook-managed form step instead of local state
  const formStep = formValidation.currentStep - 1; // Convert from 1-based to 0-based indexing
  
  // Fetch and pre-fill scoping deal data or draft data
  useEffect(() => {
    if (fromScopingId && !scopingDealData) {
      setIsPreFilling(true);
      
      fetch(`/api/deals/${fromScopingId}`)
        .then(response => response.json())
        .then(dealData => {
          setScopingDealData(dealData);
          
          // Pre-fill the form with scoping data
          form.reset({
            // Basic deal information - keep existing dealType or use from scoping
            dealType: dealData.dealType || "grow",
            dealName: dealData.dealName || "",

            // Business information
            businessSummary: dealData.businessSummary || "",

            // Growth opportunity fields from scoping
            growthOpportunityMIQ: dealData.growthOpportunityMIQ || "",
            growthOpportunityClient: dealData.growthOpportunityClient || "",
            clientAsks: dealData.clientAsks || "",
            
            // Optional RequestSupport fields
            growthAmbition: dealData.growthAmbition || 0,
            contractTermMonths: dealData.contractTermMonths || 12,

            // Client/Agency information
            salesChannel: dealData.salesChannel,
            region: dealData.region,
            advertiserName: dealData.advertiserName || "",
            agencyName: dealData.agencyName || "",

            // Deal structure
            dealStructure: dealData.dealStructure,

            // Timeframe from scoping
            termStartDate: dealData.termStartDate || new Date().toISOString().split('T')[0],
            termEndDate: dealData.termEndDate || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],

            // Financial data (if available from scoping)
            annualRevenue: dealData.annualRevenue || 0,
            annualGrossMargin: dealData.annualGrossMargin || 0,

            // Contact information
            email: dealData.email || "",

            // Status - change from scoping to submitted
            status: "submitted",
            referenceNumber: `DEAL-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000)}`,
          });
          
          // Set deal structure for tier management
          if (dealData.dealStructure) {
            setDealStructure(dealData.dealStructure);
          }
          
          setIsPreFilling(false);
          
          toast({
            title: "Scoping Data Loaded",
            description: "Form has been pre-filled with scoping request data. Please review and complete the remaining fields.",
          });
        })
        .catch(error => {
          console.error('Failed to fetch scoping deal data:', error);
          setIsPreFilling(false);
          toast({
            title: "Pre-fill Failed", 
            description: "Could not load scoping data. Please fill out the form manually.",
            variant: "destructive",
          });
        });
    } else if (draftId && !scopingDealData) {
      setIsPreFilling(true);
      
      fetch(`/api/deals/${draftId}`)
        .then(response => response.json())
        .then(draftData => {
          setScopingDealData(draftData);
          
          // Pre-fill the form with draft data - handle both stored form data and complete deal
          const formData = draftData.formData || draftData;
          form.reset(formData);
          
          // Set deal structure type if available
          if (formData.dealStructure) {
            setDealStructure(formData.dealStructure);
          }
          
          // Set form step if available
          if (draftData.currentStep) {
            formValidation.goToStep(draftData.currentStep);
          }
          
          setIsPreFilling(false);
          
          toast({
            title: "Draft Loaded",
            description: `Draft "${draftData.dealName}" has been loaded successfully.`,
          });
        })
        .catch(error => {
          console.error('Error fetching draft:', error);
          setIsPreFilling(false);
          toast({
            title: "Error",
            description: "Failed to load draft data",
            variant: "destructive",
          });
        });
    }
  }, [fromScopingId, draftId, scopingDealData]);
  
  // Removed complex tier manager - using simple state management
  
  // Trigger AI analysis when critical deal data changes
  React.useEffect(() => {
    const currentDealName = String(form.watch("dealName") || "");
    const currentSalesChannel = String(form.watch("salesChannel") || "");
    const currentRegion = String(form.watch("region") || "");
    
    if (formStep >= 2 && currentDealName && currentSalesChannel && currentRegion) {
      const dealData = {
        dealType: String(form.watch("dealType") || ""),
        salesChannel: currentSalesChannel,
        region: currentRegion,
        advertiserName: String(form.watch("advertiserName") || ""),
        agencyName: String(form.watch("agencyName") || ""),
        dealStructure: dealStructureType,
        annualRevenue: Number(form.watch("annualRevenue") || 0),
        contractTermMonths: String(form.watch("contractTermMonths") || ""),
        termStartDate: String(form.watch("termStartDate") || ""),
        termEndDate: String(form.watch("termEndDate") || ""),
        businessSummary: String(form.watch("businessSummary") || "")
      };
      
      if (dealData.annualRevenue > 0 && dealData.termStartDate && dealData.termEndDate) {
        aiAnalysis.triggerAnalysis(dealData);
      }
    }
  }, [formStep, dealStructureType]);

  // Financial calculation helper functions - now using extracted service

  // Helper functions that use the calculation service
  // ✅ PHASE 1 COMPLETE: Eliminated 8 pure wrapper functions (~50 lines)
  // Direct service calls replace all wrapper function usage
  
  // Helper to get advertiser/agency names for calculations
  const getClientNames = () => ({
    advertiserName: String(form.watch("advertiserName") || ""),
    agencyName: String(form.watch("agencyName") || ""),
    salesChannel: String(salesChannel || "")
  });

  // ✅ PHASE 5: Using DealTier incentives array for cost calculation
  const calculateTierIncentiveCost = (tierNumber: number): number => {
    const tier = dealTiers.find(t => t.tierNumber === tierNumber);
    if (!tier) return 0;
    return dealCalculations.calculateTierIncentiveCost(tier);
  };

  // ✅ PHASE 2: Replace duplicate logic with service calls
  const calculateTierGrossProfit = (tier: DealTier): number => {
    // Use DealTier directly with service
    const serviceTier: DealTier = {
      ...tier,
      incentives: tier.incentives || []
    };
    return dealCalculations.calculateTierGrossProfit(serviceTier);
  };

  // ✅ PHASE 2: Replace with service call  
  const calculateRevenueGrowthRate = (tier: DealTier): number => {
    const { advertiserName, agencyName, salesChannel: currentSalesChannel } = getClientNames();
    const serviceTier: DealTier = {
      ...tier,
      incentives: tier.incentives || []
    };
    return dealCalculations.calculateRevenueGrowthRate(serviceTier, currentSalesChannel, advertiserName, agencyName);
  };

  // Calculate gross margin growth rate using the service
  const calculateGrossMarginGrowthRate = (tier: DealTier): number => {
    const advertiserName = String(form.watch("advertiserName") || "");
    const agencyName = String(form.watch("agencyName") || "");
    
    // Convert DealTier to DealTier format expected by service
    const serviceTier: DealTier = {
      ...tier,
      incentives: tier.incentives || []
    };
    
    return dealCalculations.calculateGrossMarginGrowthRate(serviceTier, String(salesChannel || ""), advertiserName, agencyName);
  };

  // ✅ PHASE 3: Migrated to service - calculateGrossProfitGrowthRate
  const calculateGrossProfitGrowthRate = (tier: DealTier): number => {
    const { advertiserName, agencyName, salesChannel: currentSalesChannel } = getClientNames();
    const serviceTier: DealTier = {
      ...tier,
      incentives: tier.incentives || []
    };
    return dealCalculations.calculateGrossProfitGrowthRate(serviceTier, currentSalesChannel, advertiserName, agencyName);
  };

  // ✅ PHASE 3: Migrated to service - calculateAdjustedGrossProfitGrowthRate
  const calculateAdjustedGrossProfitGrowthRate = (tier: DealTier): number => {
    const { advertiserName, agencyName, salesChannel: currentSalesChannel } = getClientNames();
    const serviceTier: DealTier = {
      ...tier,
      incentives: tier.incentives || []
    };
    return dealCalculations.calculateAdjustedGrossProfitGrowthRate(serviceTier, currentSalesChannel, advertiserName, agencyName);
  };

  // ✅ PHASE 3: Migrated to service - calculateAdjustedGrossMargin  
  const calculateAdjustedGrossMargin = (tier: DealTier): number => {
    const serviceTier: DealTier = {
      ...tier,
      incentives: tier.incentives || []
    };
    return dealCalculations.calculateAdjustedGrossMargin(serviceTier);
  };

  // ✅ PHASE 3: Migrated to service - calculateAdjustedGrossMarginGrowthRate
  const calculateAdjustedGrossMarginGrowthRate = (tier: DealTier): number => {
    const { advertiserName, agencyName, salesChannel: currentSalesChannel } = getClientNames();
    const serviceTier: DealTier = {
      ...tier,
      incentives: tier.incentives || []
    };
    return dealCalculations.calculateAdjustedGrossMarginGrowthRate(serviceTier, currentSalesChannel, advertiserName, agencyName);
  };

  // ✅ PHASE 2: Replace with service call
  const calculateClientValue = (tier: DealTier): number => {
    const serviceTier: DealTier = {
      ...tier,
      incentives: tier.incentives || []
    };
    return dealCalculations.calculateClientValue(serviceTier);
  };

  // ✅ PHASE 3: Migrated to service - calculateClientValueGrowthRate
  const calculateClientValueGrowthRate = (tier: DealTier): number => {
    const { advertiserName, agencyName, salesChannel: currentSalesChannel } = getClientNames();
    const serviceTier: DealTier = {
      ...tier,
      incentives: tier.incentives || []
    };
    return dealCalculations.calculateClientValueGrowthRate(serviceTier, currentSalesChannel, advertiserName, agencyName);
  };

  // ✅ PHASE 3: Migrated to service - calculateCostGrowthRate
  const calculateCostGrowthRate = (tier: DealTier): number => {
    const { advertiserName, agencyName, salesChannel: currentSalesChannel } = getClientNames();
    const serviceTier: DealTier = {
      ...tier,
      incentives: tier.incentives || []
    };
    return dealCalculations.calculateCostGrowthRate(serviceTier, currentSalesChannel, advertiserName, agencyName);
  };

  // Watch for dealStructure changes to handle conditional fields
  
  // Mutation for submitting the deal
  const submitDealMutation = useMutation({
    mutationFn: async (data: DealFormValues) => {
      console.log("Sending data to API:", data);
      return apiRequest("/api/deals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
    },
    onSuccess: async (response) => {
      console.log("Deal submission successful!", response);
      
      // Initiate approval workflow for submitted deals
      if (response?.id && response?.annualRevenue) {
        try {
          const approvalResponse = await apiRequest(`/api/deals/${response.id}/initiate-approval`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              dealValue: response.annualRevenue,
              dealType: response.dealType,
              salesChannel: response.salesChannel
            }),
          });
          
          console.log("Approval workflow initiated:", approvalResponse);
          
          toast({
            title: "Success",
            description: "Deal submitted and approval workflow initiated!",
            variant: "default",
          });
        } catch (approvalError) {
          console.warn("Approval workflow initiation failed:", approvalError);
          toast({
            title: "Deal Submitted",
            description: "Deal submitted successfully, but approval workflow may need manual setup.",
            variant: "default",
          });
        }
      } else {
        toast({
          title: "Success",
          description: "Deal submitted successfully!",
          variant: "default",
        });
      }
      
      queryClient.invalidateQueries({ queryKey: ["/api/deals"] });
      navigate("/");
    },
    onError: (error: any) => {
      console.error("Deal submission error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to submit deal",
        variant: "destructive",
      });
    },
  });

  // Draft saving mutation with business rules
  const saveDraftMutation = useMutation({
    mutationFn: async ({ name, description, formData, step, draftId }: { 
      name: string; 
      description?: string; 
      formData: any;
      step: number;
      draftId?: number;
    }) => {
      // Business Rule: One draft per advertiser/agency per seller account
      const requestData = {
        name,
        description,
        formData,
        currentStep: step,
        advertiserName: formData.advertiserName,
        agencyName: formData.agencyName,
        salesChannel: formData.salesChannel,
        draftId: draftId // Pass draftId for updates
      };

      return apiRequest("/api/deals/drafts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestData),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/deals'] });
      queryClient.invalidateQueries({ queryKey: ['/api/deals/drafts'] });
      toast({
        title: "Draft Saved",
        description: "Your progress has been saved successfully.",
        variant: "default",
      });
    },
    onError: (error: any) => {
      console.error("Draft save error:", error);
      toast({
        title: "Save Failed",
        description: error.message || "Could not save draft. Please try again.",
        variant: "destructive",
      });
    }
  });

  // ✅ PHASE 2: Data fetching now handled by useClientData hook

  // Watch for salesChannel and dealStructure changes to handle conditional fields
  const salesChannel = form.watch("salesChannel");
  const dealStructureValue = form.watch("dealStructure");

  // Update dealStructureType when form value changes
  useEffect(() => {
    if (dealStructureValue) {
      setDealStructure(dealStructureValue as "tiered" | "flat_commit");
    }
  }, [dealStructureValue]);

  // ✅ REFACTORED: Auto-populate region using shared utility
  useEffect(() => {
    const advertiserName = form.getValues("advertiserName");
    const agencyName = form.getValues("agencyName");
    
    const region = getRegionFromSelection(
      salesChannel,
      advertiserName,
      agencyName,
      stableAdvertisers,
      stableAgencies
    );
    
    if (region) {
      const regionValue = region as "northeast" | "midwest" | "midatlantic" | "west" | "south";
      form.setValue("region", regionValue);
    }
  }, [salesChannel, stableAdvertisers, stableAgencies]);

  // Calculate real-time financial impact using dealTiers
  useEffect(() => {
    // Get fresh values from form without causing re-renders
    const getFormData = () => {
      const startDateStr = form.getValues("termStartDate") as string;
      const endDateStr = form.getValues("termEndDate") as string;
      const advertiserName = form.getValues("advertiserName") as string;
      const agencyName = form.getValues("agencyName") as string;
      return { startDateStr, endDateStr, advertiserName, agencyName };
    };
    
    const { startDateStr, endDateStr, advertiserName, agencyName } = getFormData();
    
    // Calculate contract term from ISO 8601 date strings
    let contractTerm = 12; // Default to 12 months
    if (startDateStr && endDateStr) {
      const startDate = new Date(startDateStr);
      const endDate = new Date(endDateStr);
      contractTerm = Math.max(1, (endDate.getFullYear() - startDate.getFullYear()) * 12 + (endDate.getMonth() - startDate.getMonth()));
    }

    // Find the previous year revenue for YoY calculations
    let previousYearRevenue = 0;

    if (salesChannel === "client_direct" && advertiserName) {
      const advertiser = advertisers.find((a) => a.name === advertiserName);
      if (advertiser && advertiser.previousYearRevenue) {
        previousYearRevenue = advertiser.previousYearRevenue;
      }
    } else if (
      (salesChannel === "holding_company" ||
        salesChannel === "independent_agency") &&
      agencyName
    ) {
      const agency = agencies.find((a) => a.name === agencyName);
      if (agency && agency.previousYearRevenue) {
        previousYearRevenue = agency.previousYearRevenue;
      }
    }

    // Calculate financial summary using dealTiers
    const summary = calculateDealFinancialSummary(
      dealTiers,
      contractTerm,
      previousYearRevenue,
    );

    // Update the financial summary state
    setFinancialSummary(summary);
  }, [dealTiers, salesChannel]);

  // ✅ PHASE 3: Tab navigation now handled by useTabNavigation hook

  function onSubmit(data: any) {
    console.log("Form submission triggered with data:", data);
    
    // Check for missing fields
    if (!data.dealType || !data.salesChannel || !data.region) {
      console.error("Missing required fields in form submission");
      toast({
        title: "Form Error",
        description: "Missing required basic information. Please check all required fields.",
        variant: "destructive",
      });
      return;
    }
    
    if (!data.termStartDate || !data.termEndDate) {
      console.error("Missing deal term dates");
      toast({
        title: "Form Error",
        description: "Please set both start and end dates for the deal.",
        variant: "destructive",
      });
      return;
    }
  
    // Format dates for deal name - using ISO strings  
    const startDateFormatted = data.termStartDate.replace(/-/g, '');
    const endDateFormatted = data.termEndDate.replace(/-/g, '');

    // Determine client/agency name
    let clientName = "";
    if (data.salesChannel === "client_direct" && data.advertiserName) {
      clientName = data.advertiserName;
    } else if (
      (data.salesChannel === "holding_company" ||
        data.salesChannel === "independent_agency") &&
      data.agencyName
    ) {
      clientName = data.agencyName;
    } else {
      console.error("No client/agency name found");
      toast({
        title: "Form Error",
        description: "Please select a client or agency based on your sales channel.",
        variant: "destructive",
      });
      return;
    }

    // Generate deal name format:
    // Deal Type_Sales Channel_Advertiser Name/Agency Name_Deal Structure_Deal Start Date-Deal End Date
    // ✅ MIGRATED: Using business constants instead of hardcoded maps

    // Generate deal name using the data mapping service
    const dealName = DataMappingService.generateDealName({
      dealType: data.dealType,
      salesChannel: data.salesChannel,
      dealStructure: data.dealStructure,
      advertiserName: data.advertiserName,
      agencyName: data.agencyName,
      termStartDate: data.termStartDate,
      termEndDate: data.termEndDate
    });

    // ✅ REFACTORED: Using shared data processing utility
    const dealData = processDealSubmissionData(
      data,
      dealName,
      dealStructureType,
      dealTiers,
      DEAL_CONSTANTS.DEFAULT_ANNUAL_REVENUE,
      DEAL_CONSTANTS.DEFAULT_GROSS_MARGIN
    );

    submitDealMutation.mutate(dealData);
  }

  return (
    <div className="min-h-screen bg-slate-50">
      
      <div className="bg-white rounded-lg shadow-sm border border-[#f0e6ff] p-4 sm:p-6">
      {/* Header with integrated Save Draft button - matching RequestSupport layout */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-2xl font-bold text-gray-900">Deal Submission</h1>
            <span className="text-sm font-medium text-purple-600 bg-purple-50 px-3 py-1 rounded-full">
              Step 2 of 2
            </span>
          </div>
          <p className="text-gray-600 text-base">
            {fromScopingId && isPreFilling 
              ? "Pre-filling form data from your scoping request..." 
              : fromScopingId 
              ? "Form pre-filled with data from your scoping request - Complete and submit below"
              : "Complete the form below to submit a new commercial deal for approval"
            }
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={async () => {
            const clientName = form.getValues().advertiserName || form.getValues().agencyName || "Draft";
            const autoName = `${clientName} - ${form.getValues().dealType || 'Deal'} Draft`;
            const currentTabIndex = SUBMIT_DEAL_TABS.findIndex(tab => tab.id === activeTab);
            await saveDraftMutation.mutateAsync({
              name: autoName,
              description: `Draft saved from ${getTabLabel(activeTab, SUBMIT_DEAL_TABS)}`,
              formData: {
                ...form.getValues(),
                dealTiers: dealTiers // Include tier data in formData
              },
              step: currentTabIndex >= 0 ? currentTabIndex : 0,
              draftId: draftId ? parseInt(draftId) : undefined // Pass draftId for updates
            });
          }}
          disabled={saveDraftMutation.isPending}
          className="flex items-center space-x-2 ml-4"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          <span>{saveDraftMutation.isPending ? "Saving..." : "Save Draft"}</span>
        </Button>
      </div>

      {/* Pre-fill loading indicator */}
      {fromScopingId && isPreFilling && (
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
              <span className="text-sm text-muted-foreground">
                Loading data from scoping request...
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ✅ OPTIMIZED: Tab-based form progress tracker */}
      <FormProgressTracker
        steps={SUBMIT_DEAL_TABS}
        currentStep={activeTab}
        onStepClick={(stepId) => goToTab(String(stepId))}
      />

      {/* ✅ OPTIMIZED: True tabs architecture with Card wrapper */}
      <Card className="border border-slate-200">
        <CardContent className="p-6">
          <FormErrorBoundary
            fallbackTitle="Deal Form Error"
            fallbackMessage="An error occurred while processing the deal form. Please try refreshing the page or contact support if the issue persists."
          >
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="w-full">
                <Tabs
                  value={activeTab}
                  onValueChange={goToTab}
                  className="w-full"
                >
                <TabsContent value="deal-overview" className="space-y-6 pt-4">
                  <DealOverviewStep
                    form={form}
                    agencies={agencies}
                    advertisers={advertisers}
                    salesChannel={String(salesChannel || "")}
                    dealStructureType={dealStructureType}
                    setDealStructure={setDealStructure}
                    nextStep={goToNextTab}
                    layout="tabs"
                    includeEmail={false}
                    showNavigation={true}
                    variant="submitDeal"
                  />
                </TabsContent>

                <TabsContent value="business-context" className="space-y-0">
                  <BusinessContextSection form={form as any} variant="submitDeal" />
                  
                  {/* Tab Navigation */}
                  <div className="flex justify-between items-center pt-4 border-t mt-6">
                    <Button type="button" variant="outline" onClick={goToPrevTab}>
                      Previous: Deal Overview
                    </Button>
                    <Button type="button" onClick={goToNextTab}>
                      Next: Financial Structure
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent value="financial-structure" className="space-y-6 pt-4">
                  <FormSectionHeader
                    title="Financial Structure"
                    description="Define the financial structure and value proposition for this deal"
                  />
                  <div className="space-y-6">
                    {/* Approval alert removed from Step 3 - now only shows in Step 4 (Review & Submit) */}

                    {/* Revenue & Profitability Section */}
                    <FinancialTierTable
                      dealTiers={dealTiers}
                      setDealTiers={setDealTiers}
                      lastYearRevenue={dealCalculations.getPreviousYearValue(salesChannel, form.watch("advertiserName"), form.watch("agencyName"))}
                      lastYearGrossMargin={dealCalculations.getPreviousYearMargin(salesChannel, form.watch("advertiserName"), form.watch("agencyName")) * 100}
                      isFlat={dealStructureType === "flat_commit"}
                      salesChannel={salesChannel}
                      advertiserName={form.watch("advertiserName")}
                      agencyName={form.watch("agencyName")}
                    />

                    {/* Incentive Structure Section */}
                    <IncentiveStructureSection
                      form={form}
                      dealStructureType={dealStructureType}
                      dealTiers={dealTiers}
                      setDealTiers={setDealTiers}
                      salesChannel={salesChannel}
                    />

                    {/* Cost & Value Analysis Section */}
                    <CostValueAnalysisSection
                      dealTiers={dealTiers}
                      salesChannel={salesChannel}
                      advertiserName={form.watch("advertiserName")}
                      agencyName={form.watch("agencyName")}
                    />

                    {/* Financial Summary Section */}
                    <FinancialSummarySection
                      dealTiers={dealTiers}
                      salesChannel={salesChannel}
                      advertiserName={form.watch("advertiserName")}
                      agencyName={form.watch("agencyName")}
                    />

                    {/* Navigation - Using shared FormNavigation component */}
                    <FormNavigation
                      variant="next"
                      onPrevious={goToPrevTab}
                      onNext={goToNextTab}
                      previousLabel="Previous: Business Context"
                      nextLabel="Next: Review & Submit"
                    />
                  </div>
                </TabsContent>

                <TabsContent value="review-submit" className="space-y-6 pt-4">
                  <ReviewSubmitSection
                    form={form}
                    dealStructureType={dealStructureType}
                    dealTiers={dealTiers}
                    selectedIncentives={[]} // Placeholder - incentives are embedded in dealTiers
                    tierIncentives={[]} // Placeholder - tier-specific incentives 
                    financialSummary={financialSummary}
                    currentApprover={currentApprover}
                    isSubmitting={submitDealMutation.isPending}
                    onSubmit={form.handleSubmit(onSubmit)}
                    onPrevStep={goToPrevTab}
                  />
                </TabsContent>
                </Tabs>
              </form>
            </Form>
          </FormErrorBoundary>
        </CardContent>
      </Card>
      </div>
    </div>
  );
}
