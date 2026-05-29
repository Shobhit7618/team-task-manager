import axios from 'axios';

const API = axios.create({
  // 🚀 CRITICAL: Dynamically pull your Render URL from Vercel's environment variables
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  withCredentials: true
});

// Automatically attach tokens if they exist
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default API;