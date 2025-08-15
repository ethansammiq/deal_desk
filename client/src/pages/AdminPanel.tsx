import React from 'react';
import { UserManagementPanel } from '@/components/admin/UserManagementPanel';
import { useCurrentUser } from '@/hooks/useAuth';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';

export default function AdminPanel() {
  const { data: user } = useCurrentUser();
  
  // Check if user has admin permissions
  if (user?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md">
          <Alert className="border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              Access denied. Only administrators can access the admin panel.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <UserManagementPanel />
      </div>
    </div>
  );
}