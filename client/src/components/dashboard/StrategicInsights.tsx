import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Clock, TrendingUp, TrendingDown, Minus, ExternalLink } from 'lucide-react';
import { Deal, UserRole } from '@shared/schema';
import { Link } from 'wouter';

interface StrategicInsight {
  id: string;
  title: string;
  metric: number | string;
  description: string;
  trend?: 'up' | 'down' | 'stable';
  actionLabel: string;
  actionRoute: string;
  urgency: 'low' | 'medium' | 'high';
  dealIds?: number[]; // For linking to specific deals
}

interface StrategicInsightsProps {
  userRole: UserRole;
  deals: Deal[];
  userEmail?: string;
}

// Generate Pipeline Health insights for sellers
function generatePipelineHealthInsights(deals: Deal[], userEmail?: string): StrategicInsight[] {
  const sellerDeals = userEmail 
    ? deals.filter(deal => deal.email === userEmail && deal.status !== 'draft')
    : deals.filter(deal => deal.status !== 'draft');

  const insights: StrategicInsight[] = [];
  const now = new Date();

  // 1. Deals stuck in negotiating >7 days
  const stuckInNegotiating = sellerDeals.filter(deal => {
    if (deal.status !== 'negotiating' || !deal.lastStatusChange) return false;
    const daysSinceUpdate = (now.getTime() - new Date(deal.lastStatusChange).getTime()) / (1000 * 60 * 60 * 24);
    return daysSinceUpdate > 7;
  });

  if (stuckInNegotiating.length > 0) {
    insights.push({
      id: 'stuck-negotiating',
      title: 'Deals Stuck in Negotiation',
      metric: stuckInNegotiating.length,
      description: `${stuckInNegotiating.length} deal${stuckInNegotiating.length > 1 ? 's' : ''} stalled >7 days`,
      urgency: 'high',
      actionLabel: 'Review Stalled Deals',
      actionRoute: '/deals',
      dealIds: stuckInNegotiating.map(d => d.id)
    });
  }

  // 2. High-value deals needing attention
  const highValueDeals = sellerDeals.filter(deal => {
    const value = deal.annualRevenue || 0;
    return value >= 500000 && ['revision_requested', 'negotiating'].includes(deal.status);
  });

  if (highValueDeals.length > 0) {
    const totalValue = highValueDeals.reduce((sum, deal) => sum + (deal.annualRevenue || 0), 0);
    insights.push({
      id: 'high-value-attention',
      title: 'High-Value Deals Need Focus',
      metric: `$${Math.round(totalValue / 1000000 * 10) / 10}M`,
      description: `${highValueDeals.length} deal${highValueDeals.length > 1 ? 's' : ''} >$500K requiring action`,
      urgency: 'medium',
      actionLabel: 'Review High-Value Deals',
      actionRoute: '/deals',
      dealIds: highValueDeals.map(d => d.id)
    });
  }

  // 3. Revision requests needing response
  const revisionRequests = sellerDeals.filter(deal => deal.status === 'revision_requested');
  
  if (revisionRequests.length > 0) {
    insights.push({
      id: 'revision-requests',
      title: 'Revision Requests Pending',
      metric: revisionRequests.length,
      description: `Response needed to continue ${revisionRequests.length} deal${revisionRequests.length > 1 ? 's' : ''}`,
      urgency: 'medium',
      actionLabel: 'Address Revisions',
      actionRoute: '/deals',
      dealIds: revisionRequests.map(d => d.id)
    });
  }

  // 4. Pipeline velocity insight (positive when available)
  const activeDeals = sellerDeals.filter(deal => 
    !['signed', 'lost', 'draft'].includes(deal.status)
  );
  
  if (activeDeals.length > 0 && insights.length === 0) {
    // Only show when no urgent issues
    insights.push({
      id: 'pipeline-health',
      title: 'Pipeline Running Smoothly',
      metric: activeDeals.length,
      description: `${activeDeals.length} active deal${activeDeals.length > 1 ? 's' : ''} progressing well`,
      urgency: 'low',
      actionLabel: 'View Pipeline',
      actionRoute: '/deals',
      trend: 'stable'
    });
  }

  return insights.slice(0, 3); // Max 3 insights
}

// Generate Workflow Efficiency insights for reviewers/approvers
function generateWorkflowEfficiencyInsights(deals: Deal[], userRole: UserRole): StrategicInsight[] {
  const insights: StrategicInsight[] = [];
  const now = new Date();

  // 1. Deals under review count
  const underReviewDeals = deals.filter(deal => deal.status === 'under_review');
  
  if (underReviewDeals.length > 0) {
    insights.push({
      id: 'review-queue',
      title: 'Active Review Queue',
      metric: underReviewDeals.length,
      description: `${underReviewDeals.length} deal${underReviewDeals.length > 1 ? 's' : ''} awaiting ${userRole === 'approver' ? 'approval' : 'review'}`,
      urgency: underReviewDeals.length > 5 ? 'high' : 'medium',
      actionLabel: 'Process Queue',
      actionRoute: '/deals'
    });
  }

  // 2. Deals in negotiation (collaborative stage)
  const negotiatingDeals = deals.filter(deal => deal.status === 'negotiating');
  
  if (negotiatingDeals.length > 0) {
    insights.push({
      id: 'active-negotiations',
      title: 'Active Negotiations',
      metric: negotiatingDeals.length,
      description: `${negotiatingDeals.length} deal${negotiatingDeals.length > 1 ? 's' : ''} in collaborative negotiation`,
      urgency: 'low',
      actionLabel: 'Monitor Progress',
      actionRoute: '/deals'
    });
  }

  // 3. Recently submitted deals
  const recentlySubmitted = deals.filter(deal => {
    if (deal.status !== 'submitted' || !deal.updatedAt) return false;
    const hoursSinceSubmission = (now.getTime() - new Date(deal.updatedAt).getTime()) / (1000 * 60 * 60);
    return hoursSinceSubmission <= 24; // Last 24 hours
  });

  if (recentlySubmitted.length > 0) {
    insights.push({
      id: 'recent-submissions',
      title: 'New Submissions Today',
      metric: recentlySubmitted.length,
      description: `${recentlySubmitted.length} fresh deal${recentlySubmitted.length > 1 ? 's' : ''} submitted for review`,
      urgency: 'medium',
      actionLabel: 'Review New Deals',
      actionRoute: '/deals',
      trend: 'up'
    });
  }

  return insights.slice(0, 3); // Max 3 insights
}

// Main component
export function StrategicInsights({ userRole, deals, userEmail }: StrategicInsightsProps) {
  const insights = userRole === 'seller' 
    ? generatePipelineHealthInsights(deals, userEmail)
    : generateWorkflowEfficiencyInsights(deals, userRole);

  if (insights.length === 0) {
    return null; // Don't render if no insights
  }

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'high': return 'border-red-200 bg-red-50';
      case 'medium': return 'border-amber-200 bg-amber-50';
      default: return 'border-green-200 bg-green-50';
    }
  };

  const getUrgencyBadge = (urgency: string) => {
    switch (urgency) {
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      default: return 'outline';
    }
  };

  const getTrendIcon = (trend?: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'down': return <TrendingDown className="h-4 w-4 text-red-600" />;
      default: return <Minus className="h-4 w-4 text-slate-400" />;
    }
  };

  return (
    <Card className="border border-slate-200 shadow-sm bg-white">
      <CardHeader className="pb-6">
        <div className="flex items-center gap-3">
          <div className="w-1 h-6 bg-[#3e0075] rounded-full"></div>
          <div>
            <CardTitle className="text-xl font-semibold text-slate-900 flex items-center gap-3">
              {userRole === 'seller' ? 'Pipeline Health Intelligence' : 'Workflow Efficiency Intelligence'}
              {insights.some(i => i.urgency === 'high') && (
                <Badge variant="destructive" className="text-xs">
                  Action Required
                </Badge>
              )}
            </CardTitle>
            <CardDescription className="text-slate-500">
              {userRole === 'seller' 
                ? 'Key opportunities and bottlenecks in your deal pipeline'
                : 'Workflow insights and process efficiency indicators'
              }
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {insights.map((insight) => (
            <div 
              key={insight.id}
              className={`p-4 border rounded-lg transition-all hover:shadow-sm ${getUrgencyColor(insight.urgency)}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-slate-900">{insight.title}</h4>
                      {insight.trend && getTrendIcon(insight.trend)}
                    </div>
                    <Badge variant={getUrgencyBadge(insight.urgency)} className="text-xs">
                      {insight.urgency}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-2xl font-bold text-slate-900">{insight.metric}</div>
                    <p className="text-sm text-slate-600">{insight.description}</p>
                  </div>
                </div>
                <Button asChild variant="outline" size="sm" className="border-[#3e0075] text-[#3e0075] hover:bg-[#3e0075] hover:text-white">
                  <Link to={insight.actionRoute}>
                    {insight.actionLabel}
                    <ExternalLink className="h-4 w-4 ml-2" />
                  </Link>
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}