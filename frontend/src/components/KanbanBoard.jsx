import React, { useState, useEffect } from 'react';
import { Plus, Clock, Trash2, MessageSquare, UserPlus } from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import api from '../utils/api';
import ProjectChat from './ProjectChat'; 
import InviteMemberModal from './InviteMemberModal';

const COLUMNS = [
  { id: 'TODO', title: 'To Do', bg: 'bg-slate-100 text-slate-700 border-slate-200', badge: 'bg-slate-200 text-slate-800' },
  { id: 'IN_PROGRESS', title: 'In Progress', bg: 'bg-amber-50 text-amber-700 border-amber-200', badge: 'bg-amber-100 text-amber-900' },
  { id: 'IN_REVIEW', title: 'In Review', bg: 'bg-indigo-50 text-indigo-700 border-indigo-200', badge: 'bg-indigo-100 text-indigo-900' },
  { id: 'DONE', title: 'Completed', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', badge: 'bg-emerald-100 text-emerald-900' }
];

const getPriorityStyles = (priority) => {
  switch (priority?.toUpperCase()) {
    case 'HIGH':
      return 'bg-rose-50 text-rose-600 border-rose-200';
    case 'LOW':
      return 'bg-sky-50 text-sky-600 border-sky-200';
    case 'MEDIUM':
    default:
      return 'bg-amber-50 text-amber-600 border-amber-200';
  }
};

export default function KanbanBoard({ project, onProjectDeleted }) {
  const [tasks, setTasks] = useState([]);
  const [newTaskTitle, setNewTaskTitle] = useState({});
  const [activeColumnInput, setActiveColumnInput] = useState(null);
  const [isDeletingProject, setIsDeletingProject] = useState(false);
  const [showChat, setShowChat] = useState(false); 
  const [showInviteModal, setShowInviteModal] = useState(false);

  useEffect(() => {
    fetchTasks();
  }, [project.id]);

  const fetchTasks = async () => {
    try {
      const response = await api.get(`/tasks/${project.id}`);
      setTasks(response.data);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  };

  const handleCreateTask = async (columnId, priority, assigneeId) => {
    if (!newTaskTitle[columnId]?.trim()) return;

    try {
      const response = await api.post(`/tasks/${project.id}`, {
        title: newTaskTitle[columnId],
        status: columnId,
        priority: priority || 'MEDIUM',
        assigneeId: assigneeId || null
      });
      setTasks((prev) => [response.data.task, ...prev]);
      setNewTaskTitle((prev) => ({ ...prev, [columnId]: '' }));
      setActiveColumnInput(null);
    } catch (error) {
      console.error('Failed to create task:', error);
    }
  };

  const handleDeleteTask = async (taskId, e) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to permanently delete this task card?')) return;

    try {
      await api.delete(`/tasks/${taskId}`);
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
    } catch (error) {
      console.error('Failed to delete task:', error);
    }
  };

  const handleDeleteProject = async () => {
    if (!window.confirm(`⚠️ CRITICAL WARNING:\n\nAre you sure you want to delete the project "${project.name}"?\nThis will permanently clear all tasks.`)) return;

    setIsDeletingProject(true);
    try {
      await api.delete(`/projects/${project.id}`);
      onProjectDeleted(project.id);
    } catch (error) {
      console.error('Failed to delete project:', error);
    } finally {
      setIsDeletingProject(false);
    }
  };

  const onDragEnd = async (result) => {
    const { source, destination, draggableId } = result;
    if (!destination || (source.droppableId === destination.droppableId && source.index === destination.index)) return;

    const updatedTasks = Array.from(tasks);
    const draggedTaskIndex = updatedTasks.findIndex(t => t.id === draggableId);
    if (draggedTaskIndex !== -1) {
      updatedTasks[draggedTaskIndex].status = destination.droppableId;
      setTasks(updatedTasks);
    }

    try {
      await api.put(`/tasks/${draggableId}/status`, { status: destination.droppableId });
    } catch (error) {
      fetchTasks();
    }
  };

  return (
    <div className="space-y-4">
      {/* Header Banner Block */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="w-4 h-4 rounded-full shrink-0" style={{ backgroundColor: project.color || '#4F46E5' }} />
          <div>
            <h3 className="font-bold text-lg text-slate-800">{project.name}</h3>
            {project.description && <p className="text-xs text-slate-500 mt-0.5">{project.description}</p>}
          </div>
        </div>
        
        {/* Action Buttons Hub Group */}
        <div className="flex items-center space-x-2 self-end sm:self-center">
          <button 
            onClick={() => setShowInviteModal(true)}
            className="inline-flex items-center justify-center space-x-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer"
          >
            <UserPlus size={13} />
            <span>Invite Member</span>
          </button>

          <button 
            onClick={() => setShowChat(!showChat)}
            className={`inline-flex items-center justify-center space-x-2 border rounded-lg px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${showChat ? 'bg-indigo-50 border-indigo-200 text-indigo-600 shadow-inner' : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-600'}`}
          >
            <MessageSquare size={13} />
            <span>{showChat ? 'Hide Chat' : 'Live Chat'}</span>
          </button>

          <button 
            onClick={handleDeleteProject}
            disabled={isDeletingProject}
            className="inline-flex items-center justify-center space-x-2 bg-white border border-red-200 hover:bg-red-50 text-red-600 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer disabled:opacity-50"
          >
            <Trash2 size={13} />
            <span>{isDeletingProject ? 'Deleting...' : 'Delete Project'}</span>
          </button>
        </div>
      </div>

      {/* RESPONSIVE SPLIT FLEX BOX */}
      <div className="flex flex-col lg:flex-row gap-4 items-start">
        
        <div className="flex-1 w-full">
          <DragDropContext onDragEnd={onDragEnd}>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 items-start overflow-x-auto pb-4">
              {COLUMNS.map((column) => {
                const columnTasks = tasks.filter((t) => t.status === column.id);

                return (
                  <div key={column.id} className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col max-h-[75vh] w-full min-w-[270px]">
                    
                    {/* Column Header Metadata */}
                    <div className="flex items-center justify-between mb-3 pb-1">
                      <div className="flex items-center space-x-2">
                        <span className={`text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${column.bg}`}>
                          {column.title}
                        </span>
                        <span className={`text-[11px] font-black px-2 py-0.5 rounded-full shadow-sm ${column.badge}`}>
                          {columnTasks.length}
                        </span>
                      </div>
                      <button onClick={() => setActiveColumnInput(column.id)} className="p-1 rounded-md text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition-all cursor-pointer">
                        <Plus size={16} />
                      </button>
                    </div>

                    {/* Quick Task Card Inline Form Input Row */}
                    {activeColumnInput === column.id && (
                      <div className="bg-white border border-slate-200 p-3 rounded-xl mb-3 shadow-sm space-y-3 animate-in fade-in zoom-in-95 duration-150">
                        <input 
                          type="text" 
                          value={newTaskTitle[column.id] || ''} 
                          onChange={(e) => setNewTaskTitle((prev) => ({ ...prev, [column.id]: e.target.value }))} 
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              const priorityEl = document.getElementById(`priority-${column.id}`);
                              const assigneeEl = document.getElementById(`assignee-${column.id}`);
                              handleCreateTask(column.id, priorityEl?.value, assigneeEl?.value);
                            }
                          }}
                          placeholder="Enter task title card..." 
                          className="w-full text-sm font-semibold text-slate-800 placeholder-slate-400 outline-none bg-transparent" 
                          autoFocus 
                        />
                        
                        <div className="flex gap-2 items-center pt-1">
                          <select 
                            id={`priority-${column.id}`}
                            className="text-[10px] font-bold bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-slate-600 outline-none cursor-pointer hover:bg-slate-100"
                          >
                            <option value="LOW">Low</option>
                            <option value="MEDIUM" defaultValue>Medium</option>
                            <option value="HIGH">High</option>
                          </select>

                          <select 
                            id={`assignee-${column.id}`}
                            className="text-[10px] font-bold bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-slate-600 outline-none cursor-pointer hover:bg-slate-100 max-w-[130px] truncate"
                          >
                            <option value="">Assignee...</option>
                            {project.members?.map((m) => (
                              <option key={m.user.id} value={m.user.id}>
                                {m.user.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
                          <button onClick={() => setActiveColumnInput(null)} className="text-xs font-medium text-slate-500 hover:text-slate-700 px-2 py-1 cursor-pointer">Cancel</button>
                          <button 
                            onClick={() => {
                              const priorityEl = document.getElementById(`priority-${column.id}`);
                              const assigneeEl = document.getElementById(`assignee-${column.id}`);
                              handleCreateTask(column.id, priorityEl?.value, assigneeEl?.value);
                            }} 
                            className="bg-indigo-600 text-white text-xs font-medium px-2.5 py-1 rounded-md shadow-sm hover:bg-indigo-700 cursor-pointer"
                          >
                            Add Card
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Droppable Progress Lanes Area */}
                    <Droppable droppableId={column.id}>
                      {(provided, snapshot) => (
                        <div ref={provided.innerRef} {...provided.droppableProps} className={`space-y-2.5 overflow-y-auto flex-1 pr-1 transition-all rounded-lg min-h-[150px] ${snapshot.isDraggingOver ? 'bg-indigo-50/40 border border-dashed border-indigo-200' : ''}`}>
                          {columnTasks.length === 0 && !activeColumnInput ? (
                            <div className="text-center py-12 text-xs text-slate-400 font-medium border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                              Drop tasks here
                            </div>
                          ) : (
                            columnTasks.map((task, index) => (
                              
                              <Draggable key={task.id} draggableId={task.id} index={index}>
                                {(provided, snapshot) => (
                                  <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps} style={{ ...provided.draggableProps.style }} className={`bg-white border rounded-xl p-4 shadow-sm space-y-3 transition-shadow relative group ${snapshot.isDragging ? 'shadow-xl border-indigo-500 ring-2 ring-indigo-500/10' : 'border-slate-200 hover:border-slate-300'}`}>
                                    
                                    <button 
                                      onClick={(e) => handleDeleteTask(task.id, e)}
                                      className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 p-1 rounded-md text-slate-400 hover:bg-red-50 hover:text-red-500 transition-all cursor-pointer"
                                      title="Delete Task"
                                    >
                                      <Trash2 size={13} />
                                    </button>

                                    <h4 className="text-sm font-semibold text-slate-800 tracking-tight leading-snug break-words pr-5">
                                      {task.title}
                                    </h4>
                                    
                                    <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 pt-2 border-t border-slate-50">
                                      <div className="flex items-center space-x-1.5">
                                        <span className={`px-1.5 py-0.5 rounded border uppercase tracking-wider ${getPriorityStyles(task.priority)}`}>
                                          {task.priority || 'MEDIUM'}
                                        </span>
                                        {/* 👥 Added Assignee Name Label indicator badge on card if present */}
                                        {task.assignee && (
                                          <span className="bg-slate-100 text-slate-600 border border-slate-200 px-1.5 py-0.5 rounded truncate max-w-[80px]">
                                            👤 {task.assignee.name}
                                          </span>
                                        )}
                                      </div>
                                      <div className="flex items-center space-x-1 text-slate-400">
                                        <Clock size={11} />
                                        <span>{new Date(task.createdAt).toLocaleDateString(undefined, {month: 'short', day: 'numeric'})}</span>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </Draggable>

                            ))
                          )}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>

                  </div>
                );
              })}
            </div>
          </DragDropContext>
        </div>

        {/* 🎯 THE FINISHING FIX: Keep the component continuously alive to maintain message history arrays */}
        {/* Toggle layout presentation entirely using responsive utility visibility style definitions */}
        <div className={`w-full lg:w-auto shrink-0 transition-all duration-200 ${showChat ? 'block animate-in slide-in-from-right-4' : 'hidden'}`}>
          <ProjectChat projectId={project.id} onClose={() => setShowChat(false)} />
        </div>

      </div>

      {/* Invite Member Modal Sheet layer mount reference */}
      <InviteMemberModal 
        isOpen={showInviteModal} 
        onClose={() => setShowInviteModal(false)} 
        projectId={project.id} 
      />
    </div>
  );
}