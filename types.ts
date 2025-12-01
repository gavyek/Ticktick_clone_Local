
export enum Priority {
  None = 0,
  Low = 1,
  Medium = 2,
  High = 3,
}

export interface Subtask {
  id: string;
  title: string;
  isCompleted: boolean;
  hasReminder?: boolean;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  subtasks: Subtask[];
  isChecklistMode: boolean;
  isCompleted: boolean;
  priority: Priority;
  startDate: string | null; // YYYY-MM-DD
  dueDate: string | null; // YYYY-MM-DD
  listId: string; // 'inbox' or custom list ID
  createdAt: number;
}

export interface ListGroup {
  id: string;
  name: string;
}

export interface TaskList {
  id: string;
  name: string;
  type: 'smart' | 'custom';
  groupId?: string; // Optional: if null, it's a root level list
  icon?: string;
  color?: string;
}

export type ViewType = 'inbox' | 'today' | 'week' | 'custom' | 'calendar';
