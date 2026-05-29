import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  withCredentials: true, // Crucial for handling httpOnly session refresh cookies cross-origin
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to attach the short-lived in-memory Access Token dynamically
api.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;