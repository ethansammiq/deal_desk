import React from 'react';
import { cn } from '@/lib/utils';

/**
 * Shared styling components for financial tables across Deal Form sections
 * Ensures consistent appearance between Revenue & Profitability, Financial Summary, and Incentive Structure
 */

export interface FinancialTableProps {
  children: React.ReactNode;
  className?: string;
}

export interface FinancialSectionProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

export interface GrowthIndicatorProps {
  value: number;
  className?: string;
  showAsPercentage?: boolean;
}

/**
 * Main financial table container with consistent styling
 */
export function FinancialTable({ children, className }: FinancialTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className={cn("w-full border-collapse", className)}>
        {children}
      </table>
    </div>
  );
}

/**
 * Table header with consistent background and styling
 */
export function FinancialTableHeader({ children, className }: FinancialTableProps) {
  return (
    <thead className={className}>
      {children}
    </thead>
  );
}

/**
 * Header cell with consistent styling
 */
export function FinancialHeaderCell({ 
  children, 
  className,
  isMetricName = false 
}: { children?: React.ReactNode; className?: string; isMetricName?: boolean }) {
  return (
    <th className={cn(
      "p-3 border border-slate-200 font-medium text-slate-700",
      isMetricName ? "text-left bg-slate-100" : "text-center bg-slate-100",
      className
    )}>
      {children}
    </th>
  );
}

/**
 * Table body with consistent styling
 */
export function FinancialTableBody({ children, className }: FinancialTableProps) {
  return (
    <tbody className={className}>
      {children}
    </tbody>
  );
}

/**
 * Data cell with consistent styling
 */
export function FinancialDataCell({ 
  children, 
  className,
  isMetricLabel = false 
}: { children?: React.ReactNode; className?: string; isMetricLabel?: boolean }) {
  return (
    <td className={cn(
      "p-3 border border-slate-200",
      isMetricLabel ? "bg-slate-50" : "text-center font-medium",
      className
    )}>
      {children}
    </td>
  );
}

/**
 * Metric label with description styling
 */
export function FinancialMetricLabel({ 
  title, 
  description, 
  className 
}: { 
  title: string; 
  description?: string; 
  className?: string; 
}) {
  return (
    <div className={className}>
      <div className="font-medium text-slate-900">{title}</div>
      {description && (
        <div className="text-sm text-slate-500">{description}</div>
      )}
    </div>
  );
}

/**
 * Growth indicator with consistent color coding
 */
export function GrowthIndicator({ 
  value, 
  className, 
  showAsPercentage = true 
}: GrowthIndicatorProps) {
  const isNegative = value < 0;
  const isZero = value === 0;
  
  let colorClass = "text-slate-600";
  if (!isZero) {
    colorClass = isNegative ? "text-red-600" : "text-green-600";
  }
  
  const displayValue = showAsPercentage 
    ? `${(value * 100).toFixed(1)}%`
    : value.toLocaleString();
  
  return (
    <div className={cn(colorClass, className)}>
      {displayValue}
    </div>
  );
}

/**
 * Section container with consistent card styling
 */
export function FinancialSection({ title, children, className }: FinancialSectionProps) {
  return (
    <div className={cn("bg-white p-6 rounded-lg border border-slate-200 shadow-sm", className)}>
      <div className="space-y-4">
        <h4 className="text-lg font-semibold text-purple-600">{title}</h4>
        {children}
      </div>
    </div>
  );
}

/**
 * Column group helper for consistent table layout
 */
export function FinancialTableColGroup({ 
  dealTiers 
}: { 
  dealTiers: Array<{ tierNumber: number }> 
}) {
  return (
    <colgroup>
      <col className="w-[40%]" />
      <col className="w-[20%]" />
      {dealTiers.map((tier) => (
        <col key={`col-${tier.tierNumber}`} className="w-[20%]" />
      ))}
    </colgroup>
  );
}

/**
 * Helper function for currency formatting
 */
export function formatCurrency(amount: number): string {
  return `$${amount.toLocaleString()}`;
}

/**
 * Helper function for percentage formatting
 */
export function formatPercentage(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}