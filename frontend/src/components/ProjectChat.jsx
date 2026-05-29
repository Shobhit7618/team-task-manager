import React, { useState, useEffect, useRef } from 'react';
import { Send, MessageSquare, X, Trash2 } from 'lucide-react'; 
import api from '../utils/api';
import useAuthStore from '../store/authStore';
import { getSocket } from '../utils/socket';

export default function ProjectChat({ projectId, onClose }) {
    const { user } = useAuthStore();
    const [messages, setMessages] = useState([]);
    const [text, setText] = useState('');
    const [typingStatus, setTypingStatus] = useState(''); 
    const scrollRef = useRef(null);
    const typingTimeoutRef = useRef(null); 

    // 🎯 THE CRITICAL FIX: Capture the socket instance inside a persistent Ref!
    // This stops parent state updates from forcing an infinite loop unmount chain.
    const socketRef = useRef(null);
    if (!socketRef.current) {
        socketRef.current = getSocket();
    }
    const socket = socketRef.current;

    const currentUserId = user?.id || user?._id || user?.userId || user?.user?.id || user?.user?._id;
    const currentUserName = user?.name || user?.user?.name || 'Teammate';

    const currentUserIdRef = useRef(currentUserId);
    useEffect(() => {
        currentUserIdRef.current = currentUserId;
    }, [currentUserId]);

    useEffect(() => {
        if (!projectId || !socket) return;

        console.log("🔍 PROJECT CHAT DRAWER MOUNTED WITH ID:", projectId);

        // 1. Load historical messages (Runs strictly once per unique project mount)
        const loadChatLogs = async () => {
            try {
                const res = await api.get(`/projects/${projectId}/messages`);
                if (res.data && Array.isArray(res.data)) {
                    setMessages(res.data);
                }
            } catch (err) {
                console.error('Failed to pull chat logs:', err);
            }
        };
        loadChatLogs();

        // 2. Join socket room channel
        const joinWorkspaceRoom = () => {
            socket.emit('join_project_room', { projectId });
        };

        if (socket.connected) {
            joinWorkspaceRoom();
        } else {
            socket.on('connect', joinWorkspaceRoom);
        }

        // 3. Listen for real-time messages
        const handleIncomingMessage = (incomingMessage) => {
            setMessages((prev) => {
                if (prev.some(msg => msg.id === incomingMessage.id)) return prev;
                const temporaryMatchIndex = prev.findIndex(
                    (msg) => typeof msg.id === 'string' && msg.id.startsWith('temp-') && msg.content === incomingMessage.content
                );
                if (temporaryMatchIndex !== -1) {
                    const updated = [...prev];
                    updated[temporaryMatchIndex] = incomingMessage;
                    return updated;
                }
                return [...prev, incomingMessage];
            });
        };

        // 4. TYPING INDICATOR LISTENERS: Catch teammate typing states
        const handleUserTyping = (data) => {
            if (String(data.userId) !== String(currentUserIdRef.current)) {
                setTypingStatus(`${data.name || 'Someone'} is typing...`);
            }
        };

        const handleUserStoppedTyping = (data) => {
            if (String(data.userId) !== String(currentUserIdRef.current)) {
                setTypingStatus('');
            }
        };

        // 5. REAL-TIME DELETE LISTENER: Catch clear events from other users
        const handleChatCleared = () => {
            setMessages([]);
            setTypingStatus('');
        };

        socket.on('receive_message', handleIncomingMessage);
        socket.on('user_typing', handleUserTyping);
        socket.on('user_stopped_typing', handleUserStoppedTyping);
        socket.on('project_chat_cleared', handleChatCleared);

        return () => {
            console.log("🧼 Cleaning up socket listeners for project:", projectId);
            socket.off('receive_message', handleIncomingMessage);
            socket.off('user_typing', handleUserTyping);
            socket.off('user_stopped_typing', handleUserStoppedTyping);
            socket.off('project_chat_cleared', handleChatCleared);
            socket.off('connect', joinWorkspaceRoom);
        };
    // 🎯 DEPENDENCY FIX: Remove raw socket object mapping, watch only the static reference hook
    }, [projectId]); 

    // Auto scroll to latest message or typing block
    useEffect(() => {
        scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, typingStatus]);

    // CHAT PURGE FUNCTION ACTION
    const handleClearChatHistory = async () => {
        if (!window.confirm("Are you sure you want to permanently delete all messages in this room?")) return;
        try {
            await api.delete(`/projects/${projectId}/messages`);
            setMessages([]); 
            
            if (socket) {
                socket.emit('clear_project_chat', { projectId });
            }
        } catch (err) {
            console.error('Failed clearing room history indices:', err);
        }
    };

    // EMIT TYPING STATE ON INPUT CHANGES
    const handleInputChange = (e) => {
        setText(e.target.value);

        if (!socket || !currentUserId) return;

        socket.emit('typing_start', { 
            teamId: projectId, 
            userId: currentUserId, 
            userName: currentUserName 
        });

        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

        typingTimeoutRef.current = setTimeout(() => {
            socket.emit('typing_stop', { 
                teamId: projectId, 
                userId: currentUserId 
            });
        }, 2000);
    };

    const handleSend = async (e) => {
        e.preventDefault();
        if (!text.trim()) return;

        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        socket.emit('typing_stop', { teamId: projectId, userId: currentUserId });

        const payload = {
            content: text,
            senderId: currentUserId || "ANONYMOUS_USER",
            projectId
        };

        const localOptimisticMessage = {
            id: `temp-${Date.now()}`,
            content: text,
            senderId: currentUserId || "ANONYMOUS_USER",
            projectId,
            createdAt: new Date().toISOString(),
            sender: { name: currentUserName }
        };

        setMessages((prev) => [...prev, localOptimisticMessage]);
        setText('');

        try {
            socket.emit('send_project_message', payload);
        } catch (err) {
            console.error('Socket transmit fail:', err);
        }
    };

    return (
        <div className="w-full lg:w-80 h-[calc(100vh-140px)] lg:h-[72vh] bg-white border border-slate-200 rounded-2xl flex flex-col shadow-sm">
            {/* Header */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 rounded-t-2xl">
                <div className="flex items-center space-x-2">
                    <MessageSquare size={16} className="text-indigo-600" />
                    <h4 className="font-bold text-sm text-slate-800">Live Team Room</h4>
                </div>
                <div className="flex items-center space-x-1.5">
                    <button 
                        onClick={handleClearChatHistory}
                        title="Delete All Messages"
                        className="p-1 rounded-md hover:bg-rose-50 text-slate-400 hover:text-rose-600 cursor-pointer outline-none transition-all"
                    >
                        <Trash2 size={14} />
                    </button>
                    <button onClick={onClose} className="p-1 rounded-md hover:bg-slate-100 text-slate-400 hover:text-slate-600 cursor-pointer outline-none">
                        <X size={14} />
                    </button>
                </div>
            </div>

            {/* Messages Stream */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/30">
                {messages.map((msg) => {
                    const messageSenderId = msg.senderId || msg.sender?.id || msg.sender?._id;
                    const isMe = currentUserId && messageSenderId && String(currentUserId) === String(messageSenderId);
                    
                    return (
                        <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                            <span className="text-[10px] font-bold text-slate-400 mb-0.5 px-1">
                                {isMe ? 'You' : msg.sender?.name || 'Teammate'}
                            </span>
                            <div className={`max-w-[85%] rounded-xl px-3 py-2 text-xs font-medium leading-relaxed shadow-sm ${isMe ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-white border border-slate-200 text-slate-800 rounded-bl-none'}`}>
                                {msg.content}
                            </div>
                        </div>
                    );
                })}

                {/* TYPING INDICATOR */}
                {typingStatus && (
                    <div className="flex flex-col items-start animate-pulse">
                        <span className="text-[10px] italic font-semibold text-indigo-500 px-1">
                            {typingStatus}
                        </span>
                        <div className="bg-slate-100 border border-slate-200 rounded-xl rounded-bl-none px-3 py-1.5 text-[11px] text-slate-500 font-medium">
                            <span className="inline-flex space-x-0.5">
                                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                            </span>
                        </div>
                    </div>
                )}
                <div ref={scrollRef} />
            </div>

            {/* Input Form */}
            <form onSubmit={handleSend} className="p-3 border-t border-slate-100 bg-white rounded-b-2xl flex items-center space-x-2">
                <input
                    type="text"
                    value={text}
                    onChange={handleInputChange} 
                    placeholder="Type a message..."
                    className="flex-1 bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 rounded-xl px-3 py-2 text-xs outline-none transition-all text-slate-900"
                />
                <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 p-2 text-white rounded-xl shadow-sm transition-all shrink-0 cursor-pointer outline-none">
                    <Send size={14} />
                </button>
            </form>
        </div>
    );
}