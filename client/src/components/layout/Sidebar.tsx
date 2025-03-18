import { Link, useLocation } from "wouter";
import { 
  HomeIcon, 
  ClipboardPenIcon,
  HelpCircleIcon 
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

export function Sidebar() {
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const closeMobileMenu = () => {
    setMobileOpen(false);
  };

  return (
    <>
      {/* Mobile Header */}
      <div className="relative z-10 flex items-center justify-between flex-shrink-0 h-16 bg-white border-b border-slate-200 md:hidden">
        <div className="flex items-center px-4">
          <button 
            className="text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary" 
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path>
            </svg>
          </button>
          <h1 className="ml-3 text-lg font-bold text-slate-800">Deal Desk</h1>
        </div>
        <div className="flex items-center px-4">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 rounded-full bg-slate-300" />
          </div>
        </div>
      </div>

      {/* Sidebar */}
      <div className={cn(
        "md:flex md:flex-shrink-0",
        mobileOpen ? "fixed inset-0 z-40 bg-black bg-opacity-50 md:static md:bg-transparent md:bg-opacity-100" : "hidden"
      )}>
        <div className={cn(
          "flex flex-col w-64 bg-slate-800 border-r border-slate-700 h-full",
          mobileOpen ? "block" : "hidden md:block"
        )}>
          <div className="flex items-center justify-between h-16 px-4 bg-slate-900">
            <h1 className="text-xl font-bold text-white">Deal Desk</h1>
            <button
              className="md:hidden text-white"
              onClick={closeMobileMenu}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>
          <div className="flex flex-col flex-grow px-4 pt-5 pb-4 overflow-y-auto">
            <nav className="flex-1 space-y-2">
              <Link href="/">
                <a
                  onClick={closeMobileMenu}
                  className={cn(
                    "flex items-center px-4 py-3 text-sm font-medium rounded-md group",
                    location === "/" 
                      ? "bg-slate-700 text-white" 
                      : "text-slate-300 hover:bg-slate-700 hover:text-white"
                  )}
                >
                  <HomeIcon className="w-6 h-6 mr-3" />
                  Dashboard
                </a>
              </Link>
              <Link href="/support">
                <a
                  onClick={closeMobileMenu}
                  className={cn(
                    "flex items-center px-4 py-3 text-sm font-medium rounded-md group",
                    location === "/support" || location === "/submit-deal" 
                      ? "bg-slate-700 text-white" 
                      : "text-slate-300 hover:bg-slate-700 hover:text-white"
                  )}
                >
                  <ClipboardPenIcon className="w-6 h-6 mr-3" />
                  Submit Deal
                </a>
              </Link>
              <Link href="/help">
                <a
                  onClick={closeMobileMenu}
                  className={cn(
                    "flex items-center px-4 py-3 text-sm font-medium rounded-md group",
                    location === "/help" 
                      ? "bg-slate-700 text-white" 
                      : "text-slate-300 hover:bg-slate-700 hover:text-white"
                  )}
                >
                  <HelpCircleIcon className="w-6 h-6 mr-3" />
                  Help & Resources
                </a>
              </Link>
            </nav>
            <div className="pt-4 mt-6 border-t border-slate-700">
              <div className="flex items-center px-4 py-3">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 rounded-full bg-slate-600" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-white">Sarah Johnson</p>
                  <p className="text-xs text-slate-400">Commercial Manager</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
