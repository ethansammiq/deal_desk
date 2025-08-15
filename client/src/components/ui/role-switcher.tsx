import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { UserRole } from '@shared/schema';
import { useCurrentUser } from '@/hooks/useAuth';

const roleDescriptions = {
  seller: "Creates and manages deal submissions",
  department_reviewer: "Technical review within assigned department (including legal)", 
  approver: "Business approval authority across all deals",
  admin: "Full system access and user management"
};

const departmentOptions = [
  { value: 'trading', label: 'Trading' },
  { value: 'finance', label: 'Finance' },
  { value: 'creative', label: 'Creative' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'product', label: 'Product' },
  { value: 'solutions', label: 'Solutions' },
  { value: 'legal', label: 'Legal' }
];

interface RoleSwitcherProps {
  currentRole: UserRole;
  onRoleChange?: (role: UserRole, department?: string) => void;
}

export function RoleSwitcher({ currentRole, onRoleChange }: RoleSwitcherProps) {
  const { data: currentUser } = useCurrentUser();
  const [selectedRole, setSelectedRole] = React.useState<UserRole>(currentRole);
  const [selectedDepartment, setSelectedDepartment] = React.useState<string | undefined>(currentUser?.department);

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
    if (role !== 'department_reviewer') {
      setSelectedDepartment(undefined);
    }
  };

  const handleSwitch = () => {
    if (onRoleChange) {
      onRoleChange(selectedRole, selectedDepartment);
    }
    
    // Update localStorage for demo role switching
    if (typeof window !== 'undefined') {
      localStorage.setItem('demo_user_role', selectedRole);
      if (selectedDepartment) {
        localStorage.setItem('demo_user_department', selectedDepartment);
      } else {
        localStorage.removeItem('demo_user_department');
      }
      // Refresh the page to apply the role change
      window.location.reload();
    }
  };

  const requiresDepartment = selectedRole === 'department_reviewer';

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">Select Role</label>
        <Select value={selectedRole} onValueChange={handleRoleSelect}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(roleDescriptions).map(([role, description]) => (
              <SelectItem key={role} value={role}>
                <div className="flex flex-col items-start">
                  <span className="font-medium capitalize">{role.replace('_', ' ')}</span>
                  <span className="text-xs text-gray-500">{description}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {requiresDepartment && (
        <div className="space-y-2">
          <label className="text-sm font-medium">Select Department</label>
          <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
            <SelectTrigger>
              <SelectValue placeholder="Choose department" />
            </SelectTrigger>
            <SelectContent>
              {departmentOptions.map((dept) => (
                <SelectItem key={dept.value} value={dept.value}>
                  {dept.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedDepartment && (
            <div className="text-xs text-gray-500">
              {selectedDepartment === 'legal' ? 'Legal department reviewers get special legal permissions' : 'Technical review for your department'}
            </div>
          )}
        </div>
      )}

      <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
        <Badge variant="outline">Preview</Badge>
        <span className="text-sm">
          {selectedRole.replace('_', ' ')} 
          {selectedDepartment && ` (${departmentOptions.find(d => d.value === selectedDepartment)?.label})`}
        </span>
      </div>

      <Button 
        onClick={handleSwitch}
        disabled={requiresDepartment && !selectedDepartment}
        className="w-full"
      >
        Switch to Role
      </Button>
    </div>
  );
}