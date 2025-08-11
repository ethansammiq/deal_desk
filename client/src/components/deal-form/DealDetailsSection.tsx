import React from "react";
import { UseFormReturn } from "react-hook-form";
import { CardContent } from "@/components/ui/card";
import { FormSectionHeader } from "@/components/ui/form-style-guide";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

// Interface for deal details form values
interface DealDetailsFormValues {
  dealType: string;
  dealStructure: string;
  contractTermMonths?: string;
  termStartDate?: Date | null;
  termEndDate?: Date | null;
  businessSummary: string;
}

interface DealDetailsSectionProps {
  form: UseFormReturn<DealDetailsFormValues>;
  dealStructureType: "tiered" | "flat_commit" | "";
  setDealStructure: (value: "tiered" | "flat_commit" | "") => void;
  nextStep?: () => void;
  // Configuration props to control which fields are shown
  showBusinessSummary?: boolean;
  showDealStructure?: boolean;
  showNavigationButton?: boolean;
  title?: string;
  description?: string;
}

export function DealDetailsSection({
  form,
  dealStructureType,
  setDealStructure,
  nextStep,
  showBusinessSummary = true,
  showDealStructure = true,
  showNavigationButton = true,
  title = "Deal Details",
  description = "Configure the deal type, structure, and timeline",
}: DealDetailsSectionProps) {
  return (
    <CardContent className="p-6">
      <FormSectionHeader
        title={title}
        description={description}
      />

      <div className="space-y-6">
        {/* Deal Type as card-style selection */}
        <div className="space-y-4">
          <FormField
            control={form.control}
            name="dealType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Deal Type <span className="text-red-500">*</span>
                </FormLabel>
                <FormControl>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Deal Type Cards */}
                    <Card
                      className={`cursor-pointer transition-all hover:shadow-md ${field.value === "grow" ? "ring-2 ring-purple-600 shadow-md" : "border border-slate-200"}`}
                      onClick={() => field.onChange("grow")}
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
                          For existing clients with strong growth potential. Focuses on exceeding 20% year-over-year revenue growth through expanded product usage or new business units.
                        </p>
                      </CardContent>
                    </Card>

                    <Card
                      className={`cursor-pointer transition-all hover:shadow-md ${field.value === "protect" ? "ring-2 ring-purple-600 shadow-md" : "border border-slate-200"}`}
                      onClick={() => field.onChange("protect")}
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
                          Designed for strategic account retention, especially for large enterprise clients. Focuses on maintaining current revenue levels while ensuring long-term partnership stability.
                        </p>
                      </CardContent>
                    </Card>

                    <Card
                      className={`cursor-pointer transition-all hover:shadow-md ${field.value === "custom" ? "ring-2 ring-purple-600 shadow-md" : "border border-slate-200"}`}
                      onClick={() => field.onChange("custom")}
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
                          For specialized deals requiring custom implementation, non-standard terms, or unique technical requirements. Typically used for strategic partnerships and innovative projects.
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

        {/* Deal Structure - Conditional */}
        {showDealStructure && (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <FormField
            control={form.control}
            name="dealStructure"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Deal Structure <span className="text-red-500">*</span>
                </FormLabel>
                <Select
                  onValueChange={(value) => {
                    field.onChange(value);
                    setDealStructure(value as "tiered" | "flat_commit" | "");
                  }}
                  value={field.value || ""}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose tiered or flat commit structure" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="tiered">Tiered Revenue</SelectItem>
                    <SelectItem value="flat_commit">Flat Commit</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>
                  The revenue structure for this deal
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="contractTermMonths"
            render={({ field }) => {
              // Auto-calculate contract term when dates change
              const startDate = form.watch("termStartDate");
              const endDate = form.watch("termEndDate");
              
              React.useEffect(() => {
                if (startDate && endDate && startDate < endDate) {
                  const start = new Date(startDate);
                  const end = new Date(endDate);
                  const monthsDiff = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 30.44));
                  if (monthsDiff !== parseInt(field.value || "0")) {
                    field.onChange(monthsDiff.toString());
                  }
                }
              }, [startDate, endDate, field]);

              return (
                <FormItem>
                  <FormLabel>
                    Contract Term (Months) <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="14"
                      value={field.value || ""}
                      onChange={(e) => {
                        const months = parseInt(e.target.value) || 0;
                        field.onChange(e.target.value);
                        // Auto-calculate end date based on start date + months
                        const startDate = form.getValues("termStartDate");
                        if (startDate && months > 0) {
                          const endDate = new Date(startDate);
                          endDate.setMonth(endDate.getMonth() + months);
                          form.setValue("termEndDate", endDate);
                        }
                      }}
                    />
                  </FormControl>
                  <FormDescription>
                    Length of the contract in months (auto-calculated from dates)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              );
            }}
          />
          </div>
        )}

        {/* Date Range Selection */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <FormField
            control={form.control}
            name="termStartDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Deal Start Date <span className="text-red-500">*</span>
                </FormLabel>
                <FormControl>
                  <Input
                    type="date"
                    value={field.value ? format(field.value, "yyyy-MM-dd") : ""}
                    onChange={(e) => {
                      const date = e.target.value ? new Date(e.target.value) : null;
                      field.onChange(date);
                      
                      // Auto-update end date if contract term is set
                      const contractTermMonths = parseInt(form.getValues("contractTermMonths") || "0");
                      if (date && contractTermMonths > 0) {
                        const endDate = new Date(date);
                        endDate.setMonth(endDate.getMonth() + contractTermMonths);
                        form.setValue("termEndDate", endDate);
                      }
                    }}
                  />
                </FormControl>
                <FormDescription>
                  When the deal term begins
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="termEndDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Deal End Date <span className="text-red-500">*</span>
                </FormLabel>
                <FormControl>
                  <Input
                    type="date"
                    value={field.value ? format(field.value, "yyyy-MM-dd") : ""}
                    onChange={(e) => {
                      const date = e.target.value ? new Date(e.target.value) : null;
                      field.onChange(date);
                      
                      // Auto-update contract term when end date changes
                      const startDate = form.getValues("termStartDate");
                      if (startDate && date && startDate < date) {
                        const start = new Date(startDate);
                        const end = new Date(date);
                        const monthsDiff = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 30.44));
                        form.setValue("contractTermMonths", monthsDiff.toString());
                      }
                    }}
                  />
                </FormControl>
                <FormDescription>
                  When the deal term ends
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Business Summary - Conditional */}
        {showBusinessSummary && (
          <FormField
          control={form.control}
          name="businessSummary"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Business Summary <span className="text-red-500">*</span>
              </FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Briefly describe the deal, its objectives, and any special considerations"
                  className="min-h-[100px]"
                  value={field.value || ""}
                  onChange={field.onChange}
                />
              </FormControl>
              <FormDescription>
                Briefly describe the business opportunity, growth potential, and any special considerations.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        )}

        {/* Navigation Button - Conditional */}
        {showNavigationButton && nextStep && (
          <div className="flex justify-end pt-4">
            <Button
              type="button"
              onClick={nextStep}
              className="bg-purple-600 hover:bg-purple-700"
            >
              Next: Value Structure
            </Button>
          </div>
        )}
      </div>
    </CardContent>
  );
}