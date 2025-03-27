import { ChevronRight, Home } from "lucide-react";
import { Link } from "wouter";
import { useLocation } from "wouter";

const pathToTitle: Record<string, string> = {
  "/": "Support Desk",
  "/help": "Help Resources",
  "/support": "Deal Scoping",
  "/request-support": "Deal Scoping",
  "/submit-deal": "Deal Submission",
  "/dashboard": "Deal Dashboard"
};

export function Breadcrumbs() {
  const [location] = useLocation();
  
  // Get current path title
  const currentTitle = pathToTitle[location] || "Page Not Found";
  
  return (
    <div className="flex items-center text-sm text-slate-500 mb-4 bg-white px-4 py-2.5 rounded-md shadow-sm border border-[#f0e6ff]">
      <Link href="/">
        <div className="flex items-center hover:text-[#3e0075] transition-all duration-200 cursor-pointer group">
          <Home className="h-3.5 w-3.5 mr-1 group-hover:scale-110 transition-transform" />
          <span className="group-hover:font-medium">Home</span>
        </div>
      </Link>
      
      <ChevronRight className="h-3 w-3 mx-2 text-slate-400" />
      <span className="font-medium text-[#3e0075] bg-[#f8f5ff] px-2 py-0.5 rounded-sm">{currentTitle}</span>
    </div>
  );
}