import React, { useState, useEffect } from 'react';
import { LayoutDashboard, CheckCircle2, AlertCircle, Folder, Clock, CheckSquare } from 'lucide-react';
import api from '../utils/api';

export default function Dashboard() {
  const [data, setData] = useState({ metrics: {}, tasks: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const res = await api.get('/projects/dashboard/overview');
        setData(res.data);
      } catch (err) {
        console.error('Failed loading dashboard overview metrics:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const { metrics, tasks } = data;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Dynamic Grid Metrics Grid Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Card 1: Active Projects */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center space-x-4 shadow-sm">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <Folder size={20} />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">My Projects</p>
            <h3 className="text-2xl font-black text-slate-800 mt-0.5">{metrics.totalProjects || 0}</h3>
          </div>
        </div>

        {/* Card 2: Pending Tasks */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center space-x-4 shadow-sm">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <Clock size={20} />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Pending Tasks</p>
            <h3 className="text-2xl font-black text-slate-800 mt-0.5">{metrics.pendingTasks || 0}</h3>
          </div>
        </div>

        {/* Card 3: Completed Tasks */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center space-x-4 shadow-sm">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <CheckCircle2 size={20} />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Completed</p>
            <h3 className="text-2xl font-black text-slate-800 mt-0.5">{metrics.completedTasks || 0}</h3>
          </div>
        </div>

        {/* Card 4: Urgent Action Required */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center space-x-4 shadow-sm">
          <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
            <AlertCircle size={20} />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Urgent Action</p>
            <h3 className="text-2xl font-black text-slate-800 mt-0.5">{metrics.urgentTasks || 0}</h3>
          </div>
        </div>
      </div>

      {/* Main Aggregation Work Content Window */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center space-x-2">
          <CheckSquare size={16} className="text-indigo-600" />
          <h4 className="font-bold text-sm text-slate-800">My Task Backlog Assignments</h4>
        </div>

        <div className="divide-y divide-slate-100">
          {tasks.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-400 italic">
              No tasks explicitly assigned to your profile record card yet!
            </div>
          ) : (
            tasks.map((task) => (
              <div key={task.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/40 transition-all">
                <div className="space-y-1 max-w-xl">
                  <h5 className="text-sm font-semibold text-slate-800 leading-snug break-words">
                    {task.title}
                  </h5>
                  <div className="flex items-center space-x-2">
                    <span 
                      className="w-2 h-2 rounded-full" 
                      style={{ backgroundColor: task.project?.color || '#4F46E5' }} 
                    />
                    <span className="text-xs font-medium text-slate-500">
                      {task.project?.name}
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-2.5 self-start sm:self-center">
                  <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded border ${
                    task.priority === 'HIGH' ? 'bg-rose-50 text-rose-600 border-rose-200' :
                    task.priority === 'LOW' ? 'bg-sky-50 text-sky-600 border-sky-200' :
                    'bg-amber-50 text-amber-600 border-amber-200'
                  }`}>
                    {task.priority}
                  </span>
                  
                  <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded border ${
                    task.status === 'DONE' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
                    task.status === 'IN_PROGRESS' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                    'bg-slate-100 text-slate-600 border-slate-200'
                  }`}>
                    {task.status.replace('_', ' ')}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}