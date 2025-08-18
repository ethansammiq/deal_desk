import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Clock, TrendingUp, TrendingDown, Minus, ExternalLink } from 'lucide-react';
import { Deal, UserRole } from '@shared/schema';
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

  // 1. CONSOLIDATED STALL RISK INTELLIGENCE - All deals needing follow-up
  // Import flow classification to ensure consistency
  const stalledDeals = sellerDeals.filter(deal => {
    if (['signed', 'lost', 'draft'].includes(deal.status)) return false;
    const flow = classifyDealFlow(deal);
    return flow.flowStatus === 'needs_attention';
  });

  if (stalledDeals.length > 0) {
    const totalStalledValue = stalledDeals.reduce((sum, deal) => sum + (deal.annualRevenue || 0), 0);
    
    // Separate external vs internal follow-ups for better guidance
    const externalDeals = stalledDeals.filter(deal => deal.status === 'negotiating');
    const internalDeals = stalledDeals.filter(deal => 
      ['under_review', 'revision_requested', 'approved', 'contract_drafting'].includes(deal.status)
    );
    
    const actionGuidance = externalDeals.length > 0 
      ? (externalDeals.length === 1 ? 'Contact client to move negotiation forward' : 'Contact clients to accelerate negotiations')
      : (internalDeals.length === 1 ? 'Follow up internally to move deal forward' : 'Follow up internally on stalled deals');
    
    // Streamlined: Single "Review" action for all insights
    
    insights.push({
      id: 'stall-risk-consolidated',
      title: 'Deals Need Follow-Up',
      metric: stalledDeals.length,
      description: `${formatShortCurrency(totalStalledValue)} in pipeline stalling. ${actionGuidance}`,
      urgency: 'high',
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
      insights.push({
        id: 'pipeline-value-decline',
        title: 'Deal Value Declining',
        metric: `${changePercent}%`,
        description: `Average deal value decreased ${Math.abs(changePercent)}% vs last month. Focus on qualifying higher-value prospects this week`,
        urgency: 'high',
        actionLabel: 'Review',
        actionRoute: '/request/proposal',
        trend: 'down'
      });
    }
  }

  // REMOVED: Process bottleneck detection is now consolidated into stall risk above

  // 4. ONLY SHOW HIGH-VALUE DEALS IF THEY'RE ACTUALLY STUCK/STALLED
  // Remove "progressing well" insights as they don't need action

  // REMOVED: Closing velocity intelligence consolidated into stall risk above

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
        actionLabel: 'Review',
        actionRoute: `/analytics?filter=needs_attention`,
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
    
    insights.push({
      id: 'review-bottleneck',
      title: 'Review Process Bottleneck',
      metric: stalledReviews.length,
      description: `${formatShortCurrency(totalStalledValue)} in deals delayed >3 days in review. ${actionGuidance}`,
      urgency: stalledReviews.length > 3 ? 'high' : 'medium',
      actionLabel: 'Review',
      actionRoute: '/analytics?filter=delayed',
      trend: 'down'
    });
  }

  // REMOVED: Queue overwhelmed - processing normal work isn't actionable within app

  // REMOVED: Velocity declining - optimizing process isn't actionable within app

  // REMOVED: High-value queue priority - no longer needed after consolidation


  // REMOVED: Workflow health indicator - informational only, not actionable

  return insights.slice(0, 3); // Max 3 insights
}

// Main component
export function StrategicInsights({ userRole, deals, userEmail }: StrategicInsightsProps) {
  const insights = userRole === 'seller' 
    ? generatePipelineHealthInsights(deals, userEmail)
    : generateWorkflowEfficiencyInsights(deals, userRole);

  // Don't render if no insights (normal operation when all deals are progressing well)
  if (insights.length === 0) {
    return null;
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