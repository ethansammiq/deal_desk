import { useState, useCallback, useMemo, useEffect } from 'react';
import { UseFormReturn } from 'react-hook-form';

// Define comprehensive form data interface based on SubmitDeal schema
export interface DealFormData {
  // Basic Deal Information
  dealType?: string;
  salesChannel?: string;
  advertiserName?: string;
  agencyName?: string;
  region?: string;
  termStartDate?: string;
  termEndDate?: string;
  
  // Deal Structure  
  dealStructure?: string;
  contractTermMonths?: number;
  
  // Financial Information
  annualRevenue?: number;
  annualGrossMargin?: number;
  
  // Business Context
  businessSummary?: string;
  growthAmbition?: string;
  growthOpportunityMIQ?: string;
  growthOpportunityClient?: string;
  clientAsks?: string;
  
  // System fields
  status?: string;
  referenceNumber?: string;
  
  // Allow additional fields
  [key: string]: any;
}

export interface FormStep {
  id: number;
  title: string;
  fields: (keyof DealFormData)[];
  isOptional?: boolean;
}

export interface StepValidationResult {
  isValid: boolean;
  errors: string[];
  missingFields: string[];
}

export interface UseDealFormValidationOptions {
  enableAutoAdvance?: boolean;
  validateOnChange?: boolean;
  formType?: 'submitDeal' | 'requestSupport'; // New: specify form type
}

// ✅ REDESIGNED: Logical form steps based on actual shared component usage
// SUBMIT DEAL FORM STEPS (4 steps max)
const SUBMIT_DEAL_STEPS: FormStep[] = [
  {
    id: 1,
    title: 'Deal Overview', // Step 0 in actual implementation
    fields: [
      'salesChannel',    // ClientInfoSection
      'advertiserName',  // ClientInfoSection (conditional)
      'agencyName',      // ClientInfoSection (conditional)
      'region',          // ClientInfoSection
      'dealType',        // DealDetailsSection
      'dealStructure',   // DealDetailsSection
      'contractTermMonths', // DealDetailsSection
      'termStartDate',   // DealDetailsSection
      'termEndDate'      // DealDetailsSection
    ]
  },
  {
    id: 2,
    title: 'Business Context', // Step 1 in actual implementation
    fields: [
      'growthOpportunityMIQ',  // BusinessContextSection - SubmitDeal only
      'growthOpportunityClient', // BusinessContextSection - SubmitDeal only
      'clientAsks'             // BusinessContextSection - SubmitDeal only
      // Note: growthAmbition field is NOT in SubmitDeal form, only in RequestSupport
    ]
  },
  {
    id: 3,
    title: 'Value Structure', // Step 2 in actual implementation
    fields: [
      'annualRevenue',      // Financial configuration
      'annualGrossMargin'   // Financial configuration
      // Tier configuration handled separately by useDealTiers hook
    ]
  },
  {
    id: 4,
    title: 'Review & Submit', // Step 3 in actual implementation
    fields: [
      'businessSummary'  // ReviewSubmitSection (auto-populated, editable)
    ],
    isOptional: true  // Business summary is optional
  }
];

// REQUEST SUPPORT FORM STEPS (3 steps max)
const REQUEST_SUPPORT_STEPS: FormStep[] = [
  {
    id: 1,
    title: 'Client Information', // Tab: sales-channel
    fields: [
      'salesChannel',    // ClientInfoSection
      'advertiserName',  // ClientInfoSection (conditional)
      'agencyName',      // ClientInfoSection (conditional)
      'region'           // ClientInfoSection
    ]
  },
  {
    id: 2,
    title: 'Deal Timeline', // Tab: deal-details
    fields: [
      'dealType',           // DealDetailsSection
      'dealStructure',      // DealDetailsSection
      'contractTermMonths', // DealDetailsSection
      'termStartDate',      // DealDetailsSection
      'termEndDate'         // DealDetailsSection
    ]
  },
  {
    id: 3,
    title: 'Growth Opportunity', // Tab: growth-opportunity
    fields: [
      'growthAmbition',         // BusinessContextSection
      'growthOpportunityMIQ',   // BusinessContextSection
      'growthOpportunityClient', // BusinessContextSection
      'clientAsks'              // BusinessContextSection
    ]
  }
];

export function useDealFormValidation(
  form: UseFormReturn<DealFormData>,
  options: UseDealFormValidationOptions = {}
) {
  const { enableAutoAdvance = false, validateOnChange = true, formType = 'submitDeal' } = options;
  
  // Select appropriate step configuration based on form type
  const formSteps = formType === 'requestSupport' ? REQUEST_SUPPORT_STEPS : SUBMIT_DEAL_STEPS;
  
  const [currentStep, setCurrentStep] = useState(1);
  const [visitedSteps, setVisitedSteps] = useState<Set<number>>(new Set([1]));
  const [stepValidationCache, setStepValidationCache] = useState<Map<number, StepValidationResult>>(new Map());

  // Watch specific values to avoid infinite re-renders  
  const salesChannel = form.watch('salesChannel');
  const dealStructure = form.watch('dealStructure');

  // Validate individual step
  const validateStep = useCallback((stepNumber: number): StepValidationResult => {
    const step = formSteps.find(s => s.id === stepNumber);
    if (!step) {
      return { isValid: false, errors: ['Invalid step'], missingFields: [] };
    }

    // Optional steps are always considered valid
    if (step.isOptional) {
      return { isValid: true, errors: [], missingFields: [] };
    }

    const errors: string[] = [];
    const missingFields: string[] = [];

    // Debug logging for step validation
    console.log(`🔍 Validating step ${stepNumber}:`, step.title);
    console.log(`📋 Required fields:`, step.fields);

    // Check required fields for this step
    for (const fieldName of step.fields) {
      // Handle conditional fields
      const fieldNameStr = String(fieldName);
      
      // Debug: log the field being checked
      const value = form.getValues(fieldNameStr);
      console.log(`🔍 Checking field '${fieldNameStr}':`, value);
      
      if (fieldNameStr === 'advertiserName') {
        if (salesChannel === 'client_direct') {
          if (!value || (typeof value === 'string' && value.trim() === '')) {
            missingFields.push(fieldNameStr);
            errors.push('Advertiser name is required for client direct deals');
          }
        }
        continue;
      }

      if (fieldNameStr === 'agencyName') {
        if (salesChannel === 'holding_company' || salesChannel === 'independent_agency') {
          if (!value || (typeof value === 'string' && value.trim() === '')) {
            missingFields.push(fieldNameStr);
            errors.push('Agency name is required for agency deals');
          }
        }
        continue;
      }

      // Regular field validation - value already retrieved above
      if (value === undefined || value === null || 
          (typeof value === 'string' && value.trim() === '') ||
          (typeof value === 'number' && isNaN(value))) {
        missingFields.push(fieldNameStr);
        
        // Generate human-readable error message
        const fieldLabel = fieldNameStr.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
        errors.push(`${fieldLabel} is required`);
      }
    }

    // Additional business logic validation
    if (stepNumber === 1) {
      // Date validation
      const startDate = form.getValues('termStartDate');
      const endDate = form.getValues('termEndDate');
      
      if (startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        
        if (end <= start) {
          errors.push('End date must be after start date');
        }
      }
    }

    if (stepNumber === 3) {
      // Revenue validation
      const revenue = form.getValues('annualRevenue');
      const margin = form.getValues('annualGrossMargin');
      
      if (revenue && revenue <= 0) {
        errors.push('Annual revenue must be greater than 0');
      }
      
      if (margin && (margin < 0 || margin > 100)) {
        errors.push('Gross margin must be between 0% and 100%');
      }
    }

    const isValid = errors.length === 0;
    return { isValid, errors, missingFields };
  }, [salesChannel, dealStructure, formSteps]);

  // Validate current step
  const currentStepValidation = useMemo(() => {
    return validateStep(currentStep);
  }, [validateStep, currentStep]);

  // Cache validation results
  useEffect(() => {
    if (validateOnChange) {
      setStepValidationCache(prev => {
        const newCache = new Map(prev);
        newCache.set(currentStep, currentStepValidation);
        return newCache;
      });
    }
  }, [currentStepValidation, currentStep, validateOnChange]);

  // Check if user can advance to next step
  const canAdvanceToStep = useCallback((targetStep: number): boolean => {
    if (targetStep <= currentStep) return true; // Can always go back
    if (targetStep > formSteps.length) return false; // Beyond max steps
    
    // Check all steps between current and target
    for (let step = currentStep; step < targetStep; step++) {
      const stepValidation = stepValidationCache.get(step) || validateStep(step);
      if (!stepValidation.isValid) {
        return false;
      }
    }
    
    return true;
  }, [currentStep, stepValidationCache, validateStep]);

  // Navigate to specific step
  const goToStep = useCallback((targetStep: number): boolean => {
    if (targetStep < 1 || targetStep > formSteps.length) {
      return false;
    }

    // For forward navigation, validate current step
    if (targetStep > currentStep && !currentStepValidation.isValid) {
      return false;
    }

    // For backward navigation or valid forward navigation
    setCurrentStep(targetStep);
    setVisitedSteps(prev => new Set([...Array.from(prev), targetStep]));
    
    return true;
  }, [currentStep, currentStepValidation.isValid, formSteps.length]);

  // Navigate to next step
  const goToNextStep = useCallback((): boolean => {
    const nextStep = currentStep + 1;
    return goToStep(nextStep);
  }, [currentStep, goToStep]);

  // Navigate to previous step
  const goToPreviousStep = useCallback((): boolean => {
    const prevStep = currentStep - 1;
    return goToStep(prevStep);
  }, [currentStep, goToStep]);

  // Auto-advance functionality
  useEffect(() => {
    if (enableAutoAdvance && currentStepValidation.isValid && currentStep < formSteps.length) {
      const timer = setTimeout(() => {
        goToNextStep();
      }, 1000); // 1 second delay

      return () => clearTimeout(timer);
    }
  }, [enableAutoAdvance, currentStepValidation.isValid, currentStep, goToNextStep, formSteps.length]);

  // Get overall form validation status
  const overallValidation = useMemo(() => {
    const allErrors: string[] = [];
    let isFormValid = true;
    const visitedArray = Array.from(visitedSteps);

    formSteps.forEach(step => {
      const validation = stepValidationCache.get(step.id) || validateStep(step.id);
      if (!validation.isValid && !step.isOptional) {
        isFormValid = false;
        allErrors.push(...validation.errors);
      }
    });

    return {
      isValid: isFormValid,
      errors: allErrors,
      completedSteps: visitedArray.filter(step => {
        const validation = stepValidationCache.get(step) || validateStep(step);
        return validation.isValid;
      }).length,
      totalSteps: formSteps.filter(step => !step.isOptional).length
    };
  }, [stepValidationCache, validateStep, visitedSteps, formSteps]);

  // Get step info
  const getStepInfo = useCallback((stepNumber: number) => {
    return formSteps.find(step => step.id === stepNumber);
  }, [formSteps]);

  // Reset form validation state
  const resetValidation = useCallback(() => {
    setCurrentStep(1);
    setVisitedSteps(new Set([1]));
    setStepValidationCache(new Map());
  }, []);

  return {
    // Current state
    currentStep,
    visitedSteps: Array.from(visitedSteps),
    currentStepValidation,
    
    // Navigation
    goToStep,
    goToNextStep,
    goToPreviousStep,
    canAdvanceToStep,
    
    // Validation
    validateStep,
    overallValidation,
    
    // Utilities
    getStepInfo,
    resetValidation,
    
    // Computed
    isFirstStep: currentStep === 1,
    isLastStep: currentStep === formSteps.length,
    canGoNext: currentStep < formSteps.length && currentStepValidation.isValid,
    canGoPrevious: currentStep > 1,
    progressPercentage: Math.round((overallValidation.completedSteps / overallValidation.totalSteps) * 100),
    
    // Constants
    totalSteps: formSteps.length,
    steps: formSteps
  };
}