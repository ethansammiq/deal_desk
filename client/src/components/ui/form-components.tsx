import React from "react";
import { UseFormReturn, FieldPath, FieldValues } from "react-hook-form";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
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
import { InfoTooltip } from "@/components/ui/info-tooltip";

// Enhanced FormField with tooltip support
interface FormFieldWithTooltipProps<TFieldValues extends FieldValues = FieldValues> {
  form: UseFormReturn<TFieldValues>;
  name: FieldPath<TFieldValues>;
  label: string;
  placeholder?: string;
  description?: string;
  tooltip?: string;
  required?: boolean;
  type?: "text" | "email" | "number" | "date" | "textarea";
  min?: string | number;
  max?: string | number;
  step?: string | number;
}

export function FormFieldWithTooltip<TFieldValues extends FieldValues = FieldValues>({
  form,
  name,
  label,
  placeholder,
  description,
  tooltip,
  required = false,
  type = "text",
  min,
  max,
  step,
}: FormFieldWithTooltipProps<TFieldValues>) {
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <div className="flex items-center gap-2">
            <FormLabel>
              {label}
              {required && <span className="text-red-500">*</span>}
            </FormLabel>
            {tooltip && <InfoTooltip content={tooltip} />}
          </div>
          <FormControl>
            {type === "textarea" ? (
              <Textarea
                placeholder={placeholder}
                className="min-h-[100px]"
                {...field}
              />
            ) : type === "date" ? (
              <Input
                type="date"
                {...field}
                value={
                  field.value && typeof field.value === 'object' && 'toISOString' in field.value
                    ? (field.value as Date).toISOString().split("T")[0]
                    : field.value || ""
                }
                onChange={(e) => {
                  const date = e.target.value ? new Date(e.target.value) : undefined;
                  field.onChange(date);
                }}
              />
            ) : type === "number" ? (
              <Input
                type="number"
                placeholder={placeholder}
                min={min}
                max={max}
                step={step}
                {...field}
                onChange={(e) => {
                  const value = e.target.value === "" ? (type === "number" ? 0 : "") : 
                    type === "number" ? parseFloat(e.target.value) : e.target.value;
                  field.onChange(value);
                }}
              />
            ) : (
              <Input
                type={type}
                placeholder={placeholder}
                {...field}
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

// Enhanced Select Field with tooltip
interface FormSelectFieldProps<TFieldValues extends FieldValues = FieldValues> {
  form: UseFormReturn<TFieldValues>;
  name: FieldPath<TFieldValues>;
  label: string;
  placeholder?: string;
  description?: string;
  tooltip?: string;
  required?: boolean;
  options: { value: string; label: string }[];
  onValueChange?: (value: string) => void;
}

export function FormSelectField<TFieldValues extends FieldValues = FieldValues>({
  form,
  name,
  label,
  placeholder = "Select an option",
  description,
  tooltip,
  required = false,
  options,
  onValueChange,
}: FormSelectFieldProps<TFieldValues>) {
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <div className="flex items-center gap-2">
            <FormLabel>
              {label}
              {required && <span className="text-red-500">*</span>}
            </FormLabel>
            {tooltip && <InfoTooltip content={tooltip} />}
          </div>
          <Select
            onValueChange={(value) => {
              field.onChange(value);
              onValueChange?.(value);
            }}
            value={field.value || ""}
          >
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder={placeholder} />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

// Conditional Field Group - shows/hides fields based on condition
interface ConditionalFieldGroupProps {
  condition: boolean;
  children: React.ReactNode;
  className?: string;
}

export function ConditionalFieldGroup({
  condition,
  children,
  className = "",
}: ConditionalFieldGroupProps) {
  if (!condition) return null;
  return <div className={className}>{children}</div>;
}

// Financial Input Group - standardized currency and percentage inputs
interface FinancialInputGroupProps<TFieldValues extends FieldValues = FieldValues> {
  form: UseFormReturn<TFieldValues>;
  revenueFieldName: FieldPath<TFieldValues>;
  marginFieldName: FieldPath<TFieldValues>;
  revenueLabel?: string;
  marginLabel?: string;
  revenueTooltip?: string;
  marginTooltip?: string;
}

export function FinancialInputGroup<TFieldValues extends FieldValues = FieldValues>({
  form,
  revenueFieldName,
  marginFieldName,
  revenueLabel = "Annual Revenue",
  marginLabel = "Annual Gross Margin %",
  revenueTooltip = "Expected annual revenue for this deal",
  marginTooltip = "Gross margin percentage for this deal",
}: FinancialInputGroupProps<TFieldValues>) {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      <FormFieldWithTooltip
        form={form}
        name={revenueFieldName}
        label={revenueLabel}
        type="number"
        placeholder="Enter annual revenue"
        description={revenueTooltip}
        tooltip={revenueTooltip}
        required
      />
      <FormFieldWithTooltip
        form={form}
        name={marginFieldName}
        label={marginLabel}
        type="number"
        min={0}
        max={100}
        step={0.1}
        placeholder="Enter margin percentage"
        description={marginTooltip}
        tooltip={marginTooltip}
        required
      />
    </div>
  );
}

// Date Range Input - standardized start/end date inputs
interface DateRangeInputProps<TFieldValues extends FieldValues = FieldValues> {
  form: UseFormReturn<TFieldValues>;
  startDateFieldName: FieldPath<TFieldValues>;
  endDateFieldName: FieldPath<TFieldValues>;
  startLabel?: string;
  endLabel?: string;
  startDescription?: string;
  endDescription?: string;
}

export function DateRangeInput<TFieldValues extends FieldValues = FieldValues>({
  form,
  startDateFieldName,
  endDateFieldName,
  startLabel = "Start Date",
  endLabel = "End Date",
  startDescription = "When the deal term begins",
  endDescription = "When the deal term ends",
}: DateRangeInputProps<TFieldValues>) {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      <FormFieldWithTooltip
        form={form}
        name={startDateFieldName}
        label={startLabel}
        type="date"
        description={startDescription}
        required
      />
      <FormFieldWithTooltip
        form={form}
        name={endDateFieldName}
        label={endLabel}
        type="date"
        description={endDescription}
        required
      />
    </div>
  );
}

// Standard form constants for reuse
export const REGION_OPTIONS = [
  { value: "northeast", label: "Northeast" },
  { value: "midwest", label: "Midwest" },
  { value: "midatlantic", label: "Mid-Atlantic" },
  { value: "west", label: "West" },
  { value: "south", label: "South" },
];

export const SALES_CHANNEL_OPTIONS = [
  { value: "client_direct", label: "Client Direct" },
  { value: "holding_company", label: "Holding Company" },
  { value: "independent_agency", label: "Independent Agency" },
];

export const DEAL_TYPE_OPTIONS = [
  { value: "grow", label: "Grow" },
  { value: "protect", label: "Protect" },
  { value: "custom", label: "Custom" },
];

export const DEAL_STRUCTURE_OPTIONS = [
  { value: "flat_commit", label: "Flat Commit" },
  { value: "tiered", label: "Tiered Revenue" },
];

export const INCENTIVE_TYPE_OPTIONS = [
  { value: "rebate", label: "Rebate" },
  { value: "discount", label: "Discount" },
  { value: "bonus", label: "Bonus" },
  { value: "other", label: "Other" },
];