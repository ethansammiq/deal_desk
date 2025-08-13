// Phase 7B: User role badge component
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { UserRole } from "@shared/schema";

interface UserRoleBadgeProps {
  role: UserRole;
  className?: string;
}

export function UserRoleBadge({ role, className }: UserRoleBadgeProps) {
  const getRoleConfig = (role: UserRole) => {
    switch (role) {
      case "seller":
        return {
          label: "Sales Rep",
          variant: "default" as const,
          className: "bg-blue-100 text-blue-800 hover:bg-blue-200",
        };
      case "approver":
        return {
          label: "Approver",
          variant: "secondary" as const,
          className: "bg-green-100 text-green-800 hover:bg-green-200",
        };
      case "legal":
        return {
          label: "Legal",
          variant: "outline" as const,
          className: "bg-purple-100 text-purple-800 hover:bg-purple-200",
        };
      case "admin":
        return {
          label: "Admin",
          variant: "destructive" as const,
          className: "bg-red-100 text-red-800 hover:bg-red-200",
        };
      default:
        return {
          label: role,
          variant: "outline" as const,
          className: "bg-gray-100 text-gray-800 hover:bg-gray-200",
        };
    }
  };

  const config = getRoleConfig(role);

  return (
    <Badge
      variant={config.variant}
      className={cn(config.className, className)}
    >
      {config.label}
    </Badge>
  );
}