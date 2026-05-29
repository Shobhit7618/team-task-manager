import React, { useState } from 'react';
import { X } from 'lucide-react';
import api from '../utils/api';

// A curated list of modern Tailwind-inspired canvas hex tones
const COLOR_OPTIONS = ['#4F46E5', '#0EA5E9', '#10B981', '#F59E0B', '#EF4444', '#EC4899', '#8B5CF6', '#64748B'];

export default function ProjectModal({ isOpen, onClose, onProjectCreated }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedColor, setSelectedColor] = useState('#4F46E5'); // Default Indigo
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
      // Pass name, description, and the color code payload straight to our backend endpoint
      const response = await api.post('/projects', {
        name,
        description,
        color: selectedColor
      });
      
      onProjectCreated(response.data);
      setName('');
      setDescription('');
      setSelectedColor('#4F46E5');
      onClose();
    } catch (error) {
      console.error('Failed creating customized project card container:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200">
      <div className="bg-white border border-slate-100 rounded-2xl shadow-2xl w-full max-w-md p-6 m-4 space-y-4 animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="font-bold text-base text-slate-800">Create New Project Workspace</h3>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:bg-slate-50 transition-all cursor-pointer"><X size={16} /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">Project Title</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Smart Finance Tracker" className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-sm font-medium text-slate-800 focus:border-indigo-500 outline-none bg-slate-50/30 transition-all" required />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">Description (Optional)</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Brief description of project deliverables..." className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-sm font-medium text-slate-800 focus:border-indigo-500 outline-none bg-slate-50/30 transition-all min-h-[80px] resize-none" />
          </div>

          {/* 🎨 INTERACTIVE PROJECT COLOR SELECTOR CHIPS ROW */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wide block">Workspace Identity Theme Color</label>
            <div className="flex items-center gap-2.5 flex-wrap pt-1">
              {COLOR_OPTIONS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setSelectedColor(color)}
                  className={`w-6 h-6 rounded-full transition-all duration-200 transform cursor-pointer hover:scale-110 active:scale-95 flex items-center justify-center relative`}
                  style={{ backgroundColor: color }}
                >
                  {selectedColor === color && (
                    <span className="w-2 h-2 bg-white rounded-full shadow-sm animate-ping absolute" />
                  )}
                  {selectedColor === color && (
                    <span className="w-1.5 h-1.5 bg-white rounded-full shadow-sm" />
                  )}
                </button>
              ))}
            </div>
          </div>

          <button type="submit" disabled={isSubmitting} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 rounded-xl text-sm transition-all shadow-md shadow-indigo-600/10 cursor-pointer disabled:opacity-50 mt-2">
            {isSubmitting ? 'Generating Workspace...' : 'Create Project'}
          </button>
        </form>
      </div>
    </div>
  );
}