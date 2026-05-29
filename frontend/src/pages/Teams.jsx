import React, { useState, useEffect } from 'react';
import { Users, Search, Mail, ShieldAlert, UserCheck } from 'lucide-react';
import api from '../utils/api';
import useAuthStore from '../store/authStore'; // 🎯 Imported to recognize your logged-in session status

export default function Teams() {
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const { user: currentUser } = useAuthStore(); // 🎯 Extract your logged-in profile record

  useEffect(() => {
    const fetchGlobalUsers = async () => {
      try {
        const res = await api.get('/auth/users');
        if (res.data && Array.isArray(res.data)) {
          setUsers(res.data);
        }
      } catch (err) {
        console.error('Failed fetching dynamic database workspace directory roster:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchGlobalUsers();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const filteredUsers = users.filter(u =>
    (u.name && u.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (u.email && u.email.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Search Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
        <div>
          <h3 className="font-bold text-lg text-slate-800">Workspace Organization Roster</h3>
          <p className="text-xs text-slate-500 mt-0.5">Live registered user accounts pulled in real-time directly from database clusters.</p>
        </div>

        <div className="relative w-full sm:w-64">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search active accounts..."
            className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 rounded-lg pl-9 pr-3 py-1.5 text-xs outline-none transition-all text-slate-900"
          />
        </div>
      </div>

      {/* Roster Cards Layout */}
      {filteredUsers.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-sm text-slate-400 italic shadow-sm">
          No live team accounts located in query index matching that description.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredUsers.map((member) => {
            // 🎯 THE FIX: Dynamically identify if this card belongs to your logged-in administrator profile
            const isMe = member.id === currentUser?.id;

            return (
              <div key={member.id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex items-center space-x-4">
                
                {/* Avatar Bubble Container */}
                <div className="w-12 h-12 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-sm shrink-0 uppercase">
                  {member.avatar ? (
                    <img src={member.avatar} alt="" className="w-full h-full rounded-full object-cover" />
                  ) : (
                    member.name?.slice(0, 2) || 'TM'
                  )}
                </div>

                {/* User Metadata Information */}
                <div className="flex-1 min-w-0 space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="font-bold text-sm text-slate-800 truncate leading-none">
                      {member.name} {isMe && <span className="text-xs text-slate-400 font-normal">(You)</span>}
                    </h4>
                    
                    {/* System Role Indicator Badge */}
                    <span className={`inline-flex items-center space-x-1 text-[9px] font-black tracking-wider px-1.5 py-0.5 rounded border uppercase ${
                      isMe ? 'bg-rose-50 text-rose-600 border-rose-200' : 'bg-slate-50 text-slate-600 border-slate-200'
                    }`}>
                      {isMe ? <ShieldAlert size={10} /> : <UserCheck size={10} />}
                      <span>{isMe ? 'ADMIN' : 'TEAMMATE'}</span>
                    </span>
                  </div>

                  {/* Email Info Display Row */}
                  <div className="flex items-center space-x-1 text-xs text-slate-500 font-medium">
                    <Mail size={12} className="text-slate-400 shrink-0" />
                    <span className="truncate">{member.email}</span>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}