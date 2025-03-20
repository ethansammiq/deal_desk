import { ChevronRight, Home } from "lucide-react";
import { Link } from "wouter";
import { useLocation } from "wouter";

const pathToTitle: Record<string, string> = {
  "/": "Support Desk",
  "/help": "Support Desk",
  "/support": "Deal Submission",
  "/submit-deal": "Deal Submission",
  "/dashboard": "Deal Dashboard"
};

const pathToParent: Record<string, string | null> = {
  "/": null,
  "/help": "/",
  "/support": "/",
  "/submit-deal": "/support",
  "/dashboard": "/"
};

export function Breadcrumbs() {
  const [location] = useLocation();
  
  // Get current path title
  const currentTitle = pathToTitle[location] || "Page Not Found";
  
  // Get parent path
  const parentPath = pathToParent[location];
  const parentTitle = parentPath ? pathToTitle[parentPath] : null;
  
  return (
    <div className="flex items-center text-sm text-slate-500 mb-4 bg-white px-4 py-2 rounded-md shadow-sm">
      <Link href="/">
        <div className="flex items-center hover:text-[#3e0075] transition-colors cursor-pointer">
          <Home className="h-3 w-3 mr-1" />
          <span>Home</span>
        </div>
      </Link>
      
      {parentTitle && (
        <>
          <ChevronRight className="h-3 w-3 mx-2 text-slate-400" />
          <Link href={parentPath || "/"}>
            <span className="hover:text-[#3e0075] transition-colors cursor-pointer">
              {parentTitle}
            </span>
          </Link>
        </>
      )}
      
      <ChevronRight className="h-3 w-3 mx-2 text-slate-400" />
      <span className="font-medium text-[#3e0075]">{currentTitle}</span>
    </div>
  );
}