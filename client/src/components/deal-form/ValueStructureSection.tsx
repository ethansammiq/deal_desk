import React from "react";
import { UseFormReturn } from "react-hook-form";
import { z } from "zod";
import { Card, CardContent } from "@/components/ui/card";
import { FormSectionHeader } from "@/components/ui/form-style-guide";
import { IncentiveSelector } from "@/components/IncentiveSelector";
import TierSpecificIncentives, { type TierIncentive } from "@/components/TierSpecificIncentives";
import { type SelectedIncentive } from "@/lib/incentive-data";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
} from "@/components/ui/form";

// Type this component to accept any valid form structure
type ValueStructureFormValues = any;

interface DealTierData {
  tierNumber: number;
  annualRevenue?: number;
  annualGrossMargin?: number;
  annualGrossMarginPercent?: number;
  incentivePercentage?: number;
  incentiveNotes?: string;
  incentiveType?: "rebate" | "discount" | "bonus" | "other";
  incentiveThreshold?: number;
  incentiveAmount?: number;
}

interface ValueStructureSectionProps {
  form: UseFormReturn<ValueStructureFormValues>;
  dealStructureType: "tiered" | "flat_commit" | "";
  dealTiers: DealTierData[];
  setDealTiers: (tiers: DealTierData[]) => void;
  selectedIncentives: SelectedIncentive[];
  setSelectedIncentives: (incentives: SelectedIncentive[]) => void;
  tierIncentives: TierIncentive[];
  setTierIncentives: (incentives: TierIncentive[]) => void;
  showAddIncentiveForm: boolean;
  setShowAddIncentiveForm: (show: boolean) => void;
}

export function ValueStructureSection({
  form,
  dealStructureType,
  dealTiers,
  setDealTiers,
  selectedIncentives,
  setSelectedIncentives,
  tierIncentives,
  setTierIncentives,
  showAddIncentiveForm,
  setShowAddIncentiveForm,
}: ValueStructureSectionProps) {
  // Helper function to add a new tier
  const addTier = () => {
    const newTierNumber = dealTiers.length + 1;
    const newTier: DealTierData = {
      tierNumber: newTierNumber,
      annualRevenue: undefined,
      annualGrossMargin: undefined,
      annualGrossMarginPercent: undefined,
      incentivePercentage: undefined,
      incentiveNotes: "",
      incentiveType: "rebate",
      incentiveThreshold: undefined,
      incentiveAmount: undefined,
    };
    setDealTiers([...dealTiers, newTier]);
  };

  // Helper function to remove a tier
  const removeTier = (tierNumber: number) => {
    if (dealTiers.length > 1) {
      const updatedTiers = dealTiers
        .filter((tier) => tier.tierNumber !== tierNumber)
        .map((tier, index) => ({ ...tier, tierNumber: index + 1 }));
      setDealTiers(updatedTiers);
    }
  };

  // Helper function to update a tier
  const updateTier = (tierNumber: number, updates: Partial<DealTierData>) => {
    const updatedTiers = dealTiers.map((tier) =>
      tier.tierNumber === tierNumber ? { ...tier, ...updates } : tier
    );
    setDealTiers(updatedTiers);
  };

  return (
    <Card>
      <CardContent className="p-6">
        <FormSectionHeader
          title="Value Structure"
          description="Configure the financial structure and incentives for this deal"
        />

        <div className="space-y-8">
          {/* Flat Commit Structure */}
          {dealStructureType === "flat_commit" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="annualRevenue"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Annual Revenue <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="Enter annual revenue"
                          {...field}
                          onChange={(e) => {
                            const value = e.target.value === "" ? 0 : parseFloat(e.target.value);
                            field.onChange(value);
                          }}
                        />
                      </FormControl>
                      <FormDescription>
                        Committed annual revenue for this deal
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="annualGrossMargin"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Annual Gross Margin % <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          step="0.1"
                          placeholder="Enter margin percentage"
                          {...field}
                          onChange={(e) => {
                            const value = e.target.value === "" ? 0 : parseFloat(e.target.value);
                            field.onChange(value);
                          }}
                        />
                      </FormControl>
                      <FormDescription>
                        Expected gross margin percentage
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Incentives for Flat Commit */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Deal Incentives</h3>
                <IncentiveSelector
                  selectedIncentives={selectedIncentives}
                  dealTiers={[{ tierNumber: 1, annualRevenue: 0 }]}
                  onChange={setSelectedIncentives}
                />
              </div>
            </div>
          )}

          {/* Tiered Structure */}
          {dealStructureType === "tiered" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Deal Tiers</h3>
                <Button
                  type="button"
                  onClick={addTier}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Add Tier
                </Button>
              </div>

              {/* Render each tier */}
              {dealTiers.map((tier) => (
                <div
                  key={tier.tierNumber}
                  className="border border-gray-200 rounded-lg p-4 space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-base">
                      Tier {tier.tierNumber}
                    </h4>
                    {dealTiers.length > 1 && (
                      <Button
                        type="button"
                        onClick={() => removeTier(tier.tierNumber)}
                        variant="outline"
                        size="sm"
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <label className="text-sm font-medium text-gray-700">
                        Annual Revenue
                      </label>
                      <Input
                        type="number"
                        placeholder="Enter tier revenue"
                        value={tier.annualRevenue || ""}
                        onChange={(e) => {
                          const value = e.target.value === "" ? undefined : parseFloat(e.target.value);
                          updateTier(tier.tierNumber, { annualRevenue: value });
                        }}
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-700">
                        Gross Margin %
                      </label>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        placeholder="Enter margin %"
                        value={tier.annualGrossMarginPercent || ""}
                        onChange={(e) => {
                          const value = e.target.value === "" ? undefined : parseFloat(e.target.value);
                          updateTier(tier.tierNumber, { annualGrossMarginPercent: value });
                        }}
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-700">
                        Incentive Type
                      </label>
                      <Select
                        value={tier.incentiveType || "rebate"}
                        onValueChange={(value: "rebate" | "discount" | "bonus" | "other") => {
                          updateTier(tier.tierNumber, { incentiveType: value });
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="rebate">Rebate</SelectItem>
                          <SelectItem value="discount">Discount</SelectItem>
                          <SelectItem value="bonus">Bonus</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-700">
                        Incentive Percentage
                      </label>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        placeholder="Enter incentive %"
                        value={tier.incentivePercentage || ""}
                        onChange={(e) => {
                          const value = e.target.value === "" ? undefined : parseFloat(e.target.value);
                          updateTier(tier.tierNumber, { incentivePercentage: value });
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700">
                      Incentive Notes
                    </label>
                    <Textarea
                      placeholder="Notes about this tier's incentives..."
                      value={tier.incentiveNotes || ""}
                      onChange={(e) => {
                        updateTier(tier.tierNumber, { incentiveNotes: e.target.value });
                      }}
                      className="min-h-[80px]"
                    />
                  </div>
                </div>
              ))}

              {/* Hierarchical Incentives for Tiered Structure */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Hierarchical Incentives</h3>
                <p className="text-sm text-gray-600">
                  Select incentives that apply across multiple tiers
                </p>
                <IncentiveSelector
                  selectedIncentives={selectedIncentives}
                  dealTiers={dealTiers.map(tier => ({ 
                    tierNumber: tier.tierNumber, 
                    annualRevenue: tier.annualRevenue || 0 
                  }))}
                  onChange={setSelectedIncentives}
                />
              </div>

              {/* Tier-Specific Incentives */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Tier-Specific Incentives</h3>
                <p className="text-sm text-gray-600">
                  Configure specific incentives for individual tiers
                </p>
                <TierSpecificIncentives
                  dealTiers={dealTiers.map(tier => ({
                    tierNumber: tier.tierNumber,
                    annualRevenue: tier.annualRevenue || 0
                  }))}
                  incentives={tierIncentives}
                  onChange={setTierIncentives}
                />
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}