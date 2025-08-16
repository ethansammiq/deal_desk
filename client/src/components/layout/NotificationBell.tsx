import { BellIcon } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { useUserPermissions } from "@/hooks/useAuth";

interface Notification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  type: 'approval' | 'status' | 'system';
}

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const { currentUser } = useUserPermissions();
  
  // In a real implementation, this would fetch from notifications API
  const { data: notifications = [] } = useQuery<Notification[]>({
    queryKey: ['/api/notifications', currentUser?.id],
    queryFn: () => {
      // Mock data for now - would be replaced with real API call
      return Promise.resolve([
        {
          id: '1',
          title: 'Deal requires your approval',
          message: 'Tesla Growth Scoping deal needs technical review',
          timestamp: '5 minutes ago',
          read: false,
          type: 'approval'
        },
        {
          id: '2', 
          title: 'Deal status updated',
          message: 'Meta Q2 Campaign deal has been approved',
          timestamp: '2 hours ago',
          read: true,
          type: 'status'
        }
      ] as Notification[]);
    },
    enabled: !!currentUser,
    staleTime: 30000 // 30 seconds
  });
  
  const unreadCount = notifications.filter(n => !n.read).length;
  
  // Don't show notifications for roles that don't need them
  if (currentUser?.role === 'seller') {
    return null;
  }
  
  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full hover:bg-[#f1e9fd] transition-colors"
        aria-label={`Notifications ${unreadCount > 0 ? `(${unreadCount} unread)` : ''}`}
      >
        <BellIcon className="h-5 w-5 text-[#5a0099]" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 block h-2 w-2 rounded-full bg-red-500" />
        )}
      </button>
      
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg py-1 z-50 border border-[#e9ddff]">
          <div className="px-4 py-2 border-b border-[#e9ddff]">
            <h3 className="text-sm font-medium text-[#3e0075]">
              Notifications {unreadCount > 0 && `(${unreadCount})`}
            </h3>
          </div>
          <div className="max-h-72 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-6 text-center">
                <p className="text-sm text-slate-500">No notifications</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div 
                  key={notification.id}
                  className={cn(
                    "px-4 py-3 hover:bg-[#f8f5ff] transition-colors border-l-2 cursor-pointer",
                    !notification.read ? "border-[#3e0075] bg-blue-50" : "border-transparent"
                  )}
                >
                  <p className="text-sm font-medium text-slate-800">{notification.title}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{notification.message}</p>
                  <p className="text-xs text-[#5a0099] mt-1">{notification.timestamp}</p>
                </div>
              ))
            )}
          </div>
          {notifications.length > 0 && (
            <div className="px-4 py-2 border-t border-[#e9ddff] text-center">
              <button className="text-xs text-[#3e0075] hover:underline">
                Mark all as read
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}