import React from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface FinancialInputFieldProps {
  type: 'currency' | 'percentage' | 'number';
  value: number | undefined;
  onChange: (value: number | undefined) => void;
  placeholder?: string;
  min?: number;
  max?: number;
  step?: number;
  className?: string;
  disabled?: boolean;
}

/**
 * Shared input component for financial data entry with consistent styling and behavior.
 * Handles currency ($), percentage (%), and number inputs with proper value parsing.
 */
export function FinancialInputField({
  type,
  value,
  onChange,
  placeholder = "0.00",
  min,
  max,
  step,
  className,
  disabled = false,
}: FinancialInputFieldProps) {
  // Format display value based on input type
  const getDisplayValue = () => {
    if (value === undefined || value === null) return "";
    
    switch (type) {
      case 'percentage':
        // Convert decimal to percentage for display (0.35 -> 35)
        return (value * 100).toString();
      case 'currency':
      case 'number':
      default:
        return value.toString();
    }
  };

  // Parse input value based on type
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    
    if (inputValue === "") {
      onChange(undefined);
      return;
    }

    const numericValue = parseFloat(inputValue);
    if (isNaN(numericValue)) {
      return; // Don't update for invalid numbers
    }

    switch (type) {
      case 'percentage':
        // Convert percentage to decimal for storage (35 -> 0.35)
        onChange(numericValue / 100);
        break;
      case 'currency':
      case 'number':
      default:
        onChange(numericValue);
        break;
    }
  };

  // Get input attributes based on type
  const getInputAttributes = () => {
    const baseAttributes = {
      type: "number",
      placeholder,
      min,
      max,
      step: step || (type === 'percentage' ? 0.1 : undefined),
      disabled,
    };

    switch (type) {
      case 'percentage':
        return {
          ...baseAttributes,
          min: min ?? 0,
          max: max ?? 100,
        };
      case 'currency':
        return {
          ...baseAttributes,
          min: min ?? 0,
        };
      default:
        return baseAttributes;
    }
  };

  // Render prefix/suffix based on type
  const renderPrefix = () => {
    if (type === 'currency') {
      return <span className="text-sm text-slate-500 mr-1">$</span>;
    }
    return null;
  };

  const renderSuffix = () => {
    if (type === 'percentage') {
      return <span className="text-sm text-slate-500 ml-1">%</span>;
    }
    return null;
  };

  return (
    <div className="flex items-center">
      {renderPrefix()}
      <Input
        {...getInputAttributes()}
        value={getDisplayValue()}
        onChange={handleChange}
        className={cn(
          "text-center border-0 bg-transparent p-1 text-sm",
          disabled && "cursor-not-allowed opacity-50",
          className
        )}
      />
      {renderSuffix()}
    </div>
  );
}