
import React, { useState, useRef } from 'react';
import { 
  Inbox, 
  Calendar, 
  CalendarDays, 
  CalendarRange,
  List as ListIcon, 
  Plus, 
  Clock, 
  Trash2,
  Menu,
  Folder,
  FolderOpen,
  ChevronDown,
  ChevronRight,
  Download,
  Settings,
  MoreHorizontal,
  X
} from 'lucide-react';
import { TaskList, ListGroup } from '../types';

interface SidebarProps {
  lists: TaskList[];
  groups: ListGroup[];
  activeView: string;
  onSelectView: (viewId: string) => void;
  onAddList: (name: string, groupId?: string, color?: string) => void;
  onUpdateList: (id: string, updates: Partial<TaskList>) => void;
  onDeleteList: (id: string) => void;
  onAddGroup: (name: string) => void;
  onDeleteGroup: (groupId: string) => void;
  onOpenPomodoro: () => void;
  onImport: (file: File) => void;
  isOpen: boolean;
  toggleSidebar: () => void;
}

// Expanded Color Palette
const PRESET_COLORS = [
  '#dc2626', '#ea580c', '#d97706', '#65a30d', '#16a34a', '#059669', '#0891b2', '#2563eb', '#4f46e5', '#7c3aed', '#c026d3', '#db2777',
  '#ef4444', '#f97316', '#f59e0b', '#84cc16', '#10b981', '#14b8a6', '#06b6d4', '#3b82f6', '#6366f1', '#8b5cf6', '#d946ef', '#f43f5e',
  '#fca5a5', '#fdba74', '#fcd34d', '#bef264', '#86efac', '#5eead4', '#67e8f9', '#93c5fd', '#a5b4fc', '#c4b5fd', '#f0abfc', '#fda4af',
  '#9ca3af', '#d1d5db', '#b4b3a8', '#a8a29e', '#94a3b8', '#cbd5e1', '#99f6e4', '#7dd3fc', '#a7f3d0', '#fde047'
];

interface EditListModalProps {
    list: TaskList;
    groups: ListGroup[];
    onClose: () => void;
    onSave: (updates: Partial<TaskList>) => void;
}

const EditListModal: React.FC<EditListModalProps> = ({ list, groups, onClose, onSave }) => {
    const [name, setName] = useState(list.name);
    const [color, setColor] = useState(list.color || '#3b82f6');
    const [groupId, setGroupId] = useState(list.groupId || '');
    // Placeholder for 'Hide' functionality if added to types later
    const [isHidden, setIsHidden] = useState(false); 

    const handleSave = () => {
        onSave({
            name,
            color,
            groupId: groupId === '' ? undefined : groupId
        });
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white rounded-xl shadow-2xl w-[400px] overflow-hidden animate-in fade-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
                    <h3 className="font-bold text-slate-800">Edit List</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
                </div>

                <div className="p-6 space-y-5">
                    {/* Name Input */}
                    <div>
                        <input 
                            type="text" 
                            value={name} 
                            onChange={e => setName(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-100 focus:border-primary-500 outline-none text-slate-700 font-medium"
                            placeholder="List Name"
                        />
                    </div>

                    {/* Color Picker */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Color</label>
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-8 h-8 rounded-lg shadow-sm border border-slate-100" style={{ backgroundColor: color }}></div>
                            <span className="text-sm text-slate-500 font-mono">{color}</span>
                        </div>
                        <div className="grid grid-cols-8 gap-2 mb-3">
                            {PRESET_COLORS.slice(0, 16).map(c => (
                                <button
                                    key={c}
                                    onClick={() => setColor(c)}
                                    className={`w-6 h-6 rounded-full hover:scale-110 transition-transform ${color === c ? 'ring-2 ring-offset-1 ring-slate-400' : ''}`}
                                    style={{ backgroundColor: c }}
                                />
                            ))}
                        </div>
                        {/* Custom Color Slider visual */}
                        <div className="relative h-6 rounded-full bg-gradient-to-r from-red-500 via-green-500 to-blue-500 cursor-pointer group overflow-hidden">
                            <input 
                                type="color" 
                                value={color}
                                onChange={e => setColor(e.target.value)}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            />
                             <div className="absolute inset-0 flex items-center justify-center text-white text-[10px] font-bold drop-shadow-md pointer-events-none group-hover:opacity-0 transition-opacity">
                                CUSTOM
                            </div>
                        </div>
                    </div>

                    {/* Properties */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <label className="text-sm text-slate-600">Type</label>
                            <select disabled className="text-sm bg-slate-50 border-none rounded px-2 py-1 text-slate-400 cursor-not-allowed outline-none">
                                <option>Task List</option>
                                <option>Smart List</option>
                            </select>
                        </div>
                        <div className="flex items-center justify-between">
                            <label className="text-sm text-slate-600">Folder</label>
                            <select 
                                value={groupId} 
                                onChange={e => setGroupId(e.target.value)}
                                className="text-sm bg-slate-50 border border-slate-200 rounded px-2 py-1 text-slate-700 outline-none focus:border-primary-500 min-w-[120px]"
                            >
                                <option value="">None</option>
                                {groups.map(g => (
                                    <option key={g.id} value={g.id}>{g.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="pt-2 border-t border-slate-50">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input 
                                type="checkbox" 
                                checked={isHidden} 
                                onChange={e => setIsHidden(e.target.checked)}
                                className="rounded border-slate-300 text-primary-600 focus:ring-primary-200" 
                            />
                            <span className="text-sm text-slate-600">Hide from smart lists</span>
                        </label>
                        <p className="text-xs text-slate-400 mt-1 pl-6">
                            If enabled, tasks in this list will not appear in "All", "Today", etc. unless explicitly selected.
                        </p>
                    </div>

                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-2">
                    <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-white hover:shadow-sm rounded-lg transition-all border border-transparent hover:border-slate-200">
                        Cancel
                    </button>
                    <button onClick={handleSave} className="px-6 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg shadow-sm transition-all">
                        Save
                    </button>
                </div>
            </div>
        </div>
    );
};

export const Sidebar: React.FC<SidebarProps> = ({
  lists,
  groups,
  activeView,
  onSelectView,
  onAddList,
  onUpdateList,
  onDeleteList,
  onAddGroup,
  onDeleteGroup,
  onOpenPomodoro,
  onImport,
  isOpen,
  toggleSidebar
}) => {
  const [creationMode, setCreationMode] = useState<'list' | 'group' | null>(null);
  const [creationTargetGroupId, setCreationTargetGroupId] = useState<string | undefined>(undefined);
  const [newItemName, setNewItemName] = useState('');
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
  
  // Editing State
  const [editingListId, setEditingListId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const toggleGroup = (groupId: string) => {
    setCollapsedGroups(prev => ({ ...prev, [groupId]: !prev[groupId] }));
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) return;

    if (creationMode === 'group') {
        onAddGroup(newItemName.trim());
    } else if (creationMode === 'list') {
        const randomColor = PRESET_COLORS[Math.floor(Math.random() * PRESET_COLORS.length)];
        onAddList(newItemName.trim(), creationTargetGroupId, randomColor);
    }
    
    setNewItemName('');
    setCreationMode(null);
    setCreationTargetGroupId(undefined);
  };

  const startCreatingList = (groupId?: string) => {
      setCreationMode('list');
      setCreationTargetGroupId(groupId);
      setNewItemName('');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          onImport(e.target.files[0]);
          if (fileInputRef.current) fileInputRef.current.value = '';
      }
  };

  const navItemClass = (id: string) => `
    flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors text-sm font-medium
    ${activeView === id 
      ? 'bg-primary-100 text-primary-700' 
      : 'text-slate-600 hover:bg-slate-100'
    }
  `;

  const getGroupLists = (groupId: string) => lists.filter(l => l.groupId === groupId);
  const orphanLists = lists.filter(l => !l.groupId);

  const editingList = lists.find(l => l.id === editingListId);

  return (
    <>
        {/* List Edit Modal */}
        {editingList && (
            <EditListModal 
                list={editingList}
                groups={groups}
                onClose={() => setEditingListId(null)}
                onSave={(updates) => onUpdateList(editingList.id, updates)}
            />
        )}

        {/* Mobile Overlay */}
        <div 
            className={`fixed inset-0 bg-black/20 z-20 md:hidden transition-opacity ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
            onClick={toggleSidebar}
        ></div>

        <aside className={`
            fixed md:relative z-30 w-64 h-full bg-slate-50 border-r border-slate-200 flex flex-col transition-transform duration-300 ease-in-out
            ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}>
        <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-2 text-primary-600 font-bold text-lg">
            <div className="w-6 h-6 bg-primary-600 rounded-md flex items-center justify-center text-white">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
            </div>
            PrivateTick
            </div>
            <button onClick={toggleSidebar} className="md:hidden text-slate-500">
                <Menu size={20} />
            </button>
        </div>

        <div className="flex-1 overflow-y-auto py-2 px-3 space-y-6">
            {/* Smart Lists */}
            <div className="space-y-1">
            <div onClick={() => onSelectView('inbox')} className={navItemClass('inbox')}>
                <Inbox size={18} className="text-blue-500" />
                <span>Inbox</span>
            </div>
            <div onClick={() => onSelectView('today')} className={navItemClass('today')}>
                <Calendar size={18} className="text-green-500" />
                <span>Today</span>
            </div>
            <div onClick={() => onSelectView('week')} className={navItemClass('week')}>
                <CalendarDays size={18} className="text-purple-500" />
                <span>Next 7 Days</span>
            </div>
            <div onClick={() => onSelectView('calendar')} className={navItemClass('calendar')}>
                <CalendarRange size={18} className="text-indigo-500" />
                <span>Calendar</span>
            </div>
            </div>

            {/* Lists Section */}
            <div className="relative">
            <div className="flex items-center justify-between px-3 mb-2 text-xs font-semibold text-slate-400 uppercase tracking-wider group">
                <span>Lists</span>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                        onClick={() => { setCreationMode('group'); setNewItemName(''); }}
                        className="hover:text-primary-600 transition-colors"
                        title="New Folder"
                    >
                        <Folder size={14} />
                    </button>
                    <button 
                        onClick={() => startCreatingList()}
                        className="hover:text-primary-600 transition-colors"
                        title="New List"
                    >
                        <Plus size={14} />
                    </button>
                </div>
            </div>
            
            <div className="space-y-1">
                
                {/* Creation Input (Global) */}
                {creationMode === 'group' || (creationMode === 'list' && !creationTargetGroupId) ? (
                    <form onSubmit={handleCreateSubmit} className="px-3 py-1">
                        <div className="flex items-center gap-2 border border-primary-300 rounded px-2 py-1 bg-white">
                            {creationMode === 'group' ? <Folder size={14} className="text-slate-400"/> : <ListIcon size={14} className="text-slate-400"/>}
                            <input
                                autoFocus
                                type="text"
                                className="w-full text-sm outline-none"
                                placeholder={creationMode === 'group' ? "Folder name..." : "List name..."}
                                value={newItemName}
                                onChange={(e) => setNewItemName(e.target.value)}
                                onBlur={() => !newItemName && setCreationMode(null)}
                            />
                        </div>
                    </form>
                ) : null}

                {/* Groups */}
                {groups.map(group => {
                    const isCollapsed = collapsedGroups[group.id];
                    const groupLists = getGroupLists(group.id);
                    
                    return (
                        <div key={group.id} className="mb-1">
                            <div className="flex items-center justify-between group/header px-2 py-1 rounded hover:bg-slate-100 cursor-pointer text-slate-500 text-sm">
                                <div 
                                    className="flex items-center gap-2 flex-1 overflow-hidden"
                                    onClick={() => toggleGroup(group.id)}
                                >
                                    {isCollapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
                                    <span className="truncate font-medium">{group.name}</span>
                                </div>
                                <div className="flex items-center gap-1 opacity-0 group-hover/header:opacity-100 transition-opacity">
                                     <button
                                        onClick={() => startCreatingList(group.id)}
                                        className="p-1 hover:text-primary-600"
                                        title="Add List to Folder"
                                     >
                                         <Plus size={12} />
                                     </button>
                                     <button
                                        onClick={(e) => { e.stopPropagation(); onDeleteGroup(group.id); }}
                                        className="p-1 hover:text-red-500"
                                        title="Delete Folder"
                                     >
                                         <Trash2 size={12} />
                                     </button>
                                </div>
                            </div>

                            {!isCollapsed && (
                                <div className="ml-4 space-y-0.5 border-l border-slate-200 pl-2 mt-1">
                                    {groupLists.map(list => (
                                        <div 
                                            key={list.id} 
                                            onClick={() => onSelectView(list.id)}
                                            className={`group/list flex items-center justify-between px-2 py-1.5 rounded-md cursor-pointer text-sm transition-colors ${activeView === list.id ? 'bg-primary-50 text-primary-700 font-medium' : 'text-slate-600 hover:bg-slate-100'}`}
                                        >
                                            <div className="flex items-center gap-2 truncate">
                                                <div 
                                                    className="w-2 h-2 rounded-full flex-shrink-0" 
                                                    style={{ backgroundColor: list.color }} 
                                                />
                                                <span className="truncate">{list.name}</span>
                                            </div>
                                            
                                            {/* Hover Actions */}
                                            <div className="flex items-center opacity-0 group-hover/list:opacity-100 transition-opacity">
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); setEditingListId(list.id); }}
                                                    className="p-1 text-slate-400 hover:text-primary-600"
                                                >
                                                    <Settings size={12} />
                                                </button>
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); onDeleteList(list.id); }}
                                                    className="p-1 text-slate-400 hover:text-red-500"
                                                >
                                                    <Trash2 size={12} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                    
                                    {/* Creation Input (Inside Group) */}
                                    {creationMode === 'list' && creationTargetGroupId === group.id && (
                                         <form onSubmit={handleCreateSubmit} className="px-2 py-1">
                                            <input
                                                autoFocus
                                                type="text"
                                                className="w-full text-sm px-2 py-1 border border-primary-300 rounded outline-none"
                                                placeholder="List name..."
                                                value={newItemName}
                                                onChange={(e) => setNewItemName(e.target.value)}
                                                onBlur={() => !newItemName && setCreationMode(null)}
                                            />
                                        </form>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}

                {/* Orphan Lists */}
                {orphanLists.map(list => (
                     <div 
                        key={list.id} 
                        onClick={() => onSelectView(list.id)}
                        className={`group/list flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer text-sm transition-colors ${activeView === list.id ? 'bg-primary-100 text-primary-700 font-medium' : 'text-slate-600 hover:bg-slate-100'}`}
                    >
                        <div className="flex items-center gap-3 truncate">
                             <div 
                                className="w-2.5 h-2.5 rounded-full flex-shrink-0" 
                                style={{ backgroundColor: list.color || '#94a3b8' }} 
                            />
                            <span className="truncate">{list.name}</span>
                        </div>
                        
                        {/* Hover Actions */}
                        <div className="flex items-center opacity-0 group-hover/list:opacity-100 transition-opacity">
                             <button 
                                onClick={(e) => { e.stopPropagation(); setEditingListId(list.id); }}
                                className="p-1.5 text-slate-400 hover:text-primary-600"
                            >
                                <Settings size={14} />
                            </button>
                            <button 
                                onClick={(e) => { e.stopPropagation(); onDeleteList(list.id); }}
                                className="p-1.5 text-slate-400 hover:text-red-500"
                            >
                                <Trash2 size={14} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
            
            </div>
        </div>

        {/* Tools */}
        <div className="p-3 border-t border-slate-200 bg-slate-50 space-y-2">
            <button 
            onClick={onOpenPomodoro}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-white border border-slate-200 shadow-sm rounded-lg text-slate-700 text-sm font-medium hover:bg-slate-50 hover:text-primary-600 transition-all"
            >
                <Clock size={16} />
                Start Pomo
            </button>

            <input 
                type="file" 
                accept=".csv" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                className="hidden" 
            />
            <button 
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-slate-100 border border-transparent rounded-lg text-slate-600 text-sm font-medium hover:bg-slate-200 transition-all"
                title="Import TickTick CSV"
            >
                <Download size={16} />
                Import Backup
            </button>
        </div>
        </aside>
    </>
  );
};
