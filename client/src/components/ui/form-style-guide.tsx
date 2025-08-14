import React from "react";
import { cn } from "@/lib/utils";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Info, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

/**
 * Styling constants for form layout
 */
export const FormStyles = {
  // Form section styling
  formSection: "space-y-6",
  
  // Form labels
  label: {
    standard: "",
    required: "after:content-['*'] after:ml-0.5 after:text-red-500",
    optional: "after:content-['(optional)'] after:ml-1 after:text-slate-400 after:text-xs",
  },
  
  // Form containers
  container: {
    card: "border border-slate-200 rounded-lg p-6 bg-white shadow-sm",
    section: "p-6 space-y-4 border-b last:border-b-0 border-slate-100",
  },
  
  // Form headers
  header: {
    container: "mb-6", 
    title: "text-2xl font-bold text-slate-900 flex items-center gap-2",
    badge: "ml-3 px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800",
    description: "mt-1 text-sm text-slate-500",
  },
  
  // Form help text
  help: {
    trigger: "ml-2 cursor-help",
    icon: "h-5 w-5 text-slate-400 hover:text-slate-600 transition-colors",
    title: "font-medium text-slate-900",
    content: "text-sm text-slate-700",
    container: "space-y-2",
    list: "text-sm text-slate-700 list-decimal pl-4 space-y-1",
  },
  
  // Form progress tracker
  progress: {
    container: "mb-8",
    track: "w-3/4 mx-auto relative",
    step: {
      active: "border-primary bg-primary text-white",
      inactive: "border-slate-300 text-slate-500",
      base: "flex items-center justify-center w-10 h-10 rounded-full border-2 text-sm font-medium cursor-pointer hover:opacity-90 transition-opacity z-10",
    },
    line: {
      active: "bg-primary",
      inactive: "bg-slate-200",
      base: "absolute h-1 top-5",
    },
    label: {
      active: "font-medium text-primary",
      inactive: "text-slate-600",
      base: "cursor-pointer hover:text-primary transition-colors whitespace-nowrap",
    },
  },
  
  // Form inputs
  input: {
    standard: "w-full",
    error: "border-red-300 focus-visible:ring-red-300",
  },
  
  // Form buttons
  button: {
    navigation: {
      back: "mr-auto",
      next: "ml-auto",
      submit: "ml-auto",
    },
    container: "flex justify-between mt-6 pt-4 border-t border-slate-100",
  },
};

/**
 * FormHelpPopover - A standardized help icon with popover content
 */
export function FormHelpPopover({ 
  title, 
  children 
}: { 
  title: string; 
  children: React.ReactNode;
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <div className={FormStyles.help.trigger}>
          <Info className={FormStyles.help.icon} />
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-4" align="start">
        <div className={FormStyles.help.container}>
          <h4 className={FormStyles.help.title}>{title}</h4>
          {children}
        </div>
      </PopoverContent>
    </Popover>
  );
}

/**
 * FormPageHeader - A standardized header for entire forms (top-level)
 * Visually distinct from FormSectionHeader to establish clear hierarchy
 */
export function FormPageHeader({
  title,
  description,
  badge,
  helpTitle,
  helpContent,
}: {
  title: string;
  description?: string;
  badge?: string;
  helpTitle?: string;
  helpContent?: React.ReactNode;
}) {
  return (
    <div className="mb-8 pb-6 border-b-2 border-purple-100">
      <div className="flex items-center mb-3">
        <h1 className="text-2xl font-bold text-slate-900">
          {title}
          {badge && (
            <span className="ml-3 px-3 py-1 bg-purple-100 text-purple-800 text-sm font-semibold rounded-full">
              {badge}
            </span>
          )}
        </h1>
        
        {helpTitle && helpContent && (
          <div className="ml-3">
            <FormHelpPopover title={helpTitle}>
              {helpContent}
            </FormHelpPopover>
          </div>
        )}
      </div>
      
      {description && (
        <p className="text-base text-slate-600 leading-relaxed max-w-4xl">{description}</p>
      )}
    </div>
  );
}

/**
 * FormSectionHeader - A standardized header component for form sections (section-level)
 * Smaller and less prominent than FormPageHeader
 */
export function FormSectionHeader({
  title,
  description,
  badge,
  helpTitle,
  helpContent,
}: {
  title: string;
  description?: string;
  badge?: string;
  helpTitle?: string;
  helpContent?: React.ReactNode;
}) {
  return (
    <div className={FormStyles.header.container}>
      <div className="flex items-center mb-2">
        <h3 className={FormStyles.header.title}>
          {title}
          {badge && (
            <span className={FormStyles.header.badge}>{badge}</span>
          )}
        </h3>
        
        {helpTitle && helpContent && (
          <FormHelpPopover title={helpTitle}>
            {helpContent}
          </FormHelpPopover>
        )}
      </div>
      
      {description && (
        <p className={FormStyles.header.description}>{description}</p>
      )}
    </div>
  );
}

/**
 * FormProgressTracker - A standardized progress tracker for multi-step forms
 */
export function FormProgressTracker({
  steps,
  currentStep,
  onStepClick,
}: {
  steps: { id: string | number; label: string }[];
  currentStep: string | number;
  onStepClick: (stepId: string | number) => void;
}) {
  const currentIndex = steps.findIndex(s => s.id === currentStep);
  
  return (
    <div className="w-full mb-6">
      <div className="flex items-center justify-between py-3 px-4 bg-gray-50 border border-gray-200 rounded-lg">
        {/* Left: Simple step info */}
        <div className="flex items-center space-x-3">
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span className="text-sm font-medium text-gray-900">
            Step {currentIndex + 1} of {steps.length}
          </span>
        </div>

        {/* Center: Current step name */}
        <div className="flex-1 text-center">
          <span className="text-sm font-semibold text-gray-900">
            {steps[currentIndex]?.label}
          </span>
        </div>

        {/* Right: Progress dots and save action */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            {steps.map((step, index) => {
              const isActive = index === currentIndex;
              const isCompleted = index < currentIndex;
              const isClickable = index <= currentIndex + 1;
              
              return (
                <button
                  key={step.id}
                  onClick={() => isClickable && onStepClick(step.id)}
                  className={cn(
                    "w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-all duration-200 border",
                    isActive 
                      ? "bg-purple-600 text-white border-purple-600 shadow-sm" 
                      : isCompleted 
                        ? "bg-green-500 text-white border-green-500" 
                        : "bg-gray-100 text-gray-400 border-gray-200 hover:border-gray-300",
                    isClickable ? "cursor-pointer hover:scale-105" : "cursor-not-allowed opacity-50"
                  )}
                  title={step.label}
                >
                  {isCompleted ? (
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    index + 1
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * FormNavigation - A standardized navigation component for multi-step forms
 * Supports both Previous/Next and Previous/Submit patterns
 */
export function FormNavigation({
  onPrevious,
  onNext,
  onSubmit,
  previousLabel = "Previous",
  nextLabel = "Next",
  submitLabel = "Submit",
  isSubmitting = false,
  previousDisabled = false,
  nextDisabled = false,
  submitDisabled = false,
  showBorder = false,
  variant = "next" // "next" | "submit"
}: {
  onPrevious?: () => void;
  onNext?: () => void;
  onSubmit?: () => void;
  previousLabel?: string;
  nextLabel?: string;
  submitLabel?: string;
  isSubmitting?: boolean;
  previousDisabled?: boolean;
  nextDisabled?: boolean;
  submitDisabled?: boolean;
  showBorder?: boolean;
  variant?: "next" | "submit";
}) {
  const containerClass = showBorder 
    ? "flex items-center justify-between pt-6 border-t border-gray-200"
    : "mt-8 flex justify-between items-center";

  return (
    <div className={containerClass}>
      {onPrevious && (
        <Button
          type="button"
          variant="outline"
          onClick={onPrevious}
          disabled={previousDisabled || isSubmitting}
        >
          {previousLabel}
        </Button>
      )}

      {variant === "next" && onNext && (
        <Button
          type="button"
          onClick={onNext}
          disabled={nextDisabled || isSubmitting}
        >
          {nextLabel}
        </Button>
      )}

      {variant === "submit" && onSubmit && (
        <Button
          type="submit"
          onClick={onSubmit}
          disabled={submitDisabled || isSubmitting}
          className="min-w-[120px]"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Submitting...
            </>
          ) : (
            submitLabel
          )}
        </Button>
      )}
    </div>
  );
}

/**
 * StyledFormField - A wrapper component for form fields with consistent styling
 */
export function StyledFormField({
  control,
  name,
  label,
  description,
  placeholder,
  type = "text",
  options,
  required = false,
  ...props
}: {
  control: any;
  name: string;
  label: string;
  description?: string;
  placeholder?: string;
  type?: "text" | "email" | "textarea" | "select" | "number";
  options?: { value: string; label: string }[];
  required?: boolean;
  [key: string]: any;
}) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel className={required ? FormStyles.label.required : FormStyles.label.optional}>
            {label}
          </FormLabel>
          <FormControl>
            {type === "textarea" ? (
              <Textarea
                placeholder={placeholder}
                className="resize-none"
                {...field}
                {...props}
              />
            ) : type === "select" && options ? (
              <Select
                onValueChange={field.onChange}
                value={field.value}
                {...props}
              >
                <SelectTrigger>
                  <SelectValue placeholder={placeholder} />
                </SelectTrigger>
                <SelectContent>
                  {options.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input
                type={type}
                placeholder={placeholder}
                {...field}
                {...props}
              />
            )}
          </FormControl>
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}