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
import { Info } from "lucide-react";
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
 * FormSectionHeader - A standardized header component for form sections
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
        <h2 className={FormStyles.header.title}>
          {title}
          {badge && (
            <span className={FormStyles.header.badge}>{badge}</span>
          )}
        </h2>
        
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
      <div className="flex items-center justify-between py-3 px-4 bg-white border border-gray-200 rounded-lg shadow-sm">
        {/* Left: Step info */}
        <div className="flex items-center space-x-3">
          <span className="text-sm font-medium text-gray-600">
            Step {currentIndex + 1} of {steps.length}
          </span>
          <span className="text-sm text-gray-400">•</span>
          <span className="text-sm font-semibold text-gray-900">
            {steps[currentIndex]?.label}
          </span>
        </div>

        {/* Right: Progress dots */}
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
                  "w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all duration-200 border",
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
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
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