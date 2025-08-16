import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DealRow } from "./DealRow";
import { Link, useLocation } from "wouter";
import { useSellerMetrics, useSellerDealCategories } from "@/hooks/useSellerMetrics";
import type { Deal } from "@shared/schema";
import { 
  AlertTriangle, 
  Clock, 
  TrendingUp, 
  Briefcase,
  PlusCircle
} from "lucide-react";

interface PipelineSectionProps {
  deals: Deal[];
  userEmail?: string;
  className?: string;
}

export function PipelineSection({ deals, userEmail, className = "" }: PipelineSectionProps) {
  const [, navigate] = useLocation();
  
  // Get seller-specific data using centralized hooks
  const sellerMetrics = useSellerMetrics({ deals, userEmail });
  const { dealsNeedingAction, activeDeals, signedThisMonth } = useSellerDealCategories(deals, userEmail);

  // Helper to format currency in shortened format
  const formatShortCurrency = (amount: number): string => {
    if (amount === 0) return "$0";
    if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `$${(amount / 1000).toFixed(1)}K`;
    return `$${amount.toLocaleString()}`;
  };

  return (
    <Card className={`border border-slate-200 shadow-sm bg-white ${className}`}>
      <CardHeader className="pb-6">
        <div className="flex items-center gap-3">
          <div className="w-1 h-6 bg-[#3e0075] rounded-full"></div>
          <div className="flex-1">
            <CardTitle className="text-xl font-semibold text-slate-900 flex items-center gap-3">
              My Pipeline
              {dealsNeedingAction.length > 0 && (
                <Badge variant="outline" className="border-orange-200 text-orange-700 bg-orange-50">
                  {dealsNeedingAction.length}
                </Badge>
              )}
            </CardTitle>
            <CardDescription className="text-slate-500">
              Your deals, actions, and performance
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Action Required Section */}
          {dealsNeedingAction.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                Action Required ({dealsNeedingAction.length})
              </h4>
              {dealsNeedingAction.slice(0, 3).map((deal) => (
                <DealRow
                  key={deal.id}
                  deal={deal}
                  variant="action"
                  onClick={() => navigate(`/deals/${deal.id}`)}
                  actionButton={{
                    label: "Fix Now",
                    onClick: () => navigate(`/deals/${deal.id}`)
                  }}
                  showValue={false}
                />
              ))}
            </div>
          )}

          {/* Active Deals Section */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Active Deals ({activeDeals.length})
            </h4>
            {activeDeals.length > 0 ? (
              <>
                {activeDeals.slice(0, 5).map((deal) => (
                  <DealRow
                    key={deal.id}
                    deal={deal}
                    variant="default"
                    onClick={() => navigate(`/deals/${deal.id}`)}
                    showValue={true}
                  />
                ))}
                {activeDeals.length > 5 && (
                  <div className="pt-2">
                    <Button asChild variant="ghost" className="w-full text-[#3e0075] hover:bg-[#f8f5ff]">
                      <Link to="/analytics">
                        View {activeDeals.length - 5} more active deals →
                      </Link>
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-8 border border-slate-200 rounded-lg">
                <Briefcase className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                <p className="text-slate-500 text-sm">No active deals in your pipeline</p>
              </div>
            )}
          </div>

          {/* Recent Performance Section */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Recent Performance
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-center">
                <div className="text-lg font-semibold text-green-700">{signedThisMonth.length}</div>
                <div className="text-xs text-green-600">Signed This Month</div>
              </div>
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-center">
                <div className="text-lg font-semibold text-blue-700">{formatShortCurrency(sellerMetrics.pipelineValue)}</div>
                <div className="text-xs text-blue-600">Pipeline Value</div>
              </div>
            </div>
            <Button asChild className="w-full bg-[#3e0075] hover:bg-[#2d0055] text-white">
              <Link to="/request/proposal">
                <PlusCircle className="h-4 w-4 mr-2" />
                Create New Deal
              </Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}