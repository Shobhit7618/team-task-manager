import React, { useState } from 'react';
import { X, UserPlus } from 'lucide-react';
import api from '../utils/api';

export default function InviteMemberModal({ isOpen, onClose, projectId }) {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ text: '', isError: false });

    if (!isOpen) return null;

    const handleInvite = async (e) => {
        e.preventDefault();
        if (!email.trim()) return;

        setLoading(true);
        setMessage({ text: '', isError: false });

        try {
            const res = await api.post(`/projects/${projectId}/members`, { email });
            setMessage({ text: res.data.message, isError: false });
            setEmail('');
            setTimeout(() => {
                onClose();
                setMessage({ text: '', isError: false });
            }, 1500);
        } catch (err) {
            let errorMsg = 'Failed to add member.';

            if (err.response?.data) {
                if (typeof err.response.data.error === 'string') {
                    errorMsg = err.response.data.error;
                } else if (err.response.data.error?.message) {
                    errorMsg = err.response.data.error.message;
                } else if (typeof err.response.data === 'string') {
                    errorMsg = err.response.data;
                }
            }

            setMessage({ text: String(errorMsg), isError: true }); // Guarantees it's a string!
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-150">
            <div className="bg-white border border-slate-100 rounded-2xl shadow-2xl w-full max-w-sm p-5 m-4 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <div className="flex items-center space-x-2 text-indigo-600">
                        <UserPlus size={16} />
                        <h4 className="font-bold text-sm text-slate-800">Invite Team Member</h4>
                    </div>
                    <button onClick={onClose} className="p-1 rounded-md hover:bg-slate-50 text-slate-400 cursor-pointer"><X size={14} /></button>
                </div>

                <form onSubmit={handleInvite} className="space-y-3.5">
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Teammate's Email Address</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="user@workspace.com"
                            className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none focus:border-indigo-500 bg-slate-50/50"
                            required
                        />
                    </div>

                    {message.text && (
                        <p className={`text-[11px] font-semibold ${message.isError ? 'text-rose-500' : 'text-emerald-600'}`}>
                            {message.text}
                        </p>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-2 rounded-xl transition-all shadow-sm cursor-pointer disabled:opacity-50"
                    >
                        {loading ? 'Adding Member...' : 'Add to Workspace'}
                    </button>
                </form>
            </div>
        </div>
    );
}