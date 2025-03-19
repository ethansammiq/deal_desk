import { Link, useLocation } from "wouter";
import { 
  HomeIcon, 
  ClipboardPenIcon,
  HelpCircleIcon,
  Menu,
  X,
  ChevronDown,
  UserCircle
} from "lucide-react";
import miqLogo from "../../assets/miq-logo.jpg";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";

export function TopNavbar() {
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Close mobile menu on location change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location]);

  return (
    <header className="bg-white border-b border-slate-200 shadow-sm z-50">
      {/* Desktop Navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center">
              {/* MiQ Logo */}
              <img 
                src={miqLogo} 
                alt="MiQ Logo" 
                className="h-8 mr-2" 
              />
              <h1 className="text-xl font-bold text-slate-800 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">MiQ Deal Desk</h1>
            </div>
            <nav className="hidden md:ml-8 md:flex md:space-x-1">
              <Link href="/">
                <div className={cn(
                  "inline-flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors",
                  location === "/" || location === "/help"
                    ? "bg-slate-100 text-indigo-600" 
                    : "text-slate-700 hover:bg-slate-50 hover:text-indigo-600"
                )}>
                  <HelpCircleIcon className="w-4 h-4 mr-2" />
                  Support Desk
                </div>
              </Link>
              <Link href="/support">
                <div className={cn(
                  "inline-flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors",
                  location === "/support" || location === "/submit-deal" 
                    ? "bg-slate-100 text-indigo-600" 
                    : "text-slate-700 hover:bg-slate-50 hover:text-indigo-600"
                )}>
                  <ClipboardPenIcon className="w-4 h-4 mr-2" />
                  Submit Deal Requests
                </div>
              </Link>
              <Link href="/dashboard">
                <div className={cn(
                  "inline-flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors",
                  location === "/dashboard" 
                    ? "bg-slate-100 text-indigo-600" 
                    : "text-slate-700 hover:bg-slate-50 hover:text-indigo-600"
                )}>
                  <HomeIcon className="w-4 h-4 mr-2" />
                  Deal Dash
                </div>
              </Link>
            </nav>
          </div>
          
          {/* User Profile */}
          <div className="hidden md:flex md:items-center">
            <div className="flex items-center bg-slate-50 p-1.5 pl-3 rounded-full">
              <div className="flex items-center text-sm">
                <UserCircle className="w-5 h-5 text-slate-500 mr-1.5" />
                <span className="font-medium text-slate-700">Sarah Johnson</span>
                <ChevronDown className="w-4 h-4 ml-1 text-slate-500" />
              </div>
            </div>
          </div>
          
          {/* Mobile menu button */}
          <div className="flex items-center md:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="inline-flex items-center justify-center"
            >
              <span className="sr-only">Open main menu</span>
              {mobileMenuOpen ? (
                <X className="h-5 w-5" aria-hidden="true" />
              ) : (
                <Menu className="h-5 w-5" aria-hidden="true" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile menu, show/hide based on menu state */}
      <div className={`${mobileMenuOpen ? 'block' : 'hidden'} md:hidden`}>
        <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white border-b border-slate-200">
          <Link href="/">
            <div className={cn(
              "block px-3 py-2 rounded-md text-base font-medium",
              location === "/" || location === "/help" 
                ? "bg-slate-100 text-indigo-600" 
                : "text-slate-700 hover:bg-slate-50 hover:text-indigo-600"
            )}>
              <div className="flex items-center">
                <HelpCircleIcon className="w-5 h-5 mr-2" />
                Support Desk
              </div>
            </div>
          </Link>
          <Link href="/support">
            <div className={cn(
              "block px-3 py-2 rounded-md text-base font-medium",
              location === "/support" || location === "/submit-deal" 
                ? "bg-slate-100 text-indigo-600" 
                : "text-slate-700 hover:bg-slate-50 hover:text-indigo-600"
            )}>
              <div className="flex items-center">
                <ClipboardPenIcon className="w-5 h-5 mr-2" />
                Submit Deal Requests
              </div>
            </div>
          </Link>
          <Link href="/dashboard">
            <div className={cn(
              "block px-3 py-2 rounded-md text-base font-medium",
              location === "/dashboard" 
                ? "bg-slate-100 text-indigo-600" 
                : "text-slate-700 hover:bg-slate-50 hover:text-indigo-600"
            )}>
              <div className="flex items-center">
                <HomeIcon className="w-5 h-5 mr-2" />
                Deal Dash
              </div>
            </div>
          </Link>
          
          {/* Mobile user profile */}
          <div className="mt-3 pt-3 border-t border-slate-200">
            <div className="flex items-center px-3 py-2">
              <UserCircle className="w-8 h-8 text-slate-400" />
              <div className="ml-3">
                <p className="text-sm font-medium text-slate-700">Sarah Johnson</p>
                <p className="text-xs text-slate-500">Commercial Manager</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}