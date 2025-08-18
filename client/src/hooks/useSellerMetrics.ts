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
}

export function useSellerMetrics({ deals, userEmail }: UseSellerMetricsProps): SellerMetrics {
  return useMemo(() => {
    // Filter deals for the seller
    const sellerDeals = userEmail
      ? deals.filter(deal => 
          deal.email === userEmail && 
          deal.status !== 'draft'
        )
      : deals.filter(deal => deal.status !== 'draft');

    // Calculate Pipeline Value - total value of active deals (excluding signed and lost)
    const pipelineValue = sellerDeals
      .filter(deal => !['signed', 'lost'].includes(deal.status))
      .reduce((sum, deal) => sum + ((deal as any).annualRevenue || 0), 0);

    // Calculate Close Rate - signed deals / total submitted deals
    const submittedDeals = sellerDeals.filter(deal => 
      !['draft', 'scoping'].includes(deal.status)
    );
    const signedDeals = sellerDeals.filter(deal => deal.status === 'signed');
    const closeRate = submittedDeals.length > 0 
      ? Math.round((signedDeals.length / submittedDeals.length) * 100)
      : 0;

    // Calculate Deals at Risk - multiple criteria for risk assessment
    const dealsAtRisk = sellerDeals.filter(deal => {
      const now = new Date();
      const daysSinceUpdate = deal.lastStatusChange 
        ? (now.getTime() - new Date(deal.lastStatusChange).getTime()) / (1000 * 60 * 60 * 24)
        : 0;
      
      return (
        deal.status === 'revision_requested' ||
        (deal.status === 'negotiating' && daysSinceUpdate > 7) ||
        (deal.revisionCount && deal.revisionCount >= 2) ||
        (deal.draftExpiresAt && 
         (new Date(deal.draftExpiresAt).getTime() - now.getTime()) < 3 * 24 * 60 * 60 * 1000)
      );
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
  }, [deals, userEmail]);
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
    console.log('Pipeline filtering - userEmail:', userEmail);
    console.log('All deals:', deals.map(d => ({ id: d.id, email: d.email, status: d.status, name: d.dealName })));
    
    const filtered = deals.filter(deal => {
      const matches = deal.email === userEmail || 
        (deal.status === 'draft' && (!deal.email || deal.email === userEmail));
      console.log(`Deal ${deal.id} (${deal.dealName}): email=${deal.email}, status=${deal.status}, matches=${matches}`);
      return matches;
    });
    
    console.log('Filtered pipeline deals:', filtered.map(d => ({ id: d.id, email: d.email, status: d.status, name: d.dealName })));
    return filtered;
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
        deal.status === 'revision_requested' ||
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