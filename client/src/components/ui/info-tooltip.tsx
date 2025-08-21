import React from "react";
import { Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface InfoTooltipProps {
  content: string | React.ReactNode;
  children?: React.ReactNode;
  side?: "top" | "right" | "bottom" | "left";
  align?: "start" | "center" | "end";
  className?: string;
  triggerClassName?: string;
  contentClassName?: string;
}

/**
 * Unified tooltip component that provides consistent Info icon tooltips
 * across the application. This replaces manual TooltipProvider implementations.
 */
export function InfoTooltip({
  content,
  children,
  side = "top",
  align = "center",
  className,
  triggerClassName,
  contentClassName,
}: InfoTooltipProps) {
  const trigger = children || (
    <Info className={`h-4 w-4 text-gray-400 hover:text-gray-600 cursor-help ${triggerClassName || ""}`} />
  );

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild className={className}>
          {trigger}
        </TooltipTrigger>
        <TooltipContent side={side} align={align} className={contentClassName}>
          {typeof content === "string" ? (
            <p className="max-w-xs">{content}</p>
          ) : (
            content
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}