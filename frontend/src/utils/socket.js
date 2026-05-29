import { io } from 'socket.io-client';

let socket = null;

export const getSocket = () => {
    // 🎯 Dynamically extract the token from cookies or localStorage on every invocation check
    const token = localStorage.getItem('token') || document.cookie.match(/token=([^;]+)/)?.[1];

    if (!socket) {
        console.log("🔌 Initializing real-time websocket handshake...");
        
        // 🚀 DYNAMIC PRODUCTION URL PARSING ENGINE
        // Safely strips out the "/api" suffix string from your live Vercel environment variable configuration
        const SOCKET_URL = import.meta.env.VITE_API_URL 
            ? import.meta.env.VITE_API_URL.replace('/api', '') 
            : 'http://localhost:5000';

        socket = io(SOCKET_URL, {
            withCredentials: true,
            transports: ['websocket', 'polling'], 
            autoConnect: true,
            // 🎯 Pass the token directly inside the handshake auth block payload
            auth: { token } 
        });
        
        socket.on('connect', () => {
            console.log('✅ Global application socket connected:', socket.id);
        });

        socket.on('connect_error', (err) => {
            console.warn('⚠️ Socket connection error handle flag:', err.message);
            // If the backend throws an authentication error, disconnect the stale socket instance
            if (err.message === 'jwt expired' || err.message === 'Unauthorized') {
                disconnectSocket();
            }
        });
    }
    return socket;
};

// 🎯 Call this during your Sign Out process to completely purge the stale socket connection!
export const disconnectSocket = () => {
    if (socket) {
        console.log("🧼 Tearing down old socket instance configurations...");
        socket.disconnect();
        socket = null; // Forces getSocket() to build a fresh instance with the new token next time!
    }
};