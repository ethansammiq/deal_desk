import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency, formatPercentage, type DealFinancialSummary } from "@/lib/utils";

interface FinancialMetricsGridProps {
  financialSummary: DealFinancialSummary;
}

export function FinancialMetricsGrid({ financialSummary }: FinancialMetricsGridProps) {
  return (
    <Card>
      <CardContent className="p-6">
        {/* Key Financial Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {formatCurrency(financialSummary.totalAnnualRevenue)}
            </div>
            <div className="text-sm text-gray-600">Total Revenue</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(financialSummary.totalGrossMargin)}
            </div>
            <div className="text-sm text-gray-600">Gross Margin</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">
              {formatCurrency(financialSummary.totalIncentiveValue)}
            </div>
            <div className="text-sm text-gray-600">Total Incentives</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {formatCurrency(financialSummary.projectedNetValue)}
            </div>
            <div className="text-sm text-gray-600">Net Value</div>
          </div>
        </div>

        {/* Additional Financial Details */}
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Effective Discount Rate</label>
              <p className="text-lg font-semibold">
                {formatPercentage(financialSummary.effectiveDiscountRate)}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Monthly Value</label>
              <p className="text-lg font-semibold">
                {formatCurrency(financialSummary.monthlyValue)}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">YoY Growth</label>
              <p className="text-lg font-semibold">
                {formatPercentage(financialSummary.yearOverYearGrowth)}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}