import React from "react";
import { UseFormReturn, FieldPath, FieldValues } from "react-hook-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";

// Deal type configuration
interface DealTypeOption {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  subtitle: string;
}

const dealTypeOptions: DealTypeOption[] = [
  {
    id: "grow",
    label: "Grow",
    subtitle: "20%+ YOY Growth",
    description: "For existing clients with strong growth potential. Focuses on exceeding 20% year-over-year revenue growth through expanded product usage or new business units.",
    color: "text-green-600",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
        <polyline points="17 6 23 6 23 12"></polyline>
      </svg>
    )
  },
  {
    id: "protect",
    label: "Protect",
    subtitle: "Large Account Retention",
    description: "Designed for strategic account retention, especially for large enterprise clients. Focuses on maintaining current revenue levels while ensuring long-term partnership stability.",
    color: "text-blue-600",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
        <circle cx="12" cy="7" r="4"></circle>
      </svg>
    )
  },
  {
    id: "custom",
    label: "Custom",
    subtitle: "Special Requirements",
    description: "For specialized deals requiring custom implementation, non-standard terms, or unique technical requirements. Typically used for strategic partnerships and innovative projects.",
    color: "text-purple-600",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
      </svg>
    )
  }
];

interface DealTypeCardSelectorProps<TFieldValues extends FieldValues = FieldValues> {
  form: UseFormReturn<TFieldValues>;
  name: FieldPath<TFieldValues>;
  label?: string;
  required?: boolean;
  className?: string;
}

export function DealTypeCardSelector<TFieldValues extends FieldValues = FieldValues>({
  form,
  name,
  label = "Deal Type",
  required = true,
  className = "",
}: DealTypeCardSelectorProps<TFieldValues>) {
  return (
    <div className={`space-y-4 ${className}`}>
      <FormField
        control={form.control}
        name={name}
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              {label} {required && <span className="text-red-500">*</span>}
            </FormLabel>
            <FormControl>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {dealTypeOptions.map((option) => (
                  <Card
                    key={option.id}
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      field.value === option.id 
                        ? "ring-2 ring-purple-600 shadow-md" 
                        : "border border-slate-200"
                    }`}
                    onClick={() => field.onChange(option.id)}
                  >
                    <CardHeader className="p-4 pb-2">
                      <CardTitle className="text-md flex items-center space-x-2">
                        <span className={option.color}>
                          {option.icon}
                        </span>
                        <span>{option.label}</span>
                      </CardTitle>
                      <CardDescription>{option.subtitle}</CardDescription>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      <p className="text-sm text-slate-600">
                        {option.description}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}

// Export deal type options for other components that might need them
export { dealTypeOptions };
export type { DealTypeOption };