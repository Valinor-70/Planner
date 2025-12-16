export interface Task {
  id: string;
  title: string;
  type: 'homework' | 'life';
  subject: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  dueDate: string | null;
  dueTime: string | null;
  scheduledDate: string | null;
  scheduledTime: string | null;
  timeZone: string;
  estimatedMinutes: number | null;
  priority: 'low' | 'medium' | 'high' | null;
  pomodoroCount: number;
  completed: boolean;
  completedAt: string | null;
  order: number;
}

export interface StorageMetadata {
  schemaVersion: number;
  lastModified: string;
}

export interface TaskGroup {
  title: string;
  tasks: Task[];
}

export type StorageEngine = 'indexeddb' | 'localstorage';

export interface UndoAction {
  type: 'create' | 'update' | 'delete';
  task: Task;
  previousTask?: Task;
}
