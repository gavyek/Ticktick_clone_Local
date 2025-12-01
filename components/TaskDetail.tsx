
import React, { useEffect, useState } from 'react';
import { X, Calendar, Flag, Trash2, CheckSquare, ListChecks, AlignLeft, Bell, BellOff, Plus } from 'lucide-react';
import { Task, Priority, Subtask } from '../types';

interface TaskDetailProps {
  task: Task | null;
  onClose: () => void;
  onUpdate: (task: Task) => void;
  onDelete: (id: string) => void;
}

export const TaskDetail: React.FC<TaskDetailProps> = ({ 
  task, 
  onClose, 
  onUpdate,
  onDelete
}) => {
  const [editedTask, setEditedTask] = useState<Task | null>(null);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');

  useEffect(() => {
    setEditedTask(task);
  }, [task]);

  if (!editedTask) return null;

  const handleUpdate = (updates: Partial<Task>) => {
    const updated = { ...editedTask, ...updates };
    setEditedTask(updated);
    onUpdate(updated);
  };

  const toggleDescriptionMode = () => {
      if (editedTask.isChecklistMode) {
          // Convert List -> Text
          // We join completed and uncompleted tasks
          const text = editedTask.subtasks.map(s => `${s.isCompleted ? '[x] ' : ''}${s.title}`).join('\n');
          handleUpdate({ isChecklistMode: false, description: text });
      } else {
          // Convert Text -> List
          const lines = editedTask.description.split('\n').filter(l => l.trim().length > 0);
          const subtasks: Subtask[] = lines.map(line => ({
              id: Math.random().toString(36).substr(2, 9),
              title: line.replace(/^\[x\]\s*/i, ''),
              isCompleted: line.trim().toLowerCase().startsWith('[x]'),
              hasReminder: false
          }));
          handleUpdate({ isChecklistMode: true, subtasks });
      }
  };

  const addSubtask = (e: React.FormEvent) => {
      e.preventDefault();
      if (!newSubtaskTitle.trim()) return;
      const newSub: Subtask = {
          id: Math.random().toString(36).substr(2, 9),
          title: newSubtaskTitle,
          isCompleted: false,
          hasReminder: false
      };
      handleUpdate({ subtasks: [...(editedTask.subtasks || []), newSub] });
      setNewSubtaskTitle('');
  };

  const toggleSubtask = (subtaskId: string) => {
      const updatedSubtasks = editedTask.subtasks.map(s => 
          s.id === subtaskId ? { ...s, isCompleted: !s.isCompleted } : s
      );
      
      // Auto-complete parent task if all subtasks are done
      const allCompleted = updatedSubtasks.length > 0 && updatedSubtasks.every(s => s.isCompleted);
      
      handleUpdate({ 
          subtasks: updatedSubtasks,
          isCompleted: allCompleted ? true : editedTask.isCompleted 
      });
  };

  const updateSubtaskTitle = (subtaskId: string, title: string) => {
      const updatedSubtasks = editedTask.subtasks.map(s => 
          s.id === subtaskId ? { ...s, title } : s
      );
      handleUpdate({ subtasks: updatedSubtasks });
  };

  const deleteSubtask = (subtaskId: string) => {
      handleUpdate({ subtasks: editedTask.subtasks.filter(s => s.id !== subtaskId) });
  };

  const toggleSubtaskReminder = (subtaskId: string) => {
      const updatedSubtasks = editedTask.subtasks.map(s => 
          s.id === subtaskId ? { ...s, hasReminder: !s.hasReminder } : s
      );
      handleUpdate({ subtasks: updatedSubtasks });
  };

  const priorityOptions = [
    { value: Priority.None, label: 'None', color: 'bg-slate-200' },
    { value: Priority.Low, label: 'Low', color: 'bg-blue-400' },
    { value: Priority.Medium, label: 'Medium', color: 'bg-orange-400' },
    { value: Priority.High, label: 'High', color: 'bg-red-500' },
  ];

  return (
    <div className="w-80 h-full bg-white border-l border-slate-200 flex flex-col shadow-xl z-20">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-100">
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <button 
            onClick={() => handleUpdate({ isCompleted: !editedTask.isCompleted })}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md border transition-colors ${editedTask.isCompleted ? 'bg-green-100 text-green-700 border-green-200' : 'hover:bg-slate-50 border-slate-200'}`}
          >
            <CheckSquare size={14} />
            {editedTask.isCompleted ? 'Completed' : 'Mark Complete'}
          </button>
        </div>
        
        <div className="flex items-center gap-1">
            <button 
                onClick={() => onDelete(editedTask.id)}
                className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                title="Delete Task"
            >
                <Trash2 size={16} />
            </button>
            <button 
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-md"
            >
                <X size={18} />
            </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6">
        {/* Title */}
        <textarea
          value={editedTask.title}
          onChange={(e) => handleUpdate({ title: e.target.value })}
          className="w-full text-lg font-semibold text-slate-800 placeholder-slate-400 resize-none outline-none bg-transparent"
          rows={2}
          placeholder="Task title"
        />

        {/* Description / Checklist Area */}
        <div className="relative group">
            <div className="flex items-center justify-between mb-2">
                 <label className="block text-xs font-semibold text-slate-400 uppercase">
                     {editedTask.isChecklistMode ? 'Checklist' : 'Description'}
                 </label>
                 <button 
                    onClick={toggleDescriptionMode}
                    className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-primary-600 transition-colors"
                    title={editedTask.isChecklistMode ? "Switch to Text" : "Switch to Checklist"}
                 >
                     {editedTask.isChecklistMode ? <AlignLeft size={16} /> : <ListChecks size={16} />}
                 </button>
            </div>

            {editedTask.isChecklistMode ? (
                <div className="space-y-2">
                    {/* Render Subtasks */}
                    {(editedTask.subtasks || []).map(sub => (
                        <div key={sub.id} className="flex items-center gap-2 group/subtask">
                            <button
                                onClick={() => toggleSubtask(sub.id)}
                                className={`flex-shrink-0 w-4 h-4 rounded border flex items-center justify-center transition-colors ${sub.isCompleted ? 'bg-slate-400 border-slate-400 text-white' : 'border-slate-300 hover:border-primary-500'}`}
                            >
                                {sub.isCompleted && <CheckSquare size={10} />}
                            </button>
                            <input
                                type="text"
                                value={sub.title}
                                onChange={(e) => updateSubtaskTitle(sub.id, e.target.value)}
                                className={`flex-1 text-sm bg-transparent outline-none border-b border-transparent focus:border-slate-200 ${sub.isCompleted ? 'text-slate-400 line-through' : 'text-slate-700'}`}
                            />
                            <div className="flex items-center opacity-0 group-hover/subtask:opacity-100 transition-opacity">
                                <button onClick={() => toggleSubtaskReminder(sub.id)} className={`p-1 ${sub.hasReminder ? 'text-orange-500 opacity-100' : 'text-slate-300 hover:text-orange-500'}`}>
                                    {sub.hasReminder ? <Bell size={12} fill="currentColor" /> : <Bell size={12} />}
                                </button>
                                <button onClick={() => deleteSubtask(sub.id)} className="p-1 text-slate-300 hover:text-red-500">
                                    <Trash2 size={12} />
                                </button>
                            </div>
                        </div>
                    ))}
                    
                    {/* Add Subtask Input */}
                    <form onSubmit={addSubtask} className="flex items-center gap-2 mt-2 pl-6 opacity-60 hover:opacity-100 transition-opacity">
                         <Plus size={14} className="text-slate-400" />
                         <input 
                            type="text"
                            value={newSubtaskTitle}
                            onChange={(e) => setNewSubtaskTitle(e.target.value)}
                            placeholder="Add an item..."
                            className="flex-1 text-sm bg-transparent outline-none placeholder-slate-400"
                         />
                    </form>
                </div>
            ) : (
                <textarea
                    value={editedTask.description || ''}
                    onChange={(e) => handleUpdate({ description: e.target.value })}
                    className="w-full text-sm text-slate-600 placeholder-slate-300 resize-none outline-none bg-slate-50 p-3 rounded-lg border border-transparent focus:border-primary-200 focus:bg-white transition-all"
                    rows={6}
                    placeholder="Add details, notes, or subtasks..."
                />
            )}
        </div>

        {/* Properties */}
        <div className="space-y-4">
          {/* Due Date */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
              <Calendar size={14} />
            </div>
            <div className="flex-1">
              <label className="block text-xs text-slate-400 mb-1">Due Date</label>
              <input 
                type="date" 
                value={editedTask.dueDate || ''}
                onChange={(e) => handleUpdate({ dueDate: e.target.value || null })}
                className="text-sm text-slate-700 bg-transparent outline-none w-full"
              />
            </div>
          </div>

          {/* Priority */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
              <Flag size={14} />
            </div>
            <div className="flex-1">
              <label className="block text-xs text-slate-400 mb-1">Priority</label>
              <div className="flex gap-1">
                {priorityOptions.map(option => (
                  <button
                    key={option.value}
                    onClick={() => handleUpdate({ priority: option.value })}
                    className={`w-5 h-5 rounded-full border-2 ${editedTask.priority === option.value ? 'border-slate-600 scale-110' : 'border-transparent opacity-50 hover:opacity-100'} ${option.color} transition-all`}
                    title={option.label}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="p-3 text-center text-xs text-slate-300 border-t border-slate-100">
        Created {new Date(editedTask.createdAt).toLocaleDateString()}
      </div>
    </div>
  );
};
