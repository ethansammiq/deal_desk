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

// Generate Pipeline Health insights for sellers - STRATEGIC level, not immediate actions
function generatePipelineHealthInsights(deals: Deal[], userEmail?: string): StrategicInsight[] {
  const sellerDeals = userEmail 
    ? deals.filter(deal => deal.email === userEmail && deal.status !== 'draft')
    : deals.filter(deal => deal.status !== 'draft');

  const insights: StrategicInsight[] = [];
  const now = new Date();

  // 1. Pipeline velocity trends (strategic insight)
  const activeDeals = sellerDeals.filter(deal => 
    !['signed', 'lost', 'draft'].includes(deal.status)
  );
  
  const negotiatingDeals = sellerDeals.filter(deal => deal.status === 'negotiating');
  const underReviewDeals = sellerDeals.filter(deal => deal.status === 'under_review');
  
  if (negotiatingDeals.length > 0) {
    insights.push({
      id: 'negotiation-momentum',
      title: 'Negotiation Phase Activity',
      metric: negotiatingDeals.length,
      description: `${negotiatingDeals.length} deal${negotiatingDeals.length > 1 ? 's' : ''} actively negotiating - momentum building`,
      urgency: 'low',
      actionLabel: 'Monitor Progress',
      actionRoute: '/deals',
      trend: 'up'
    });
  }

  // 2. Pipeline value concentration (strategic insight)
  const highValueDeals = sellerDeals.filter(deal => {
    const value = deal.annualRevenue || 0;
    return value >= 500000 && !['signed', 'lost'].includes(deal.status);
  });

  if (highValueDeals.length > 0) {
    const totalHighValue = highValueDeals.reduce((sum, deal) => sum + (deal.annualRevenue || 0), 0);
    const totalPipelineValue = activeDeals.reduce((sum, deal) => sum + (deal.annualRevenue || 0), 0);
    const concentration = Math.round((totalHighValue / totalPipelineValue) * 100);
    
    insights.push({
      id: 'value-concentration',
      title: 'High-Value Pipeline Focus',
      metric: `${concentration}%`,
      description: `${highValueDeals.length} deal${highValueDeals.length > 1 ? 's' : ''} >$500K represent ${concentration}% of pipeline value`,
      urgency: concentration > 70 ? 'medium' : 'low',
      actionLabel: 'View High-Value Deals',
      actionRoute: '/deals',
      trend: concentration > 70 ? 'up' : 'stable'
    });
  }

  // 3. Deal progression health (strategic insight)
  const totalDeals = sellerDeals.filter(deal => !['draft'].includes(deal.status)).length;
  const progressingDeals = sellerDeals.filter(deal => 
    ['under_review', 'negotiating', 'approved', 'contract_drafting'].includes(deal.status)
  ).length;
  
  if (totalDeals > 0) {
    const progressionRate = Math.round((progressingDeals / totalDeals) * 100);
    insights.push({
      id: 'progression-health',
      title: 'Pipeline Progression Rate',
      metric: `${progressionRate}%`,
      description: `${progressingDeals} of ${totalDeals} deals advancing through workflow`,
      urgency: progressionRate < 50 ? 'medium' : 'low',
      actionLabel: 'Analyze Workflow',
      actionRoute: '/analytics',
      trend: progressionRate >= 70 ? 'up' : progressionRate >= 50 ? 'stable' : 'down'
    });
  }

  // 4. Recent submission momentum (positive indicator)
  const recentSubmissions = sellerDeals.filter(deal => {
    if (!deal.updatedAt) return false;
    const hoursSinceUpdate = (now.getTime() - new Date(deal.updatedAt).getTime()) / (1000 * 60 * 60);
    return hoursSinceUpdate <= 72 && deal.status === 'submitted'; // Last 3 days
  });

  if (recentSubmissions.length > 0 && insights.length < 3) {
    insights.push({
      id: 'submission-momentum',
      title: 'Fresh Submissions This Week',
      metric: recentSubmissions.length,
      description: `${recentSubmissions.length} new deal${recentSubmissions.length > 1 ? 's' : ''} submitted for review`,
      urgency: 'low',
      actionLabel: 'Track Progress',
      actionRoute: '/deals',
      trend: 'up'
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