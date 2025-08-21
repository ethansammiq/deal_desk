import { Link, useLocation } from "wouter";
import { 
  LayoutDashboardIcon, 
  ClipboardPenIcon,
  HelpCircleIcon,
  Menu,
  X,
  ChevronDown,
  UserCircle,
  BellIcon,
  TestTube2,
  BarChart3,
  Briefcase,
  LogOut,
  Settings,
  User,
  FileText
} from "lucide-react";
import companyLogo from "../../assets/miq-transparent.png";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { NotificationBell } from "./NotificationBell";
import { useUserPermissions } from "@/hooks/useAuth";

// User Profile Dropdown Component
function UserProfileDropdown({ currentUser }: { currentUser: any }) {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center bg-[#f8f5ff] p-1.5 pl-3 rounded-full border border-[#e9ddff] shadow-sm hover:shadow transition-all"
      >
        <div className="flex items-center text-sm">
          <UserCircle className="flex-shrink-0 w-5 h-5 text-[#5a0099] mr-1.5" />
          <span className="font-medium text-[#3e0075] whitespace-nowrap">
            {currentUser?.firstName || currentUser?.username || 'User'}
          </span>
          <ChevronDown className="flex-shrink-0 w-4 h-4 ml-1 text-[#5a0099]" />
        </div>
      </button>
      
      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg py-1 z-50 border border-[#e9ddff]">
          <div className="px-4 py-3 border-b border-[#e9ddff]">
            <p className="text-sm font-medium text-[#3e0075]">
              {currentUser?.firstName || currentUser?.username || 'User'}
            </p>
            <p className="text-xs text-slate-500 capitalize">
              {currentUser?.role?.replace('_', ' ')}
              {currentUser?.department && ` • ${currentUser.department}`}
            </p>
          </div>
          
          <div className="py-1">
            <Link href="/profile">
              <button className="flex items-center w-full px-4 py-2 text-sm text-slate-700 hover:bg-[#f8f5ff] hover:text-[#3e0075]">
                <User className="w-4 h-4 mr-3" />
                Profile Settings
              </button>
            </Link>
            
            {currentUser?.role === 'admin' && (
              <Link href="/admin">
                <button className="flex items-center w-full px-4 py-2 text-sm text-slate-700 hover:bg-[#f8f5ff] hover:text-[#3e0075]">
                  <Settings className="w-4 h-4 mr-3" />
                  Admin Panel
                </button>
              </Link>
            )}
            
            <Link href="/testing">
              <button className="flex items-center w-full px-4 py-2 text-sm text-slate-700 hover:bg-[#f8f5ff] hover:text-[#3e0075]">
                <TestTube2 className="w-4 h-4 mr-3" />
                Switch Roles
              </button>
            </Link>
          </div>
          
          <div className="py-1 border-t border-[#e9ddff]">
            <button className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50">
              <LogOut className="w-4 h-4 mr-3" />
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function TopNavbar() {
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { currentUser } = useUserPermissions();
  const userRole = currentUser?.role;
  
  // Close mobile menu on location change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location]);

  return (
    <header className="sticky top-0 bg-white border-b border-slate-200 shadow-sm z-50 bg-gradient-to-r from-[#f8f5ff] to-white">
      {/* Responsive Navigation */}
      <div>
        <div className="flex justify-between h-16 px-4">
          {/* Logo and Navigation Container */}
          <div className="flex items-center w-full">
            {/* Logo Section - Fixed Width */}
            <div className="flex-shrink-0 flex items-center lg:w-80">
              <div className="h-8 w-8 lg:h-12 lg:w-12 mr-2 lg:mr-3 flex-shrink-0 flex items-center justify-center">
                <img 
                  src={companyLogo} 
                  alt="Logo" 
                  className="h-full w-full object-contain" 
                />
              </div>
              <h1 className="text-lg lg:text-xl font-bold bg-gradient-to-r from-[#3e0075] to-[#5a0099] bg-clip-text text-transparent whitespace-nowrap">
                <span className="hidden sm:inline">Commercial Deal Desk</span>
                <span className="sm:hidden">Deal Desk</span>
              </h1>
            </div>
            
            {/* Navigation - Centered */}
            <nav className="hidden lg:flex lg:space-x-3 flex-1 justify-center">
            {/* Core: Dashboard */}
            <Link href="/dashboard">
              <div className={cn(
                "flex items-center justify-center min-w-[120px] px-3 py-2 rounded-md text-sm font-medium transition-all duration-200",
                (location === "/" || location === "/dashboard")
                  ? "bg-[#f1e9fd] text-[#3e0075] shadow-sm" 
                  : "text-slate-700 hover:bg-[#f8f5ff] hover:text-[#3e0075] hover:shadow-sm"
              )}>
                <LayoutDashboardIcon className="flex-shrink-0 w-4 h-4 mr-2" />
                <span className="whitespace-nowrap">Dashboard</span>
              </div>
            </Link>

            {/* Core: Requests */}
            <Link href="/request">
              <div className={cn(
                "flex items-center justify-center min-w-[100px] px-3 py-2 rounded-md text-sm font-medium transition-all duration-200",
                (location === "/request" || location === "/request/scoping" || location === "/request/proposal")
                  ? "bg-[#f1e9fd] text-[#3e0075] shadow-sm" 
                  : "text-slate-700 hover:bg-[#f8f5ff] hover:text-[#3e0075] hover:shadow-sm"
              )}>
                <FileText className="flex-shrink-0 w-4 h-4 mr-2" />
                <span className="whitespace-nowrap">Requests</span>
              </div>
            </Link>

            {/* Core: Support */}
            <Link href="/support">
              <div className={cn(
                "flex items-center justify-center min-w-[100px] px-3 py-2 rounded-md text-sm font-medium transition-all duration-200",
                location === "/support"
                  ? "bg-[#f1e9fd] text-[#3e0075] shadow-sm" 
                  : "text-slate-700 hover:bg-[#f8f5ff] hover:text-[#3e0075] hover:shadow-sm"
              )}>
                <HelpCircleIcon className="flex-shrink-0 w-4 h-4 mr-2" />
                <span className="whitespace-nowrap">Support</span>
              </div>
            </Link>

            {/* Analytics - Available to all roles */}
            <Link href="/analytics">
              <div className={cn(
                "flex items-center justify-center min-w-[110px] px-3 py-2 rounded-md text-sm font-medium transition-all duration-200",
                location === "/analytics"
                  ? "bg-[#f1e9fd] text-[#3e0075] shadow-sm" 
                  : "text-slate-700 hover:bg-[#f8f5ff] hover:text-[#3e0075] hover:shadow-sm"
              )}>
                <BarChart3 className="flex-shrink-0 w-4 h-4 mr-2" />
                <span className="whitespace-nowrap">Analytics</span>
              </div>
            </Link>
            </nav>
          </div>
          
          {/* User Tools - Fixed Width Right Section */}
          <div className="flex items-center space-x-2 flex-shrink-0">
            {/* Desktop Tools */}
            <div className="hidden lg:flex lg:items-center lg:space-x-3">
              
              {/* Notification Bell */}
              <NotificationBell />
              
              {/* User Profile with Dropdown */}
              <UserProfileDropdown currentUser={currentUser} />
            </div>

            {/* Tablet & Mobile: Compact Profile */}
            <div className="lg:hidden flex items-center space-x-2">
              <NotificationBell />
              <UserProfileDropdown currentUser={currentUser} />
            </div>
            
            {/* Mobile menu button */}
            <div className="lg:hidden">
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
      </div>

      {/* Mobile menu, show/hide based on menu state */}
      <div className={`${mobileMenuOpen ? 'block' : 'hidden'} lg:hidden`}>
        <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white border-b border-slate-200">
          {/* Mobile Navigation Links */}
          <Link href="/dashboard">
            <div className={cn(
              "block px-3 py-2 rounded-md text-base font-medium transition-all duration-200",
              (location === "/" || location === "/dashboard")
                ? "bg-[#f1e9fd] text-[#3e0075] shadow-sm" 
                : "text-slate-700 hover:bg-[#f8f5ff] hover:text-[#3e0075] hover:shadow-sm hover:translate-x-1"
            )}>
              <div className="flex items-center">
                <LayoutDashboardIcon className="w-5 h-5 mr-2 flex-shrink-0" />
                <span>Dashboard</span>
              </div>
            </div>
          </Link>
          
          <Link href="/request">
            <div className={cn(
              "block px-3 py-2 rounded-md text-base font-medium transition-all duration-200",
              (location === "/request" || location === "/request/scoping" || location === "/request/proposal")
                ? "bg-[#f1e9fd] text-[#3e0075] shadow-sm" 
                : "text-slate-700 hover:bg-[#f8f5ff] hover:text-[#3e0075] hover:shadow-sm hover:translate-x-1"
            )}>
              <div className="flex items-center">
                <FileText className="w-5 h-5 mr-2 flex-shrink-0" />
                <span>Requests</span>
              </div>
            </div>
          </Link>
          
          <Link href="/support">
            <div className={cn(
              "block px-3 py-2 rounded-md text-base font-medium transition-all duration-200",
              location === "/support" 
                ? "bg-[#f1e9fd] text-[#3e0075] shadow-sm" 
                : "text-slate-700 hover:bg-[#f8f5ff] hover:text-[#3e0075] hover:shadow-sm hover:translate-x-1"
            )}>
              <div className="flex items-center">
                <HelpCircleIcon className="w-5 h-5 mr-2 flex-shrink-0" />
                <span>Support</span>
              </div>
            </div>
          </Link>
          
          {/* Analytics - Available to all roles */}
          <Link href="/analytics">
            <div className={cn(
              "block px-3 py-2 rounded-md text-base font-medium transition-all duration-200",
              location === "/analytics"
                ? "bg-[#f1e9fd] text-[#3e0075] shadow-sm" 
                : "text-slate-700 hover:bg-[#f8f5ff] hover:text-[#3e0075] hover:shadow-sm hover:translate-x-1"
            )}>
              <div className="flex items-center">
                <BarChart3 className="w-5 h-5 mr-2 flex-shrink-0" />
                <span>Analytics</span>
              </div>
            </div>
          </Link>

        </div>
      </div>
    </header>
  );
}