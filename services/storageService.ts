
import { Task, TaskList, ListGroup, Priority } from '../types';

/**
 * NOTE FOR SYNOLOGY/PHP USERS:
 * This service currently uses LocalStorage for instant demo purposes.
 * To connect to your Apache/PHP backend, replace the implementation of these functions
 * to use `fetch()` calls to your PHP API endpoints (e.g., api/get_tasks.php).
 */

const STORAGE_KEYS = {
  TASKS: 'privatetick_tasks',
  LISTS: 'privatetick_lists',
  GROUPS: 'privatetick_groups',
};

// Initial Seed Data
const DEFAULT_GROUPS: ListGroup[] = [
  { id: 'g_work', name: 'Work Projects' },
  { id: 'g_life', name: 'Personal Life' }
];

const DEFAULT_LISTS: TaskList[] = [
  { id: 'personal', name: 'Groceries', type: 'custom', color: '#3b82f6', groupId: 'g_life' },
  { id: 'fitness', name: 'Fitness', type: 'custom', color: '#10b981', groupId: 'g_life' },
  { id: 'work', name: 'Q4 Goals', type: 'custom', color: '#ef4444', groupId: 'g_work' },
  { id: 'misc', name: 'Misc', type: 'custom', color: '#8b5cf6' }, // No group
];

const DEFAULT_TASKS: Task[] = [
  {
    id: '1',
    title: 'Welcome to PrivateTick',
    description: 'This data is stored locally on your browser. No external servers.',
    subtasks: [],
    isChecklistMode: false,
    isCompleted: false,
    priority: Priority.High,
    startDate: new Date().toISOString().split('T')[0],
    dueDate: new Date().toISOString().split('T')[0],
    listId: 'inbox',
    createdAt: Date.now(),
  },
  {
    id: '2',
    title: 'Try the Pomodoro Timer',
    description: 'Click the clock icon in the sidebar to start a focus session.',
    subtasks: [
        { id: 's1', title: 'Open sidebar', isCompleted: true },
        { id: 's2', title: 'Click Start Pomo', isCompleted: false }
    ],
    isChecklistMode: true,
    isCompleted: false,
    priority: Priority.Medium,
    startDate: null,
    dueDate: null,
    listId: 'personal',
    createdAt: Date.now(),
  }
];

export const StorageService = {
  getTasks: (): Task[] => {
    const data = localStorage.getItem(STORAGE_KEYS.TASKS);
    return data ? JSON.parse(data) : DEFAULT_TASKS;
  },

  saveTasks: (tasks: Task[]) => {
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
  },

  getLists: (): TaskList[] => {
    const data = localStorage.getItem(STORAGE_KEYS.LISTS);
    return data ? JSON.parse(data) : DEFAULT_LISTS;
  },

  saveLists: (lists: TaskList[]) => {
    localStorage.setItem(STORAGE_KEYS.LISTS, JSON.stringify(lists));
  },

  getGroups: (): ListGroup[] => {
    const data = localStorage.getItem(STORAGE_KEYS.GROUPS);
    return data ? JSON.parse(data) : DEFAULT_GROUPS;
  },

  saveGroups: (groups: ListGroup[]) => {
    localStorage.setItem(STORAGE_KEYS.GROUPS, JSON.stringify(groups));
  },

  // Helper to generate IDs
  generateId: (): string => {
    return Math.random().toString(36).substr(2, 9);
  }
};
