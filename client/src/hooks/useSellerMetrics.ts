import { useMemo } from "react";
import type { Deal } from "@shared/schema";

interface SellerMetrics {
  pipelineValue: number;
  closeRate: number;
  dealsAtRisk: number;
  totalDeals: number;
  signedDeals: number;
  activeDeals: number;
  submittedDeals: number;
  signedThisMonth: number;
}

interface UseSellerMetricsProps {
  deals: Deal[];
  userEmail?: string;
  tierRevenues?: Record<number, number>; // Revenue values from tier data
}

export function useSellerMetrics({ deals, userEmail, tierRevenues = {} }: UseSellerMetricsProps): SellerMetrics {
  return useMemo(() => {
    // Filter deals for the seller
    const sellerDeals = userEmail
      ? deals.filter(deal => 
          deal.email === userEmail && 
          deal.status !== 'draft'
        )
      : deals.filter(deal => deal.status !== 'draft');

    // Calculate Pipeline Value using tier revenues with fallback to base deal data
    const activePipelineDeals = sellerDeals.filter(deal => !['signed', 'lost'].includes(deal.status));
    console.log("Pipeline calculation - active deals:", activePipelineDeals.map(d => ({ id: d.id, name: d.dealName, status: d.status })));
    console.log("Pipeline calculation - tier revenues:", tierRevenues);
    
    const pipelineValue = activePipelineDeals
      .reduce((sum, deal) => {
        const tierRevenue = tierRevenues[deal.id] || 0;
        const fallbackRevenue = (deal as any).annualRevenue || 0;
        const usedRevenue = tierRevenue || fallbackRevenue;
        console.log(`Deal ${deal.id} (${deal.dealName}): tier=$${tierRevenue}, fallback=$${fallbackRevenue}, using=$${usedRevenue}`);
        return sum + usedRevenue;
      }, 0);
      
    console.log("Final pipeline value:", pipelineValue);

    // Calculate Close Rate - signed deals / total submitted deals
    const submittedDeals = sellerDeals.filter(deal => 
      !['draft', 'scoping'].includes(deal.status)
    );
    const signedDeals = sellerDeals.filter(deal => deal.status === 'signed');
    const closeRate = submittedDeals.length > 0 
      ? Math.round((signedDeals.length / submittedDeals.length) * 100)
      : 0;

    // Calculate Deals at Risk - use flowIntelligence for consistency with Strategic Insights
    const dealsAtRisk = sellerDeals.filter(deal => {
      // Use the same logic as Strategic Insights - flowIntelligence field
      return deal.flowIntelligence === 'needs_attention';
    }).length;

    // Calculate signed deals this month
    const signedThisMonth = sellerDeals.filter(deal => {
      if (deal.status !== 'signed' || !deal.lastStatusChange) return false;
      const signedDate = new Date(deal.lastStatusChange);
      const now = new Date();
      return signedDate.getMonth() === now.getMonth() && 
             signedDate.getFullYear() === now.getFullYear();
    }).length;

    // Calculate active deals (excluding signed, lost, draft)
    const activeDeals = sellerDeals.filter(deal => 
      !['signed', 'lost', 'draft'].includes(deal.status)
    ).length;

    return {
      pipelineValue,
      closeRate,
      dealsAtRisk,
      totalDeals: sellerDeals.length,
      signedDeals: signedDeals.length,
      activeDeals,
      submittedDeals: submittedDeals.length,
      signedThisMonth
    };
  }, [deals, userEmail, tierRevenues]);
}

// Helper function for deal filtering (can be used in components) - excludes drafts
export function useSellerDeals(deals: Deal[], userEmail?: string) {
  return useMemo(() => {
    if (!userEmail) {
      return deals.filter(deal => deal.status !== 'draft');
    }
    return deals.filter(deal => 
      deal.email === userEmail && 
      deal.status !== 'draft'
    );
  }, [deals, userEmail]);
}

// Helper function for My Pipeline - includes drafts and scoping deals for seller
export function useSellerPipelineDeals(deals: Deal[], userEmail?: string) {
  return useMemo(() => {
    if (!userEmail) {
      return deals;
    }
    // For pipeline, include ALL deals belonging to this seller (including drafts)
    return deals.filter(deal => 
      deal.email === userEmail || 
      (deal.status === 'draft' && (!deal.email || deal.email === userEmail))
    );
  }, [deals, userEmail]);
}

// Helper function for categorizing deals by status
export function useSellerDealCategories(deals: Deal[], userEmail?: string) {
  const sellerDeals = useSellerDeals(deals, userEmail);
  
  return useMemo(() => {
    const now = new Date();
    
    const dealsNeedingAction = sellerDeals.filter(deal => {
      const daysSinceUpdate = deal.lastStatusChange 
        ? (now.getTime() - new Date(deal.lastStatusChange).getTime()) / (1000 * 60 * 60 * 24)
        : 0;
      
      return (

        (deal.status === 'negotiating' && daysSinceUpdate > 7) ||
        (deal.revisionCount && deal.revisionCount >= 2) ||
        (deal.draftExpiresAt && 
         (new Date(deal.draftExpiresAt).getTime() - now.getTime()) < 3 * 24 * 60 * 60 * 1000)
      );
    });

    const activeDeals = sellerDeals.filter(deal => 
      !['signed', 'lost', 'draft'].includes(deal.status)
    );

    const signedThisMonth = sellerDeals.filter(deal => {
      if (deal.status !== 'signed' || !deal.lastStatusChange) return false;
      const signedDate = new Date(deal.lastStatusChange);
      return signedDate.getMonth() === now.getMonth() && 
             signedDate.getFullYear() === now.getFullYear();
    });

    return {
      dealsNeedingAction,
      activeDeals,
      signedThisMonth,
      allDeals: sellerDeals
    };
  }, [sellerDeals]);
}