import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Clock, TrendingUp, TrendingDown, Minus, ExternalLink } from 'lucide-react';
import { Deal, UserRole, DealPriority } from '@shared/schema';
import { Link } from 'wouter';
import { classifyDealFlow } from "@/utils/dealClassification";
import { useQuery } from '@tanstack/react-query';
import { DealCalculationService } from '@/services/dealCalculations';

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

// Helper function to get aggregated tier revenue for a deal
async function getDealTierRevenue(dealId: number): Promise<number> {
  try {
    const response = await fetch(`/api/deals/${dealId}/tiers`);
    if (!response.ok) return 0;
    const tiers = await response.json();
    const calculationService = new DealCalculationService([], []);
    const metrics = calculationService.calculateDealMetrics(tiers);
    return metrics.totalAnnualRevenue;
  } catch {
    return 0;
  }
}

// Hook to get tier revenues for multiple deals
function useDealTierRevenues(dealIds: number[]) {
  return useQuery({
    queryKey: ['deal-tier-revenues', dealIds],
    queryFn: async () => {
      const revenues = await Promise.all(
        dealIds.map(async (id) => {
          const revenue = await getDealTierRevenue(id);
          return { dealId: id, revenue };
        })
      );
      return revenues.reduce((acc, { dealId, revenue }) => {
        acc[dealId] = revenue;
        return acc;
      }, {} as Record<number, number>);
    },
    enabled: dealIds.length > 0
  });
}

// Phase 2A: Enhanced Pipeline Health Intelligence using existing data
function generatePipelineHealthInsights(deals: Deal[], userEmail?: string, tierRevenues: Record<number, number> = {}): StrategicInsight[] {
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
    const totalStalledValue = stalledDeals.reduce((sum, deal) => sum + (tierRevenues[deal.id] || 0), 0);
    
    // Enhanced contextual guidance based on deal types and risk factors
    const externalDeals = stalledDeals.filter(deal => 
      ['negotiating', 'client_review'].includes(deal.status)
    );
    const internalDeals = stalledDeals.filter(deal => 
      ['under_review', 'submitted', 'approved', 'contract_drafting'].includes(deal.status)
    );
    // Note: revision_requested is now handled within approval system, not as deal status
    const highRevisionDeals = stalledDeals.filter(deal => deal.revisionCount && deal.revisionCount >= 2);

    // Determine priority based on deal mix
    const highPriorityDeals = stalledDeals.filter(deal => deal.priority === 'critical' || deal.priority === 'high');
    const insightPriority: DealPriority = highPriorityDeals.length > 0 ? 'high' : 'medium';
    
    // ENHANCED: Create separate insights for client vs internal follow-up
    if (externalDeals.length > 0 && internalDeals.length > 0) {
      // Mixed scenario - create combined insight with clear breakdown
      const externalValue = externalDeals.reduce((sum, deal) => sum + (tierRevenues[deal.id] || 0), 0);
      const internalValue = internalDeals.reduce((sum, deal) => sum + (tierRevenues[deal.id] || 0), 0);
      
      insights.push({
        id: 'stall-risk-combined',
        title: 'Client & Internal Follow-Up',
        metric: stalledDeals.length,
        description: `${externalDeals.length} client follow-up (${formatShortCurrency(externalValue)}) + ${internalDeals.length} internal follow-up (${formatShortCurrency(internalValue)})`,
        priority: insightPriority,
        actionLabel: 'Review All',
        actionRoute: `/analytics?filter=needs_attention`,
        dealIds: stalledDeals.map(d => d.id),
        trend: 'down'
      });
    } else if (externalDeals.length > 0) {
      // Client follow-up only
      const externalValue = externalDeals.reduce((sum, deal) => sum + (tierRevenues[deal.id] || 0), 0);
      const actionGuidance = externalDeals.length === 1 
        ? 'Contact client today to move deal forward' 
        : 'Contact clients to accelerate progress';
        
      insights.push({
        id: 'stall-risk-client',
        title: 'Client Follow-Up Required',
        metric: externalDeals.length,
        description: `${formatShortCurrency(externalValue)} in client negotiations stalling. ${actionGuidance}`,
        priority: insightPriority,
        actionLabel: 'Contact Client',
        actionRoute: externalDeals.length === 1 ? `/deals/${externalDeals[0].id}` : `/analytics?filter=needs_attention`,
        dealIds: externalDeals.map(d => d.id),
        trend: 'down'
      });
    } else if (internalDeals.length > 0) {
      // Internal follow-up only
      const internalValue = internalDeals.reduce((sum, deal) => sum + (tierRevenues[deal.id] || 0), 0);
      const actionGuidance = internalDeals.length === 1 
        ? 'Follow up internally to move deal forward' 
        : 'Follow up with internal teams on stalled deals';
        
      insights.push({
        id: 'stall-risk-internal',
        title: 'Internal Follow-Up Required',
        metric: internalDeals.length,
        description: `${formatShortCurrency(internalValue)} in internal pipeline stalling. ${actionGuidance}`,
        priority: insightPriority,
        actionLabel: 'Follow Up',
        actionRoute: internalDeals.length === 1 ? `/deals/${internalDeals[0].id}` : `/analytics?filter=needs_attention`,
        dealIds: internalDeals.map(d => d.id),
        trend: 'down'
      });
    }
    
    // Handle high revision deals as separate insight if present
    if (highRevisionDeals.length > 0) {
      const revisionValue = highRevisionDeals.reduce((sum, deal) => sum + (tierRevenues[deal.id] || 0), 0);
      const actionGuidance = highRevisionDeals.length === 1 
        ? 'Deal has multiple revision requests - needs immediate attention'
        : 'Multiple deals have repeated revision requests - review strategy';
        
      insights.push({
        id: 'revision-risk',
        title: 'High Revision Risk',
        metric: highRevisionDeals.length,
        description: `${formatShortCurrency(revisionValue)} in deals with 2+ revisions. ${actionGuidance}`,
        priority: 'high',
        actionLabel: 'Review Strategy',
        actionRoute: highRevisionDeals.length === 1 ? `/deals/${highRevisionDeals[0].id}` : `/analytics?filter=needs_attention`,
        dealIds: highRevisionDeals.map(d => d.id),
        trend: 'down'
      });
    }
  }

  // 2. PERFORMANCE THRESHOLD MONITORING - Pipeline value changes
  const activeDeals = sellerDeals.filter(deal => 
    !['signed', 'lost', 'draft'].includes(deal.status)
  );
  const currentPipelineValue = activeDeals.reduce((sum, deal) => sum + (tierRevenues[deal.id] || 0), 0);
  
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
    const recentAvgValue = recentDeals.reduce((sum, deal) => sum + (tierRevenues[deal.id] || 0), 0) / recentDeals.length;
    const historicalAvgValue = olderDeals.reduce((sum, deal) => sum + (tierRevenues[deal.id] || 0), 0) / olderDeals.length;
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
function generateWorkflowEfficiencyInsights(deals: Deal[], userRole: UserRole, userDepartment?: string, approvalItems?: any[], tierRevenues: Record<number, number> = {}): StrategicInsight[] {
  const insights: StrategicInsight[] = [];
  const now = new Date();

  // 1. PROCESS BOTTLENECK DETECTION - Use department-filtered approval queue data
  // This ensures consistency with the metrics that show 0 pending reviews for Creative
  if (userRole === 'department_reviewer' && approvalItems) {
    // Only look at deals that are actually in this department's queue
    const departmentReviewItems = approvalItems.filter(item => item.type === 'department_approval');
    const departmentDealIds = departmentReviewItems.map(item => item.dealId);
    const reviewingDeals = deals.filter(deal => departmentDealIds.includes(deal.id));
    
    const stalledReviews = reviewingDeals.filter(deal => {
      if (!deal.lastStatusChange) return false;
      const daysSinceReview = (now.getTime() - new Date(deal.lastStatusChange).getTime()) / (1000 * 60 * 60 * 24);
      return daysSinceReview > 3; // Reviews taking longer than 3 days
    });

    if (stalledReviews.length > 0) {
      const totalStalledValue = stalledReviews.reduce((sum, deal) => sum + (tierRevenues[deal.id] || 0), 0);
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
      const totalStalledValue = stalledReviews.reduce((sum, deal) => sum + (tierRevenues[deal.id] || 0), 0);
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
  // Get tier revenues for all deals
  const dealIds = deals.map(d => d.id);
  const { data: tierRevenues, isLoading } = useDealTierRevenues(dealIds);
  
  // Show loading while tier revenues are being fetched
  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
        <div className="h-20 bg-gray-100 rounded animate-pulse"></div>
      </div>
    );
  }

  const insights = userRole === 'seller' 
    ? generatePipelineHealthInsights(deals, userEmail, tierRevenues || {})
    : generateWorkflowEfficiencyInsights(deals, userRole, userDepartment, approvalItems, tierRevenues || {});

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
              Deal Pipeline Intelligence
              {insights.some(i => i.priority === 'high' || i.priority === 'critical') && (
                <Badge variant="destructive" className="text-xs">
                  Action Required
                </Badge>
              )}
            </CardTitle>
            <CardDescription className="text-slate-500">
              Strategic insights to identify gaps and prioritize actionable next steps
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