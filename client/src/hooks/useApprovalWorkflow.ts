import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

/**
 * Custom hook for managing approval workflow operations
 * Provides methods for initiating, updating, and tracking approval workflows
 */
export function useApprovalWorkflow(dealId: number) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch approval status for a deal
  const {
    data: approvalStatus,
    isLoading: isLoadingStatus,
    error: statusError
  } = useQuery<any>({
    queryKey: [`/api/deals/${dealId}/approval-status`],
    enabled: !!dealId
  });

  // Fetch deal approvals with action history
  const {
    data: approvals,
    isLoading: isLoadingApprovals
  } = useQuery<any[]>({
    queryKey: [`/api/deals/${dealId}/approvals`],
    enabled: !!dealId
  });

  // Fetch approval departments
  const { data: departments } = useQuery<any[]>({
    queryKey: ['/api/approval-departments']
  });

  // Initiate approval workflow
  const initiateWorkflow = useMutation({
    mutationFn: async (workflowData: {
      incentiveTypes: string[];
      dealValue: number;
      initiatedBy: number;
    }) => {
      const response = await fetch(`/api/deals/${dealId}/initiate-approval`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(workflowData)
      });
      
      if (!response.ok) {
        throw new Error('Failed to initiate approval workflow');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Approval Workflow Initiated",
        description: `${data.approvals.length} approval requirements created across ${data.workflow.totalStages} stages.`
      });
      
      // Invalidate and refetch approval data
      queryClient.invalidateQueries({ queryKey: [`/api/deals/${dealId}/approval-status`] });
      queryClient.invalidateQueries({ queryKey: [`/api/deals/${dealId}/approvals`] });
    },
    onError: (error) => {
      toast({
        title: "Failed to Initiate Workflow",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Update approval status
  const updateApproval = useMutation({
    mutationFn: async ({
      approvalId,
      status,
      comments,
      reviewedBy
    }: {
      approvalId: number;
      status: 'approved' | 'rejected' | 'revision_requested';
      comments: string;
      reviewedBy: number;
    }) => {
      const response = await fetch(`/api/deals/${dealId}/approvals/${approvalId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, comments, reviewedBy })
      });
      
      if (!response.ok) {
        throw new Error('Failed to update approval');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Approval Updated",
        description: "The approval status has been updated successfully."
      });
      
      // Invalidate and refetch approval data
      queryClient.invalidateQueries({ queryKey: [`/api/deals/${dealId}/approval-status`] });
      queryClient.invalidateQueries({ queryKey: [`/api/deals/${dealId}/approvals`] });
    },
    onError: (error) => {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Create new approval requirement
  const createApproval = useMutation({
    mutationFn: async (approvalData: {
      approvalStage: number;
      departmentName: string;
      requiredRole: string;
      priority: 'low' | 'normal' | 'high';
      dueDate: Date;
    }) => {
      const response = await fetch(`/api/deals/${dealId}/approvals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(approvalData)
      });
      
      if (!response.ok) {
        throw new Error('Failed to create approval requirement');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Approval Requirement Created",
        description: "New approval requirement has been added to the workflow."
      });
      
      // Invalidate and refetch approval data
      queryClient.invalidateQueries({ queryKey: [`/api/deals/${dealId}/approval-status`] });
      queryClient.invalidateQueries({ queryKey: [`/api/deals/${dealId}/approvals`] });
    },
    onError: (error) => {
      toast({
        title: "Creation Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Helper functions
  const getApprovalsByStage = (stage: number) => {
    return Array.isArray(approvals) ? approvals.filter((approval: any) => approval.approvalStage === stage) : [];
  };

  const getPendingApprovals = () => {
    return Array.isArray(approvals) ? approvals.filter((approval: any) => approval.status === 'pending') : [];
  };

  const getCompletedApprovals = () => {
    return Array.isArray(approvals) ? approvals.filter((approval: any) => 
      approval.status === 'approved' || approval.status === 'rejected'
    ) : [];
  };

  const getDepartmentDisplayName = (departmentName: string) => {
    const dept = Array.isArray(departments) ? departments.find((d: any) => d.departmentName === departmentName) : null;
    return dept?.displayName || departmentName.charAt(0).toUpperCase() + departmentName.slice(1);
  };

  const canUserReview = (approval: any, userRole: string, userDepartment?: string) => {
    // Admin can review any approval
    if (userRole === 'admin') return true;
    
    // Department reviewers can review approvals for their department
    if (userRole === 'department_reviewer' && userDepartment === approval.departmentName) {
      return true;
    }
    
    // Users can review approvals that require their specific role
    if (approval.requiredRole === userRole) return true;
    
    return false;
  };

  const getWorkflowProgress = () => {
    if (!approvalStatus) return { percentage: 0, currentStage: 1, isComplete: false };
    
    return {
      percentage: approvalStatus.progressPercentage || 0,
      currentStage: approvalStatus.currentStage || 1,
      isComplete: approvalStatus.isComplete || false,
      totalStages: Math.max(...(Array.isArray(approvals) ? approvals.map((a: any) => a.approvalStage) : [1]))
    };
  };

  return {
    // Data
    approvalStatus,
    approvals,
    departments,
    
    // Loading states
    isLoadingStatus,
    isLoadingApprovals,
    
    // Mutations
    initiateWorkflow,
    updateApproval,
    createApproval,
    
    // Helper functions
    getApprovalsByStage,
    getPendingApprovals,
    getCompletedApprovals,
    getDepartmentDisplayName,
    canUserReview,
    getWorkflowProgress,
    
    // Mutation states
    isInitiating: initiateWorkflow.isPending,
    isUpdating: updateApproval.isPending,
    isCreating: createApproval.isPending
  };
}

/**
 * Hook for managing approval departments
 */
export function useApprovalDepartments() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch all departments
  const {
    data: departments,
    isLoading,
    error
  } = useQuery({
    queryKey: ['/api/approval-departments']
  });

  // Fetch specific department
  const getDepartment = (departmentName: string) => {
    return useQuery({
      queryKey: [`/api/approval-departments/${departmentName}`],
      enabled: !!departmentName
    });
  };

  // Create or update department
  const saveDepartment = useMutation({
    mutationFn: async (departmentData: {
      departmentName: string;
      displayName: string;
      description: string;
      contactEmail?: string;
      incentiveTypes: string[];
      isActive: boolean;
    }) => {
      const response = await fetch('/api/approval-departments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(departmentData)
      });
      
      if (!response.ok) {
        throw new Error('Failed to save department');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Department Saved",
        description: "Department configuration has been updated successfully."
      });
      
      queryClient.invalidateQueries({ queryKey: ['/api/approval-departments'] });
    },
    onError: (error) => {
      toast({
        title: "Save Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  return {
    departments,
    isLoading,
    error,
    getDepartment,
    saveDepartment,
    isSaving: saveDepartment.isPending
  };
}