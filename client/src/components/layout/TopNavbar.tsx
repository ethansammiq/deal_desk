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
  User
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
      {/* Desktop Navigation - Fixed Width */}
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between h-16 px-4">
          {/* Logo and Nav Links Section */}
          <div className="flex items-center w-full">
            {/* Logo - Fixed width with enough space for the full title */}
            <div className="flex-shrink-0 flex items-center w-80">
              <div className="h-12 w-12 mr-3 flex-shrink-0 flex items-center justify-center">
                <img 
                  src={companyLogo} 
                  alt="Logo" 
                  className="h-full w-full object-contain" 
                />
              </div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-[#3e0075] to-[#5a0099] bg-clip-text text-transparent whitespace-nowrap">
                Commercial Deal Desk
              </h1>
            </div>
            
            {/* Streamlined Navigation - Role-Aware */}
            <nav className="hidden md:flex md:space-x-3 flex-1 justify-center">
              {/* Core: Dashboard */}
              <Link href="/">
                <div className={cn(
                  "flex items-center justify-center w-32 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200",
                  (location === "/" || location === "/insights")
                    ? "bg-[#f1e9fd] text-[#3e0075] shadow-sm" 
                    : "text-slate-700 hover:bg-[#f8f5ff] hover:text-[#3e0075] hover:shadow-sm"
                )}>
                  <LayoutDashboardIcon className="flex-shrink-0 w-4 h-4 mr-2" />
                  <span className="whitespace-nowrap">Dashboard</span>
                </div>
              </Link>

              {/* Core: Deals (Consolidated) */}
              <Link href="/deals">
                <div className={cn(
                  "flex items-center justify-center w-32 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200",
                  (location === "/deals" || location === "/deal-requests" || location === "/submit-deal")
                    ? "bg-[#f1e9fd] text-[#3e0075] shadow-sm" 
                    : "text-slate-700 hover:bg-[#f8f5ff] hover:text-[#3e0075] hover:shadow-sm"
                )}>
                  <Briefcase className="flex-shrink-0 w-4 h-4 mr-2" />
                  <span className="whitespace-nowrap">Deals</span>
                </div>
              </Link>

              {/* Core: Support */}
              <Link href="/help">
                <div className={cn(
                  "flex items-center justify-center w-32 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200",
                  location === "/help"
                    ? "bg-[#f1e9fd] text-[#3e0075] shadow-sm" 
                    : "text-slate-700 hover:bg-[#f8f5ff] hover:text-[#3e0075] hover:shadow-sm"
                )}>
                  <HelpCircleIcon className="flex-shrink-0 w-4 h-4 mr-2" />
                  <span className="whitespace-nowrap">Support</span>
                </div>
              </Link>

              {/* Admin Only: Analytics */}
              {(userRole === 'admin' || userRole === 'approver') && (
                <Link href="/sla-monitoring">
                  <div className={cn(
                    "flex items-center justify-center w-32 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200",
                    location === "/sla-monitoring"
                      ? "bg-[#f1e9fd] text-[#3e0075] shadow-sm" 
                      : "text-slate-700 hover:bg-[#f8f5ff] hover:text-[#3e0075] hover:shadow-sm"
                  )}>
                    <BarChart3 className="flex-shrink-0 w-4 h-4 mr-2" />
                    <span className="whitespace-nowrap">Analytics</span>
                  </div>
                </Link>
              )}
            </nav>
          </div>
          
          {/* User Profile & Tools - Streamlined */}
          <div className="hidden md:flex md:items-center md:space-x-3 flex-shrink-0 w-52 justify-end">
            {/* Admin/Dev Tools */}
            {(userRole === 'admin' || import.meta.env.DEV) && (
              <Link href="/testing">
                <button className="flex items-center px-2 py-1 text-xs font-medium text-slate-600 hover:text-[#3e0075] hover:bg-[#f8f5ff] rounded-md transition-all duration-200 border border-slate-200 hover:border-[#3e0075]">
                  <TestTube2 className="w-3 h-3 mr-1" />
                  Test
                </button>
              </Link>
            )}
            
            {/* Notification Bell */}
            <NotificationBell />
            
            {/* User Profile with Dropdown */}
            <UserProfileDropdown currentUser={currentUser} />
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
          {/* Mobile Logo */}
          <div className="flex items-center mb-3 px-3">
            <div className="h-11 w-11 mr-3 flex-shrink-0 flex items-center justify-center">
              <img 
                src={companyLogo} 
                alt="Logo" 
                className="h-full w-full object-contain" 
              />
            </div>
            <h2 className="text-lg font-bold bg-gradient-to-r from-[#3e0075] to-[#5a0099] bg-clip-text text-transparent whitespace-nowrap">
              Commercial Deal Desk
            </h2>
          </div>
          <Link href="/dashboard">
            <div className={cn(
              "block px-3 py-2 rounded-md text-base font-medium transition-all duration-200",
              (location === "/" || location === "/dashboard" || location === "/deals")
                ? "bg-[#f1e9fd] text-[#3e0075] shadow-sm" 
                : "text-slate-700 hover:bg-[#f8f5ff] hover:text-[#3e0075] hover:shadow-sm hover:translate-x-1"
            )}>
              <div className="flex items-center">
                <LayoutDashboardIcon className="w-5 h-5 mr-2 flex-shrink-0" />
                <span>Insights</span>
              </div>
            </div>
          </Link>
          <Link href="/help">
            <div className={cn(
              "block px-3 py-2 rounded-md text-base font-medium transition-all duration-200",
              location === "/help" 
                ? "bg-[#f1e9fd] text-[#3e0075] shadow-sm" 
                : "text-slate-700 hover:bg-[#f8f5ff] hover:text-[#3e0075] hover:shadow-sm hover:translate-x-1"
            )}>
              <div className="flex items-center">
                <HelpCircleIcon className="w-5 h-5 mr-2 flex-shrink-0" />
                <span>Support Desk</span>
              </div>
            </div>
          </Link>
          <Link href="/deal-requests">
            <div className={cn(
              "block px-3 py-2 rounded-md text-base font-medium transition-all duration-200",
              location === "/deal-requests" || location === "/support" || location === "/submit-deal" 
                ? "bg-[#f1e9fd] text-[#3e0075] shadow-sm" 
                : "text-slate-700 hover:bg-[#f8f5ff] hover:text-[#3e0075] hover:shadow-sm hover:translate-x-1"
            )}>
              <div className="flex items-center">
                <ClipboardPenIcon className="w-5 h-5 mr-2 flex-shrink-0" />
                <span>Deal Requests</span>
              </div>
            </div>
          </Link>
          
          {/* Mobile Notifications */}
          <div className="mt-3 pt-3 border-t border-[#e9ddff]">
            <div className="px-3 py-2">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-[#3e0075]">Notifications</p>
                <div className="bg-[#f1e9fd] p-1 rounded-full">
                  <div className="relative">
                    <BellIcon className="h-5 w-5 text-[#5a0099]" />
                    <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-500" />
                  </div>
                </div>
              </div>
              <div className="bg-white p-2 rounded-md border border-[#e9ddff] text-xs text-[#3e0075]">
                <p className="font-medium">New deal approval request</p>
                <p className="text-slate-500 mt-1">A new deal has been submitted for your approval</p>
              </div>
            </div>
            
            {/* Mobile user profile */}
            <div className="flex items-center px-3 py-2 bg-[#f8f5ff] m-2 rounded-lg border border-[#e9ddff]">
              <UserCircle className="w-8 h-8 text-[#5a0099] flex-shrink-0" />
              <div className="ml-3">
                <p className="text-sm font-medium text-[#3e0075]">Charlie Far</p>
                <p className="text-xs text-[#5a0099]">Commercial Manager</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}