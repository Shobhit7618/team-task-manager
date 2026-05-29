import React, { useState } from 'react';
import { X } from 'lucide-react';
import api from '../utils/api';

export default function CreateProjectModal({ isOpen, onClose, onProjectCreated }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('#4F46E5'); // Default Indigo
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await api.post('/projects', { name, description, color });
      onProjectCreated(response.data.project);
      setName('');
      setDescription('');
      onClose();
    } catch (error) {
      console.error('Error deploying project layout:', error);
      alert(error.response?.data?.error?.message || 'Failed to construct project.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-xl animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold text-slate-900">Create New Project</h3>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-all">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Project Name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} required className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl px-4 py-2.5 text-sm outline-none transition-all text-slate-900" placeholder="e.g., Q3 Product Sprint Launch" />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl px-4 py-2.5 text-sm outline-none transition-all text-slate-900 resize-none" placeholder="Provide core project parameters or objectives..." />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Theme Accent Color</label>
            <div className="flex items-center space-x-3 mt-1">
              <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="w-10 h-10 rounded-lg border border-slate-200 cursor-pointer bg-transparent" />
              <span className="text-sm font-mono text-slate-600 uppercase">{color}</span>
            </div>
          </div>

          <button type="submit" disabled={isLoading} className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-medium py-2.5 rounded-xl text-sm transition-all shadow-sm">
            {isLoading ? 'Deploying workspace...' : 'Construct Project'}
          </button>
        </form>
      </div>
    </div>
  );
}