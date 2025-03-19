import { Link, useLocation } from "wouter";
import { 
  HomeIcon, 
  ClipboardPenIcon,
  HelpCircleIcon,
  Menu,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";

export function TopNavbar() {
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Close mobile menu on location change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location]);

  return (
    <header className="bg-slate-800 shadow-md z-50">
      {/* Desktop Navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <h1 className="text-xl font-bold text-white">Deal Desk</h1>
            </div>
            <nav className="hidden md:ml-8 md:flex md:space-x-2">
              <Link href="/">
                <div className={cn(
                  "inline-flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors",
                  location === "/" 
                    ? "bg-slate-700 text-white" 
                    : "text-slate-300 hover:bg-slate-700 hover:text-white"
                )}>
                  <HomeIcon className="w-5 h-5 mr-2" />
                  Dashboard
                </div>
              </Link>
              <Link href="/support">
                <div className={cn(
                  "inline-flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors",
                  location === "/support" || location === "/submit-deal" 
                    ? "bg-slate-700 text-white" 
                    : "text-slate-300 hover:bg-slate-700 hover:text-white"
                )}>
                  <ClipboardPenIcon className="w-5 h-5 mr-2" />
                  Deal Process
                </div>
              </Link>
              <Link href="/help">
                <div className={cn(
                  "inline-flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors",
                  location === "/help" 
                    ? "bg-slate-700 text-white" 
                    : "text-slate-300 hover:bg-slate-700 hover:text-white"
                )}>
                  <HelpCircleIcon className="w-5 h-5 mr-2" />
                  Help & Resources
                </div>
              </Link>
            </nav>
          </div>
          
          {/* User Profile */}
          <div className="hidden md:flex md:items-center">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 rounded-full bg-slate-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-white">Sarah Johnson</p>
                <p className="text-xs text-slate-400">Commercial Manager</p>
              </div>
            </div>
          </div>
          
          {/* Mobile menu button */}
          <div className="flex items-center md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-slate-400 hover:text-white hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
            >
              <span className="sr-only">Open main menu</span>
              {mobileMenuOpen ? (
                <X className="block h-6 w-6" aria-hidden="true" />
              ) : (
                <Menu className="block h-6 w-6" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu, show/hide based on menu state */}
      <div className={`${mobileMenuOpen ? 'block' : 'hidden'} md:hidden`}>
        <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-slate-800">
          <Link href="/">
            <div className={cn(
              "block px-3 py-2 rounded-md text-base font-medium",
              location === "/" 
                ? "bg-slate-700 text-white" 
                : "text-slate-300 hover:bg-slate-700 hover:text-white"
            )}>
              <div className="flex items-center">
                <HomeIcon className="w-5 h-5 mr-2" />
                Dashboard
              </div>
            </div>
          </Link>
          <Link href="/support">
            <div className={cn(
              "block px-3 py-2 rounded-md text-base font-medium",
              location === "/support" || location === "/submit-deal" 
                ? "bg-slate-700 text-white" 
                : "text-slate-300 hover:bg-slate-700 hover:text-white"
            )}>
              <div className="flex items-center">
                <ClipboardPenIcon className="w-5 h-5 mr-2" />
                Deal Process
              </div>
            </div>
          </Link>
          <Link href="/help">
            <div className={cn(
              "block px-3 py-2 rounded-md text-base font-medium",
              location === "/help" 
                ? "bg-slate-700 text-white" 
                : "text-slate-300 hover:bg-slate-700 hover:text-white"
            )}>
              <div className="flex items-center">
                <HelpCircleIcon className="w-5 h-5 mr-2" />
                Help & Resources
              </div>
            </div>
          </Link>
          
          {/* Mobile user profile */}
          <div className="pt-4 mt-3 border-t border-slate-700">
            <div className="flex items-center px-3 py-2">
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
    </header>
  );
}