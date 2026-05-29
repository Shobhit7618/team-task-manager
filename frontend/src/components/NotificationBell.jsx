import React, { useState, useEffect, useRef } from 'react';
import { Bell, CheckSquare, MessageSquare, AlertCircle, Trash2 } from 'lucide-react';
import useNotificationStore from '../store/notificationStore';
import useAuthStore from '../store/authStore';
import { getSocket } from '../utils/socket'; 
import api from '../utils/api'; // 🎯 THE CRITICAL FIX: Import your configured Axios API instance!

export default function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const { notifications, unreadCount, fetchNotifications, addNotification, markAllAsRead } = useNotificationStore();
  const { user } = useAuthStore();
  const dropdownRef = useRef(null);

  const currentUserId = user?.id || user?._id || user?.userId || user?.user?.id || user?.user?._id;

  useEffect(() => {
    fetchNotifications();

    const socket = getSocket(); 

    if (currentUserId && socket) {
      socket.emit('join_user_notification_channel', { userId: currentUserId });

      socket.on('incoming_notification', (newNotif) => {
        addNotification(newNotif);
      });
    }

    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      if (socket) {
        socket.off('incoming_notification'); 
      }
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [currentUserId]);

  const handleToggle = () => {
    setIsOpen(!isOpen);
    if (!isOpen && unreadCount > 0) {
      markAllAsRead();
    }
  };

  // 🎯 PURGE ALL NOTIFICATIONS HANDLER
  const handleClearAllNotifications = async () => {
    if (!window.confirm("Are you sure you want to delete all notification logs permanently?")) return;
    try {
      // Hits the router.delete('/') endpoint on your backend notification routes cleanly now!
      await api.delete('/notifications');
      
      // Instantly wipe the global frontend cache array state
      useNotificationStore.setState({ notifications: [], unreadCount: 0 });
    } catch (err) {
      console.error("Failed to wipe notification logs from the pipeline stream:", err);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Trigger Button */}
      <button 
        onClick={handleToggle}
        className="relative p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50/60 rounded-xl transition-all cursor-pointer outline-none"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 text-white rounded-full flex items-center justify-center text-[10px] font-bold animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Floating Layer */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-3 duration-200">
          
          {/* Title Bar Header Space */}
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <h4 className="font-bold text-sm text-slate-800">Activity Feed</h4>
            <div className="flex items-center space-x-2">
              
              {/* CLEAR ALL BUTTON */}
              {notifications.length > 0 && (
                <button
                  onClick={handleClearAllNotifications}
                  title="Clear All Notifications"
                  className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer transition-all outline-none"
                >
                  <Trash2 size={14} />
                </button>
              )}
              
              {unreadCount > 0 && (
                <span className="text-[10px] bg-indigo-100 text-indigo-700 font-bold px-2 py-0.5 rounded-full">
                  New
                </span>
              )}
            </div>
          </div>

          {/* Items Content Feed Window */}
          <div className="max-h-72 overflow-y-auto divide-y divide-slate-50">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400 italic">
                All caught up! No recent system updates.
              </div>
            ) : (
              notifications.map((n) => {
                const isUnread = 
                  n.read === false || 
                  n.read === "false" || 
                  n.isRead === false || 
                  n.isRead === "false";

                return (
                  <div 
                    key={n.id} 
                    className={`p-3.5 flex items-start space-x-3 transition-all hover:bg-slate-50/60 ${
                      isUnread ? 'bg-indigo-50/40 border-l-2 border-indigo-500 font-medium' : 'bg-white'
                    }`}
                  >
                    <div className={`mt-0.5 shrink-0 ${isUnread ? 'text-indigo-600' : 'text-slate-400'}`}>
                      {n.type === 'COMMENT' || n.type === 'NEW_MESSAGE' ? (
                        <MessageSquare size={14} />
                      ) : n.type === 'TASK_CREATED' ? (
                        <CheckSquare size={14} />
                      ) : (
                        <AlertCircle size={14} />
                      )}
                    </div>
                    <div className="flex-1 space-y-0.5">
                      <p className={`text-xs leading-tight ${isUnread ? 'font-bold text-slate-900' : 'font-normal text-slate-600'}`}>
                        {n.title}
                      </p>
                      <p className="text-[11px] text-slate-500 leading-normal">{n.message}</p>
                      <p className="text-[9px] text-slate-400">
                        {n.createdAt ? new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}