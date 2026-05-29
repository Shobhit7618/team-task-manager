import React, { useState, useEffect } from 'react';
import { Folder, Search, Shield, User, ArrowRight } from 'lucide-react';
import api from '../utils/api';

export default function Projects({ onSelectProject }) {
  const [projects, setProjects] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAllProjects = async () => {
      try {
        const res = await api.get('/projects');
        setProjects(res.data);
      } catch (err) {
        console.error('Failed loading projects directory:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAllProjects();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Filter projects by search query string match
  const filteredProjects = projects.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Search and Metadata Top Control Bar Row */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
        <div>
          <h3 className="font-bold text-lg text-slate-800">Projects Portfolio Directory</h3>
          <p className="text-xs text-slate-500 mt-0.5">Manage, search, and navigate across your distinct company workspaces.</p>
        </div>

        <div className="relative w-full sm:w-64">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search workspace names..."
            className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 rounded-lg pl-9 pr-3 py-1.5 text-xs outline-none transition-all text-slate-900"
          />
        </div>
      </div>

      {/* Projects Grid Array Layer */}
      {filteredProjects.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-sm text-slate-400 italic shadow-sm">
          No matching project directory workspaces located.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredProjects.map((p) => {
            // Safely grab structural task array variables if bundled from backend query rows count keys
            const taskTotalCount = p._count?.tasks || 0;
            const membersTotalCount = p._count?.members || 0;

            return (
              <div 
                key={p.id} 
                className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md hover:border-slate-300 transition-all flex flex-col justify-between space-y-4"
              >
                <div className="space-y-2">
                  {/* Color Tag Header Bubble */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: p.color || '#4F46E5' }} />
                      <span className="text-[10px] bg-slate-100 text-slate-600 border border-slate-200 font-black tracking-wider px-2 py-0.5 rounded uppercase">
                        {p.myRole || 'MEMBER'}
                      </span>
                    </div>
                    <Folder size={16} className="text-slate-300" />
                  </div>

                  {/* Title text layout strings */}
                  <div>
                    <h4 className="font-bold text-sm text-slate-800 truncate">{p.name}</h4>
                    <p className="text-xs text-slate-500 line-clamp-2 mt-1 leading-normal">
                      {p.description || 'No system workspace descriptive blueprint notes provided.'}
                    </p>
                  </div>
                </div>

                {/* Footer Section Stats and Click Trigger Navigation Row */}
                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center space-x-3 text-slate-500 text-xs font-semibold">
                    <div className="flex items-center space-x-1">
                      <User size={12} className="text-slate-400" />
                      <span>{membersTotalCount} {membersTotalCount === 1 ? 'member' : 'members'}</span>
                    </div>
                    <span>•</span>
                    <span>{taskTotalCount} {taskTotalCount === 1 ? 'task' : 'tasks'}</span>
                  </div>

                  <button
                    onClick={() => onSelectProject(p)}
                    className="inline-flex items-center justify-center p-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-600 cursor-pointer transition-all outline-none"
                    title="Enter Workspace Board"
                  >
                    <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}