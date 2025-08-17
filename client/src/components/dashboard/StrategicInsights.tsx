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
    insights.push({
      id: 'stall-risk-prediction',
      title: 'Deals at Stall Risk',
      metric: stalledDeals.length,
      description: `${formatShortCurrency(totalStalledValue)} in pipeline needs immediate attention to prevent stalling`,
      urgency: 'high',
      actionLabel: 'Review At-Risk Deals',
      actionRoute: '/deals',
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
      insights.push({
        id: 'pipeline-threshold-alert',
        title: 'Pipeline Value Trend Alert',
        metric: `${changePercent > 0 ? '+' : ''}${changePercent}%`,
        description: `Average deal value ${changePercent > 0 ? 'increased' : 'decreased'} ${Math.abs(changePercent)}% vs last month`,
        urgency: changePercent < -25 ? 'high' : 'medium',
        actionLabel: 'Analyze Trend',
        actionRoute: '/analytics',
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
        insights.push({
          id: `bottleneck-${status}`,
          title: `${status.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())} Bottleneck`,
          metric: `${Math.round(avgTime)}d`,
          description: `Deals averaging ${Math.round(avgTime)} days in ${status} vs ${expectedTime}d target`,
          urgency: avgTime > expectedTime * 2 ? 'high' : 'medium',
          actionLabel: 'Investigate Delays',
          actionRoute: '/deals',
          trend: 'down'
        });
        return; // Only show one bottleneck at a time
      }
    }
  });

  // 4. High-value concentration risk (existing logic enhanced)
  const highValueDeals = sellerDeals.filter(deal => {
    const value = deal.annualRevenue || 0;
    return value >= 500000 && !['signed', 'lost'].includes(deal.status);
  });

  if (highValueDeals.length > 0 && insights.length < 3) {
    const totalHighValue = highValueDeals.reduce((sum, deal) => sum + (deal.annualRevenue || 0), 0);
    const totalPipelineValue = activeDeals.reduce((sum, deal) => sum + (deal.annualRevenue || 0), 0);
    const concentration = Math.round((totalHighValue / totalPipelineValue) * 100);
    
    if (concentration > 60) { // Only show if high concentration
      insights.push({
        id: 'concentration-risk',
        title: 'High-Value Concentration Risk',
        metric: `${concentration}%`,
        description: `${highValueDeals.length} deals >$500K represent ${concentration}% of pipeline value`,
        urgency: concentration > 80 ? 'high' : 'medium',
        actionLabel: 'Diversify Pipeline',
        actionRoute: '/deals',
        trend: concentration > 80 ? 'up' : 'stable'
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
    insights.push({
      id: 'review-bottleneck',
      title: 'Review Process Bottleneck',
      metric: stalledReviews.length,
      description: `${formatShortCurrency(totalStalledValue)} in deals delayed >3 days in review`,
      urgency: stalledReviews.length > 3 ? 'high' : 'medium',
      actionLabel: 'Expedite Reviews',
      actionRoute: '/deals',
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
    insights.push({
      id: 'queue-capacity-alert',
      title: 'Queue Capacity Alert',
      metric: pendingQueue.length,
      description: `Review queue at ${pendingQueue.length} deals - ${Math.round((recentQueue.length / Math.max(historicalQueue.length, 1)) * 100)}% vs last week`,
      urgency: pendingQueue.length > 8 ? 'high' : 'medium',
      actionLabel: 'Manage Workload',
      actionRoute: '/deals',
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
      insights.push({
        id: 'approval-velocity',
        title: 'Approval Velocity Change',
        metric: `${velocityChange > 0 ? '+' : ''}${Math.round(velocityChange)}%`,
        description: `Approval rate ${velocityChange > 0 ? 'increased' : 'decreased'} ${Math.abs(Math.round(velocityChange))}% this week`,
        urgency: velocityChange < -30 ? 'medium' : 'low',
        actionLabel: 'Analyze Performance',
        actionRoute: '/analytics',
        trend: velocityChange > 0 ? 'up' : 'down'
      });
    }
  }

  // 4. HIGH-VALUE QUEUE PRIORITY - Critical deals in queue
  const highValueInQueue = pendingQueue.filter(deal => (deal.annualRevenue || 0) >= 500000);
  
  if (highValueInQueue.length > 0 && insights.length < 3) {
    const totalHighValue = highValueInQueue.reduce((sum, deal) => sum + (deal.annualRevenue || 0), 0);
    insights.push({
      id: 'high-value-queue',
      title: 'High-Value Deals in Queue',
      metric: highValueInQueue.length,
      description: `${formatShortCurrency(totalHighValue)} in high-value deals awaiting review`,
      urgency: 'medium',
      actionLabel: 'Prioritize Review',
      actionRoute: '/deals',
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