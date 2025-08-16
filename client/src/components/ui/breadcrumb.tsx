import { Link } from "wouter";
import { ChevronRight, Home } from "lucide-react";
import { cn } from "@/lib/utils";

interface BreadcrumbItem {
  label: string;
  href?: string;
  isCurrentPage?: boolean;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function Breadcrumb({ items, className }: BreadcrumbProps) {
  return (
    <div className={cn("bg-white border-b border-slate-200", className)}>
      <div className="max-w-7xl mx-auto px-4 py-3">
        <nav className="flex items-center space-x-2 text-sm" aria-label="Breadcrumb">
          {/* Home Icon + Link */}
          <Link href="/" className="text-slate-500 hover:text-slate-700 transition-colors">
            <Home className="h-4 w-4" />
            <span className="sr-only">Home</span>
          </Link>
          
          {/* Breadcrumb Items */}
          {items.map((item, index) => (
            <div key={index} className="flex items-center space-x-2">
              <ChevronRight className="h-4 w-4 text-slate-400" />
              {item.href && !item.isCurrentPage ? (
                <Link 
                  href={item.href} 
                  className="text-slate-500 hover:text-slate-700 transition-colors"
                >
                  {item.label}
                </Link>
              ) : (
                <span className={cn(
                  "font-medium",
                  item.isCurrentPage ? "text-[#3e0075]" : "text-slate-500"
                )}>
                  {item.label}
                </span>
              )}
            </div>
          ))}
        </nav>
      </div>
    </div>
  );
}

// Utility function to build breadcrumb items for common patterns
export function buildBreadcrumbs(path: string): BreadcrumbItem[] {
  switch (path) {
    case '/dashboard':
      return [{ label: 'Dashboard', isCurrentPage: true }];
    
    case '/request':
      return [{ label: 'Requests', isCurrentPage: true }];
    
    case '/request/scoping':
      return [
        { label: 'Requests', href: '/request' },
        { label: 'Scoping', isCurrentPage: true }
      ];
    
    case '/request/proposal':
      return [
        { label: 'Requests', href: '/request' },
        { label: 'Proposal', isCurrentPage: true }
      ];
    
    case '/support':
      return [{ label: 'Support', isCurrentPage: true }];
    
    case '/analytics':
      return [{ label: 'Analytics', isCurrentPage: true }];
    
    default:
      // For dynamic routes like /deals/:id
      if (path.startsWith('/deals/')) {
        return [
          { label: 'Analytics', href: '/analytics' },
          { label: 'Deal Details', isCurrentPage: true }
        ];
      }
      return [];
  }
}