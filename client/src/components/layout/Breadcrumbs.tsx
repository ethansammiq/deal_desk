import { ChevronRight, Home } from "lucide-react";
import { Link } from "wouter";
import { useLocation } from "wouter";

// Define the path to title mapping
const pathToTitle: Record<string, string> = {
  "/": "Support Desk",
  "/help": "Help Resources",
  "/support": "Deal Scoping",
  "/submit-deal": "Deal Submission",
  "/dashboard": "Deal Dashboard"
};

// Define breadcrumb structure for hierarchical paths
interface BreadcrumbPath {
  title: string;
  path: string;
  isActive?: boolean;
  isGroup?: boolean; // For non-clickable group labels
  id?: string; // Unique identifier for React key
}

export function Breadcrumbs() {
  const [location] = useLocation();
  
  // Generate breadcrumb trail based on current path
  const getBreadcrumbs = (): BreadcrumbPath[] => {
    // Start with Home
    const breadcrumbs: BreadcrumbPath[] = [
      { title: "Home", path: "/", id: "home" }
    ];
    
    // Deal Scoping has a parent of Deal Requests (non-clickable grouping)
    if (location === "/support") {
      breadcrumbs.push({ title: "Deal Requests", path: "#", isGroup: true, id: "deal-requests-group" });
      breadcrumbs.push({ title: "Deal Scoping", path: "/support", isActive: true, id: "deal-scoping" });
      return breadcrumbs;
    }
    
    // Deal Submission has a parent of Deal Requests (non-clickable grouping)
    if (location === "/submit-deal") {
      breadcrumbs.push({ title: "Deal Requests", path: "#", isGroup: true, id: "deal-requests-group" });
      breadcrumbs.push({ title: "Deal Submission", path: "/submit-deal", isActive: true, id: "deal-submission" });
      return breadcrumbs;
    }
    
    // For other paths, just use the direct mapping
    breadcrumbs.push({ 
      title: pathToTitle[location] || "Page Not Found",
      path: location,
      isActive: true,
      id: location.replace(/\//g, "-") || "unknown-page"
    });
    
    return breadcrumbs;
  };
  
  const breadcrumbs = getBreadcrumbs();
  
  return (
    <div className="flex items-center text-sm text-slate-500 mb-4 bg-white px-4 py-2.5 rounded-md shadow-sm border border-[#f0e6ff]">
      {breadcrumbs.map((breadcrumb, index) => (
        <div key={breadcrumb.id} className="flex items-center">
          {index > 0 && <ChevronRight className="h-3 w-3 mx-2 text-slate-400" />}
          
          {breadcrumb.isActive ? (
            <span className="font-medium text-[#3e0075] bg-[#f8f5ff] px-2 py-0.5 rounded-sm">
              {breadcrumb.title}
            </span>
          ) : breadcrumb.isGroup ? (
            <span className="text-slate-700">
              {breadcrumb.title}
            </span>
          ) : (
            <Link href={breadcrumb.path}>
              <div className="flex items-center hover:text-[#3e0075] transition-all duration-200 cursor-pointer group">
                {index === 0 && (
                  <Home className="h-3.5 w-3.5 mr-1 group-hover:scale-110 transition-transform" />
                )}
                <span className="group-hover:font-medium">{breadcrumb.title}</span>
              </div>
            </Link>
          )}
        </div>
      ))}
    </div>
  );
}