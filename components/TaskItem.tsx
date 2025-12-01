
import React from 'react';
import { Check, Calendar as CalendarIcon, Flag } from 'lucide-react';
import { Task, Priority } from '../types';

interface TaskItemProps {
  task: Task;
  isSelected: boolean;
  onSelect: (task: Task) => void;
  onToggleComplete: (task: Task) => void;
}

export const TaskItem: React.FC<TaskItemProps> = ({ 
  task, 
  isSelected, 
  onSelect,
  onToggleComplete 
}) => {
  
  const getPriorityColor = (p: Priority) => {
    switch(p) {
      case Priority.High: return 'text-red-500';
      case Priority.Medium: return 'text-orange-400';
      case Priority.Low: return 'text-blue-400';
      default: return 'text-slate-300';
    }
  };

  return (
    <div 
      onClick={() => onSelect(task)}
      className={`
        group flex items-start gap-3 p-3 border-b border-slate-100 cursor-pointer transition-all hover:bg-slate-50
        ${isSelected ? 'bg-blue-50/60 hover:bg-blue-50/80' : 'bg-white'}
      `}
    >
      {/* Checkbox */}
      <button
        onClick={(e) => { e.stopPropagation(); onToggleComplete(task); }}
        className={`
          mt-1 flex-shrink-0 w-5 h-5 rounded border transition-all flex items-center justify-center
          ${task.isCompleted 
            ? 'bg-slate-400 border-slate-400 text-white' 
            : `border-slate-300 hover:border-primary-500 ${getPriorityColor(task.priority).replace('text-', 'border-')}`
          }
          ${task.isCompleted ? '' : `priority-border-${task.priority}`}
        `}
        style={{ borderColor: !task.isCompleted && task.priority !== Priority.None ? 'currentColor' : undefined }}
      >
        {task.isCompleted && <Check size={12} strokeWidth={3} />}
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className={`text-sm leading-relaxed ${task.isCompleted ? 'text-slate-400 line-through' : 'text-slate-700'}`}>
          {task.title}
        </div>
        
        <div className="flex items-center gap-3 mt-1">
          {task.dueDate && (
            <div className={`flex items-center gap-1 text-xs ${task.isCompleted ? 'text-slate-300' : 'text-red-500'}`}>
              <CalendarIcon size={10} />
              <span>{task.dueDate}</span>
            </div>
          )}
          
          {task.priority !== Priority.None && !task.isCompleted && (
             <div className={`flex items-center gap-1 text-xs ${getPriorityColor(task.priority)}`}>
               <Flag size={10} fill="currentColor" />
             </div>
          )}

          {task.description && (
             <div className="text-xs text-slate-400 truncate max-w-[200px]">
               {task.description}
             </div>
          )}
        </div>
      </div>
    </div>
  );
};
