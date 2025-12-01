
import React, { useState, useEffect, useMemo } from 'react';
import { Sidebar } from './components/Sidebar';
import { TaskItem } from './components/TaskItem';
import { TaskDetail } from './components/TaskDetail';
import { PomodoroTimer } from './components/PomodoroTimer';
import { CalendarView } from './components/CalendarView';
import { StorageService } from './services/storageService';
import { ImportService } from './services/importService';
import { Task, TaskList, ListGroup, ViewType, Priority } from './types';
import { Plus, Menu } from 'lucide-react';

function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [lists, setLists] = useState<TaskList[]>([]);
  const [groups, setGroups] = useState<ListGroup[]>([]);
  const [currentView, setCurrentView] = useState<ViewType | string>('inbox');
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [isPomoOpen, setIsPomoOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [quickAddTask, setQuickAddTask] = useState('');

  // Load data on mount
  useEffect(() => {
    setTasks(StorageService.getTasks());
    setLists(StorageService.getLists());
    setGroups(StorageService.getGroups());
    
    // Responsive sidebar
    if (window.innerWidth >= 768) {
      setIsSidebarOpen(true);
    }
  }, []);

  // Persist data when changed
  useEffect(() => {
    if (tasks.length > 0) StorageService.saveTasks(tasks);
  }, [tasks]);

  useEffect(() => {
    if (lists.length > 0) StorageService.saveLists(lists);
  }, [lists]);

  useEffect(() => {
    if (groups.length > 0) StorageService.saveGroups(groups);
  }, [groups]);

  const filteredTasks = useMemo(() => {
    // If we are in calendar view, this logic is skipped for the main list render
    if (currentView === 'calendar') return [];

    let filtered = [...tasks];
    
    // Sort: Not completed first, then by priority (desc), then by date
    filtered.sort((a, b) => {
      if (a.isCompleted !== b.isCompleted) return a.isCompleted ? 1 : -1;
      if (a.priority !== b.priority) return b.priority - a.priority;
      return b.createdAt - a.createdAt;
    });

    const todayStr = new Date().toISOString().split('T')[0];

    switch (currentView) {
      case 'inbox':
        return filtered.filter(t => t.listId === 'inbox' && !t.isCompleted);
      case 'today':
        // Show if today falls within the start/end range
        return filtered.filter(t => {
            if (t.isCompleted) return false;
            if (!t.dueDate) return false;
            const start = t.startDate || t.dueDate;
            return start <= todayStr && t.dueDate >= todayStr;
        });
      case 'week':
        const nextWeek = new Date();
        nextWeek.setDate(nextWeek.getDate() + 7);
        const nextWeekStr = nextWeek.toISOString().split('T')[0];
        
        return filtered.filter(t => {
          if (!t.dueDate) return false;
          if (t.isCompleted) return false;
          
          const start = t.startDate || t.dueDate;
          // Check for overlap
          return start <= nextWeekStr && t.dueDate >= todayStr;
        });
      default:
        // Custom list ID
        return filtered.filter(t => t.listId === currentView);
    }
  }, [tasks, currentView]);

  const completedTasksInView = useMemo(() => {
     if (currentView === 'calendar') return [];
     if (['today', 'week'].includes(currentView)) return [];
     return tasks.filter(t => t.listId === currentView && t.isCompleted);
  }, [tasks, currentView]);

  // Handle adding task via text input
  const handleQuickAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickAddTask.trim()) return;

    const today = new Date().toISOString().split('T')[0];
    const newTask: Task = {
      id: StorageService.generateId(),
      title: quickAddTask,
      description: '',
      subtasks: [],
      isChecklistMode: false,
      isCompleted: false,
      priority: Priority.None,
      startDate: currentView === 'today' ? today : null,
      dueDate: currentView === 'today' ? today : null,
      listId: ['inbox', 'today', 'week', 'calendar'].includes(currentView) ? 'inbox' : currentView,
      createdAt: Date.now(),
    };

    setTasks([newTask, ...tasks]);
    setQuickAddTask('');
  };

  // Handle adding task via object (Calendar view)
  const handleCreateTask = (taskData: Partial<Task>) => {
    const newTask: Task = {
      id: StorageService.generateId(),
      title: taskData.title || 'New Task',
      description: taskData.description || '',
      subtasks: taskData.subtasks || [],
      isChecklistMode: taskData.isChecklistMode || false,
      isCompleted: taskData.isCompleted || false,
      priority: taskData.priority || Priority.None,
      startDate: taskData.startDate || taskData.dueDate || null,
      dueDate: taskData.dueDate || null,
      listId: taskData.listId || 'inbox',
      createdAt: Date.now(),
    };
    setTasks([newTask, ...tasks]);
  };

  const handleUpdateTask = (updatedTask: Task) => {
    setTasks(tasks.map(t => t.id === updatedTask.id ? updatedTask : t));
  };

  const handleDeleteTask = (id: string) => {
      setTasks(tasks.filter(t => t.id !== id));
      if (selectedTaskId === id) setSelectedTaskId(null);
  };

  const handleToggleComplete = (task: Task) => {
    handleUpdateTask({ ...task, isCompleted: !task.isCompleted });
  };

  const handleAddList = (name: string, groupId?: string, color?: string) => {
    const newList: TaskList = {
      id: StorageService.generateId(),
      name,
      type: 'custom',
      color: color || '#3b82f6', // Default blue
      groupId: groupId
    };
    setLists([...lists, newList]);
    setCurrentView(newList.id);
  };

  const handleUpdateList = (id: string, updates: Partial<TaskList>) => {
    setLists(lists.map(l => l.id === id ? { ...l, ...updates } : l));
  };

  const handleDeleteList = (id: string) => {
    if (confirm('Are you sure you want to delete this list? Tasks will be moved to Inbox.')) {
        setLists(lists.filter(l => l.id !== id));
        setTasks(tasks.map(t => t.listId === id ? { ...t, listId: 'inbox' } : t));
        if (currentView === id) setCurrentView('inbox');
    }
  };

  const handleAddGroup = (name: string) => {
      const newGroup: ListGroup = {
          id: StorageService.generateId(),
          name
      };
      setGroups([...groups, newGroup]);
  };

  const handleDeleteGroup = (groupId: string) => {
      if (confirm('Delete this folder? Lists inside will be moved to the main list.')) {
          setGroups(groups.filter(g => g.id !== groupId));
          setLists(lists.map(l => l.groupId === groupId ? { ...l, groupId: undefined } : l));
      }
  };

  const handleImport = async (file: File) => {
      try {
          const importedData = await ImportService.parseTickTickCSV(file);
          
          // Merge Data
          const mergedGroups = [...groups];
          importedData.groups.forEach(ig => {
              if (!mergedGroups.find(g => g.name === ig.name)) {
                  mergedGroups.push(ig);
              }
          });

          const mergedLists = [...lists];
          importedData.lists.forEach(il => {
               // Simple check to avoid duplicate list names in same group?
               // For now just append, or check if list exists
               const existing = mergedLists.find(l => l.name === il.name && l.groupId === il.groupId);
               if (!existing) {
                   mergedLists.push(il);
               } else {
                   // Update imported tasks to use existing list ID
                   importedData.tasks.forEach(t => {
                       if (t.listId === il.id) t.listId = existing.id;
                   });
               }
          });
          
          // Append tasks
          const mergedTasks = [...tasks, ...importedData.tasks];

          setGroups(mergedGroups);
          setLists(mergedLists);
          setTasks(mergedTasks);

          alert(`Imported ${importedData.tasks.length} tasks successfully!`);

      } catch (error) {
          console.error("Import failed", error);
          alert("Failed to import CSV. Please ensure it is a valid TickTick backup.");
      }
  };

  const selectedTask = tasks.find(t => t.id === selectedTaskId) || null;

  const getViewTitle = () => {
    if (currentView === 'inbox') return 'Inbox';
    if (currentView === 'today') return 'Today';
    if (currentView === 'week') return 'Next 7 Days';
    if (currentView === 'calendar') return 'Calendar';
    return lists.find(l => l.id === currentView)?.name || 'List';
  };

  return (
    <div className="flex h-screen bg-white">
      <Sidebar 
        lists={lists}
        groups={groups}
        activeView={currentView}
        onSelectView={(id) => { setCurrentView(id); setSelectedTaskId(null); if(window.innerWidth < 768) setIsSidebarOpen(false); }}
        onAddList={handleAddList}
        onUpdateList={handleUpdateList}
        onDeleteList={handleDeleteList}
        onAddGroup={handleAddGroup}
        onDeleteGroup={handleDeleteGroup}
        onOpenPomodoro={() => setIsPomoOpen(true)}
        onImport={handleImport}
        isOpen={isSidebarOpen}
        toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
      />

      <main className="flex-1 flex flex-col min-w-0 bg-white relative">
        {/* Mobile Header (Always visible on mobile) */}
        <div className="md:hidden flex items-center p-4 border-b border-slate-100 bg-white">
            <button onClick={() => setIsSidebarOpen(true)} className="mr-3 text-slate-500">
                <Menu size={24} />
            </button>
            <h1 className="text-lg font-bold text-slate-800">{getViewTitle()}</h1>
        </div>

        {currentView === 'calendar' ? (
          <CalendarView 
            tasks={tasks}
            lists={lists}
            groups={groups} 
            onAddTask={handleCreateTask}
            onUpdateTask={handleUpdateTask}
            onDeleteTask={handleDeleteTask}
          />
        ) : (
          <>
            {/* Desktop Header for List Views */}
            <header className="hidden md:flex items-center justify-between px-8 py-6">
              <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                {getViewTitle()}
                <span className="text-slate-300 text-sm font-normal ml-2">{filteredTasks.length} tasks</span>
              </h1>
            </header>

            {/* Task List */}
            <div className="flex-1 overflow-y-auto px-4 md:px-8 pb-20">
              
              {/* Quick Add */}
              <form onSubmit={handleQuickAdd} className="mb-6 relative group">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-primary-500">
                  <Plus size={20} />
                </div>
                <input 
                  type="text" 
                  value={quickAddTask}
                  onChange={(e) => setQuickAddTask(e.target.value)}
                  placeholder="Add a task to 'Inbox', press Enter to save"
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary-100 focus:border-primary-300 outline-none transition-all placeholder-slate-400"
                />
              </form>

              {/* Active Tasks */}
              <div className="space-y-1">
                {filteredTasks.map(task => (
                  <TaskItem 
                    key={task.id} 
                    task={task} 
                    isSelected={selectedTaskId === task.id}
                    onSelect={(t) => setSelectedTaskId(t.id)}
                    onToggleComplete={handleToggleComplete}
                  />
                ))}
                
                {filteredTasks.length === 0 && (
                  <div className="text-center py-20">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-50 text-slate-300 mb-4">
                      <Menu size={32} />
                    </div>
                    <p className="text-slate-400">No tasks here. Enjoy your day!</p>
                  </div>
                )}
              </div>

              {/* Completed Tasks */}
              {completedTasksInView.length > 0 && (
                  <div className="mt-8">
                      <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 px-2">Completed</h3>
                      <div className="opacity-60">
                        {completedTasksInView.map(task => (
                            <TaskItem 
                                key={task.id} 
                                task={task} 
                                isSelected={selectedTaskId === task.id}
                                onSelect={(t) => setSelectedTaskId(t.id)}
                                onToggleComplete={handleToggleComplete}
                            />
                        ))}
                      </div>
                  </div>
              )}
            </div>
          </>
        )}
      </main>

      {/* Right Sidebar (Detail View) - Only shown in list views */}
      {currentView !== 'calendar' && (
        <div className={`
            fixed inset-y-0 right-0 transform transition-transform duration-300 ease-in-out z-40 shadow-2xl md:shadow-none md:static
            ${selectedTaskId ? 'translate-x-0' : 'translate-x-full md:hidden'}
        `}>
            <TaskDetail 
            task={selectedTask} 
            onClose={() => setSelectedTaskId(null)}
            onUpdate={handleUpdateTask}
            onDelete={handleDeleteTask}
            />
        </div>
      )}

      {/* Pomodoro Overlay */}
      {isPomoOpen && (
        <PomodoroTimer onClose={() => setIsPomoOpen(false)} />
      )}
    </div>
  );
}

export default App;
