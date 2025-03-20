import { Link, useLocation } from "wouter";
import { 
  LayoutDashboardIcon, 
  ClipboardPenIcon,
  HelpCircleIcon,
  Menu,
  X,
  ChevronDown,
  UserCircle
} from "lucide-react";
import companyLogo from "../../assets/company-logo.jpg";
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
    <header className="bg-white border-b border-slate-200 shadow-sm z-50 bg-gradient-to-r from-[#f8f5ff] to-white">
      {/* Desktop Navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center">
              {/* Logo */}
              <img 
                src={companyLogo} 
                alt="Logo" 
                className="h-8 mr-2" 
              />
              <h1 className="text-xl font-bold text-slate-800 bg-gradient-to-r from-[#3e0075] to-[#5a0099] bg-clip-text text-transparent">Commercial Deal Desk</h1>
            </div>
            <nav className="hidden md:ml-8 md:flex md:space-x-3">
              <Link href="/">
                <div className={cn(
                  "inline-flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors",
                  location === "/" || location === "/help"
                    ? "bg-[#f1e9fd] text-[#3e0075]" 
                    : "text-slate-700 hover:bg-[#f8f5ff] hover:text-[#3e0075]"
                )}>
                  <HelpCircleIcon className="w-4 h-4 mr-2" />
                  Support Desk
                </div>
              </Link>
              <Link href="/support">
                <div className={cn(
                  "inline-flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors",
                  location === "/support" || location === "/submit-deal" 
                    ? "bg-[#f1e9fd] text-[#3e0075]" 
                    : "text-slate-700 hover:bg-[#f8f5ff] hover:text-[#3e0075]"
                )}>
                  <ClipboardPenIcon className="w-4 h-4 mr-2" />
                  Deal Submission
                </div>
              </Link>
              <Link href="/dashboard">
                <div className={cn(
                  "inline-flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors",
                  location === "/dashboard" 
                    ? "bg-[#f1e9fd] text-[#3e0075]" 
                    : "text-slate-700 hover:bg-[#f8f5ff] hover:text-[#3e0075]"
                )}>
                  <LayoutDashboardIcon className="w-4 h-4 mr-2" />
                  Deal Dashboard
                </div>
              </Link>
            </nav>
          </div>
          
          {/* User Profile */}
          <div className="hidden md:flex md:items-center">
            <div className="flex items-center bg-[#f8f5ff] p-1.5 pl-3 rounded-full border border-[#e9ddff] shadow-sm hover:shadow transition-all">
              <div className="flex items-center text-sm">
                <UserCircle className="w-5 h-5 text-[#5a0099] mr-1.5" />
                <span className="font-medium text-[#3e0075]">Sarah Johnson</span>
                <ChevronDown className="w-4 h-4 ml-1 text-[#5a0099]" />
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
                ? "bg-[#f1e9fd] text-[#3e0075]" 
                : "text-slate-700 hover:bg-[#f8f5ff] hover:text-[#3e0075]"
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
                ? "bg-[#f1e9fd] text-[#3e0075]" 
                : "text-slate-700 hover:bg-[#f8f5ff] hover:text-[#3e0075]"
            )}>
              <div className="flex items-center">
                <ClipboardPenIcon className="w-5 h-5 mr-2" />
                Deal Submission
              </div>
            </div>
          </Link>
          <Link href="/dashboard">
            <div className={cn(
              "block px-3 py-2 rounded-md text-base font-medium",
              location === "/dashboard" 
                ? "bg-[#f1e9fd] text-[#3e0075]" 
                : "text-slate-700 hover:bg-[#f8f5ff] hover:text-[#3e0075]"
            )}>
              <div className="flex items-center">
                <LayoutDashboardIcon className="w-5 h-5 mr-2" />
                Deal Dashboard
              </div>
            </div>
          </Link>
          
          {/* Mobile user profile */}
          <div className="mt-3 pt-3 border-t border-[#e9ddff]">
            <div className="flex items-center px-3 py-2 bg-[#f8f5ff] m-2 rounded-lg border border-[#e9ddff]">
              <UserCircle className="w-8 h-8 text-[#5a0099]" />
              <div className="ml-3">
                <p className="text-sm font-medium text-[#3e0075]">Sarah Johnson</p>
                <p className="text-xs text-[#5a0099]">Commercial Manager</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}