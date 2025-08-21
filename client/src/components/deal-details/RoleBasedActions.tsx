import { Button } from "@/components/ui/button";
import { CheckCircle, Edit, MessageSquare, Share2, FileText } from "lucide-react";
import { Deal } from "@shared/schema";

type UserRole = 'seller' | 'approver' | 'legal' | 'admin' | 'department_reviewer';

interface RoleBasedActionsProps {
  deal: Deal;
  userRole: UserRole;
  onApprove?: () => void;
  onEdit?: () => void;
  onRequestRevision?: () => void;
  onResubmit?: () => void;
  isLoading?: boolean;
}

export function RoleBasedActions({ 
  deal, 
  userRole, 
  onApprove, 
  onEdit, 
  onRequestRevision, 
  onResubmit,
  isLoading 
}: RoleBasedActionsProps) {
  
  const getPrimaryAction = () => {
    if (userRole === 'approver' && deal.status === 'under_review') {
      return (
        <Button 
          onClick={onApprove} 
          disabled={isLoading}
          size="lg"
          className="bg-green-600 hover:bg-green-700"
        >
          <CheckCircle className="h-4 w-4 mr-2" />
          Approve Deal
        </Button>
      );
    }
    
    if (userRole === 'seller' && deal.status === 'revision_requested') {
      return (
        <Button 
          onClick={onResubmit} 
          disabled={isLoading}
          size="lg"
          className="bg-blue-600 hover:bg-blue-700"
        >
          <FileText className="h-4 w-4 mr-2" />
          Resubmit Deal
        </Button>
      );
    }
    
    if (userRole === 'seller' && (deal.status === 'draft' || deal.status === 'revision_requested')) {
      return (
        <Button 
          onClick={onEdit} 
          disabled={isLoading}
          size="lg"
        >
          <Edit className="h-4 w-4 mr-2" />
          Edit Deal
        </Button>
      );
    }
    
    if ((userRole === 'department_reviewer' || userRole === 'legal') && deal.status === 'under_review') {
      return (
        <Button 
          onClick={onRequestRevision} 
          disabled={isLoading}
          variant="outline"
          size="lg"
          className="border-amber-300 text-amber-700 hover:bg-amber-50"
        >
          <MessageSquare className="h-4 w-4 mr-2" />
          Request Changes
        </Button>
      );
    }
    
    return null;
  };

  const getSecondaryActions = () => {
    const actions = [];
    
    // Share action - available to all roles
    actions.push(
      <Button key="share" variant="outline" size="sm">
        <Share2 className="h-4 w-4 mr-2" />
        Share Deal
      </Button>
    );
    
    // Generate Report - available to approvers and sellers
    if (userRole === 'approver' || userRole === 'seller') {
      actions.push(
        <Button key="report" variant="outline" size="sm">
          <FileText className="h-4 w-4 mr-2" />
          Generate Report
        </Button>
      );
    }
    
    return actions;
  };

  const primaryAction = getPrimaryAction();
  const secondaryActions = getSecondaryActions();

  if (!primaryAction && secondaryActions.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-3">
      {primaryAction}
      {secondaryActions.length > 0 && (
        <div className="flex items-center gap-2">
          {secondaryActions}
        </div>
      )}
    </div>
  );
}