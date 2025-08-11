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
    <div className="space-y-8">
      {/* Unified Financial Structure - Always show table */}
      <FinancialTierTable
        dealTiers={dealTiers}
        setDealTiers={setDealTiers}
        lastYearRevenue={850000}
        lastYearGrossMargin={35.0}
        isFlat={dealStructureType === "flat_commit"}
      />
    </div>
  );
}