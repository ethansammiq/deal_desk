import { Progress } from "@/components/ui/progress";
import { DEAL_STATUS_FLOW, DEAL_STATUS_LABELS, type DealStatus } from "@shared/schema";

interface StatusProgressBarProps {
  currentStatus: DealStatus;
  className?: string;
}

export function StatusProgressBar({ currentStatus, className = "" }: StatusProgressBarProps) {
  // Calculate progress percentage based on status position in flow
  const currentIndex = DEAL_STATUS_FLOW.indexOf(currentStatus);
  const totalSteps = DEAL_STATUS_FLOW.length;
  
  // Handle lost status separately (not part of normal flow)
  if (currentStatus === "lost") {
    return (
      <div className={`space-y-2 ${className}`}>
        <div className="flex justify-between text-sm">
          <span className="text-slate-600">Deal Progress</span>
          <span className="text-red-600 font-medium">Lost</span>
        </div>
        <Progress value={0} className="h-2 bg-red-100" />
        <div className="text-xs text-red-500">Deal was not completed</div>
      </div>
    );
  }
  
  // Calculate progress (add 1 to include current step as completed)
  const progress = currentIndex >= 0 ? ((currentIndex + 1) / totalSteps) * 100 : 0;
  
  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex justify-between text-sm">
        <span className="text-slate-600">Deal Progress</span>
        <span className="text-slate-800 font-medium">
          {DEAL_STATUS_LABELS[currentStatus]} ({currentIndex + 1}/{totalSteps})
        </span>
      </div>
      
      <Progress 
        value={progress} 
        className="h-2"
      />
      
      <div className="flex justify-between text-xs text-slate-500">
        <span>Scoping</span>
        <span>Signed</span>
      </div>
      
      {/* Status steps indicator */}
      <div className="flex justify-between">
        {DEAL_STATUS_FLOW.map((status, index) => (
          <div
            key={status}
            className={`w-3 h-3 rounded-full border-2 ${
              index <= currentIndex
                ? "bg-primary border-primary"
                : "bg-white border-slate-300"
            }`}
            title={DEAL_STATUS_LABELS[status]}
          />
        ))}
      </div>
    </div>
  );
}