
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, X, Calendar as CalendarIcon, Flag, Trash2, CheckSquare, Plus, Inbox, Folder, FolderOpen, List as ListIcon, ChevronDown, ChevronRight as ChevronRightIcon, ArrowRight, ListChecks, AlignLeft, Bell } from 'lucide-react';
import { Task, Priority, TaskList, ListGroup, Subtask } from '../types';

interface CalendarViewProps {
  tasks: Task[];
  lists: TaskList[];
  groups: ListGroup[];
  onAddTask: (task: Partial<Task>) => void;
  onUpdateTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
}

interface PopoverState {
  isOpen: boolean;
  mode: 'create' | 'edit';
  position: { x: number, y: number };
  data: any;
}

// Convert Hex to RGBA for transparent backgrounds
const hexToRgba = (hex: string, alpha: number) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const toDateStr = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

export const CalendarView: React.FC<CalendarViewProps> = ({ tasks, lists, groups, onAddTask, onUpdateTask, onDeleteTask }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [popover, setPopover] = useState<PopoverState | null>(null);
  
  // Drag & Drop State
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [draggedTaskSegmentDate, setDraggedTaskSegmentDate] = useState<string | null>(null); // Date where drag started
  
  // Range Selection State
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionRange, setSelectionRange] = useState<{start: string, end: string} | null>(null);
  const selectionStartRef = useRef<string | null>(null);
  
  // Scroll throttling
  const wheelTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Close popover on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
        const target = e.target as HTMLElement;
        if (!target.closest('.calendar-popover') && !target.closest('.calendar-cell') && !target.closest('.calendar-task')) {
            setPopover(null);
            setSelectionRange(null); // Clear selection on outside click if popover is closed
        }
    };
    if (popover) {
        document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [popover]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 is Sunday

  const handlePrevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const handleNextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const handleToday = () => setCurrentDate(new Date());

  const handleWheel = (e: React.WheelEvent) => {
    // Prevent rapid scrolling
    if (wheelTimeout.current) return;
    
    if (e.deltaY !== 0) {
        wheelTimeout.current = setTimeout(() => {
            wheelTimeout.current = null;
        }, 300); // 300ms throttle

        if (e.deltaY > 0) {
            handleNextMonth();
        } else {
            handlePrevMonth();
        }
    }
  };

  // Map tasks to dates (handling multi-day)
  const getTasksForDay = (dateStr: string) => {
      return tasks.filter(task => {
          if (!task.dueDate) return false;
          const start = task.startDate || task.dueDate;
          const end = task.dueDate;
          return dateStr >= start && dateStr <= end;
      });
  };

  const getListColor = (listId: string) => {
      const list = lists.find(l => l.id === listId);
      return list ? list.color : '#94a3b8'; // default slate-400
  };

  // --- Drag & Drop Handlers (Task Moving) ---

  const handleDragStart = (e: React.DragEvent, task: Task, segmentDate: string) => {
      setDraggedTask(task);
      setDraggedTaskSegmentDate(segmentDate);
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setDragImage(e.currentTarget as Element, 0, 0);
  };

  const handleDragOver = (e: React.DragEvent) => {
      e.preventDefault(); // Allow drop
      e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetDate: string) => {
      e.preventDefault();
      
      if (draggedTask && draggedTaskSegmentDate) {
          const oldDate = new Date(draggedTaskSegmentDate);
          const newDate = new Date(targetDate);
          const diffTime = newDate.getTime() - oldDate.getTime();
          const diffDaysVal = Math.round(diffTime / (1000 * 3600 * 24));
          
          const currentStart = new Date(draggedTask.startDate || draggedTask.dueDate || new Date());
          const currentEnd = new Date(draggedTask.dueDate || new Date());

          currentStart.setDate(currentStart.getDate() + diffDaysVal);
          currentEnd.setDate(currentEnd.getDate() + diffDaysVal);

          onUpdateTask({
              ...draggedTask,
              startDate: toDateStr(currentStart),
              dueDate: toDateStr(currentEnd)
          });
      }

      setDraggedTask(null);
      setDraggedTaskSegmentDate(null);
  };


  // --- Selection Handlers (Range Creation) ---

  const handleMouseDown = (e: React.MouseEvent, dateStr: string) => {
      if ((e.target as HTMLElement).closest('.calendar-task')) return;

      setIsSelecting(true);
      selectionStartRef.current = dateStr;
      setSelectionRange({ start: dateStr, end: dateStr });
  };

  const handleMouseEnter = (dateStr: string) => {
      if (isSelecting && selectionStartRef.current) {
          const start = selectionStartRef.current;
          if (dateStr < start) {
              setSelectionRange({ start: dateStr, end: start });
          } else {
              setSelectionRange({ start: start, end: dateStr });
          }
      }
  };

  const handleMouseUp = (e: React.MouseEvent) => {
      if (isSelecting && selectionRange) {
          setIsSelecting(false);
          selectionStartRef.current = null;
          
          setPopover({
              isOpen: true,
              mode: 'create',
              position: { x: e.clientX, y: e.clientY },
              data: { startDate: selectionRange.start, dueDate: selectionRange.end }
          });
      }
  };

  useEffect(() => {
      const handleGlobalMouseUp = () => {
          if (isSelecting) {
              setIsSelecting(false);
              selectionStartRef.current = null;
              setSelectionRange(null);
          }
      };
      window.addEventListener('mouseup', handleGlobalMouseUp);
      return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
  }, [isSelecting]);

  const handleTaskClick = (e: React.MouseEvent, task: Task) => {
      e.stopPropagation();
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      setPopover({
          isOpen: true,
          mode: 'edit',
          position: { x: rect.right + 10, y: rect.top },
          data: task
      });
  };

  const renderCells = () => {
    const cells = [];
    for (let i = 0; i < firstDayOfMonth; i++) {
        cells.push(<div key={`pad-${i}`} className="bg-slate-50/50 border-b border-r border-slate-100 min-h-[100px]" />);
    }

    for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const dayTasks = getTasksForDay(dateStr);
        const isToday = new Date().toDateString() === new Date(year, month, day).toDateString();
        
        const isSelected = selectionRange && dateStr >= selectionRange.start && dateStr <= selectionRange.end;

        cells.push(
            <div 
                key={day} 
                onMouseDown={(e) => handleMouseDown(e, dateStr)}
                onMouseEnter={() => handleMouseEnter(dateStr)}
                onMouseUp={handleMouseUp}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, dateStr)}
                className={`
                    calendar-cell min-h-[100px] border-b border-r border-slate-100 p-1 hover:bg-slate-50 transition-colors group relative cursor-pointer select-none
                    ${isToday ? 'bg-blue-50/30' : ''}
                    ${isSelected ? 'bg-blue-100/50' : ''}
                `}
            >
                <div className="flex justify-between items-start mb-1 px-1 pointer-events-none">
                    <div className={`text-sm font-medium w-6 h-6 rounded-full flex items-center justify-center ${isToday ? 'bg-primary-600 text-white' : 'text-slate-700'}`}>
                        {day}
                    </div>
                </div>
                
                <div className="space-y-1">
                    {dayTasks.map(task => {
                        const listColor = getListColor(task.listId);
                        const isInbox = task.listId === 'inbox';
                        const color = isInbox ? '#3b82f6' : (listColor || '#94a3b8');
                        
                        const isStart = task.startDate === dateStr || (!task.startDate && task.dueDate === dateStr);
                        const isEnd = task.dueDate === dateStr;
                        const isMultiDay = task.startDate !== task.dueDate;

                        return (
                            <div 
                                key={task.id}
                                draggable
                                onDragStart={(e) => handleDragStart(e, task, dateStr)}
                                onClick={(e) => handleTaskClick(e, task)}
                                className={`
                                    calendar-task text-xs px-2 py-1.5 cursor-pointer truncate shadow-sm transition-all hover:scale-[1.02] hover:shadow-md
                                    ${task.isCompleted ? 'opacity-50 line-through' : ''}
                                    ${isStart ? 'rounded-l-sm' : ''}
                                    ${isEnd ? 'rounded-r-sm' : ''}
                                    ${!isStart ? 'border-l-0 ml-[-5px] pl-3' : 'border-l-4'} 
                                    ${!isEnd ? 'mr-[-5px] pr-3' : ''} 
                                `}
                                style={{
                                    backgroundColor: hexToRgba(color, isMultiDay ? 0.2 : 0.1),
                                    borderLeftColor: color,
                                    color: '#334155', // Slate-700
                                    position: 'relative',
                                    zIndex: 10
                                }}
                                title={`${task.title} (${task.startDate} - ${task.dueDate})`}
                            >
                                {isStart && task.title}
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    }
    
    // Fill remaining
    const totalSlots = cells.length;
    const remaining = 7 - (totalSlots % 7);
    if (remaining < 7) {
        for(let i = 0; i < remaining; i++) {
            cells.push(<div key={`end-${i}`} className="bg-slate-50/50 border-b border-r border-slate-100 min-h-[100px]" />);
        }
    }

    return cells;
  };

  return (
    <div className="flex flex-col h-full bg-white relative" onWheel={handleWheel}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
             <div className="flex items-center gap-4">
                 <h2 className="text-2xl font-bold text-slate-800">
                     {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                 </h2>
                 <div className="flex items-center bg-slate-100 rounded-lg p-0.5 border border-slate-200">
                     <button onClick={handlePrevMonth} className="p-1 hover:bg-white hover:shadow-sm rounded-md transition-all text-slate-600"><ChevronLeft size={18} /></button>
                     <button onClick={handleToday} className="px-3 py-1 text-xs font-bold text-slate-600 hover:bg-white hover:shadow-sm rounded-md transition-all">Today</button>
                     <button onClick={handleNextMonth} className="p-1 hover:bg-white hover:shadow-sm rounded-md transition-all text-slate-600"><ChevronRight size={18} /></button>
                 </div>
             </div>
             
             {/* Add Task Button */}
             <button 
                onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const todayStr = new Date().toISOString().split('T')[0];
                    setPopover({
                        isOpen: true,
                        mode: 'create',
                        position: { x: rect.left, y: rect.bottom + 10 },
                        data: { startDate: todayStr, dueDate: todayStr }
                    });
                }}
                className="w-8 h-8 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center hover:bg-primary-200 transition-colors"
             >
                 <Plus size={18} />
             </button>
        </div>
        
        {/* Days Header */}
        <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50/50">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                <div key={d} className="py-2 text-center text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    {d}
                </div>
            ))}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-7 flex-1 auto-rows-fr overflow-y-auto content-start">
            {renderCells()}
        </div>

        {/* Popover */}
        {popover && (
            <CalendarPopover 
                key={`${popover.mode}-${popover.data.id || popover.data.date}`}
                state={popover} 
                lists={lists}
                groups={groups}
                onClose={() => { setPopover(null); setSelectionRange(null); }} 
                onSave={(task) => {
                    if (popover.mode === 'create') onAddTask(task);
                    else onUpdateTask(task as Task);
                    setPopover(null);
                    setSelectionRange(null);
                }}
                onDelete={(id) => {
                    onDeleteTask(id);
                    setPopover(null);
                    setSelectionRange(null);
                }}
            />
        )}
    </div>
  );
};

// --- Helper Components for Popover ---

interface CalendarPopoverProps {
    state: PopoverState;
    lists: TaskList[];
    groups: ListGroup[];
    onClose: () => void;
    onSave: (task: Partial<Task>) => void;
    onDelete: (id: string) => void;
}

const CalendarPopover: React.FC<CalendarPopoverProps> = ({ state, lists, groups, onClose, onSave, onDelete }) => {
    const { mode, position, data } = state;
    const [title, setTitle] = useState(mode === 'edit' ? data.title : '');
    const [description, setDescription] = useState(mode === 'edit' ? data.description : '');
    
    // Subtask State
    const [isChecklistMode, setIsChecklistMode] = useState<boolean>(mode === 'edit' ? (data.isChecklistMode || false) : false);
    const [subtasks, setSubtasks] = useState<Subtask[]>(mode === 'edit' ? (data.subtasks || []) : []);
    const [newSubtaskTitle, setNewSubtaskTitle] = useState('');

    // Dates
    const [startDate, setStartDate] = useState(mode === 'edit' ? (data.startDate || data.dueDate) : data.startDate);
    const [dueDate, setDueDate] = useState(mode === 'edit' ? data.dueDate : data.dueDate);

    const [priority, setPriority] = useState<Priority>(mode === 'edit' ? data.priority : Priority.None);
    const [listId, setListId] = useState(mode === 'edit' ? data.listId : 'inbox');
    
    // List Selector State
    const [isListSelectorOpen, setIsListSelectorOpen] = useState(false);
    const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

    // Adjust position for wider width (450px)
    const adjustedX = position.x + 460 > window.innerWidth ? window.innerWidth - 470 : position.x;
    const adjustedY = position.y + 450 > window.innerHeight ? window.innerHeight - 470 : position.y;

    const toggleMode = () => {
        if (isChecklistMode) {
             // To Text
             const text = subtasks.map(s => `${s.isCompleted ? '[x] ' : ''}${s.title}`).join('\n');
             setDescription(text);
             setIsChecklistMode(false);
        } else {
            // To List
            const lines = (description || '').split('\n').filter((l: string) => l.trim().length > 0);
            const subs: Subtask[] = lines.map((line: string) => ({
                id: Math.random().toString(36).substr(2, 9),
                title: line.replace(/^\[x\]\s*/i, ''),
                isCompleted: line.trim().toLowerCase().startsWith('[x]'),
                hasReminder: false
            }));
            setSubtasks(subs);
            setIsChecklistMode(true);
        }
    };

    const addSubtask = (e: React.FormEvent) => {
        e.preventDefault();
        if(!newSubtaskTitle.trim()) return;
        setSubtasks([...subtasks, {
            id: Math.random().toString(36).substr(2, 9),
            title: newSubtaskTitle,
            isCompleted: false,
            hasReminder: false
        }]);
        setNewSubtaskTitle('');
    };

    const toggleSubtask = (id: string) => {
        setSubtasks(subtasks.map(s => s.id === id ? { ...s, isCompleted: !s.isCompleted } : s));
    };

    const deleteSubtask = (id: string) => {
        setSubtasks(subtasks.filter(s => s.id !== id));
    };

    const toggleReminder = (id: string) => {
        setSubtasks(subtasks.map(s => s.id === id ? { ...s, hasReminder: !s.hasReminder } : s));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) return;
        
        let finalStart = startDate;
        let finalEnd = dueDate;
        if (finalStart > finalEnd) {
            finalStart = dueDate;
            finalEnd = startDate;
        }

        let autoCompleted = false;
        if (isChecklistMode && subtasks.length > 0 && subtasks.every(s => s.isCompleted)) {
            autoCompleted = true;
        }

        const taskData = {
            ...(mode === 'edit' ? data : {}),
            title,
            description: isChecklistMode ? '' : description,
            subtasks: isChecklistMode ? subtasks : [],
            isChecklistMode,
            startDate: finalStart,
            dueDate: finalEnd,
            priority,
            listId,
            isCompleted: autoCompleted ? true : (mode === 'edit' ? data.isCompleted : false)
        };
        onSave(taskData);
    };

    const toggleGroup = (groupId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setExpandedGroups(prev => ({ ...prev, [groupId]: !prev[groupId] }));
    };

    const selectList = (id: string) => {
        setListId(id);
        setIsListSelectorOpen(false);
    };

    const getListName = (id: string) => {
        if (id === 'inbox') return 'Inbox';
        return lists.find(l => l.id === id)?.name || 'Unknown List';
    };

    const currentList = lists.find(l => l.id === listId);
    const currentListColor = listId === 'inbox' ? '#3b82f6' : currentList?.color || '#94a3b8';

    return (
        <div 
            className="calendar-popover fixed z-50 w-[450px] bg-white rounded-xl shadow-2xl border border-slate-100 flex flex-col animate-in fade-in zoom-in-95 duration-100"
            style={{ 
                top: Math.max(10, adjustedY), 
                left: Math.max(10, adjustedX)
            }}
        >
            <form onSubmit={handleSubmit} className="flex flex-col h-full">
                {/* Header */}
                <div className="flex items-center justify-between p-3 border-b border-slate-50">
                    <div className="flex items-center gap-2">
                        {mode === 'edit' && (
                             <button 
                                type="button"
                                onClick={() => onSave({ ...data, isCompleted: !data.isCompleted })}
                                className={`flex items-center justify-center w-6 h-6 rounded border transition-colors ${data.isCompleted ? 'bg-green-500 border-green-500 text-white' : 'border-slate-300 hover:border-primary-500'}`}
                             >
                                 <CheckSquare size={14} />
                             </button>
                        )}
                        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                            {mode === 'create' ? 'New Task' : 'Edit Task'}
                        </span>
                    </div>
                    <div className="flex items-center gap-1">
                        {mode === 'edit' && (
                            <button 
                                type="button"
                                onClick={() => onDelete(data.id)}
                                className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                            >
                                <Trash2 size={16} />
                            </button>
                        )}
                        <button 
                            type="button"
                            onClick={onClose}
                            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-md"
                        >
                            <X size={18} />
                        </button>
                    </div>
                </div>

                {/* Body */}
                <div className="p-5 space-y-4 flex-1 overflow-y-auto max-h-[60vh]">
                    <input 
                        autoFocus
                        type="text" 
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="What needs to be done?"
                        className="w-full text-xl font-semibold text-slate-800 placeholder-slate-400 outline-none bg-transparent"
                    />
                    
                    {/* Description/Checklist Toggle Area */}
                    <div className="group relative min-h-[100px]">
                        <div className="absolute right-0 top-0 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                            <button 
                                type="button" 
                                onClick={toggleMode}
                                className="p-1 bg-white hover:bg-slate-100 rounded border border-slate-200 shadow-sm text-slate-400"
                                title={isChecklistMode ? "Switch to Description" : "Switch to Checklist"}
                            >
                                {isChecklistMode ? <AlignLeft size={14} /> : <ListChecks size={14} />}
                            </button>
                        </div>
                        
                        {isChecklistMode ? (
                            <div className="space-y-1 mt-2">
                                {subtasks.map(sub => (
                                    <div key={sub.id} className="flex items-center gap-2 group/sub">
                                        <button 
                                            type="button"
                                            onClick={() => toggleSubtask(sub.id)}
                                            className={`w-3.5 h-3.5 rounded border flex items-center justify-center ${sub.isCompleted ? 'bg-slate-400 border-slate-400 text-white' : 'border-slate-300'}`}
                                        >
                                            {sub.isCompleted && <CheckSquare size={10} />}
                                        </button>
                                        <span className={`flex-1 text-sm ${sub.isCompleted ? 'text-slate-400 line-through' : 'text-slate-600'}`}>{sub.title}</span>
                                        <div className="flex gap-1 opacity-0 group-hover/sub:opacity-100 transition-opacity">
                                             <button type="button" onClick={() => toggleReminder(sub.id)} className={sub.hasReminder ? 'text-orange-500' : 'text-slate-300 hover:text-orange-500'}>
                                                 <Bell size={12} fill={sub.hasReminder ? "currentColor" : "none"} />
                                             </button>
                                             <button type="button" onClick={() => deleteSubtask(sub.id)} className="text-slate-300 hover:text-red-500">
                                                 <Trash2 size={12} />
                                             </button>
                                        </div>
                                    </div>
                                ))}
                                <div className="flex items-center gap-2 mt-2">
                                    <Plus size={14} className="text-slate-400" />
                                    <input 
                                        type="text" 
                                        value={newSubtaskTitle}
                                        onChange={(e) => setNewSubtaskTitle(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                addSubtask(e);
                                            }
                                        }}
                                        placeholder="Add subtask..."
                                        className="flex-1 text-sm bg-transparent outline-none placeholder-slate-400"
                                    />
                                </div>
                            </div>
                        ) : (
                            <textarea 
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Description..."
                                rows={4}
                                className="w-full text-sm text-slate-600 placeholder-slate-300 resize-none outline-none bg-slate-50/50 p-2 rounded-lg focus:bg-white focus:shadow-sm transition-all"
                            />
                        )}
                    </div>

                    {/* Properties Grid */}
                    <div className="grid grid-cols-5 gap-3">
                        {/* Date Range */}
                        <div className="col-span-3 bg-slate-50 p-2.5 rounded-lg border border-slate-100 flex flex-col justify-center">
                            <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 flex items-center gap-1">
                                <CalendarIcon size={10} /> Date Range
                            </label>
                            <div className="flex items-center gap-2">
                                <input 
                                    type="date" 
                                    value={startDate || ''}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="flex-1 text-xs bg-transparent border-none rounded text-slate-700 font-medium outline-none p-0 cursor-pointer"
                                />
                                <ArrowRight size={10} className="text-slate-300 flex-shrink-0" />
                                <input 
                                    type="date" 
                                    value={dueDate || ''}
                                    onChange={(e) => setDueDate(e.target.value)}
                                    className="flex-1 text-xs bg-transparent border-none rounded text-slate-700 font-medium outline-none p-0 cursor-pointer"
                                />
                            </div>
                        </div>

                        {/* Priority */}
                        <div className="col-span-2 bg-slate-50 p-2.5 rounded-lg border border-slate-100 flex flex-col justify-center relative">
                            <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 flex items-center gap-1">
                                <Flag size={10} /> Priority
                            </label>
                            <div className="relative">
                                <select 
                                    value={priority} 
                                    onChange={(e) => setPriority(Number(e.target.value))}
                                    className="w-full text-xs bg-transparent text-slate-700 font-medium outline-none appearance-none relative z-10 cursor-pointer p-0"
                                >
                                    <option value={Priority.None}>None</option>
                                    <option value={Priority.Low}>Low</option>
                                    <option value={Priority.Medium}>Medium</option>
                                    <option value={Priority.High}>High</option>
                                </select>
                                <ChevronDown size={12} className="absolute right-0 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer: List Selector & Save */}
                <div className="px-5 py-3 bg-slate-50 rounded-b-xl flex items-center justify-between border-t border-slate-100 relative">
                    {/* List Selector Trigger */}
                    <div className="relative">
                        <button 
                            type="button"
                            onClick={() => setIsListSelectorOpen(!isListSelectorOpen)}
                            className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-slate-200 transition-colors text-sm text-slate-600"
                        >
                            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: currentListColor }}></div>
                            <span className="max-w-[150px] truncate font-medium">{getListName(listId)}</span>
                        </button>

                        {/* Dropdown Menu */}
                        {isListSelectorOpen && (
                            <div className="absolute bottom-full left-0 mb-2 w-56 bg-white rounded-lg shadow-xl border border-slate-100 max-h-60 overflow-y-auto z-50">
                                {/* Search (Placeholder) */}
                                <div className="p-2 border-b border-slate-50">
                                    <input type="text" placeholder="Search list..." className="w-full text-xs px-2 py-1 bg-slate-50 rounded outline-none" />
                                </div>

                                <div className="p-1 space-y-0.5">
                                    {/* Inbox */}
                                    <div 
                                        onClick={() => selectList('inbox')}
                                        className="flex items-center gap-2 px-2 py-1.5 hover:bg-slate-100 rounded cursor-pointer text-sm text-slate-700"
                                    >
                                        <Inbox size={14} className="text-blue-500" />
                                        <span>Inbox</span>
                                    </div>

                                    {/* Groups */}
                                    {groups.map(group => {
                                        const groupLists = lists.filter(l => l.groupId === group.id);
                                        const isExpanded = expandedGroups[group.id];

                                        return (
                                            <div key={group.id}>
                                                <div 
                                                    onClick={(e) => toggleGroup(group.id, e)}
                                                    className="flex items-center justify-between px-2 py-1.5 hover:bg-slate-100 rounded cursor-pointer text-sm text-slate-500 font-medium"
                                                >
                                                    <div className="flex items-center gap-2">
                                                        {isExpanded ? <FolderOpen size={14} /> : <Folder size={14} />}
                                                        <span>{group.name}</span>
                                                    </div>
                                                    {isExpanded ? <ChevronDown size={12} /> : <ChevronRightIcon size={12} />}
                                                </div>
                                                
                                                {isExpanded && (
                                                    <div className="ml-2 pl-2 border-l border-slate-200">
                                                        {groupLists.map(list => (
                                                            <div 
                                                                key={list.id}
                                                                onClick={() => selectList(list.id)}
                                                                className="flex items-center gap-2 px-2 py-1.5 hover:bg-slate-100 rounded cursor-pointer text-sm text-slate-600"
                                                            >
                                                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: list.color }}></div>
                                                                <span>{list.name}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}

                                    {/* Orphan Lists */}
                                    {lists.filter(l => !l.groupId).map(list => (
                                        <div 
                                            key={list.id}
                                            onClick={() => selectList(list.id)}
                                            className="flex items-center gap-2 px-2 py-1.5 hover:bg-slate-100 rounded cursor-pointer text-sm text-slate-700"
                                        >
                                            <ListIcon size={14} style={{ color: list.color }} />
                                            <span>{list.name}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex gap-2">
                         <button 
                            type="submit"
                            className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg shadow-sm transition-colors text-sm font-medium"
                        >
                            {mode === 'create' ? (
                                <>
                                    <Plus size={16} />
                                    <span>Create Task</span>
                                </>
                            ) : (
                                <>
                                    <CheckSquare size={16} />
                                    <span>Save Changes</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
};
