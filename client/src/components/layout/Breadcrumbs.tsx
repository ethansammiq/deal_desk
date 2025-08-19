import { ChevronRight, Home } from "lucide-react";
import { Link } from "wouter";
import { useLocation } from "wouter";

// Define the path to title mapping
const pathToTitle: Record<string, string> = {
  "/": "Home",
  "/dashboard": "Dashboard",
  "/request": "Requests",
  "/request/scoping": "Scoping",
  "/request/proposal": "Proposal", 
  "/support": "Support",
  "/analytics": "Analytics",
  "/testing": "Testing",
  "/deals": "Deals",
  "/admin": "Admin Panel",
  "/department-queues": "Department Queues",
  "/sla-monitoring": "SLA Monitoring"
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
      { title: "Home", path: "/dashboard", id: "home" }
    ];
    
    // Handle nested request paths
    if (location === "/request/scoping") {
      breadcrumbs.push({ title: "Requests", path: "/request", id: "requests" });
      breadcrumbs.push({ title: "Scoping", path: "/request/scoping", isActive: true, id: "scoping" });
      return breadcrumbs;
    }
    
    if (location === "/request/proposal") {
      breadcrumbs.push({ title: "Requests", path: "/request", id: "requests" });
      breadcrumbs.push({ title: "Proposal", path: "/request/proposal", isActive: true, id: "proposal" });
      return breadcrumbs;
    }
    
    // Handle deal detail pages
    if (location.startsWith("/deals/")) {
      let analyticsPath = '/analytics';
      
      // Use sessionStorage to get the referrer URL with query parameters
      if (typeof window !== 'undefined') {
        const referrerUrl = sessionStorage.getItem('analyticsReferrer');
        console.log('🍞 Breadcrumb Debug - SessionStorage Check:', {
          referrerUrl,
          startsWith: referrerUrl?.startsWith('/analytics'),
          location
        });
        
        if (referrerUrl && referrerUrl.startsWith('/analytics')) {
          analyticsPath = referrerUrl;
          console.log('🍞 Using referrer path:', analyticsPath);
        } else {
          console.log('🍞 Using default analytics path');
        }
      }
      
      console.log('🍞 Final breadcrumb path for Analytics button:', analyticsPath);
      
      breadcrumbs.push({ title: "Analytics", path: analyticsPath, id: "analytics" });
      breadcrumbs.push({ title: "Deal Details", path: location, isActive: true, id: "deal-details" });
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
  
  // Don't show breadcrumbs on the home page
  if (location === "/") {
    return null;
  }
  
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