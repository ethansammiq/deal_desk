import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { 
  Users, 
  UserCog, 
  Shield, 
  Building, 
  Edit, 
  Check,
  X
} from 'lucide-react';
import { UserRole, DepartmentType } from '@shared/schema';
import { apiRequest } from '@/lib/queryClient';

interface User {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  department?: DepartmentType;
  isActive: boolean;
  createdAt: string;
  lastRoleChange?: string;
}

interface RoleAssignment {
  userId: number;
  role: UserRole;
  department?: DepartmentType;
  reason: string;
}

export function UserManagementPanel() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [assignmentData, setAssignmentData] = useState<Partial<RoleAssignment>>({});
  const [dialogOpen, setDialogOpen] = useState(false);

  // Fetch all users
  const { data: users = [], isLoading } = useQuery<User[]>({
    queryKey: ['/api/admin/users'],
    staleTime: 30000
  });

  // Fetch available roles and departments
  const { data: availableRoles = [] } = useQuery<{ role: UserRole; description: string }[]>({
    queryKey: ['/api/admin/available-roles'],
    staleTime: 300000
  });

  const { data: departments = [] } = useQuery<{ department: string; displayName: string }[]>({
    queryKey: ['/api/approval-departments'],
    staleTime: 300000
  });

  // Role assignment mutation
  const assignRoleMutation = useMutation({
    mutationFn: async (data: RoleAssignment) => {
      await apiRequest(`/api/admin/users/${data.userId}/assign-role`, {
        method: 'POST',
        body: JSON.stringify({
          role: data.role,
          department: data.department,
          reason: data.reason
        })
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      toast({
        title: "Role Updated",
        description: "User role and permissions have been updated successfully."
      });
      setDialogOpen(false);
      setSelectedUser(null);
      setAssignmentData({});
    },
    onError: (error: any) => {
      toast({
        title: "Assignment Failed",
        description: error.message || "Failed to update user role.",
        variant: "destructive"
      });
    }
  });

  const handleRoleAssignment = () => {
    if (!selectedUser || !assignmentData.role) {
      return;
    }

    assignRoleMutation.mutate({
      userId: selectedUser.id,
      role: assignmentData.role,
      department: assignmentData.department,
      reason: assignmentData.reason || 'Admin assignment'
    });
  };

  const openAssignmentDialog = (user: User) => {
    setSelectedUser(user);
    setAssignmentData({
      role: user.role,
      department: user.department,
      reason: ''
    });
    setDialogOpen(true);
  };

  const getRoleColor = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800';
      case 'approver':
        return 'bg-purple-100 text-purple-800';
      case 'department_reviewer':
        return 'bg-blue-100 text-blue-800';
      case 'legal':
        return 'bg-green-100 text-green-800';
      case 'seller':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getDepartmentBadge = (department?: DepartmentType) => {
    if (!department) return null;
    
    return (
      <Badge variant="outline" className="text-xs">
        <Building className="h-3 w-3 mr-1" />
        {departments.find(d => d.department === department)?.displayName || department}
      </Badge>
    );
  };

  const requiresDepartment = (role: UserRole) => {
    return role === 'department_reviewer';
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Loading Users...</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-200 rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Users className="h-6 w-6" />
            User Management
          </h1>
          <p className="text-gray-600">Manage user roles and department assignments</p>
        </div>
      </div>

      {/* User Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-2xl font-bold">{users.length}</p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Department Reviewers</p>
                <p className="text-2xl font-bold">
                  {users.filter(u => u.role === 'department_reviewer').length}
                </p>
              </div>
              <UserCog className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Approvers</p>
                <p className="text-2xl font-bold">
                  {users.filter(u => u.role === 'approver').length}
                </p>
              </div>
              <Shield className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Users</p>
                <p className="text-2xl font-bold">
                  {users.filter(u => u.isActive).length}
                </p>
              </div>
              <Check className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Users</CardTitle>
          <CardDescription>
            Manage user roles and department assignments
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">
                        {user.firstName && user.lastName 
                          ? `${user.firstName} ${user.lastName}` 
                          : user.username}
                      </div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getRoleColor(user.role)}>
                      {user.role.replace('_', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {getDepartmentBadge(user.department)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.isActive ? "default" : "secondary"}>
                      {user.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openAssignmentDialog(user)}
                      className="flex items-center gap-1"
                    >
                      <Edit className="h-3 w-3" />
                      Edit
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Role Assignment Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Assign Role & Department</DialogTitle>
          </DialogHeader>
          
          {selectedUser && (
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium">User</Label>
                <p className="text-sm text-gray-600">
                  {selectedUser.firstName && selectedUser.lastName 
                    ? `${selectedUser.firstName} ${selectedUser.lastName}` 
                    : selectedUser.username}
                </p>
              </div>

              <div>
                <Label htmlFor="role" className="text-sm font-medium">Role</Label>
                <Select 
                  value={assignmentData.role} 
                  onValueChange={(value) => 
                    setAssignmentData(prev => ({ ...prev, role: value as UserRole }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableRoles.map((role) => (
                      <SelectItem key={role.role} value={role.role}>
                        {role.role.replace('_', ' ')} - {role.description}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {requiresDepartment(assignmentData.role as UserRole) && (
                <div>
                  <Label htmlFor="department" className="text-sm font-medium">Department</Label>
                  <Select 
                    value={assignmentData.department} 
                    onValueChange={(value) => 
                      setAssignmentData(prev => ({ ...prev, department: value as DepartmentType }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map((dept) => (
                        <SelectItem key={dept.department} value={dept.department}>
                          {dept.displayName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="flex gap-2 pt-4">
                <Button
                  onClick={handleRoleAssignment}
                  disabled={assignRoleMutation.isPending}
                  className="flex-1"
                >
                  {assignRoleMutation.isPending ? 'Updating...' : 'Update Role'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                  disabled={assignRoleMutation.isPending}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}