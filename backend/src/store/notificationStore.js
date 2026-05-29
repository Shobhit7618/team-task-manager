import { create } from 'zustand';
import api from '../utils/api';

const useNotificationStore = create((set, get) => ({
  notifications: [],
  unreadCount: 0,

  fetchNotifications: async () => {
    try {
      const res = await api.get('/notifications');
      const list = Array.isArray(res.data) ? res.data : [];
      
      // 🎯 THE TRIPLE GUARDRAIL FILTER: Accurately calculate items across both schema variations
      const unread = list.filter(n => 
        n.read === false || 
        n.read === "false" || 
        n.isRead === false || 
        n.isRead === "false"
      ).length;

      set({ notifications: list, unreadCount: unread });
    } catch (err) {
      console.error('Failed loading notification feed arrays:', err);
    }
  },

  addNotification: (notif) => {
    set((state) => {
      const updatedList = [notif, ...state.notifications];
      const unread = updatedList.filter(n => 
        n.read === false || 
        n.read === "false" || 
        n.isRead === false || 
        n.isRead === "false"
      ).length;

      return {
        notifications: updatedList,
        unreadCount: unread
      };
    });
  },

  markAllAsRead: async () => {
    try {
      // 1. 🔥 INSTANT LOCAL UI CLEARANCE: Optimistically wipe styles and numbers out instantly
      set((state) => ({
        unreadCount: 0,
        notifications: state.notifications.map(n => ({ 
          ...n, 
          read: true,      // Set true booleans
          isRead: true     // Map both properties to handle all template condition choices
        }))
      }));

      // 2. Fire the network request to your synchronized route endpoint path
      await api.put('/notifications/read-all');
      
      console.log("📥 Notification badge successfully flushed on database clusters.");
    } catch (err) {
      console.error('Failed updating notification batch tags:', err);
      // Optional fallback: re-sync array layout from database if backend drops completely
      get().fetchNotifications();
    }
  }
}));

export default useNotificationStore;