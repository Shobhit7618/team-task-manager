import { create } from 'zustand';
import api from '../utils/api';

const useNotificationStore = create((set) => ({
  notifications: [],
  unreadCount: 0,

  fetchNotifications: async () => {
    try {
      const res = await api.get('/notifications');
      const list = res.data;
      const unread = list.filter(n => n.isRead === "false" || n.isRead === false).length;
      set({ notifications: list, unreadCount: unread });
    } catch (err) {
      console.error('Failed loading notification feed:', err);
    }
  },

  addNotification: (notif) => {
    set((state) => ({
      notifications: [notif, ...state.notifications],
      unreadCount: state.unreadCount + 1
    }));
  },

  markAllAsRead: async () => {
    try {
      await api.put('/notifications/read-all');
      set((state) => ({
        unreadCount: 0,
        notifications: state.notifications.map(n => ({ ...n, isRead: "true" }))
      }));
    } catch (err) {
      console.error('Failed updating notification batch tags:', err);
    }
  }
}));

export default useNotificationStore;