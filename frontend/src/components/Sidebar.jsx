{projects.map((p) => (
  <button
    key={p.id}
    onClick={() => handleSelectProject(p)}
    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all ${activeProjectId === p.id ? 'bg-indigo-50/60 text-indigo-600' : 'text-slate-600 hover:bg-slate-50'}`}
  >
    <div className="flex items-center space-x-2.5 truncate">
      {/* Dynamic color identity indicator chip pill dot */}
      <span 
        className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm border border-white"
        style={{ backgroundColor: p.color || '#4F46E5' }} 
      />
      <span className="truncate">{p.name}</span>
    </div>
  </button>
))}