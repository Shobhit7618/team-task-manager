import { create } from 'zustand';
import api from '../utils/api';

const useAuthStore = create((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  // 1. LOGIN HANDLER
  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post('/auth/login', { email, password });
      const { accessToken, user } = response.data;
      
      sessionStorage.setItem('accessToken', accessToken);
      set({ user, isAuthenticated: true, isLoading: false });
      return true;
    } catch (err) {
      set({ 
        error: err.response?.data?.error?.message || 'Login failed. Check your credentials.', 
        isLoading: false 
      });
      return false;
    }
  },

  // 2. REGISTER HANDLER
  register: async (name, email, password) => {
    set({ isLoading: true, error: null });
    try {
      await api.post('/auth/register', { name, email, password });
      set({ isLoading: false });
      return true;
    } catch (err) {
      set({ 
        error: err.response?.data?.error?.message || 'Registration failed.', 
        isLoading: false 
      });
      return false;
    }
  },

  // 3. LOGOUT HANDLER
  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch (err) {
      console.error('Logout error context cleanup:', err);
    } finally {
      sessionStorage.removeItem('accessToken');
      set({ user: null, isAuthenticated: false });
    }
  },
}));

export default useAuthStore;