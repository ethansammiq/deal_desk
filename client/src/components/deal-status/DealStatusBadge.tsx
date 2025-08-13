import { Badge } from "@/components/ui/badge";
import { DEAL_STATUS_LABELS, type DealStatus } from "@shared/schema";

interface DealStatusBadgeProps {
  status: DealStatus;
  className?: string;
}

// Phase 7A: Status variant mapping for visual consistency
const statusVariants: Record<DealStatus, "default" | "secondary" | "destructive" | "outline"> = {
  scoping: "outline",
  submitted: "secondary", 
  under_review: "default",
  negotiating: "default",
  approved: "default",
  legal_review: "default", 
  contract_sent: "default",
  signed: "default",
  lost: "destructive"
};

// Status color classes for enhanced styling
const statusColors: Record<DealStatus, string> = {
  scoping: "bg-slate-100 text-slate-700 border-slate-300",
  submitted: "bg-blue-100 text-blue-700 border-blue-300",
  under_review: "bg-yellow-100 text-yellow-700 border-yellow-300", 
  negotiating: "bg-orange-100 text-orange-700 border-orange-300",
  approved: "bg-green-100 text-green-700 border-green-300",
  legal_review: "bg-purple-100 text-purple-700 border-purple-300",
  contract_sent: "bg-indigo-100 text-indigo-700 border-indigo-300",
  signed: "bg-emerald-100 text-emerald-700 border-emerald-300", 
  lost: "bg-red-100 text-red-700 border-red-300"
};

export function DealStatusBadge({ status, className = "" }: DealStatusBadgeProps) {
  const label = DEAL_STATUS_LABELS[status] || status;
  const variant = statusVariants[status] || "default";
  const colorClass = statusColors[status] || "";
  
  return (
    <Badge 
      variant={variant}
      className={`${colorClass} ${className}`}
    >
      {label}
    </Badge>
  );
}