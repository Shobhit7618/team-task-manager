import React, { useState } from 'react';
import { User, Image, CheckCircle2, AlertCircle, Save } from 'lucide-react';
import useAuthStore from '../store/authStore';
import api from '../utils/api';

export default function UserSettings() {
  const { user, setUser } = useAuthStore(); // Grab user record and hydration helper from store
  const [name, setName] = useState(user?.name || '');
  const [avatar, setAvatar] = useState(user?.avatar || '');
  const [status, setStatus] = useState({ type: '', message: '' });
  const [loading, setLoading] = useState(false);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setStatus({ type: 'error', message: 'Display name cannot be blank.' });
      return;
    }

    setLoading(true);
    setStatus({ type: '', message: '' });

    try {
      // 🎯 Hits your backend router.put('/profile') endpoint cleanly
      const res = await api.put('/auth/profile', {
        name: name.trim(),
        avatar: avatar.trim()
      });

      if (res.data && res.data.user) {
        // Update your central global state store so changes reflect instantly in header/sidebar
        if (typeof setUser === 'function') {
          setUser(res.data.user);
        } else {
          // Fallback if your store structure handles updates slightly differently
          useAuthStore.setState({ user: res.data.user });
        }
        setStatus({ type: 'success', message: 'Identity profile details synchronized!' });
      }
    } catch (err) {
      console.error('Profile adjustment execution crash:', err);
      setStatus({
        type: 'error',
        message: err.response?.data?.error?.message || 'Failed updating your user workspace profiles.'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Title Config Section */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
        <h3 className="font-bold text-lg text-slate-800">Account Preferences Settings</h3>
        <p className="text-xs text-slate-500 mt-0.5">Customize your display identity and look within the team organization platform.</p>
      </div>

      {/* Main Core Management Card Form */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center space-x-2">
          <User size={16} className="text-indigo-600" />
          <h4 className="font-bold text-sm text-slate-800">Profile Identity Layout</h4>
        </div>

        <form onSubmit={handleUpdateProfile} className="p-6 space-y-5">
          {/* Status Notifications Layer banner */}
          {status.message && (
            <div className={`p-3.5 rounded-lg flex items-start space-x-2.5 text-xs font-semibold border ${
              status.type === 'success' 
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                : 'bg-rose-50 text-rose-700 border-rose-200'
            }`}>
              {status.type === 'success' ? <CheckCircle2 size={16} className="shrink-0" /> : <AlertCircle size={16} className="shrink-0" />}
              <span>{status.message}</span>
            </div>
          )}

          {/* Interactive Live Identity Avatar Display Badge */}
          <div className="flex items-center space-x-4 pb-2">
            <div className="w-16 h-16 rounded-full bg-indigo-50 border-2 border-indigo-200 flex items-center justify-center font-black text-indigo-600 text-xl uppercase overflow-hidden shrink-0">
              {avatar.trim() ? (
                <img src={avatar} alt="" className="w-full h-full object-cover" />
              ) : (
                name?.slice(0, 2) || 'US'
              )}
            </div>
            <div>
              <h5 className="text-sm font-bold text-slate-800">Avatar Preview</h5>
              <p className="text-xs text-slate-400 mt-0.5">Provide an image URL linkage pointer to customize your profile thumbnail bubble view icon.</p>
            </div>
          </div>

          {/* Field 1: Display Full Name String Input */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Full Display Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Shobhit Yadav"
              className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 rounded-lg px-3 py-2 text-sm outline-none transition-all text-slate-900"
            />
          </div>

          {/* Field 2: Avatar URL Layout Field Target */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Avatar Photo Link URL</label>
            <div className="relative">
              <Image size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={avatar}
                onChange={(e) => setAvatar(e.target.value)}
                placeholder="https://images.unsplash.com/photo-example..."
                className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 rounded-lg pl-9 pr-3 py-2 text-sm outline-none transition-all text-slate-900"
              />
            </div>
          </div>

          {/* Locked Static Parameter Account Metric View Field */}
          <div className="space-y-1.5 opacity-60">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Registered Workspace Email Address</label>
            <input
              type="email"
              disabled
              value={user?.email || 'shobhit@workspace.com'}
              className="w-full bg-slate-100 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-500 outline-none cursor-not-allowed"
            />
          </div>

          {/* Form Actions Button Alignment Layer */}
          <div className="pt-3 border-t border-slate-100 flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-medium px-4 py-2 rounded-lg text-sm transition-all shadow-sm cursor-pointer outline-none"
            >
              <Save size={16} />
              <span>{loading ? 'Saving Changes...' : 'Save Preferences'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}