import React from "react";
import { UseFormReturn } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Plus, Info } from "lucide-react";
import { useDealCalculations } from "@/hooks/useDealCalculations";
// ✅ PHASE 2: Removed useTierManagement - functionality absorbed into useDealTiers
import { useFinancialData } from "@/hooks/useFinancialData";
import { FinancialTierTable } from "./FinancialTierTable";
import { IncentiveSelector } from "@/components/IncentiveSelector";
import { IncentiveDisplayTable } from "@/components/ui/incentive-display-table";
import { DEAL_CONSTANTS } from "@/config/businessConstants";
import { DealTier, getTotalIncentiveValue, useDealTiers } from "@/hooks/useDealTiers";
import {
  FinancialSection,
  FinancialTable,
  FinancialTableHeader,
  FinancialHeaderCell,
  FinancialTableBody,
  FinancialDataCell,
  FinancialMetricLabel,
  GrowthIndicator,
  FinancialTableColGroup,
  formatCurrency
} from "@/components/ui/financial-table";

// Type this component to accept any valid form structure
type IncentiveStructureFormValues = any;

// ✅ PHASE 3: Simplified interface - showAddIncentiveForm state now internal
interface IncentiveStructureSectionProps {
  form: UseFormReturn<IncentiveStructureFormValues>;
  dealStructureType: "tiered" | "flat_commit" | "";
  dealTiers: DealTier[];
  setDealTiers: (tiers: DealTier[]) => void;
  salesChannel?: string;
  advertiserName?: string;
  agencyName?: string;
}

export function IncentiveStructureSection({
  form,
  dealStructureType,
  dealTiers,
  setDealTiers,
  salesChannel = "independent_agency",
  advertiserName,
  agencyName,
}: IncentiveStructureSectionProps) {
  // ✅ PHASE 3: Internal state management for incentive form visibility
  const [showAddIncentiveForm, setShowAddIncentiveForm] = React.useState(false);
  // ✅ MIGRATED: Use shared financial data hook
  const { agenciesQuery, advertisersQuery, isLoading, hasError, agenciesData, advertisersData } = useFinancialData();
  
  // Use shared calculation service with clean data arrays
  const { calculationService } = useDealCalculations(advertisersData, agenciesData);

  // ✅ PHASE 2: Using enhanced useDealTiers for tier operations
  const tierManager = useDealTiers({
    initialTiers: dealTiers,
    supportFlatDeals: true,
    dealStructure: dealStructureType
  });
  
  // Sync tier changes back to parent
  React.useEffect(() => {
    setDealTiers(tierManager.tiers);
  }, [tierManager.tiers, setDealTiers]);
  
  const { addTier, removeTier, updateTier } = tierManager;

  // Calculate incentive cost using the new getTotalIncentiveValue function
  const calculateTierIncentiveCost = (tierNumber: number): number => {
    const tier = dealTiers.find(t => t.tierNumber === tierNumber);
    if (!tier) return 0;
    return calculationService.calculateTierIncentiveCost(tier);
  };

  // ✅ FIXED: Use dynamic data from calculation service instead of hardcoded value
  const lastYearIncentiveCost = calculationService.getPreviousYearIncentiveCost(salesChannel, advertiserName, agencyName);

  // ✅ SIMPLIFIED: Use shared loading/error states
  if (isLoading) {
    return (
      <FinancialSection title="Incentive Structure">
        <div className="text-center py-8">
          <p className="text-slate-500">Loading incentive data...</p>
        </div>
      </FinancialSection>
    );
  }

  if (hasError) {
    return (
      <FinancialSection title="Incentive Structure">
        <div className="text-center py-8">
          <p className="text-red-600">Error loading incentive data. Please try again.</p>
        </div>
      </FinancialSection>
    );
  }

  return (
    <FinancialSection 
      title="Incentive Structure"
      headerAction={
        <Button
          type="button"
          onClick={() => setShowAddIncentiveForm(true)}
          variant="outline"
          size="sm"
          className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white border-0 hover:from-purple-700 hover:to-indigo-700"
        >
          <Plus className="h-4 w-4 mr-1" />
          Add Incentive
        </Button>
      }
    >
      {/* Info Banner - using Alert component for consistency */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>Incentive Configuration</AlertTitle>
        <AlertDescription>
          Incentives are additional benefits provided to the client based on performance. 
          Select appropriate incentive types and amounts for each tier of the deal.
        </AlertDescription>
      </Alert>

          {/* Add Incentive Form */}
          {showAddIncentiveForm && (
            <div className="mb-6 p-4 border border-slate-200 rounded-lg bg-slate-50">
              <IncentiveSelector
                dealTiers={dealTiers}
                setDealTiers={setDealTiers}
                onClose={() => setShowAddIncentiveForm(false)}
              />
              <div className="flex justify-end gap-2 mt-4">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setShowAddIncentiveForm(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* Current Incentive Display - using shared IncentiveDisplayTable */}
          {dealTiers.some(tier => getTotalIncentiveValue(tier) > 0) && (
            <div className="space-y-4 mb-6">
              <h4 className="text-lg font-semibold">Current Incentive Configuration</h4>
              <IncentiveDisplayTable
                dealTiers={dealTiers}
                onRemoveIncentive={(incentiveType) => {
                  // Remove specific incentive type from all tiers
                  const updatedTiers = dealTiers.map(tier => ({
                    ...tier,
                    incentives: tier.incentives?.filter(inc => 
                      !(inc.category === incentiveType.category && 
                        inc.subCategory === incentiveType.subCategory && 
                        inc.option === incentiveType.option)
                    ) || []
                  }));
                  setDealTiers(updatedTiers);
                }}
                showActions={true}
              />
            </div>
          )}

    </FinancialSection>
  );
}