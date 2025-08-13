// Phase 7B: User profile header component
import { Card, CardContent } from "@/components/ui/card";
import { UserRoleBadge } from "@/components/ui/user-role-badge";
import { useMockAuth } from "@/hooks/useAuth";
import { User, Building2 } from "lucide-react";

export function UserProfileHeader() {
  const { user, displayName, roleDisplayName } = useMockAuth();

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center space-x-4">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <div className="flex items-center space-x-2">
              <h3 className="font-semibold text-lg">{displayName}</h3>
              <UserRoleBadge role={user.role} />
            </div>
            <div className="flex items-center space-x-1 text-sm text-muted-foreground">
              {user.department && (
                <>
                  <Building2 className="h-3 w-3" />
                  <span>{user.department}</span>
                  <span>•</span>
                </>
              )}
              <span>{user.email}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}