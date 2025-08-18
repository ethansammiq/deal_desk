import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Clock, TrendingUp, TrendingDown, Minus, ExternalLink } from 'lucide-react';
import { Deal, UserRole, DealPriority } from '@shared/schema';
import { Link } from 'wouter';
import { classifyDealFlow } from "@/utils/dealClassification";

interface StrategicInsight {
  id: string;
  title: string;
  metric: number | string;
  description: string;
  trend?: 'up' | 'down' | 'stable';
  actionLabel: string;
  actionRoute: string;
  priority: DealPriority; // Use actual deal priority instead of custom urgency
  dealIds?: number[]; // For linking to specific deals
}

interface StrategicInsightsProps {
  userRole: UserRole;
  deals: Deal[];
  userEmail?: string;
  userDepartment?: string;
  approvalItems?: any[]; // Department-filtered approval queue items
}

// Phase 2A: Enhanced Pipeline Health Intelligence using existing data
function generatePipelineHealthInsights(deals: Deal[], userEmail?: string): StrategicInsight[] {
  // Step 1: Exclude both 'draft' and 'scoping' status for seller insights
  const sellerDeals = userEmail 
    ? deals.filter(deal => deal.email === userEmail && !['draft', 'scoping'].includes(deal.status))
    : deals.filter(deal => !['draft', 'scoping'].includes(deal.status));

  const insights: StrategicInsight[] = [];
  const now = new Date();

  // 1. CONSOLIDATED STALL RISK INTELLIGENCE - All deals needing follow-up  
  // Use enhanced flowIntelligence that includes both timing and business risk criteria
  const stalledDeals = sellerDeals.filter(deal => {
    // Step 2: Also exclude 'scoping' from flowIntelligence check
    if (['signed', 'lost', 'draft', 'scoping'].includes(deal.status)) return false;
    return deal.flowIntelligence === 'needs_attention';
  });

  if (stalledDeals.length > 0) {
    const totalStalledValue = stalledDeals.reduce((sum, deal) => sum + (deal.annualRevenue || 0), 0);
    
    // Enhanced contextual guidance based on deal types and risk factors
    const externalDeals = stalledDeals.filter(deal => 
      ['negotiating', 'client_review'].includes(deal.status)
    );
    const internalDeals = stalledDeals.filter(deal => 
      ['under_review', 'submitted', 'approved', 'contract_drafting'].includes(deal.status)
    );
    const revisionDeals = stalledDeals.filter(deal => deal.status === 'revision_requested');
    const highRevisionDeals = stalledDeals.filter(deal => deal.revisionCount && deal.revisionCount >= 2);

    
    let actionGuidance = '';
    let insightPriority: DealPriority = 'medium';
    
    // Determine guidance based on deal mix and priority
    const highPriorityDeals = stalledDeals.filter(deal => deal.priority === 'critical' || deal.priority === 'high');
    if (highPriorityDeals.length > 0) {
      insightPriority = 'high';
    }
    
    // Prioritize guidance based on urgency and type
    if (revisionDeals.length > 0) {
      actionGuidance = revisionDeals.length === 1 
        ? 'Address revision feedback and resubmit deal'
        : 'Address revision feedback on multiple deals';
    } else if (highRevisionDeals.length > 0) {
      actionGuidance = highRevisionDeals.length === 1
        ? 'Deal has multiple revisions - review strategy'
        : 'Multiple deals with revision issues - review approach';
    } else if (externalDeals.length > 0) {
      actionGuidance = externalDeals.length === 1 
        ? 'Contact client to move deal forward' 
        : 'Contact clients to accelerate progress';
    } else {
      actionGuidance = internalDeals.length === 1 
        ? 'Follow up internally to move deal forward' 
        : 'Follow up internally on stalled deals';
    }
    
    insights.push({
      id: 'stall-risk-consolidated',
      title: 'Deals Need Attention',
      metric: stalledDeals.length,
      description: `${formatShortCurrency(totalStalledValue)} in pipeline stalling. ${actionGuidance}`,
      priority: insightPriority,
      actionLabel: 'Review',
      actionRoute: stalledDeals.length === 1 ? `/deals/${stalledDeals[0].id}` : `/analytics?filter=needs_attention`,
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
      // Use priority-based logic instead of fixed 'high'
      const insightPriority: DealPriority = Math.abs(changePercent) > 40 ? 'high' : 'medium';
      
      insights.push({
        id: 'pipeline-value-decline',
        title: 'Deal Value Declining',
        metric: `${changePercent}%`,
        description: `Average deal value decreased ${Math.abs(changePercent)}% vs last month. Focus on qualifying higher-value prospects this week`,
        priority: insightPriority,
        actionLabel: 'Review',
        actionRoute: '/request/proposal',
        trend: 'down'
      });
    }
  }

  // REMOVED: Pipeline Needs Activation insight per feedback
  // Seller should follow up internally if submitted deals don't move within 2-3 days

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
function generateWorkflowEfficiencyInsights(deals: Deal[], userRole: UserRole, userDepartment?: string, approvalItems?: any[]): StrategicInsight[] {
  const insights: StrategicInsight[] = [];
  const now = new Date();

  // 1. PROCESS BOTTLENECK DETECTION - Use department-filtered approval queue data
  // This ensures consistency with the metrics that show 0 pending reviews for Creative
  if (userRole === 'department_reviewer' && approvalItems) {
    // Only look at deals that are actually in this department's queue
    const departmentReviewItems = approvalItems.filter(item => item.type === 'technical_review');
    const departmentDealIds = departmentReviewItems.map(item => item.dealId);
    const reviewingDeals = deals.filter(deal => departmentDealIds.includes(deal.id));
    
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
      
      // Determine priority based on priority levels of stalled deals
      const highPriorityStalled = stalledReviews.filter(deal => 
        deal.priority === 'critical' || deal.priority === 'high'
      );
      const insightPriority: DealPriority = highPriorityStalled.length > 0 ? 'high' : 
                          stalledReviews.length > 3 ? 'medium' : 'low';
      
      insights.push({
        id: 'review-bottleneck',
        title: 'Review Process Bottleneck',
        metric: stalledReviews.length,
        description: `${formatShortCurrency(totalStalledValue)} in deals delayed >3 days in review. ${actionGuidance}`,
        priority: insightPriority,
        actionLabel: 'Review',
        actionRoute: stalledReviews.length === 1 ? `/deals/${stalledReviews[0].id}` : '/analytics?filter=needs_attention',
        trend: 'down'
      });
    }
  } else {
    // For approvers, use the existing logic but filtered by business approvals
    const reviewingDeals = deals.filter(deal => 
      deal.status === 'under_review' || deal.status === 'submitted'
    );
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
      
      // Determine priority based on priority levels of stalled deals
      const highPriorityStalled = stalledReviews.filter(deal => 
        deal.priority === 'critical' || deal.priority === 'high'
      );
      const insightPriority: DealPriority = highPriorityStalled.length > 0 ? 'high' : 
                          stalledReviews.length > 3 ? 'medium' : 'low';
      
      insights.push({
        id: 'review-bottleneck',
        title: 'Review Process Bottleneck',
        metric: stalledReviews.length,
        description: `${formatShortCurrency(totalStalledValue)} in deals delayed >3 days in review. ${actionGuidance}`,
        priority: insightPriority,
        actionLabel: 'Review',
        actionRoute: stalledReviews.length === 1 ? `/deals/${stalledReviews[0].id}` : '/analytics?filter=needs_attention',
        trend: 'down'
      });
    }
  }

  // REMOVED: Queue overwhelmed - processing normal work isn't actionable within app

  // REMOVED: Velocity declining - optimizing process isn't actionable within app

  // REMOVED: High-value queue priority - no longer needed after consolidation


  // REMOVED: Workflow health indicator - informational only, not actionable

  return insights.slice(0, 3); // Max 3 insights
}

// Main component
export function StrategicInsights({ userRole, deals, userEmail, userDepartment, approvalItems }: StrategicInsightsProps) {
  const insights = userRole === 'seller' 
    ? generatePipelineHealthInsights(deals, userEmail)
    : generateWorkflowEfficiencyInsights(deals, userRole, userDepartment, approvalItems);

  // Don't render if no insights (normal operation when all deals are progressing well)
  if (insights.length === 0) {
    return null;
  }

  // Use Priority-based styling for consistency with deal priority labels
  const getPriorityColor = (priority: DealPriority) => {
    switch (priority) {
      case 'critical':
      case 'high': 
        return 'border-red-200 bg-red-50'; // Critical/High priority styling
      case 'medium': 
        return 'border-amber-200 bg-amber-50'; // Medium priority styling  
      default: 
        return 'border-slate-200 bg-slate-50'; // Low priority styling
    }
  };

  const getPriorityBadge = (priority: DealPriority) => {
    switch (priority) {
      case 'critical':
      case 'high': 
        return 'destructive'; // Red for high priority
      case 'medium': 
        return 'secondary'; // Gray for medium priority
      default: 
        return 'outline'; // Outline for low priority
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
              {insights.some(i => i.priority === 'high' || i.priority === 'critical') && (
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
              className={`p-4 border rounded-lg transition-all hover:shadow-sm ${getPriorityColor(insight.priority)}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-slate-900">{insight.title}</h4>
                      {insight.trend && getTrendIcon(insight.trend)}
                    </div>
                    <Badge variant={getPriorityBadge(insight.priority)} className="text-xs">
                      {insight.priority.charAt(0).toUpperCase() + insight.priority.slice(1)}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-2xl font-bold text-slate-900">{insight.metric}</div>
                    <p className="text-sm text-slate-600">{insight.description}</p>
                  </div>
                </div>
                <Button asChild variant="outline" size="sm" className="border-[#3e0075] text-[#3e0075] hover:bg-[#3e0075] hover:text-white">
                  <Link to={insight.actionRoute}>
                    Review
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