import { Badge } from "@/components/ui/badge";
import { DEAL_STATUS_LABELS, type DealStatus } from "@shared/schema";

interface DealStatusBadgeProps {
  status: DealStatus;
  className?: string;
}

// Phase 8: Enhanced status variant mapping with new statuses
const statusVariants: Record<DealStatus, "default" | "secondary" | "destructive" | "outline"> = {
  draft: "outline",
  scoping: "outline",
  submitted: "secondary", 
  under_review: "default",
  revision_requested: "default",
  negotiating: "default",
  approved: "default",
  contract_drafting: "default", 
  client_review: "default",
  signed: "default",
  lost: "destructive"
};

// Phase 8: Enhanced status color classes with new statuses
const statusColors: Record<DealStatus, string> = {
  draft: "bg-slate-100 text-slate-600 border-slate-200",
  scoping: "bg-slate-100 text-slate-700 border-slate-300",
  submitted: "bg-blue-100 text-blue-700 border-blue-300",
  under_review: "bg-yellow-100 text-yellow-700 border-yellow-300", 
  revision_requested: "bg-amber-100 text-amber-700 border-amber-300",
  negotiating: "bg-orange-100 text-orange-700 border-orange-300",
  approved: "bg-green-100 text-green-700 border-green-300",
  contract_drafting: "bg-purple-100 text-purple-700 border-purple-300",
  client_review: "bg-indigo-100 text-indigo-700 border-indigo-300",
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