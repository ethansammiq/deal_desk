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
      actionLabel: stalledDeals.length === 1 ? 'Contact This Client' : `Follow Up on ${stalledDeals.length} Deals`,
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

  if (olderDeals.length > 0 && recentDeals.length > 0) {
    const recentAvgValue = recentDeals.reduce((sum, deal) => sum + (deal.annualRevenue || 0), 0) / recentDeals.length;
    const historicalAvgValue = olderDeals.reduce((sum, deal) => sum + (deal.annualRevenue || 0), 0) / olderDeals.length;
    const changePercent = Math.round(((recentAvgValue - historicalAvgValue) / historicalAvgValue) * 100);
    
    if (Math.abs(changePercent) >= 20) {
      const actionGuidance = changePercent > 0 
        ? 'Continue targeting larger accounts to maintain momentum'
        : changePercent < -25 
          ? 'Focus on qualifying higher-value prospects this week'
          : 'Review recent wins to identify successful deal patterns';
      
      insights.push({
        id: 'pipeline-threshold-alert',
        title: 'Pipeline Value Trend Alert',
        metric: `${changePercent > 0 ? '+' : ''}${changePercent}%`,
        description: `Average deal value ${changePercent > 0 ? 'increased' : 'decreased'} ${Math.abs(changePercent)}% vs last month. ${actionGuidance}`,
        urgency: changePercent < -25 ? 'high' : 'medium',
        actionLabel: changePercent < -25 ? 'Create High-Value Deal' : 'View Deal History',
        actionRoute: changePercent < -25 ? '/request/proposal' : '/analytics',
        trend: changePercent > 0 ? 'up' : 'down'
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
          actionLabel: status === 'negotiating' ? 'Contact Prospects' : 'Follow Up',
          actionRoute: `/deals?status=${status}`,
          trend: 'down'
        });
        return; // Only show one bottleneck at a time
      }
    }
  });

  // 4. HIGH-VALUE OPPORTUNITY INTELLIGENCE - Focus on maximizing existing deals
  const highValueDeals = sellerDeals.filter(deal => {
    const value = deal.annualRevenue || 0;
    return value >= 500000 && !['signed', 'lost'].includes(deal.status);
  });

  if (highValueDeals.length > 0 && insights.length < 3) {
    const totalHighValue = highValueDeals.reduce((sum, deal) => sum + (deal.annualRevenue || 0), 0);
    const nearClosingDeals = highValueDeals.filter(deal => 
      ['approved', 'contract_drafting', 'negotiating'].includes(deal.status)
    );
    
    if (nearClosingDeals.length > 0) {
      const closingValue = nearClosingDeals.reduce((sum, deal) => sum + (deal.annualRevenue || 0), 0);
      const actionGuidance = nearClosingDeals.length === 1 
        ? 'This high-value deal is close to closing - prioritize it for maximum impact'
        : 'These high-value deals are progressing well - focus efforts here for biggest wins';
      
      insights.push({
        id: 'high-value-opportunity',
        title: 'High-Value Deals Progressing',
        metric: nearClosingDeals.length,
        description: `${formatShortCurrency(closingValue)} in high-value deals advancing. ${actionGuidance}`,
        urgency: 'medium',
        actionLabel: nearClosingDeals.length === 1 ? 'Focus on This Deal' : `Push ${nearClosingDeals.length} High-Value Deals`,
        actionRoute: nearClosingDeals.length === 1 ? `/deals/${nearClosingDeals[0].id}` : `/analytics?highlight=${nearClosingDeals.map(d => d.id).join(',')}`,
        trend: 'up',
        dealIds: nearClosingDeals.map(d => d.id)
      });
    } else {
      // High-value deals exist but need acceleration
      const actionGuidance = highValueDeals.length === 1 
        ? 'Push this high-value deal through approval to maximize quarterly impact'
        : 'Accelerate these high-value deals - they represent your biggest commission opportunity';
      
      insights.push({
        id: 'high-value-acceleration',
        title: 'High-Value Deals Need Push',
        metric: highValueDeals.length,
        description: `${formatShortCurrency(totalHighValue)} in high-value pipeline needs acceleration. ${actionGuidance}`,
        urgency: 'medium',
        actionLabel: highValueDeals.length === 1 ? 'Accelerate This Deal' : `Accelerate ${highValueDeals.length} Deals`,
        actionRoute: highValueDeals.length === 1 ? `/deals/${highValueDeals[0].id}` : `/analytics?highlight=${highValueDeals.map(d => d.id).join(',')}`,
        trend: 'stable'
      });
    }
  }

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
        actionLabel: closingOpportunities.length === 1 ? 'Close This Deal' : `Close ${closingOpportunities.length} Approved Deals`,
        actionRoute: closingOpportunities.length === 1 ? `/deals/${closingOpportunities[0].id}` : `/analytics?highlight=${closingOpportunities.map(d => d.id).join(',')}`,
        trend: 'up'
      });
    }
  }

  // 6. PIPELINE MOMENTUM INTELLIGENCE - Overall progress indicator  
  if (insights.length < 3) {
    const progressingDeals = sellerDeals.filter(deal => 
      ['under_review', 'negotiating', 'approved', 'contract_drafting'].includes(deal.status)
    );
    const stagnantDeals = sellerDeals.filter(deal => 
      deal.status === 'submitted' && deal.lastStatusChange && 
      (now.getTime() - new Date(deal.lastStatusChange).getTime()) / (1000 * 60 * 60 * 24) > 2
    );
    
    if (progressingDeals.length > stagnantDeals.length && progressingDeals.length > 0) {
      const progressValue = progressingDeals.reduce((sum, deal) => sum + (deal.annualRevenue || 0), 0);
      const actionLabel = progressingDeals.length === 1 
        ? 'Monitor This Deal'
        : `Check Status on ${progressingDeals.length} Deals`;
      
      insights.push({
        id: 'pipeline-momentum',
        title: 'Strong Pipeline Momentum',
        metric: progressingDeals.length,
        description: `${formatShortCurrency(progressValue)} in deals moving through workflow - keep pushing forward`,
        urgency: 'low',
        actionLabel,
        actionRoute: progressingDeals.length === 1 ? `/deals/${progressingDeals[0].id}` : `/analytics?highlight=${progressingDeals.map(d => d.id).join(',')}`,
        trend: 'up',
        dealIds: progressingDeals.map(d => d.id)
      });
    } else if (stagnantDeals.length > 0) {
      const stagnantValue = stagnantDeals.reduce((sum, deal) => sum + (deal.annualRevenue || 0), 0);
      insights.push({
        id: 'pipeline-stagnation',
        title: 'Pipeline Needs Activation',
        metric: stagnantDeals.length,
        description: `${formatShortCurrency(stagnantValue)} in deals awaiting review - follow up to maintain momentum`,
        urgency: 'medium',
        actionLabel: 'Activate Stagnant Deals',
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
      actionLabel: 'Review Delayed Deals',
      actionRoute: '/deals?filter=delayed',
      trend: 'down'
    });
  }

  // 2. QUEUE THRESHOLD MONITORING - Workload capacity analysis  
  const pendingQueue = deals.filter(deal => 
    deal.status === 'submitted' || deal.status === 'under_review'
  );

  // Historical queue baseline (using creation patterns)
  const recentQueue = deals.filter(deal => {
    if (!deal.createdAt) return false;
    const daysOld = (now.getTime() - new Date(deal.createdAt).getTime()) / (1000 * 60 * 60 * 24);
    return daysOld <= 7 && (deal.status === 'submitted' || deal.status === 'under_review');
  });

  const historicalQueue = deals.filter(deal => {
    if (!deal.createdAt) return false;
    const daysOld = (now.getTime() - new Date(deal.createdAt).getTime()) / (1000 * 60 * 60 * 24);
    return daysOld > 7 && daysOld <= 14 && (deal.status === 'submitted' || deal.status === 'under_review');
  });

  if (pendingQueue.length > 5 || (recentQueue.length > historicalQueue.length * 1.5)) {
    const actionGuidance = pendingQueue.length > 8 
      ? 'Consider delegating reviews or working extra hours to prevent bottleneck'
      : 'Prioritize high-value deals and process smaller deals in batches';
    
    insights.push({
      id: 'queue-capacity-alert',
      title: 'Queue Capacity Alert',
      metric: pendingQueue.length,
      description: `Review queue at ${pendingQueue.length} deals - ${Math.round((recentQueue.length / Math.max(historicalQueue.length, 1)) * 100)}% vs last week. ${actionGuidance}`,
      urgency: pendingQueue.length > 8 ? 'high' : 'medium',
      actionLabel: 'Process Queue',
      actionRoute: '/deals?status=submitted,under_review',
      trend: recentQueue.length > historicalQueue.length ? 'up' : 'stable'
    });
  }

  // 3. APPROVAL VELOCITY TRACKING - Time-to-approval analysis
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
    
    if (Math.abs(velocityChange) >= 25) {
      const actionGuidance = velocityChange > 0 
        ? 'Great momentum! Maintain current review pace to support sales team'
        : 'Review process may need optimization - consider streamlining steps';
      
      insights.push({
        id: 'approval-velocity',
        title: 'Approval Velocity Change',
        metric: `${velocityChange > 0 ? '+' : ''}${Math.round(velocityChange)}%`,
        description: `Approval rate ${velocityChange > 0 ? 'increased' : 'decreased'} ${Math.abs(Math.round(velocityChange))}% this week. ${actionGuidance}`,
        urgency: velocityChange < -30 ? 'medium' : 'low',
        actionLabel: velocityChange > 0 ? 'View Recent Approvals' : 'Optimize Process',
        actionRoute: velocityChange > 0 ? '/deals?status=approved' : '/deals?status=under_review',
        trend: velocityChange > 0 ? 'up' : 'down'
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