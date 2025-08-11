import React from "react";
import { UseFormReturn } from "react-hook-form";
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
import { FinancialInputGroup } from "@/components/ui/form-components";
import { FinancialTierTable } from "./FinancialTierTable";

// Type this component to accept any valid form structure
type ValueStructureFormValues = any;

// Import unified interface from hook
import { DealTier } from "@/hooks/useDealTiers";
import { DEAL_CONSTANTS, INCENTIVE_CONSTANTS } from "@/config/businessConstants";

interface ValueStructureSectionProps {
  form: UseFormReturn<ValueStructureFormValues>;
  dealStructureType: "tiered" | "flat_commit" | "";
  dealTiers: DealTier[];
  setDealTiers: (tiers: DealTier[]) => void;
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
    const newTier: DealTier = {
      tierNumber: newTierNumber,
      annualRevenue: DEAL_CONSTANTS.DEFAULT_ANNUAL_REVENUE,
      annualGrossMargin: DEAL_CONSTANTS.DEFAULT_GROSS_MARGIN,
      incentiveCategory: INCENTIVE_CONSTANTS.DEFAULT_CATEGORY,
      incentiveSubCategory: INCENTIVE_CONSTANTS.DEFAULT_SUB_CATEGORY,
      specificIncentive: INCENTIVE_CONSTANTS.DEFAULT_SPECIFIC_INCENTIVE,
      incentiveValue: 0,
      incentiveNotes: "",
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
    <div className="space-y-8">
      {/* Revenue & Profitability Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">Revenue & Profitability</h3>
          {dealStructureType === "tiered" && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addTier}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Tier
            </Button>
          )}
        </div>
        
        <FinancialTierTable
          dealTiers={dealTiers}
          setDealTiers={setDealTiers}
          lastYearRevenue={850000}
          lastYearGrossMargin={35.0}
          isFlat={dealStructureType === "flat_commit"}
        />
      </div>

      {/* Incentive Structure Section */}
      {dealStructureType === "tiered" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Incentive Structure</h3>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowAddIncentiveForm(!showAddIncentiveForm)}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Incentive
            </Button>
          </div>
          
          <IncentiveSelector
            selectedIncentives={selectedIncentives}
            onChange={setSelectedIncentives}
            dealTiers={dealTiers}
            showAddForm={showAddIncentiveForm}
          />
          
          <TierSpecificIncentives
            dealTiers={dealTiers.map(tier => ({
              ...tier,
              annualRevenue: tier.annualRevenue || 0
            }))}
            incentives={tierIncentives}
            onChange={setTierIncentives}
          />
        </div>
      )}
    </div>
  );
}