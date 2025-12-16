// Domain types for ZenPlan

export type Priority = 'low' | 'med' | 'high';

export type TaskStatus = 'todo' | 'done';

export interface Task {
  id?: number;
  title: string;
  date: string; // ISO date string (YYYY-MM-DD)
  status: TaskStatus;
  priority: Priority;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface TaskFormData {
  title: string;
  date: string;
  priority: Priority;
  description?: string;
}

// View types for the task board
export type ViewMode = 'daily' | 'weekly' | 'monthly';
