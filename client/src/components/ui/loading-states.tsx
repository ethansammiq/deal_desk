import React from 'react';
import { Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from './button';
import { Card, CardContent, CardHeader } from './card';
import { Skeleton } from './skeleton';
import { Alert, AlertDescription } from './alert';

// Loading Spinner Component
interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  text?: string;
}

export function LoadingSpinner({ size = 'md', className = '', text }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8'
  };

  return (
    <div className={`flex items-center justify-center gap-2 ${className}`}>
      <Loader2 className={`animate-spin ${sizeClasses[size]}`} />
      {text && <span className="text-sm text-gray-600">{text}</span>}
    </div>
  );
}

// Full Page Loading
interface PageLoadingProps {
  title?: string;
  description?: string;
}

export function PageLoading({ title = 'Loading...', description }: PageLoadingProps) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <LoadingSpinner size="lg" className="mb-4" />
          <h2 className="text-lg font-semibold">{title}</h2>
          {description && (
            <p className="text-sm text-gray-600 mt-2">{description}</p>
          )}
        </CardHeader>
      </Card>
    </div>
  );
}

// Section Loading
interface SectionLoadingProps {
  title?: string;
  rows?: number;
  className?: string;
}

export function SectionLoading({ title, rows = 3, className = '' }: SectionLoadingProps) {
  return (
    <div className={`space-y-4 ${className}`}>
      {title && (
        <div className="flex items-center gap-2">
          <Skeleton className="h-6 w-32" />
          <LoadingSpinner size="sm" />
        </div>
      )}
      <div className="space-y-2">
        {Array.from({ length: rows }, (_, i) => (
          <Skeleton key={i} className="h-4 w-full" />
        ))}
      </div>
    </div>
  );
}

// Form Loading Overlay
interface FormLoadingProps {
  isLoading: boolean;
  children: React.ReactNode;
  loadingText?: string;
}

export function FormLoading({ isLoading, children, loadingText = 'Processing...' }: FormLoadingProps) {
  return (
    <div className="relative">
      {children}
      {isLoading && (
        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-10">
          <Card className="p-4">
            <CardContent>
              <LoadingSpinner text={loadingText} />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

// Error State Component
interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  retryText?: string;
  className?: string;
}

export function ErrorState({
  title = 'Something went wrong',
  message = 'An unexpected error occurred. Please try again.',
  onRetry,
  retryText = 'Try Again',
  className = ''
}: ErrorStateProps) {
  return (
    <div className={`text-center py-8 ${className}`}>
      <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
        <AlertCircle className="h-6 w-6 text-red-600" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 mb-4">{message}</p>
      {onRetry && (
        <Button onClick={onRetry} variant="outline" className="flex items-center gap-2 mx-auto">
          <RefreshCw className="h-4 w-4" />
          {retryText}
        </Button>
      )}
    </div>
  );
}

// Empty State Component
interface EmptyStateProps {
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  icon?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  title,
  description,
  action,
  icon,
  className = ''
}: EmptyStateProps) {
  return (
    <div className={`text-center py-12 ${className}`}>
      {icon && (
        <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      {description && (
        <p className="text-gray-600 mb-4 max-w-sm mx-auto">{description}</p>
      )}
      {action && (
        <Button onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  );
}

// Query State Handler (wraps TanStack Query states)
interface QueryStateHandlerProps<T> {
  query: {
    data?: T;
    isLoading: boolean;
    error: Error | null;
    refetch?: () => void;
  };
  children: (data: T) => React.ReactNode;
  loadingComponent?: React.ReactNode;
  errorComponent?: React.ReactNode;
  emptyComponent?: React.ReactNode;
  emptyCheck?: (data: T) => boolean;
}

export function QueryStateHandler<T>({
  query,
  children,
  loadingComponent,
  errorComponent,
  emptyComponent,
  emptyCheck
}: QueryStateHandlerProps<T>) {
  if (query.isLoading) {
    return <>{loadingComponent || <SectionLoading />}</>;
  }

  if (query.error) {
    return (
      <>
        {errorComponent || (
          <ErrorState
            title="Failed to load data"
            message={query.error.message}
            onRetry={query.refetch}
          />
        )}
      </>
    );
  }

  if (!query.data) {
    return (
      <>
        {emptyComponent || (
          <EmptyState
            title="No data available"
            description="There's no data to display at the moment."
          />
        )}
      </>
    );
  }

  if (emptyCheck && emptyCheck(query.data)) {
    return <>{emptyComponent}</>;
  }

  return <>{children(query.data)}</>;
}