// Phase 7B: Role switcher component for testing different user permissions
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UserRoleBadge } from "@/components/ui/user-role-badge";
import { useQueryClient } from "@tanstack/react-query";
import { RefreshCw, User } from "lucide-react";
import type { UserRole } from "@shared/schema";
import { getRoleDisplayName } from "@shared/auth";

interface RoleSwitcherProps {
  currentRole: UserRole;
  onRoleChange?: (newRole: UserRole) => void;
  className?: string;
}

export function RoleSwitcher({ currentRole, onRoleChange, className }: RoleSwitcherProps) {
  const [selectedRole, setSelectedRole] = useState<UserRole>(currentRole);
  const [isChanging, setIsChanging] = useState(false);
  const queryClient = useQueryClient();

  const roles: { value: UserRole; label: string; description: string }[] = [
    {
      value: "seller",
      label: "Sales Representative",
      description: "Can create and submit deals for review"
    },
    {
      value: "approver", 
      label: "Deal Approver",
      description: "Can review, approve, and reject deals"
    },
    {
      value: "legal",
      label: "Legal Team",
      description: "Can manage legal review and contracts"
    }
  ];

  const handleRoleSwitch = async () => {
    if (selectedRole === currentRole) return;
    
    setIsChanging(true);
    
    // Simulate role change by updating the mock user data
    // In a real app, this would call an API to update the user's session
    setTimeout(() => {
      // Update the mock getCurrentUser function's return value
      localStorage.setItem('demo_user_role', selectedRole);
      
      // Invalidate all queries to refresh data with new permissions
      queryClient.invalidateQueries();
      
      // Call the callback if provided
      onRoleChange?.(selectedRole);
      
      setIsChanging(false);
      
      // Force page reload to ensure all components re-render with new role
      window.location.reload();
    }, 1000);
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <User className="h-5 w-5" />
          <span>Role Switcher (Demo Mode)</span>
        </CardTitle>
        <CardDescription>
          Switch between different user roles to test permissions and functionality
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Current Role:</p>
            <div className="flex items-center space-x-2 mt-1">
              <UserRoleBadge role={currentRole} />
              <span className="text-sm text-muted-foreground">
                {getRoleDisplayName(currentRole)}
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Switch to Role:</label>
          <Select 
            value={selectedRole} 
            onValueChange={(value) => setSelectedRole(value as UserRole)}
            disabled={isChanging}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {roles.map((role) => (
                <SelectItem key={role.value} value={role.value}>
                  <div className="flex items-center space-x-2">
                    <UserRoleBadge role={role.value} />
                    <div className="flex flex-col">
                      <span className="font-medium">{role.label}</span>
                      <span className="text-xs text-muted-foreground">
                        {role.description}
                      </span>
                    </div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button 
          onClick={handleRoleSwitch}
          disabled={selectedRole === currentRole || isChanging}
          className="w-full"
          variant={selectedRole === currentRole ? "outline" : "default"}
        >
          {isChanging ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Switching Role...
            </>
          ) : selectedRole === currentRole ? (
            "Current Role Selected"
          ) : (
            <>
              <RefreshCw className="h-4 w-4 mr-2" />
              Switch to {getRoleDisplayName(selectedRole)}
            </>
          )}
        </Button>

        {selectedRole !== currentRole && (
          <div className="p-3 bg-blue-50 rounded-md">
            <p className="text-sm text-blue-900 font-medium">Preview Changes:</p>
            <p className="text-sm text-blue-700 mt-1">
              Switching to <Badge variant="outline" className="mx-1">{selectedRole}</Badge> 
              will reload the page and update all permissions, dashboard sections, and available actions.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}