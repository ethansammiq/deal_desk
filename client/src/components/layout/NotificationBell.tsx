import { BellIcon } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [hasNotifications] = useState(true); // This would be connected to real notifications in a full implementation
  
  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full hover:bg-[#f1e9fd] transition-colors"
        aria-label="Notifications"
      >
        <BellIcon className="h-5 w-5 text-[#5a0099]" />
        {hasNotifications && (
          <span className="absolute top-1 right-1 block h-2 w-2 rounded-full bg-red-500" />
        )}
      </button>
      
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg py-1 z-50 border border-[#e9ddff]">
          <div className="px-4 py-2 border-b border-[#e9ddff]">
            <h3 className="text-sm font-medium text-[#3e0075]">Notifications</h3>
          </div>
          <div className="max-h-72 overflow-y-auto">
            {/* Example notifications - in real implementation these would come from a notifications system */}
            <div className={cn(
              "px-4 py-3 hover:bg-[#f8f5ff] transition-colors border-l-2",
              hasNotifications ? "border-[#3e0075]" : "border-transparent"
            )}>
              <p className="text-sm font-medium text-slate-800">New deal approval request</p>
              <p className="text-xs text-slate-500 mt-0.5">A new deal has been submitted for your approval</p>
              <p className="text-xs text-[#5a0099] mt-1">5 minutes ago</p>
            </div>
            <div className="px-4 py-3 hover:bg-[#f8f5ff] transition-colors border-l-2 border-transparent">
              <p className="text-sm font-medium text-slate-800">Deal status update</p>
              <p className="text-xs text-slate-500 mt-0.5">Deal #CDD-2023-005 has been approved</p>
              <p className="text-xs text-[#5a0099] mt-1">2 hours ago</p>
            </div>
            <div className="px-4 py-3 hover:bg-[#f8f5ff] transition-colors border-l-2 border-transparent">
              <p className="text-sm font-medium text-slate-800">Weekly summary</p>
              <p className="text-xs text-slate-500 mt-0.5">Your deal performance summary is ready to view</p>
              <p className="text-xs text-[#5a0099] mt-1">Yesterday</p>
            </div>
          </div>
          <div className="px-4 py-2 border-t border-[#e9ddff] text-center">
            <button className="text-xs text-[#3e0075] hover:underline">
              Mark all as read
            </button>
            <span className="px-2 text-slate-300">|</span>
            <button className="text-xs text-[#3e0075] hover:underline">
              View all notifications
            </button>
          </div>
        </div>
      )}
    </div>
  );
}