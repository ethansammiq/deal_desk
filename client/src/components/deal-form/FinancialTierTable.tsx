import React from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Plus, Trash2, Info } from "lucide-react";
import { useDealCalculations } from "@/hooks/useDealCalculations";
// ✅ PHASE 2: Removed useTierManagement - functionality absorbed into useDealTiers
import { useFinancialData } from "@/hooks/useFinancialData";

// Import unified interface from hook
import { DealTier, useDealTiers } from "@/hooks/useDealTiers";
import { DEAL_CONSTANTS, INCENTIVE_CONSTANTS } from "@/config/businessConstants";
import {
  FinancialSection,
  FinancialTable,
  FinancialTableHeader,
  FinancialHeaderCell,
  FinancialTableBody,
  FinancialDataCell,
  FinancialMetricLabel,
  GrowthIndicator,
  FinancialTableColGroup
} from "@/components/ui/financial-table";
import { FinancialInputField } from "@/components/ui/financial-input-field";
import { formatCurrency, formatPercentage } from "@/lib/utils";

interface FinancialTierTableProps {
  dealTiers: DealTier[];
  setDealTiers: (tiers: DealTier[]) => void;
  lastYearRevenue: number;
  lastYearGrossMargin: number;
  isFlat?: boolean;
  salesChannel?: string;
  advertiserName?: string;
  agencyName?: string;
}

export function FinancialTierTable({
  dealTiers,
  setDealTiers,
  lastYearRevenue,
  lastYearGrossMargin,
  isFlat = false,
  salesChannel = "independent_agency",
  advertiserName,
  agencyName,
}: FinancialTierTableProps) {
  // ✅ MIGRATED: Use shared financial data hook
  const { agenciesQuery, advertisersQuery, isLoading, hasError, agenciesData, advertisersData } = useFinancialData();
  
  // Use shared calculation service with clean data arrays
  const { 
    calculationService 
  } = useDealCalculations(advertisersData, agenciesData);

  // ✅ PHASE 2: Using enhanced useDealTiers for tier operations
  const tierManager = useDealTiers({
    initialTiers: dealTiers,
    supportFlatDeals: true,
    dealStructure: isFlat ? "flat_commit" : "tiered"
  });
  
  // Sync tier changes back to parent
  React.useEffect(() => {
    setDealTiers(tierManager.tiers);
  }, [tierManager.tiers, setDealTiers]);
  
  const { addTier, removeTier, updateTier } = tierManager;

  // Calculate last year's gross profit
  const lastYearGrossProfit = lastYearRevenue * (lastYearGrossMargin / 100);

  // ✅ SIMPLIFIED: Use shared loading/error states
  if (isLoading) {
    return (
      <FinancialSection title="Revenue & Profitability">
        <div className="text-center py-8">
          <p className="text-slate-500">Loading financial data...</p>
        </div>
      </FinancialSection>
    );
  }

  if (hasError) {
    return (
      <FinancialSection title="Revenue & Profitability">
        <div className="text-center py-8">
          <p className="text-red-600">Error loading financial data. Please try again.</p>
        </div>
      </FinancialSection>
    );
  }

  return (
    <FinancialSection 
      title="Revenue & Profitability"
      headerAction={
        <Button
          type="button"
          onClick={addTier}
          variant="outline"
          size="sm"
          disabled={isFlat}
          className={`${
            isFlat 
              ? "bg-gray-300 text-gray-500 cursor-not-allowed border-gray-300" 
              : "bg-gradient-to-r from-purple-600 to-indigo-600 text-white border-0 hover:from-purple-700 hover:to-indigo-700"
          }`}
          title={isFlat ? "Add Tier is disabled for Flat Commit deals" : "Add a new tier"}
        >
          <Plus className="h-4 w-4 mr-1" />
          Add Tier
        </Button>
      }
    >
            {/* Info banner - using Alert component for consistency */}
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                {isFlat 
                  ? "This section shows revenue targets and profitability metrics for your flat commit deal. Add Tier is disabled for flat commit structures."
                  : "This section details revenue targets, gross margin percentages, and calculated profitability metrics for each tier. Key metrics include Revenue Growth Rate and Gross Margin Growth Rate compared to last year's performance."
                }
              </AlertDescription>
            </Alert>

          <FinancialTable>
            <FinancialTableColGroup dealTiers={dealTiers} />
            
            <FinancialTableHeader>
          <tr>
            <FinancialHeaderCell isMetricName />
            <FinancialHeaderCell>Last Year</FinancialHeaderCell>
            {dealTiers.map((tier) => (
              <FinancialHeaderCell key={`th-${tier.tierNumber}`}>
                <div className="flex justify-between items-center">
                  <span className="flex-1">Tier {tier.tierNumber}</span>
                  {dealTiers.length > 1 && (
                    <Button
                      type="button"
                      onClick={() => removeTier(tier.tierNumber)}
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </FinancialHeaderCell>
            ))}
          </tr>
            </FinancialTableHeader>

            <FinancialTableBody>
          {/* Annual Revenue Row */}
          <tr>
            <FinancialDataCell isMetricLabel>
              <FinancialMetricLabel 
                title="Annual Revenue"
                description="Total revenue expected for the fiscal year"
              />
            </FinancialDataCell>
            <FinancialDataCell>
              {formatCurrency(lastYearRevenue)}
            </FinancialDataCell>
            {dealTiers.map((tier) => (
              <FinancialDataCell key={`revenue-${tier.tierNumber}`}>
                <FinancialInputField
                  type="currency"
                  value={tier.annualRevenue}
                  onChange={(value) => updateTier(tier.tierNumber, { annualRevenue: value })}
                  placeholder="0.00"
                />
              </FinancialDataCell>
            ))}
          </tr>

          {/* Gross Margin Row */}
          <tr>
            <FinancialDataCell isMetricLabel>
              <FinancialMetricLabel 
                title="Gross Margin"
                description="Percentage of revenue retained after direct costs"
              />
            </FinancialDataCell>
            <FinancialDataCell>
              {formatPercentage(lastYearGrossMargin / 100)}
            </FinancialDataCell>
            {dealTiers.map((tier) => (
              <FinancialDataCell key={`margin-${tier.tierNumber}`}>
                <FinancialInputField
                  type="percentage"
                  value={tier.annualGrossMargin}
                  onChange={(value) => updateTier(tier.tierNumber, { annualGrossMargin: value })}
                  placeholder="0.00"
                  min={0}
                  max={100}
                />
              </FinancialDataCell>
            ))}
          </tr>

          {/* Gross Profit Row */}
          <tr>
            <FinancialDataCell isMetricLabel>
              <FinancialMetricLabel 
                title="Gross Profit"
                description="Actual dollar amount retained after direct costs"
              />
            </FinancialDataCell>
            <FinancialDataCell>
              {formatCurrency(lastYearGrossProfit)}
            </FinancialDataCell>
            {dealTiers.map((tier) => {
              const grossProfit = calculationService.calculateBasicGrossProfit(tier);
              return (
                <FinancialDataCell key={`profit-${tier.tierNumber}`}>
                  {formatCurrency(grossProfit)}
                </FinancialDataCell>
              );
            })}
          </tr>

          {/* Revenue Growth Rate Row */}
          <tr>
            <FinancialDataCell isMetricLabel>
              <FinancialMetricLabel 
                title="Revenue Growth Rate"
                description="Percentage increase compared to last year"
              />
            </FinancialDataCell>
            <FinancialDataCell>
              <span className="text-slate-500">—</span>
            </FinancialDataCell>
            {dealTiers.map((tier) => {
              const growthRate = calculationService.calculateRevenueGrowthRate(
                tier,
                salesChannel,
                advertiserName,
                agencyName
              );
              return (
                <FinancialDataCell key={`rev-growth-${tier.tierNumber}`}>
                  <GrowthIndicator value={growthRate} />
                </FinancialDataCell>
              );
            })}
          </tr>

          {/* Gross Margin Growth Rate Row - Revenue & Profitability table shows basic rates */}
          <tr>
            <FinancialDataCell isMetricLabel>
              <FinancialMetricLabel 
                title="Gross Margin Growth Rate"
                description="Change in margin percentage vs last year"
              />
            </FinancialDataCell>
            <FinancialDataCell>
              <span className="text-slate-500">—</span>
            </FinancialDataCell>
            {dealTiers.map((tier) => {
              const marginGrowthRate = calculationService.calculateGrossMarginGrowthRate(
                tier,
                salesChannel,
                advertiserName,
                agencyName
              );
              return (
                <FinancialDataCell key={`margin-growth-${tier.tierNumber}`}>
                  <GrowthIndicator value={marginGrowthRate} />
                </FinancialDataCell>
              );
            })}
          </tr>

          {/* Gross Profit Growth Rate Row - Revenue & Profitability table shows basic rates */}
          <tr>
            <FinancialDataCell isMetricLabel>
              <FinancialMetricLabel 
                title="Gross Profit Growth Rate"
                description="Change in dollar profit amount vs last year"
              />
            </FinancialDataCell>
            <FinancialDataCell>
              <span className="text-slate-500">—</span>
            </FinancialDataCell>
            {dealTiers.map((tier) => {
              const profitGrowthRate = calculationService.calculateProfitGrowthRate(
                tier,
                salesChannel,
                advertiserName,
                agencyName
              );
              return (
                <FinancialDataCell key={`profit-growth-${tier.tierNumber}`}>
                  <GrowthIndicator value={profitGrowthRate} />
                </FinancialDataCell>
              );
            })}
          </tr>
            </FinancialTableBody>
          </FinancialTable>
    </FinancialSection>
  );
}