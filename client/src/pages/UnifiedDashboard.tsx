import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table";
import { DealStatusBadge } from "@/components/deal-status/DealStatusBadge";
import { QueryStateHandler, SectionLoading, ErrorState } from "@/components/ui/loading-states";
import { RevisionRequestModal } from "@/components/revision/RevisionRequestModal";
import { useCurrentUser } from "@/hooks/useAuth";
import { useDealConversion } from "@/hooks/useDealConversion";
import { useDealActions } from "@/hooks/useDealActions";
import { usePriorityItems } from "@/hooks/usePriorityItems";
import { PriorityBanner } from "@/components/dashboard/PriorityBanner";
import { useApprovalWorkflow } from "@/hooks/useApprovalWorkflow";
import { 
  BarChart3, 
  CheckCircle,
  XCircle,
  TrendingUp,
  PlusCircle,
  ArrowUpRight,
  MessageSquare,
  FileCheck,
  Clock,
  AlertTriangle
} from "lucide-react";
import { formatCurrency, cn } from "@/lib/utils";
import { Deal, type DealStatus, type UserRole } from "@shared/schema";
import { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";

// Updated stats interface with Close Rate instead of Success Rate
interface DealStats {
  totalDeals: number;
  activeDeals: number; // scoping through contract_sent
  completedDeals: number; // signed
  lostDeals: number; // lost
  closeRate: number; // signed / (signed + lost) * 100
  // Status breakdown for additional calculations
  scopingCount: number;
  submittedCount: number;
  underReviewCount: number;
  negotiatingCount: number;
  approvedCount: number;
  legalReviewCount: number;
  contractSentCount: number;
}

// Action type definition for role-based actions
interface DealAction {
  type: 'convert' | 'nudge' | 'approve' | 'legal_approve' | 'contract' | 'view' | 'override' | 'request_revision';
  label: string;
  variant: 'default' | 'outline' | 'secondary' | 'destructive';
  icon?: React.ComponentType<{ className?: string }>;
  onClick: (dealId: number) => void;
  visible: boolean;
}

// Action logic based on role and deal status
const getActionForDeal = (deal: Deal, userRole: UserRole, handlers: {
  onConvert: (dealId: number) => void;
  onNudge: (dealId: number, target: string) => void;
  onApprove: (dealId: number) => void;
  onLegalApprove: (dealId: number) => void;
  onSendContract: (dealId: number) => void;
  onRequestRevision: (dealId: number) => void;
  onView: (dealId: number) => void;
}): DealAction => {
  const { onConvert, onNudge, onApprove, onLegalApprove, onSendContract, onRequestRevision, onView } = handlers;

  // Seller actions
  if (userRole === 'seller') {
    if (deal.status === 'scoping') {
      return {
        type: 'convert',
        label: 'Convert to Deal',
        variant: 'default',
        icon: ArrowUpRight,
        onClick: onConvert,
        visible: true
      };
    }
    if (['under_review', 'legal_review', 'negotiating'].includes(deal.status)) {
      return {
        type: 'nudge',
        label: 'Send Nudge',
        variant: 'outline',
        icon: MessageSquare,
        onClick: (id) => onNudge(id, 'approver'),
        visible: true
      };
    }
  }
  
  // Approver actions  
  if (userRole === 'approver') {
    if (deal.status === 'under_review') {
      return {
        type: 'approve',
        label: 'Review & Approve',
        variant: 'default',
        icon: FileCheck,
        onClick: onApprove,
        visible: true
      };
    }
    if (deal.status === 'negotiating') {
      return {
        type: 'request_revision',
        label: 'Request Revision',
        variant: 'outline',
        icon: AlertTriangle,
        onClick: onRequestRevision,
        visible: true
      };
    }
    if (deal.status === 'contract_drafting') {
      return {
        type: 'nudge',
        label: 'Nudge Legal',
        variant: 'outline',
        icon: MessageSquare,
        onClick: (id) => onNudge(id, 'legal'),
        visible: true
      };
    }
  }
  
  // Legal actions
  if (userRole === 'legal') {
    if (deal.status === 'legal_review') {
      return {
        type: 'legal_approve',
        label: 'Legal Review',
        variant: 'default',
        icon: FileCheck,
        onClick: onLegalApprove,
        visible: true
      };
    }
    if (deal.status === 'approved') {
      return {
        type: 'contract',
        label: 'Send Contract',
        variant: 'default',
        icon: ArrowUpRight,
        onClick: onSendContract,
        visible: true
      };
    }
  }
  
  // Department Reviewer actions for approval workflow
  if (userRole === 'department_reviewer') {
    // Show approval actions for deals in review status
    if (deal.status === 'under_review' || deal.status === 'submitted') {
      return {
        type: 'approve',
        label: 'Review Approval',
        variant: 'default',
        icon: FileCheck,
        onClick: onView, // Navigate to deal details for full approval workflow
        visible: true
      };
    }
  }

  // Admin actions (can override any status)
  if (userRole === 'admin') {
    return {
      type: 'override',
      label: 'Manage',
      variant: 'secondary',
      onClick: onView,
      visible: true
    };
  }
  
  // Default view action
  return {
    type: 'view',
    label: 'View Details',
    variant: 'outline',
    onClick: onView,
    visible: true
  };
};

export default function UnifiedDashboard() {
  const { data: user } = useCurrentUser();
  const [revisionModalOpen, setRevisionModalOpen] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const { convertScopingToDeal } = useDealConversion();
  const { 
    sendNudge, 
    approveDeal, 
    legalApproveDeal, 
    sendContract,
    isUpdatingStatus,
    isSendingNudge 
  } = useDealActions();
  const userName = user?.firstName || user?.username || "User";
  const userRole = (user?.role as UserRole) || 'seller';
  const userDepartment = user?.department;

  // Fetch approval departments for department reviewer filtering
  const { data: departments = [] } = useQuery({
    queryKey: ['/api/approval-departments'],
    staleTime: 300000 // 5 minutes
  });

  // Fetch user's pending approvals if they are a department reviewer
  const { data: userPendingApprovals = [] } = useQuery({
    queryKey: [`/api/approvals/pending?department=${userDepartment}`],
    enabled: userRole === 'department_reviewer' && !!userDepartment,
    staleTime: 30000 // 30 seconds
  });

  // Get priority items for the current user
  const { 
    priorityItems, 
    priorityStats, 
    isLoading: priorityLoading 
  } = usePriorityItems(userRole);

  // Fetch deal statistics
  const { data: dealStats, isLoading: statsLoading } = useQuery<DealStats>({
    queryKey: ['/api/stats'],
    retry: 3,
    staleTime: 30000, // 30 seconds
  });

  // Fetch deals for the table
  const dealsQuery = useQuery<Deal[]>({
    queryKey: ['/api/deals'],
    retry: 3,
    staleTime: 30000, // 30 seconds
  });



  // Format relative date
  const formatRelativeDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diff = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
      
      if (diff === 0) return "Today";
      if (diff === 1) return "Yesterday";
      if (diff < 7) return `${diff} days ago`;
      if (diff < 30) return `${Math.floor(diff / 7)} week${Math.floor(diff / 7) !== 1 ? 's' : ''} ago`;
      return format(date, 'MMM d, yyyy');
    } catch (e) {
      return dateString || "Unknown date";
    }
  };

  // Action handlers
  const handleConvert = (dealId: number) => {
    convertScopingToDeal.mutate(dealId);
  };



  const handleNudge = (dealId: number, target: string) => {
    const nudgeMessages = {
      approver: "Please review this deal for approval. It has been waiting for your attention.",
      legal: "This deal is ready for legal review. Please review the contract terms.",
      seller: "Please follow up on this deal or provide additional information."
    };
    
    const message = nudgeMessages[target as keyof typeof nudgeMessages] || "Please check on this deal.";
    
    sendNudge.mutate({
      dealId,
      targetRole: target,
      message
    });
  };

  const handleApprove = (dealId: number) => {
    approveDeal.mutate({
      dealId,
      comments: "Deal approved via dashboard action"
    });
  };

  const handleLegalApprove = (dealId: number) => {
    legalApproveDeal.mutate({
      dealId,
      comments: "Legal review completed via dashboard action"
    });
  };

  const handleSendContract = (dealId: number) => {
    sendContract.mutate({
      dealId,
      comments: "Contract sent via dashboard action"
    });
  };

  const handleRequestRevision = (dealId: number) => {
    const deal = dealsQuery.data?.find(d => d.id === dealId);
    if (deal) {
      setSelectedDeal(deal);
      setRevisionModalOpen(true);
    }
  };

  const [, navigate] = useLocation();
  
  const handleView = (dealId: number) => {
    // Navigate to deal details page
    navigate(`/deals/${dealId}`);
  };

  // Handle draft resumption
  const handleResumeDraft = (dealId: number) => {
    // Navigate to Submit Deal form and load draft data
    navigate(`/submit-deal?draft=${dealId}`);
  };

  // Handle priority banner actions
  const handlePriorityAction = (dealId: number, actionType: any) => {
    switch (actionType) {
      case 'convert':
        handleConvert(dealId);
        break;
      case 'resume_draft':
      case 'draft':
        handleResumeDraft(dealId);
        break;
      case 'approve':
        handleApprove(dealId);
        break;
      case 'legal_review':
        handleLegalApprove(dealId);
        break;
      case 'contract':
        handleSendContract(dealId);
        break;
      case 'request_revision':
        handleRequestRevision(dealId);
        break;
      case 'nudge':
        // Default nudge logic based on user role
        if (userRole === 'seller') {
          handleNudge(dealId, 'approver');
        } else if (userRole === 'approver') {
          handleNudge(dealId, 'legal');
        }
        break;
      default:
        handleView(dealId);
    }
  };

  // Helper function to format currency in shortened format
  const formatShortCurrency = (amount: number, isMultiTier: boolean = false): string => {
    if (amount === 0) return "$0";
    
    const suffix = isMultiTier ? "+" : "";
    
    if (amount >= 1000000000) {
      return `$${(amount / 1000000000).toFixed(amount % 1000000000 === 0 ? 0 : 1)}B${suffix}`;
    } else if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(amount % 1000000 === 0 ? 0 : 1)}M${suffix}`;
    } else if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(amount % 1000 === 0 ? 0 : 1)}k${suffix}`;
    } else {
      return `$${amount.toFixed(0)}${suffix}`;
    }
  };

  // Helper function to get deal value based on deal type and structure
  const getDealValue = (deal: Deal & { tier1Revenue?: number; totalTierRevenue?: number; tiers?: any[] }): { amount: number; isMultiTier: boolean } => {
    // For scoping deals, use growth ambition
    if (deal.status === 'scoping' && deal.growthAmbition) {
      return { amount: deal.growthAmbition, isMultiTier: false };
    }
    
    // For tiered deals, ALWAYS show + sign since they are inherently multi-tier
    if (deal.dealStructure === 'tiered') {
      // Use tier1Revenue if available, otherwise use annualRevenue or growthAmbition
      const amount = deal.tier1Revenue || deal.annualRevenue || deal.growthAmbition || 0;
      return { amount, isMultiTier: true }; // Always true for tiered deals
    }
    
    // For flat commit deals, use annual revenue (no + sign)
    if (deal.dealStructure === 'flat_commit' && deal.annualRevenue) {
      return { amount: deal.annualRevenue, isMultiTier: false };
    }
    
    // Fallback to any available revenue value
    const amount = deal.annualRevenue || deal.growthAmbition || 0;
    return { amount, isMultiTier: false };
  };

  // Define columns for the deals table with action column
  const columns: ColumnDef<Deal>[] = [
    {
      id: "client",
      header: "Client",
      cell: ({ row }) => {
        const deal = row.original;
        const clientName = deal.advertiserName || deal.agencyName || "N/A";
        return <div className="font-medium text-slate-900">{clientName}</div>;
      },
    },
    {
      accessorKey: "salesChannel",
      header: "Sales Channel",
      cell: ({ row }) => {
        const channelLabels = {
          'holding_company': 'Holding Company',
          'independent_agency': 'Independent Agency', 
          'client_direct': 'Client Direct'
        };
        const channel = row.original.salesChannel;
        const label = channelLabels[channel as keyof typeof channelLabels] || channel;
        return <div className="text-sm text-slate-700">{label}</div>;
      },
    },
    {
      accessorKey: "region",
      header: "Region",
      cell: ({ row }) => {
        const regionLabels = {
          'northeast': 'Northeast',
          'midwest': 'Midwest',
          'midatlantic': 'Mid-Atlantic',
          'west': 'West',
          'south': 'South'
        };
        const region = row.original.region;
        const label = regionLabels[region as keyof typeof regionLabels] || region || "N/A";
        return <div className="text-sm text-slate-700">{label}</div>;
      },
    },
    {
      accessorKey: "dealStructure",
      header: "Deal Type",
      cell: ({ row }) => {
        const structure = row.original.dealStructure;
        const typeLabels = {
          'tiered': 'Tiered',
          'flat_commit': 'Flat Commit'
        };
        const label = typeLabels[structure as keyof typeof typeLabels] || structure;
        return <div className="text-sm text-slate-700">{label}</div>;
      },
    },
    {
      id: "dealValue", 
      header: "Deal Value",
      cell: ({ row }) => {
        const { amount, isMultiTier } = getDealValue(row.original);
        return <div className="font-medium">{formatShortCurrency(amount, isMultiTier)}</div>;
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const deal = row.original;
        const status = deal.status as DealStatus;
        return (
          <div className="flex items-center gap-2">
            <DealStatusBadge status={status} />
            {deal.revisionCount > 0 && (
              <Badge variant="outline" className="text-xs px-1 py-0">
                Rev {deal.revisionCount}
              </Badge>
            )}
            {deal.draftType && status === 'draft' && (
              <Badge variant="secondary" className="text-xs px-1 py-0">
                {deal.draftType === 'scoping_draft' ? 'Scoping' : 'Submission'}
              </Badge>
            )}
          </div>
        );
      },
      filterFn: (row, id, value) => {
        return value === row.getValue(id);
      },
    },
    {
      accessorKey: "updatedAt",
      header: "Updated",
      cell: ({ row }) => {
        const updatedAt = row.original.updatedAt;
        const dateString = updatedAt ? updatedAt.toString() : "";
        return <div className="text-sm text-slate-500">{formatRelativeDate(dateString)}</div>;
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const deal = row.original;
        const action = getActionForDeal(deal, userRole, {
          onConvert: handleConvert,
          onNudge: handleNudge,
          onApprove: handleApprove,
          onLegalApprove: handleLegalApprove,
          onSendContract: handleSendContract,
          onRequestRevision: handleRequestRevision,
          onView: handleView,
        });

        if (!action.visible) return null;

        return (
          <Button
            variant={action.variant}
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              action.onClick(deal.id);
            }}
            disabled={isUpdatingStatus || isSendingNudge}
            className="h-8"
          >
            {action.icon && <action.icon className="h-3 w-3 mr-1" />}
            {action.label}
          </Button>
        );
      },
    },

  ];

  return (
    <div className="p-6 space-y-8">
      {/* Welcome Banner */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Welcome back, {userName}</h1>
          <p className="mt-1 text-slate-500">Here's what's happening with your commercial deals</p>
        </div>
      </div>
      
      {/* Priority Banner */}
      <PriorityBanner
        priorityItems={priorityItems}
        priorityStats={priorityStats}
        userRole={userRole}
        onAction={handlePriorityAction}
        isLoading={priorityLoading}
      />

      {/* Stats Overview - Updated with Close Rate */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Total Deals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold">{dealStats?.totalDeals || 0}</div>
              <div className="p-2 bg-slate-100 rounded-full">
                <BarChart3 className="h-5 w-5 text-slate-600" />
              </div>
            </div>
            <div className="flex justify-between items-center mt-2">
              <p className="text-xs text-slate-500">All deals</p>
              <p className="text-xs font-semibold">100%</p>
            </div>
            <div className="w-full bg-slate-100 h-1 mt-2 rounded-full overflow-hidden">
              <div className="bg-slate-400 h-1 rounded-full" style={{ width: '100%' }}></div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Active Deals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold">{dealStats?.activeDeals || 0}</div>
              <div className="p-2 bg-amber-100 rounded-full">
                <Clock className="h-5 w-5 text-amber-600" />
              </div>
            </div>
            <div className="flex justify-between items-center mt-2">
              <p className="text-xs text-slate-500">In progress</p>
              <p className="text-xs font-semibold">
                {dealStats?.totalDeals ? Math.round((dealStats.activeDeals / dealStats.totalDeals) * 100) : 0}%
              </p>
            </div>
            <div className="w-full bg-slate-100 h-1 mt-2 rounded-full overflow-hidden">
              <div 
                className="bg-amber-400 h-1 rounded-full" 
                style={{ 
                  width: `${dealStats?.totalDeals ? Math.round((dealStats.activeDeals / dealStats.totalDeals) * 100) : 0}%` 
                }}
              ></div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Closed Deals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold">{dealStats?.completedDeals || 0}</div>
              <div className="p-2 bg-green-100 rounded-full">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
            </div>
            <div className="flex justify-between items-center mt-2">
              <p className="text-xs text-slate-500">Signed deals</p>
              <p className="text-xs font-semibold">
                {dealStats?.totalDeals ? Math.round((dealStats.completedDeals / dealStats.totalDeals) * 100) : 0}%
              </p>
            </div>
            <div className="w-full bg-slate-100 h-1 mt-2 rounded-full overflow-hidden">
              <div 
                className="bg-green-400 h-1 rounded-full" 
                style={{ 
                  width: `${dealStats?.totalDeals ? Math.round((dealStats.completedDeals / dealStats.totalDeals) * 100) : 0}%` 
                }}
              ></div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Close Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold">{dealStats?.closeRate ? `${dealStats.closeRate}%` : "0%"}</div>
              <div className="p-2 bg-blue-100 rounded-full">
                <TrendingUp className="h-5 w-5 text-blue-600" />
              </div>
            </div>
            <div className="flex justify-between items-center mt-2">
              <p className="text-xs text-slate-500">Won vs Lost</p>
              <p className="text-xs font-semibold">{dealStats?.lostDeals || 0} lost</p>
            </div>
            <div className="w-full bg-slate-100 h-1 mt-2 rounded-full overflow-hidden">
              <div 
                className="bg-blue-400 h-1 rounded-full" 
                style={{ width: `${dealStats?.closeRate || 0}%` }}
              ></div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Department Reviewer Approval Queue */}
      {userRole === 'department_reviewer' && userDepartment && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileCheck className="h-5 w-5" />
              Your Approval Queue - {departments.find(d => d.departmentName === userDepartment)?.displayName || userDepartment}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <QueryStateHandler
              query={{ data: userPendingApprovals, isLoading: false, error: null }}
              loadingComponent={<SectionLoading title="Loading pending approvals..." rows={3} />}
              emptyComponent={
                <div className="text-center py-6">
                  <p className="text-gray-500">No pending approvals for your department.</p>
                </div>
              }
              emptyCheck={(data) => data.length === 0}
            >
              {(approvals) => (
                <div className="space-y-3">
                  {approvals.slice(0, 5).map((approval: any) => (
                    <div key={approval.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-medium">Deal #{approval.dealId}</h4>
                        <p className="text-sm text-gray-600">
                          Stage {approval.approvalStage} • Priority: {approval.priority}
                        </p>
                        <p className="text-xs text-gray-500">
                          Due: {new Date(approval.dueDate).toLocaleDateString()}
                        </p>
                      </div>
                      <Button 
                        size="sm" 
                        onClick={() => handleView(approval.dealId)}
                        className="ml-4"
                      >
                        Review
                      </Button>
                    </div>
                  ))}
                  {approvals.length > 5 && (
                    <div className="text-center pt-2">
                      <p className="text-sm text-gray-500">
                        +{approvals.length - 5} more approvals pending
                      </p>
                    </div>
                  )}
                </div>
              )}
            </QueryStateHandler>
          </CardContent>
        </Card>
      )}

      {/* Main Deals Table */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">All Deals</h2>
          <div className="text-sm text-slate-500">
            Role: <Badge variant="outline" className="ml-1 capitalize">{userRole}</Badge>
          </div>
        </div>
        
        <div className="bg-white border border-slate-200 rounded-md p-4">
          <QueryStateHandler
            query={dealsQuery}
            loadingComponent={<SectionLoading title="Loading deals..." rows={5} />}
            errorComponent={
              <ErrorState
                title="Failed to load deals"
                message="Unable to fetch deal data. Please try refreshing the page."
                onRetry={dealsQuery.refetch}
              />
            }
            emptyComponent={
              <div className="text-center py-12">
                <p className="text-gray-500">No deals found. Create your first deal to get started.</p>
                <Button asChild className="mt-4">
                  <Link to="/submit-deal">Create Deal</Link>
                </Button>
              </div>
            }
            emptyCheck={(data) => data.filter(deal => deal.status !== 'draft').length === 0}
          >
            {(deals) => {
              // Phase 8B: Filter drafts from main deal table - drafts should only appear in Priority Actions
              const nonDraftDeals = deals.filter(deal => deal.status !== 'draft');

              
              return (
                <DataTable 
                  columns={columns} 
                  data={nonDraftDeals} 
                  searchKey="client"
                  placeholder="Search by client name..."
                  statusFilter={true}
                  onRowClick={(deal) => handleView(deal.id)}
                />
              );
            }}
          </QueryStateHandler>
        </div>
      </div>

      {/* Phase 8: Revision Request Modal */}
      {selectedDeal && (
        <RevisionRequestModal
          isOpen={revisionModalOpen}
          onClose={() => {
            setRevisionModalOpen(false);
            setSelectedDeal(null);
          }}
          deal={selectedDeal}
        />
      )}
    </div>
  );
}