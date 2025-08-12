import { lazy, Suspense, useEffect, useState } from 'react';
import { SectionLoading } from '@/components/ui/loading-states';

// Phase 4: Bundle Optimization - Lazy load expensive components
export const LazyFinancialTierTable = lazy(() => 
  import('@/components/deal-form/FinancialTierTable').then(module => ({
    default: module.FinancialTierTable
  }))
);

export const LazyIncentiveStructureSection = lazy(() =>
  import('@/components/deal-form/IncentiveStructureSection').then(module => ({
    default: module.IncentiveStructureSection
  }))
);

export const LazyCostValueAnalysisSection = lazy(() =>
  import('@/components/deal-form/CostValueAnalysisSection').then(module => ({
    default: module.CostValueAnalysisSection
  }))
);

// Performance monitoring component
export function PerformanceMonitor({ children }: { children: React.ReactNode }) {
  const [renderTime, setRenderTime] = useState<number>(0);

  useEffect(() => {
    const startTime = performance.now();
    
    // Use requestAnimationFrame to measure actual render completion
    requestAnimationFrame(() => {
      const endTime = performance.now();
      setRenderTime(endTime - startTime);
      
      // Log performance metrics in development
      if (import.meta.env.DEV) {
        console.log(`Component render time: ${(endTime - startTime).toFixed(2)}ms`);
      }
    });
  });

  return (
    <>
      {children}
      {import.meta.env.DEV && renderTime > 0 && (
        <div className="fixed bottom-4 right-4 bg-slate-800 text-white text-xs px-2 py-1 rounded z-50">
          Render: {renderTime.toFixed(1)}ms
        </div>
      )}
    </>
  );
}

// Lazy wrapper with loading fallback
export function LazyComponentWrapper({ 
  children, 
  fallback,
  name 
}: { 
  children: React.ReactNode;
  fallback?: React.ReactNode;
  name?: string;
}) {
  return (
    <Suspense 
      fallback={
        fallback || <SectionLoading title={`Loading ${name}...`} rows={3} />
      }
    >
      <PerformanceMonitor>
        {children}
      </PerformanceMonitor>
    </Suspense>
  );
}