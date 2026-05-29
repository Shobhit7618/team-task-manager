import React, { useState, useEffect } from 'react';
import { LayoutDashboard, FolderKanban, Settings, Plus, LogOut, Users } from 'lucide-react';
import api from './utils/api';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard'; 
import Projects from './pages/Projects'; 
import Teams from './pages/Teams'; // 🎯 THE FIX: Imported your new organization team directory roster screen
import CreateProjectModal from './components/CreateProjectModal';
import KanbanBoard from './components/KanbanBoard';
import UserSettings from './components/UserSettings';
import NotificationBell from './components/NotificationBell';
import useAuthStore from "./store/authStore";
import useNotificationStore from "./store/notificationStore";

export default function App() {
  const { isAuthenticated, logout, user } = useAuthStore();
  const [authView, setAuthView] = useState('login');
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewTab, setViewTab] = useState('DASHBOARD'); // Tracks active view stage

  // Synchronize dynamic user project matrix lists from the database
  useEffect(() => {
    if (isAuthenticated) {
      fetchUserProjects();
    }
  }, [isAuthenticated]);

  const fetchUserProjects = async () => {
    try {
      const response = await api.get('/projects');
      setProjects(response.data);
    } catch (error) {
      console.error('Failed fetching user memberships arrays:', error);
    }
  };

  if (!isAuthenticated) {
    return authView === 'login' ? (
      <Login onToggleView={() => setAuthView('register')} />
    ) : (
      <Register onToggleView={() => setAuthView('login')} />
    );
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#F8FAFC] text-[#0F172A]">

      {/* 📱 MOBILE NAVIGATION HEADER */}
      <header className="flex md:hidden items-center justify-between px-6 py-4 bg-white border-b border-slate-200 shadow-sm">
        <h1 className="text-xl font-bold text-indigo-600 tracking-tight">Workspace</h1>
        <button onClick={() => setIsModalOpen(true)} className="p-2 text-indigo-600"><Plus size={20} /></button>
      </header>

      {/* 🖥️ DESKTOP SIDEBAR PANEL */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-slate-200 p-6 space-y-7 shadow-sm shrink-0 justify-between">
        <div className="space-y-7 flex flex-col flex-1 min-h-0">
          {/* Logo Header */}
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-lg">W</div>
            <h1 className="text-xl font-bold tracking-tight">Workspace</h1>
          </div>

          {/* Top Level Nav Options */}
          <nav className="space-y-1">
            <SidebarLink
              icon={<LayoutDashboard size={18} />}
              label="Dashboard"
              active={viewTab === 'DASHBOARD'}
              onClick={() => { setViewTab('DASHBOARD'); setSelectedProject(null); }}
            />
            <SidebarLink
              icon={<FolderKanban size={18} />}
              label="Projects Portfolio"
              active={viewTab === 'PROJECTS'}
              onClick={() => { setViewTab('PROJECTS'); setSelectedProject(null); }}
            />
            {/* 🎯 NEW DESKTOP SIDEBAR LINK ELEMENT */}
            <SidebarLink
              icon={<Users size={18} />}
              label="Team Directory"
              active={viewTab === 'TEAMS'}
              onClick={() => { setViewTab('TEAMS'); setSelectedProject(null); }}
            />
          </nav>

          {/* 📁 PROJECTS DIRECTORY SECTION INDEX */}
          <div className="flex-1 flex flex-col min-h-0 space-y-2">
            <div className="flex items-center justify-between px-3 text-xs font-bold text-slate-400 uppercase tracking-wider">
              <span>My Projects</span>
              <button onClick={() => setIsModalOpen(true)} className="hover:text-indigo-600 transition-all cursor-pointer"><Plus size={14} /></button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-0.5 pr-1">
              {projects.length === 0 ? (
                <p className="text-xs text-slate-400 italic px-3 py-2">No projects created yet.</p>
              ) : (
                projects.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => { setSelectedProject(p); setViewTab('PROJECT'); }}
                    className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium text-left transition-all cursor-pointer ${viewTab === 'PROJECT' && selectedProject?.id === p.id ? 'bg-indigo-50 text-indigo-600 font-semibold' : 'text-slate-600 hover:bg-slate-50'}`}
                  >
                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: p.color || '#6366F1' }} />
                    <span className="truncate">{p.name}</span>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Sidebar Footer Administrative Options */}
        <div className="space-y-1 pt-4 border-t border-slate-100">
          <SidebarLink
            icon={<Settings size={18} />}
            label="Account Settings"
            active={viewTab === 'SETTINGS'}
            onClick={() => { setViewTab('SETTINGS'); setSelectedProject(null); }}
          />

          <button onClick={logout} className="w-full flex items-center space-x-3 px-3 py-2.5 text-sm font-medium text-slate-600 hover:text-red-600 transition-all cursor-pointer">
            <LogOut size={18} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* =========================================================
          🚀 MAIN DISPLAY CONTAINER STAGE W/ CONDITIONALS
         ========================================================= */}
      <main className="flex-1 p-4 sm:p-6 md:p-8 overflow-y-auto pb-24 md:pb-8">
        <div className="max-w-7xl mx-auto space-y-6">

          {/* VIEW PANEL 1: PROJECT KANBAN BOARD */}
          {viewTab === 'PROJECT' && selectedProject && (
            <KanbanBoard
              project={selectedProject}
              onProjectDeleted={(deletedId) => {
                setProjects((prev) => prev.filter((p) => p.id !== deletedId));
                setSelectedProject(null);
                setViewTab('DASHBOARD'); 
              }}
            />
          )}

          {/* VIEW PANEL 2: IDENTITY ACCOUNT PREFERENCES */}
          {viewTab === 'SETTINGS' && <UserSettings />}

          {/* VIEW PANEL 4: CORE PROJECTS PORTFOLIO DIRECTORY */}
          {viewTab === 'PROJECTS' && (
            <Projects 
              onSelectProject={(project) => {
                setSelectedProject(project);
                setViewTab('PROJECT'); 
              }}
            />
          )}

          {/* 🎯 VIEW PANEL 5: NEW MOUNTED TEAM ROSTER COMPONENT */}
          {viewTab === 'TEAMS' && <Teams />}

          {/* VIEW PANEL 3: MASTER DASHBOARD OVERVIEW SUMMARY */}
          {viewTab === 'DASHBOARD' && (
            <>
              {/* Header Title Section Banner Block */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
                <div className="flex items-center justify-between w-full sm:w-auto">
                  <div>
                    <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">Welcome, {user?.name || 'Shobhit'}</h2>
                    <p className="text-slate-500 text-sm mt-1">Monitor high level company operations deliverables summaries maps.</p>
                  </div>

                  <div className="ml-4 sm:hidden">
                    <NotificationBell />
                  </div>
                </div>

                <div className="flex items-center space-x-3 w-full sm:w-auto justify-end">
                  <div className="hidden sm:block">
                    <NotificationBell />
                  </div>
                  <button onClick={() => setIsModalOpen(true)} className="inline-flex items-center justify-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-4 py-2.5 rounded-lg text-sm transition-all shadow-sm cursor-pointer">
                    <Plus size={16} />
                    <span>New Project</span>
                  </button>
                </div>
              </div>

              <Dashboard />
            </>
          )}

        </div>
      </main>

      {/* 📱 MOBILE BOTTOM NAVIGATION FLUID SHEET BAR */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-4 py-2 flex justify-around items-center z-50 shadow-lg">
        <button onClick={() => { setViewTab('DASHBOARD'); setSelectedProject(null); }} className={`p-3 rounded-lg ${viewTab === 'DASHBOARD' ? 'text-indigo-600' : 'text-slate-500'}`}><LayoutDashboard size={20} /></button>
        <button onClick={() => { setViewTab('PROJECTS'); setSelectedProject(null); }} className={`p-3 rounded-lg ${viewTab === 'PROJECTS' ? 'text-indigo-600' : 'text-slate-500'}`}><FolderKanban size={20} /></button>
        
        {/* 🎯 NEW MOBILE ROW DIRECTORY INTERCEPT ACCELERATOR LINK BUTTON */}
        <button onClick={() => { setViewTab('TEAMS'); setSelectedProject(null); }} className={`p-3 rounded-lg ${viewTab === 'TEAMS' ? 'text-indigo-600' : 'text-slate-500'}`}><Users size={20} /></button>
        
        <button onClick={() => { setViewTab('SETTINGS'); setSelectedProject(null); }} className={`p-3 rounded-lg ${viewTab === 'SETTINGS' ? 'text-indigo-600' : 'text-slate-500'}`}><Settings size={20} /></button>
        <button onClick={() => setIsModalOpen(true)} className="p-3 text-slate-500"><Plus size={20} /></button>
      </nav>

      {/* Project Creation Popup Modal */}
      <CreateProjectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onProjectCreated={(newProj) => {
          setProjects((prev) => [newProj, ...prev]);
          setSelectedProject(newProj);
          setViewTab('PROJECT');
        }}
      />

    </div>
  );
}

function SidebarLink({ icon, label, active, onClick }) {
  return (
    <button onClick={onClick} className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${active ? 'bg-indigo-50 text-indigo-600 font-semibold' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}>
      <div className="flex items-center space-x-3">
        {icon}
        <span>{label}</span>
      </div>
    </button>
  );
}