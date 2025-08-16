import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DealRow } from "./DealRow";
import { useLocation } from "wouter";
import { useSellerDealCategories } from "@/hooks/useSellerMetrics";
import type { Deal, UserRole } from "@shared/schema";
import { 
  AlertTriangle, 
  Clock, 
  CheckCircle,
  FileText,
  Scale,
  Zap
} from "lucide-react";

interface ActionItemsSectionProps {
  deals: Deal[];
  userRole: UserRole;
  userEmail?: string;
  userDepartment?: string;
  approvalItems?: any[];
  className?: string;
}

export function ActionItemsSection({ 
  deals, 
  userRole, 
  userEmail, 
  userDepartment,
  approvalItems = [],
  className = "" 
}: ActionItemsSectionProps) {
  const [, navigate] = useLocation();
  
  // Get deal categories for sellers
  const { dealsNeedingAction } = useSellerDealCategories(deals, userRole === 'seller' ? userEmail : undefined);

  // Enhanced action item detection based on role
  const getActionItems = () => {
    const items: Array<{
      id: string;
      type: 'deal_action' | 'approval' | 'review' | 'urgent';
      title: string;
      description: string;
      priority: 'high' | 'medium' | 'low';
      onClick: () => void;
      badge?: string;
      icon: React.ComponentType<any>;
    }> = [];

    switch (userRole) {
      case 'seller':
        // Seller-specific action items
        dealsNeedingAction.forEach(deal => {
          let priority: 'high' | 'medium' | 'low' = 'medium';
          let description = '';
          
          if (deal.status === 'revision_requested') {
            priority = 'high';
            description = 'Needs revision - blocked until fixed';
          } else if (deal.revisionCount && deal.revisionCount >= 2) {
            priority = 'high';
            description = `Multiple revisions (${deal.revisionCount}) - needs attention`;
          } else if (deal.draftExpiresAt) {
            const daysLeft = Math.ceil((new Date(deal.draftExpiresAt).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
            priority = daysLeft <= 1 ? 'high' : 'medium';
            description = `Draft expires in ${daysLeft} day${daysLeft === 1 ? '' : 's'}`;
          }
          
          items.push({
            id: `deal-${deal.id}`,
            type: 'deal_action',
            title: deal.dealName,
            description,
            priority,
            onClick: () => navigate(`/deals/${deal.id}`),
            icon: AlertTriangle
          });
        });
        break;

      case 'department_reviewer':
        // Department reviewer action items
        const pendingReviews = deals.filter(deal => 
          deal.status === 'submitted' || deal.status === 'under_review'
        );
        
        pendingReviews.slice(0, 3).forEach(deal => {
          items.push({
            id: `review-${deal.id}`,
            type: 'review',
            title: `Review: ${deal.dealName}`,
            description: `${deal.advertiserName || deal.agencyName} - Awaiting ${userDepartment} review`,
            priority: 'medium',
            onClick: () => navigate(`/deals/${deal.id}`),
            badge: userDepartment,
            icon: FileText
          });
        });
        break;

      case 'approver':
        // Approver action items
        const pendingApprovals = deals.filter(deal => deal.status === 'approved');
        
        pendingApprovals.slice(0, 3).forEach(deal => {
          const isHighValue = (deal as any).annualRevenue > 500000;
          items.push({
            id: `approval-${deal.id}`,
            type: 'approval',
            title: `Approve: ${deal.dealName}`,
            description: `Ready for business approval${isHighValue ? ' - High value deal' : ''}`,
            priority: isHighValue ? 'high' : 'medium',
            onClick: () => navigate(`/deals/${deal.id}`),
            badge: isHighValue ? 'High Value' : undefined,
            icon: CheckCircle
          });
        });
        break;

      case 'admin':
        // Admin action items - system-wide issues
        const stuckDeals = deals.filter(deal => {
          if (!deal.lastStatusChange) return false;
          const daysSinceUpdate = (new Date().getTime() - new Date(deal.lastStatusChange).getTime()) / (1000 * 60 * 60 * 24);
          return daysSinceUpdate > 14 && !['signed', 'lost', 'draft'].includes(deal.status);
        });

        stuckDeals.slice(0, 2).forEach(deal => {
          items.push({
            id: `stuck-${deal.id}`,
            type: 'urgent',
            title: `Stuck Deal: ${deal.dealName}`,
            description: 'No activity for 14+ days - needs intervention',
            priority: 'high',
            onClick: () => navigate(`/deals/${deal.id}`),
            badge: 'Stuck',
            icon: AlertTriangle
          });
        });
        break;
    }

    return items.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  };

  const actionItems = getActionItems();

  if (actionItems.length === 0) {
    return (
      <Card className={`border border-slate-200 shadow-sm bg-white ${className}`}>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold text-slate-900 flex items-center gap-3">
            <Zap className="h-5 w-5 text-green-500" />
            Action Items
          </CardTitle>
          <CardDescription className="text-slate-500">
            Tasks requiring your attention
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
            <p className="text-slate-500 text-sm">All caught up! No action items.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`border border-slate-200 shadow-sm bg-white ${className}`}>
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold text-slate-900 flex items-center gap-3">
          <Zap className="h-5 w-5 text-amber-500" />
          Action Items
          <Badge variant="outline" className="border-amber-200 text-amber-700 bg-amber-50">
            {actionItems.length}
          </Badge>
        </CardTitle>
        <CardDescription className="text-slate-500">
          Tasks requiring your attention
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {actionItems.map((item) => {
            const IconComponent = item.icon;
            const priorityColors = {
              high: 'border-red-200 bg-red-50',
              medium: 'border-amber-200 bg-amber-50', 
              low: 'border-blue-200 bg-blue-50'
            };
            
            return (
              <div
                key={item.id}
                className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-colors hover:bg-slate-50 ${priorityColors[item.priority]}`}
                onClick={item.onClick}
              >
                <div className="flex items-center gap-3">
                  <div className="p-1 rounded-full bg-white">
                    <IconComponent className="h-4 w-4 text-slate-600" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">{item.title}</p>
                    <p className="text-sm text-slate-600">{item.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {item.badge && (
                    <Badge variant="outline" className="text-xs">
                      {item.badge}
                    </Badge>
                  )}
                  <Badge 
                    variant={item.priority === 'high' ? 'destructive' : 'secondary'}
                    className="text-xs"
                  >
                    {item.priority.toUpperCase()}
                  </Badge>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}