
import { Task, TaskList, ListGroup, Priority, Subtask } from '../types';
import { StorageService } from './storageService';

interface TickTickRow {
  folderName: string;
  listName: string;
  title: string;
  kind: string;
  content: string;
  isChecklist: string;
  startDate: string;
  dueDate: string;
  priority: string;
  status: string;
  createdTime: string;
  completedTime: string;
  isAllDay: string;
  taskId: string;
  parentId: string;
}

export const ImportService = {
  parseTickTickCSV: async (file: File): Promise<{ tasks: Task[], lists: TaskList[], groups: ListGroup[] }> => {
    const text = await file.text();
    const lines = text.split('\n');
    
    // Find header row index (it starts with "Folder Name")
    const headerRowIndex = lines.findIndex(line => line.startsWith('"Folder Name"'));
    if (headerRowIndex === -1) throw new Error("Invalid TickTick CSV format");

    const dataLines = lines.slice(headerRowIndex + 1);
    
    const groupsMap = new Map<string, ListGroup>();
    const listsMap = new Map<string, TaskList>();
    const tasks: Task[] = [];

    // Helper to parse CSV line with quoted values
    const parseLine = (line: string): string[] => {
      const result = [];
      let current = '';
      let inQuote = false;
      
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          inQuote = !inQuote;
        } else if (char === ',' && !inQuote) {
          result.push(current);
          current = '';
        } else {
          current += char;
        }
      }
      result.push(current);
      return result.map(s => s.replace(/^"|"$/g, '').replace(/""/g, '"')); // Remove surrounding quotes and unescape double quotes
    };

    dataLines.forEach(line => {
      if (!line.trim()) return;
      
      const cols = parseLine(line);
      // Map columns based on provided structure
      // "Folder Name","List Name","Title","Kind","Tags","Content","Is Check list","Start Date","Due Date","Reminder","Repeat","Priority","Status","Created Time","Completed Time","Order","Timezone","Is All Day","Is Floating","Column Name","Column Order","View Mode","taskId","parentId"
      
      const row: TickTickRow = {
        folderName: cols[0],
        listName: cols[1],
        title: cols[2],
        kind: cols[3],
        // tags: cols[4],
        content: cols[5],
        isChecklist: cols[6],
        startDate: cols[7],
        dueDate: cols[8],
        // reminder: cols[9],
        // repeat: cols[10],
        priority: cols[11],
        status: cols[12],
        createdTime: cols[13],
        completedTime: cols[14],
        // order: cols[15],
        // timezone: cols[16],
        isAllDay: cols[17],
        // ...
        taskId: cols[22],
        parentId: cols[23]
      };

      // 1. Process Group
      let groupId: string | undefined = undefined;
      if (row.folderName) {
        if (!groupsMap.has(row.folderName)) {
          const newGroup = { id: StorageService.generateId(), name: row.folderName };
          groupsMap.set(row.folderName, newGroup);
        }
        groupId = groupsMap.get(row.folderName)!.id;
      }

      // 2. Process List
      // TickTick "Inbox" maps to our "inbox"
      let listId = 'inbox';
      if (row.listName && row.listName !== 'Inbox') {
        const listKey = `${row.folderName}::${row.listName}`; // Unique key for list
        if (!listsMap.has(listKey)) {
           const newList: TaskList = {
             id: StorageService.generateId(),
             name: row.listName,
             type: 'custom',
             groupId: groupId,
             color: '#3b82f6' // Default color, maybe randomize?
           };
           listsMap.set(listKey, newList);
        }
        listId = listsMap.get(listKey)!.id;
      }

      // 3. Process Task
      // Parse Dates
      const parseDate = (dateStr: string): string | null => {
        if (!dateStr) return null;
        try {
            const date = new Date(dateStr);
            // Adjust for timezone if needed, but ISO strings from TickTick seem to be UTC
            // If Is All Day is true, TickTick often stores as previous day 15:00 UTC (for KST +9)
            // We want local date YYYY-MM-DD
            return date.getFullYear() + '-' + 
                   String(date.getMonth() + 1).padStart(2, '0') + '-' + 
                   String(date.getDate()).padStart(2, '0');
        } catch {
            return null;
        }
      };

      // Map Priority (TickTick: 0, 1, 3, 5 -> Our: 0, 1, 2, 3)
      let priority = Priority.None;
      if (row.priority === '1') priority = Priority.Low;
      else if (row.priority === '3') priority = Priority.Medium;
      else if (row.priority === '5') priority = Priority.High;

      // Parse Checklist / Description
      let description = row.content || '';
      let subtasks: Subtask[] = [];
      let isChecklistMode = row.isChecklist === 'Y' || row.kind === 'CHECKLIST';

      if (isChecklistMode && description) {
         // TickTick exports content like "▪1. item... ▪2. item..." or "▫1. item..."
         // We try to split by these special chars or newlines
         // The sample showed items usually separated by the bullet char or newlines inside the content string
         
         // Strategy: Split by known bullet markers if present, otherwise newline
         let items: string[] = [];
         if (description.includes('▪') || description.includes('▫')) {
             items = description.split(/[▪▫]/).map(s => s.trim()).filter(s => s);
         } else {
             items = description.split('\n').map(s => s.trim()).filter(s => s);
         }

         subtasks = items.map(item => ({
             id: StorageService.generateId(),
             title: item,
             isCompleted: false, // Cannot determine subtask completion status easily from single string without parsing marks like [x]
             hasReminder: false
         }));
         description = ''; // Clear description if converted to subtasks
      }

      const newTask: Task = {
          id: StorageService.generateId(),
          title: row.title,
          description: description,
          subtasks: subtasks,
          isChecklistMode: isChecklistMode,
          isCompleted: row.status !== '0', // 0 is Normal, 1 Completed, 2 Archived
          priority: priority,
          startDate: parseDate(row.startDate),
          dueDate: parseDate(row.dueDate),
          listId: listId,
          createdAt: row.createdTime ? new Date(row.createdTime).getTime() : Date.now()
      };
      
      tasks.push(newTask);
    });

    return {
        tasks,
        lists: Array.from(listsMap.values()),
        groups: Array.from(groupsMap.values())
    };
  }
};
