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

// Phase 2A: Enhanced Pipeline Health Intelligence using existing data
function generatePipelineHealthInsights(deals: Deal[], userEmail?: string): StrategicInsight[] {
  const sellerDeals = userEmail 
    ? deals.filter(deal => deal.email === userEmail && deal.status !== 'draft')
    : deals.filter(deal => deal.status !== 'draft');

  const insights: StrategicInsight[] = [];
  const now = new Date();

  // 1. PREDICTIVE RISK INTELLIGENCE - Deals at risk of stalling
  const stalledDeals = sellerDeals.filter(deal => {
    if (!deal.lastStatusChange || ['signed', 'lost', 'draft'].includes(deal.status)) return false;
    const daysSinceUpdate = (now.getTime() - new Date(deal.lastStatusChange).getTime()) / (1000 * 60 * 60 * 24);
    
    // Risk thresholds by status
    if (deal.status === 'negotiating' && daysSinceUpdate > 7) return true;
    if (deal.status === 'under_review' && daysSinceUpdate > 5) return true;
    if (deal.status === 'revision_requested' && daysSinceUpdate > 3) return true;
    return false;
  });

  if (stalledDeals.length > 0) {
    const totalStalledValue = stalledDeals.reduce((sum, deal) => sum + (deal.annualRevenue || 0), 0);
    const actionGuidance = stalledDeals.length === 1 
      ? 'Contact client today or schedule follow-up meeting'
      : `Review each deal and send status updates to all ${stalledDeals.length} prospects`;
    
    insights.push({
      id: 'stall-risk-prediction',
      title: 'Deals at Stall Risk',
      metric: stalledDeals.length,
      description: `${formatShortCurrency(totalStalledValue)} in pipeline stalling. ${actionGuidance}`,
      urgency: 'high',
      actionLabel: stalledDeals.length === 1 ? 'Call Client' : `Follow Up (${stalledDeals.length})`,
      actionRoute: stalledDeals.length === 1 ? `/deals/${stalledDeals[0].id}` : `/analytics?highlight=${stalledDeals.map(d => d.id).join(',')}`,
      trend: 'down'
    });
  }

  // 2. PERFORMANCE THRESHOLD MONITORING - Pipeline value changes
  const activeDeals = sellerDeals.filter(deal => 
    !['signed', 'lost', 'draft'].includes(deal.status)
  );
  const currentPipelineValue = activeDeals.reduce((sum, deal) => sum + (deal.annualRevenue || 0), 0);
  
  // Historical baseline comparison (using deal creation patterns as proxy)
  const recentDeals = sellerDeals.filter(deal => {
    if (!deal.createdAt) return false;
    const daysOld = (now.getTime() - new Date(deal.createdAt).getTime()) / (1000 * 60 * 60 * 24);
    return daysOld <= 30;
  });
  
  const olderDeals = sellerDeals.filter(deal => {
    if (!deal.createdAt) return false;
    const daysOld = (now.getTime() - new Date(deal.createdAt).getTime()) / (1000 * 60 * 60 * 24);
    return daysOld > 30 && daysOld <= 60;
  });

  // ONLY SHOW DECLINING VALUE TRENDS (ACTIONABLE PROBLEM)
  if (olderDeals.length > 0 && recentDeals.length > 0) {
    const recentAvgValue = recentDeals.reduce((sum, deal) => sum + (deal.annualRevenue || 0), 0) / recentDeals.length;
    const historicalAvgValue = olderDeals.reduce((sum, deal) => sum + (deal.annualRevenue || 0), 0) / olderDeals.length;
    const changePercent = Math.round(((recentAvgValue - historicalAvgValue) / historicalAvgValue) * 100);
    
    // Only show if it's a significant decline requiring action
    if (changePercent < -25) {
      insights.push({
        id: 'pipeline-value-decline',
        title: 'Deal Value Declining',
        metric: `${changePercent}%`,
        description: `Average deal value decreased ${Math.abs(changePercent)}% vs last month. Focus on qualifying higher-value prospects this week`,
        urgency: 'high',
        actionLabel: 'Add Deal',
        actionRoute: '/request/proposal',
        trend: 'down'
      });
    }
  }

  // 3. PROCESS BOTTLENECK DETECTION - Status transition timing
  const statusTimings = new Map<string, number[]>();
  
  sellerDeals.forEach(deal => {
    if (deal.lastStatusChange) {
      const daysInStatus = (now.getTime() - new Date(deal.lastStatusChange).getTime()) / (1000 * 60 * 60 * 24);
      if (!statusTimings.has(deal.status)) {
        statusTimings.set(deal.status, []);
      }
      statusTimings.get(deal.status)!.push(daysInStatus);
    }
  });

  // Identify bottlenecks
  statusTimings.forEach((timings, status) => {
    if (timings.length >= 2) {
      const avgTime = timings.reduce((sum: number, time: number) => sum + time, 0) / timings.length;
      const expectedTime = status === 'under_review' ? 3 : status === 'negotiating' ? 7 : 5;
      
      if (avgTime > expectedTime * 1.5) { // 50% longer than expected
        const actionGuidance = status === 'negotiating' 
          ? 'Schedule calls with prospects to move deals forward'
          : status === 'under_review'
          ? 'Contact approvers to expedite review process'
          : 'Follow up on pending items to accelerate progress';
        
        insights.push({
          id: `bottleneck-${status}`,
          title: `${status.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())} Bottleneck`,
          metric: `${Math.round(avgTime)}d`,
          description: `Deals averaging ${Math.round(avgTime)} days in ${status} vs ${expectedTime}d target. ${actionGuidance}`,
          urgency: avgTime > expectedTime * 2 ? 'high' : 'medium',
          actionLabel: status === 'negotiating' ? 'Call Prospects' : 'Follow Up',
          actionRoute: `/deals?status=${status}`,
          trend: 'down'
        });
        return; // Only show one bottleneck at a time
      }
    }
  });

  // 4. ONLY SHOW HIGH-VALUE DEALS IF THEY'RE ACTUALLY STUCK/STALLED
  // Remove "progressing well" insights as they don't need action

  // 5. CLOSING VELOCITY INTELLIGENCE - Deals ready for final push
  if (insights.length < 3) {
    const closingOpportunities = sellerDeals.filter(deal => 
      ['approved', 'contract_drafting'].includes(deal.status)
    );
    
    if (closingOpportunities.length > 0) {
      const closingValue = closingOpportunities.reduce((sum, deal) => sum + (deal.annualRevenue || 0), 0);
      const actionGuidance = closingOpportunities.length === 1 
        ? 'This deal is approved and ready to close - follow up today'
        : `${closingOpportunities.length} deals ready to close - schedule final meetings this week`;
      
      insights.push({
        id: 'closing-velocity',
        title: 'Deals Ready to Close',
        metric: closingOpportunities.length,
        description: `${formatShortCurrency(closingValue)} in approved deals ready for final close. ${actionGuidance}`,
        urgency: 'high',
        actionLabel: closingOpportunities.length === 1 ? 'Close Deal' : `Close (${closingOpportunities.length})`,
        actionRoute: closingOpportunities.length === 1 ? `/deals/${closingOpportunities[0].id}` : `/analytics?highlight=${closingOpportunities.map(d => d.id).join(',')}`,
        trend: 'up'
      });
    }
  }

  // 6. ONLY SHOW STAGNANT PIPELINE (ACTIONABLE PROBLEM)
  if (insights.length < 3) {
    const stagnantDeals = sellerDeals.filter(deal => 
      deal.status === 'submitted' && deal.lastStatusChange && 
      (now.getTime() - new Date(deal.lastStatusChange).getTime()) / (1000 * 60 * 60 * 24) > 2
    );
    
    if (stagnantDeals.length > 0) {
      const stagnantValue = stagnantDeals.reduce((sum, deal) => sum + (deal.annualRevenue || 0), 0);
      insights.push({
        id: 'pipeline-stagnation',
        title: 'Pipeline Needs Activation',
        metric: stagnantDeals.length,
        description: `${formatShortCurrency(stagnantValue)} in deals awaiting review - follow up to maintain momentum`,
        urgency: 'medium',
        actionLabel: `Activate (${stagnantDeals.length})`,
        actionRoute: `/analytics?highlight=${stagnantDeals.map(d => d.id).join(',')}`,
        trend: 'stable'
      });
    }
  }

  return insights.slice(0, 3); // Max 3 insights
}

// Helper function for currency formatting
function formatShortCurrency(amount: number): string {
  if (amount >= 1000000) {
    return `$${(amount / 1000000).toFixed(1)}M`;
  } else if (amount >= 1000) {
    return `$${(amount / 1000).toFixed(0)}K`;
  } else {
    return `$${amount.toFixed(0)}`;
  }
}

// Phase 2A: Enhanced Workflow Efficiency Intelligence using existing data
function generateWorkflowEfficiencyInsights(deals: Deal[], userRole: UserRole): StrategicInsight[] {
  const insights: StrategicInsight[] = [];
  const now = new Date();

  // 1. PROCESS BOTTLENECK DETECTION - Approval timing analysis
  const reviewingDeals = deals.filter(deal => deal.status === 'under_review');
  const stalledReviews = reviewingDeals.filter(deal => {
    if (!deal.lastStatusChange) return false;
    const daysSinceReview = (now.getTime() - new Date(deal.lastStatusChange).getTime()) / (1000 * 60 * 60 * 24);
    return daysSinceReview > 3; // Reviews taking longer than 3 days
  });

  if (stalledReviews.length > 0) {
    const totalStalledValue = stalledReviews.reduce((sum, deal) => sum + (deal.annualRevenue || 0), 0);
    const actionGuidance = stalledReviews.length === 1 
      ? 'Review the delayed deal today to prevent further stalling'
      : 'Block 2 hours to clear review backlog and prevent seller frustration';
    
    insights.push({
      id: 'review-bottleneck',
      title: 'Review Process Bottleneck',
      metric: stalledReviews.length,
      description: `${formatShortCurrency(totalStalledValue)} in deals delayed >3 days in review. ${actionGuidance}`,
      urgency: stalledReviews.length > 3 ? 'high' : 'medium',
      actionLabel: stalledReviews.length === 1 ? 'Review Deal' : `Review (${stalledReviews.length})`,
      actionRoute: '/deals?filter=delayed',
      trend: 'down'
    });
  }

  // 2. ONLY SHOW OVERWHELMED QUEUE (ACTIONABLE PROBLEM)
  const pendingQueue = deals.filter(deal => 
    deal.status === 'submitted' || deal.status === 'under_review'
  );

  // Only show if queue is genuinely overwhelming (>8 deals)
  if (pendingQueue.length > 8) {
    insights.push({
      id: 'queue-overwhelmed',
      title: 'Review Queue Overwhelmed',
      metric: pendingQueue.length,
      description: `Review queue at ${pendingQueue.length} deals. Consider delegating reviews or working extra hours to prevent bottleneck`,
      urgency: 'high',
      actionLabel: `Process (${pendingQueue.length})`,
      actionRoute: '/analytics',
      trend: 'up'
    });
  }

  // 3. ONLY SHOW DECLINING APPROVAL VELOCITY (ACTIONABLE PROBLEM)
  const recentApprovals = deals.filter(deal => {
    if (!deal.lastStatusChange || deal.status !== 'approved') return false;
    const daysOld = (now.getTime() - new Date(deal.lastStatusChange).getTime()) / (1000 * 60 * 60 * 24);
    return daysOld <= 7;
  });

  const olderApprovals = deals.filter(deal => {
    if (!deal.lastStatusChange || deal.status !== 'approved') return false;
    const daysOld = (now.getTime() - new Date(deal.lastStatusChange).getTime()) / (1000 * 60 * 60 * 24);
    return daysOld > 7 && daysOld <= 14;
  });

  if (recentApprovals.length > 0 && olderApprovals.length > 0) {
    const velocityChange = ((recentApprovals.length - olderApprovals.length) / olderApprovals.length) * 100;
    
    // Only show if velocity declined significantly (actionable problem)
    if (velocityChange < -30) {
      insights.push({
        id: 'approval-velocity-decline',
        title: 'Approval Velocity Declining',
        metric: `${Math.round(velocityChange)}%`,
        description: `Approval rate decreased ${Math.abs(Math.round(velocityChange))}% this week. Review process may need optimization - consider streamlining steps`,
        urgency: 'medium',
        actionLabel: 'Optimize',
        actionRoute: '/analytics',
        trend: 'down'
      });
    }
  }

  // 4. HIGH-VALUE QUEUE PRIORITY - Critical deals in queue
  const highValueInQueue = pendingQueue.filter(deal => (deal.annualRevenue || 0) >= 500000);
  
  if (highValueInQueue.length > 0 && insights.length < 3) {
    const totalHighValue = highValueInQueue.reduce((sum, deal) => sum + (deal.annualRevenue || 0), 0);
    const actionGuidance = highValueInQueue.length === 1 
      ? 'Review this high-value deal first to avoid revenue risk'
      : 'Process these high-value deals before smaller ones to maximize impact';
    
    insights.push({
      id: 'high-value-queue',
      title: 'High-Value Deals in Queue',
      metric: highValueInQueue.length,
      description: `${formatShortCurrency(totalHighValue)} in high-value deals awaiting review. ${actionGuidance}`,
      urgency: 'medium',
      actionLabel: 'Review High-Value First',
      actionRoute: '/deals?filter=high-value&status=submitted,under_review',
      trend: 'stable'
    });
  }

  // 5. Workflow health indicator (if no critical issues)
  if (insights.length === 0) {
    const activeWorkflow = deals.filter(deal => 
      ['submitted', 'under_review', 'negotiating', 'approved'].includes(deal.status)
    );
    
    if (activeWorkflow.length > 0) {
      insights.push({
        id: 'workflow-optimized',
        title: 'Workflow Operating Efficiently',
        metric: activeWorkflow.length,
        description: `${activeWorkflow.length} deal${activeWorkflow.length > 1 ? 's' : ''} flowing smoothly through approval process`,
        urgency: 'low',
        actionLabel: 'Monitor Trends',
        actionRoute: '/analytics',
        trend: 'stable'
      });
    }
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