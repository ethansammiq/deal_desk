import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, Info } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useDealCalculations } from "@/hooks/useDealCalculations";
import { useTierManagement } from "@/hooks/useTierManagement";

// Import unified interface from hook
import { DealTier } from "@/hooks/useDealTiers";
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
import { formatCurrency, formatPercentage } from "@/lib/utils";

interface FinancialTierTableProps {
  dealTiers: DealTier[];
  setDealTiers: (tiers: DealTier[]) => void;
  lastYearRevenue?: number;
  lastYearGrossMargin?: number;
  isFlat?: boolean;
}

export function FinancialTierTable({
  dealTiers,
  setDealTiers,
  lastYearRevenue = 850000,
  lastYearGrossMargin = 35.0,
  isFlat = false,
}: FinancialTierTableProps) {
  const { 
    calculationService 
  } = useDealCalculations();

  const { addTier, removeTier, updateTier } = useTierManagement({
    dealTiers,
    setDealTiers,
    isFlat
  });

  // Calculate last year's gross profit
  const lastYearGrossProfit = lastYearRevenue * (lastYearGrossMargin / 100);

  return (
    <FinancialSection title="Revenue & Profitability">
      <Accordion type="single" collapsible defaultValue="revenue">
        <AccordionItem value="revenue">
          <div className="flex items-center justify-between">
            <AccordionTrigger>
              Financial Details
            </AccordionTrigger>
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
          </div>
          <AccordionContent>
            {/* Info banner */}
            <div className="p-3 bg-blue-50 border border-blue-100 rounded text-sm text-blue-800 mb-4">
              <Info className="h-4 w-4 inline mr-2" />
              {isFlat 
                ? "This section shows revenue targets and profitability metrics for your flat commit deal. Add Tier is disabled for flat commit structures."
                : "This section details revenue targets, gross margin percentages, and calculated profitability metrics for each tier. Key metrics include Revenue Growth Rate and Gross Margin Growth Rate compared to last year's performance."
              }
            </div>

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
                <div className="flex items-center">
                  <span className="text-sm text-slate-500 mr-1">$</span>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={tier.annualRevenue || ""}
                    onChange={(e) => {
                      const value = e.target.value === "" ? undefined : parseFloat(e.target.value);
                      updateTier(tier.tierNumber, { annualRevenue: value });
                    }}
                    className="text-center border-0 bg-transparent p-1 text-sm"
                  />
                </div>
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
                <div className="flex items-center">
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    placeholder="0.00"
                    value={((tier.annualGrossMargin || 0) * 100).toString() || ""}
                    onChange={(e) => {
                      const value = e.target.value === "" ? 0 : parseFloat(e.target.value) / 100;
                      updateTier(tier.tierNumber, { annualGrossMargin: value });
                    }}
                    className="text-center border-0 bg-transparent p-1 text-sm"
                  />
                  <span className="text-sm text-slate-500 ml-1">%</span>
                </div>
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
              const grossProfit = (tier.annualRevenue || 0) * (tier.annualGrossMargin || 0);
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
              const serviceTier = {
                tierNumber: tier.tierNumber,
                annualRevenue: tier.annualRevenue,
                annualGrossMargin: tier.annualGrossMargin
              };
              const growthRate = calculationService.calculateRevenueGrowthRate(
                serviceTier,
                "independent_agency"
              );
              return (
                <FinancialDataCell key={`rev-growth-${tier.tierNumber}`}>
                  <GrowthIndicator value={growthRate} />
                </FinancialDataCell>
              );
            })}
          </tr>

          {/* Gross Margin Growth Rate Row */}
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
              const serviceTier = {
                tierNumber: tier.tierNumber,
                annualRevenue: tier.annualRevenue,
                annualGrossMargin: tier.annualGrossMargin
              };
              const marginGrowthRate = calculationService.calculateGrossMarginGrowthRate(
                serviceTier,
                "independent_agency"
              );
              return (
                <FinancialDataCell key={`margin-growth-${tier.tierNumber}`}>
                  <GrowthIndicator value={marginGrowthRate} />
                </FinancialDataCell>
              );
            })}
          </tr>

          {/* Gross Profit Growth Rate Row */}
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
              const serviceTier = {
                tierNumber: tier.tierNumber,
                annualRevenue: tier.annualRevenue,
                annualGrossMargin: tier.annualGrossMargin
              };
              const profitGrowthRate = calculationService.calculateProfitGrowthRate(
                serviceTier,
                "independent_agency"
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
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </FinancialSection>
  );
}