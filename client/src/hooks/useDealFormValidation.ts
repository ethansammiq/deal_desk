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
}

// Define form steps with their required fields
const FORM_STEPS: FormStep[] = [
  {
    id: 1,
    title: 'Basic Deal Information',
    fields: [
      'dealType',
      'salesChannel', 
      'advertiserName', // conditional on salesChannel
      'agencyName', // conditional on salesChannel
      'region',
      'termStartDate',
      'termEndDate'
    ]
  },
  {
    id: 2,
    title: 'Deal Details & Structure',
    fields: [
      'dealStructure',
      'contractTermMonths'
    ]
  },
  {
    id: 3,
    title: 'Value Structure',
    fields: [
      'annualRevenue',
      'annualGrossMargin'
    ]
  },
  {
    id: 4,
    title: 'Business Context',
    fields: [
      'businessSummary',
      'growthAmbition',
      'growthOpportunityMIQ',
      'growthOpportunityClient',
      'clientAsks'
    ],
    isOptional: true
  },
  {
    id: 5,
    title: 'Review & Submit',
    fields: [], // No additional fields, just review
    isOptional: true
  }
];

export function useDealFormValidation(
  form: UseFormReturn<DealFormData>,
  options: UseDealFormValidationOptions = {}
) {
  const { enableAutoAdvance = false, validateOnChange = true } = options;
  const [currentStep, setCurrentStep] = useState(1);
  const [visitedSteps, setVisitedSteps] = useState<Set<number>>(new Set([1]));
  const [stepValidationCache, setStepValidationCache] = useState<Map<number, StepValidationResult>>(new Map());

  // Watch form values for validation
  const formValues = form.watch();
  const salesChannel = form.watch('salesChannel');
  const dealStructure = form.watch('dealStructure');

  // Validate individual step
  const validateStep = useCallback((stepNumber: number): StepValidationResult => {
    const step = FORM_STEPS.find(s => s.id === stepNumber);
    if (!step) {
      return { isValid: false, errors: ['Invalid step'], missingFields: [] };
    }

    // Optional steps are always considered valid
    if (step.isOptional) {
      return { isValid: true, errors: [], missingFields: [] };
    }

    const errors: string[] = [];
    const missingFields: string[] = [];

    // Check required fields for this step
    for (const fieldName of step.fields) {
      // Handle conditional fields
      const fieldNameStr = String(fieldName);
      
      if (fieldNameStr === 'advertiserName') {
        if (salesChannel === 'client_direct') {
          const value = formValues[fieldName];
          if (!value || (typeof value === 'string' && value.trim() === '')) {
            missingFields.push(fieldNameStr);
            errors.push('Advertiser name is required for client direct deals');
          }
        }
        continue;
      }

      if (fieldNameStr === 'agencyName') {
        if (salesChannel === 'holding_company' || salesChannel === 'independent_agency') {
          const value = formValues[fieldName];
          if (!value || (typeof value === 'string' && value.trim() === '')) {
            missingFields.push(fieldNameStr);
            errors.push('Agency name is required for agency deals');
          }
        }
        continue;
      }

      // Regular field validation
      const value = formValues[fieldName];
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
      const startDate = formValues.termStartDate;
      const endDate = formValues.termEndDate;
      
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
      const revenue = formValues.annualRevenue;
      const margin = formValues.annualGrossMargin;
      
      if (revenue && revenue <= 0) {
        errors.push('Annual revenue must be greater than 0');
      }
      
      if (margin && (margin < 0 || margin > 100)) {
        errors.push('Gross margin must be between 0% and 100%');
      }
    }

    const isValid = errors.length === 0;
    return { isValid, errors, missingFields };
  }, [formValues, salesChannel, dealStructure]);

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
    if (targetStep > FORM_STEPS.length) return false; // Beyond max steps
    
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
    if (targetStep < 1 || targetStep > FORM_STEPS.length) {
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
  }, [currentStep, currentStepValidation.isValid]);

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
    if (enableAutoAdvance && currentStepValidation.isValid && currentStep < FORM_STEPS.length) {
      const timer = setTimeout(() => {
        goToNextStep();
      }, 1000); // 1 second delay

      return () => clearTimeout(timer);
    }
  }, [enableAutoAdvance, currentStepValidation.isValid, currentStep, goToNextStep]);

  // Get overall form validation status
  const overallValidation = useMemo(() => {
    const allErrors: string[] = [];
    let isFormValid = true;
    const visitedArray = Array.from(visitedSteps);

    FORM_STEPS.forEach(step => {
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
      totalSteps: FORM_STEPS.filter(step => !step.isOptional).length
    };
  }, [stepValidationCache, validateStep, visitedSteps]);

  // Get step info
  const getStepInfo = useCallback((stepNumber: number) => {
    return FORM_STEPS.find(step => step.id === stepNumber);
  }, []);

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
    isLastStep: currentStep === FORM_STEPS.length,
    canGoNext: currentStep < FORM_STEPS.length && currentStepValidation.isValid,
    canGoPrevious: currentStep > 1,
    progressPercentage: Math.round((overallValidation.completedSteps / overallValidation.totalSteps) * 100),
    
    // Constants
    totalSteps: FORM_STEPS.length,
    steps: FORM_STEPS
  };
}