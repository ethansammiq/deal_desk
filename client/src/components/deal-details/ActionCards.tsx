import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Edit, 
  FileText, 
  Share2, 
  CheckCircle, 
  XCircle, 
  Calendar, 
  Clock,
  BarChart3,
  AlertTriangle,
  MessageSquare,
  History
} from "lucide-react";
import { Deal } from "@shared/schema";
import { format } from "date-fns";
import { Link } from "wouter";

interface ActionCardsProps {
  deal: Deal;
  userRole: string;
  onRevisionRequest?: () => void;
  onApprove?: () => void;
  isUpdatingStatus?: boolean;
}

export function ActionCards({ 
  deal, 
  userRole, 
  onRevisionRequest, 
  onApprove,
  isUpdatingStatus 
}: ActionCardsProps) {
  
  const canApprove = userRole === 'approver' && 
    (deal.status === 'under_review' || deal.status === 'pending_approval');
  
  const canEdit = userRole === 'seller' && 
    (deal.status === 'draft' || deal.status === 'scoping' || deal.status === 'revision_requested');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-slate-100 text-slate-800 border-slate-200';
      case 'submitted': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'under_review': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'approved': return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
      case 'revision_requested': return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <BarChart3 className="h-4 w-4" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {canEdit && (
            <Link href={`/submit-deal?dealId=${deal.id}&mode=edit`}>
              <Button variant="outline" size="sm" className="w-full justify-start">
                <Edit className="h-4 w-4 mr-2" />
                Edit Deal
              </Button>
            </Link>
          )}
          
          {canApprove && (
            <>
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full justify-start text-orange-600 border-orange-200 hover:bg-orange-50"
                onClick={onRevisionRequest}
                disabled={isUpdatingStatus}
              >
                <XCircle className="h-4 w-4 mr-2" />
                Request Revision
              </Button>
              
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full justify-start text-green-600 border-green-200 hover:bg-green-50"
                onClick={onApprove}
                disabled={isUpdatingStatus}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Approve Deal
              </Button>
            </>
          )}
          
          <Button variant="outline" size="sm" className="w-full justify-start">
            <Share2 className="h-4 w-4 mr-2" />
            Share Deal
          </Button>
          
          <Button variant="outline" size="sm" className="w-full justify-start">
            <FileText className="h-4 w-4 mr-2" />
            Generate Report
          </Button>
        </CardContent>
      </Card>

      {/* Deal Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4" />
            Deal Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className={`p-3 rounded-lg border ${getStatusColor(deal.status)}`}>
            <div className="flex items-center justify-between">
              <span className="font-medium capitalize">
                {deal.status.replace('_', ' ')}
              </span>
              <Badge variant="secondary" className="text-xs">
                Stage 2
              </Badge>
            </div>
            {deal.createdAt && (
              <p className="text-xs mt-1 opacity-75">
                Created {format(new Date(deal.createdAt), 'MMM dd, yyyy')}
              </p>
            )}
          </div>
          
          {deal.status === 'revision_requested' && deal.revisionReason && (
            <div className="p-3 rounded-lg border border-orange-200 bg-orange-50">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs font-medium text-orange-800 mb-1">
                    Revision Required
                  </p>
                  <p className="text-xs text-orange-700">
                    {deal.revisionReason}
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Timeline Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4" />
            Timeline
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2 text-xs">
            {deal.createdAt && (
              <div className="flex justify-between items-center">
                <span className="text-slate-600">Created</span>
                <span className="font-medium">
                  {format(new Date(deal.createdAt), 'MMM dd')}
                </span>
              </div>
            )}
            
            {deal.status !== 'draft' && (
              <div className="flex justify-between items-center">
                <span className="text-slate-600">Submitted</span>
                <span className="font-medium">
                  {format(new Date(deal.createdAt || new Date()), 'MMM dd')}
                </span>
              </div>
            )}
            
            {deal.status === 'approved' && (
              <div className="flex justify-between items-center">
                <span className="text-slate-600">Approved</span>
                <span className="font-medium text-green-600">
                  Recent
                </span>
              </div>
            )}
            
            {deal.lastRevisedAt && (
              <div className="flex justify-between items-center">
                <span className="text-slate-600">Last Revised</span>
                <span className="font-medium text-orange-600">
                  {format(new Date(deal.lastRevisedAt), 'MMM dd')}
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Deal Metrics Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <BarChart3 className="h-4 w-4" />
            Deal Metrics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-xs">
            <div className="flex justify-between items-center p-2 bg-slate-50 rounded">
              <span className="text-slate-600">Deal Value</span>
              <span className="font-bold text-green-600">$1.0M</span>
            </div>
            
            <div className="flex justify-between items-center p-2 bg-slate-50 rounded">
              <span className="text-slate-600">Expected Margin</span>
              <span className="font-bold text-blue-600">33.0%</span>
            </div>
            
            <div className="flex justify-between items-center p-2 bg-slate-50 rounded">
              <span className="text-slate-600">Profit Impact</span>
              <span className="font-bold text-purple-600">$320K</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-slate-600">Comments</span>
              <span className="font-medium">0</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-slate-600">Revisions</span>
              <span className="font-medium">
                {deal.revisionCount || 0}
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-slate-600">Stage</span>
              <Badge variant="outline" className="text-xs h-5">
                2
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Deal Context */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <History className="h-4 w-4" />
            Deal Context
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-xs">
            <div>
              <span className="text-slate-600 block mb-1">Deal Type</span>
              <Badge variant="secondary" className="text-xs">
                {deal.dealType || 'Standard'}
              </Badge>
            </div>
            
            <div>
              <span className="text-slate-600 block mb-1">Channel</span>
              <span className="font-medium">{deal.salesChannel || 'Direct'}</span>
            </div>
            
            <div>
              <span className="text-slate-600 block mb-1">Region</span>
              <span className="font-medium">{deal.region || 'Global'}</span>
            </div>
            
            {deal.agencyName && (
              <div>
                <span className="text-slate-600 block mb-1">Agency</span>
                <span className="font-medium">{deal.agencyName}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}