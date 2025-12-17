// Domain types for ZenPlan

// ==================== Task Types ====================

export type Priority = 'low' | 'med' | 'high';
export type TaskStatus = 'todo' | 'in-progress' | 'done';
export type ViewMode = 'daily' | 'weekly' | 'monthly';

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Task {
  id?: number;
  title: string;
  description?: string;
  date: string; // ISO date string (YYYY-MM-DD)
  time?: string; // Time in HH:mm format
  duration?: number; // Duration in minutes
  status: TaskStatus;
  priority: Priority;
  tags?: string[];
  subtasks?: Subtask[];
  recurrence?: RecurrenceRule;
  linkedNoteIds?: number[];
  pomodoroCount?: number;
  pomodoroTarget?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface RecurrenceRule {
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  interval: number; // Every N days/weeks/etc
  endDate?: string; // Optional end date
  daysOfWeek?: number[]; // For weekly: 0=Sun, 1=Mon, etc
}

export interface TaskFormData {
  title: string;
  date: string;
  time?: string;
  duration?: number;
  priority: Priority;
  description?: string;
  tags?: string[];
  subtasks?: Subtask[];
}

// ==================== Note Types ====================

export interface Note {
  id?: number;
  title: string;
  content: string; // Markdown content
  tags?: string[];
  isPinned?: boolean;
  linkedTaskIds?: number[];
  linkedDate?: string; // Optional date association
  createdAt?: string;
  updatedAt?: string;
}

export interface NoteFormData {
  title: string;
  content: string;
  tags?: string[];
  linkedDate?: string;
}

// ==================== Settings Types ====================

export type Theme = 'light' | 'dark' | 'auto';
export type UIDensity = 'compact' | 'comfortable' | 'spacious';
export type WeekStart = 'sunday' | 'monday';
export type DefaultView = 'daily' | 'weekly' | 'monthly';

export interface UserProfile {
  id?: number;
  name: string;
  avatar?: string; // Base64 encoded image or URL
  bio?: string;
  timezone?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AppSettings {
  id?: number;
  // Appearance
  theme: Theme;
  density: UIDensity;
  fontSize: number; // Base font size in pixels
  
  // Calendar preferences
  weekStart: WeekStart;
  defaultView: DefaultView;
  workingHoursStart: string; // HH:mm format
  workingHoursEnd: string;
  
  // Notifications
  enableReminders: boolean;
  reminderMinutesBefore: number;
  
  // Developer mode
  developerMode: boolean;
  
  // Onboarding
  onboardingCompleted: boolean;
  
  updatedAt?: string;
}

export interface AppState {
  profile: UserProfile | null;
  settings: AppSettings;
  hasExistingData: boolean;
}

// ==================== Search Types ====================

export interface SearchResult {
  type: 'task' | 'note';
  id: number;
  title: string;
  preview: string;
  date?: string;
  score: number;
}

// ==================== Command Palette Types ====================

export interface Command {
  id: string;
  label: string;
  description?: string;
  icon?: string;
  shortcut?: string;
  action: () => void;
  category?: string;
}

// ==================== Onboarding Types ====================

export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  component: string;
}

export interface OnboardingData {
  name: string;
  theme: Theme;
  defaultView: DefaultView;
  weekStart: WeekStart;
  loadDemoData: boolean;
}

// ==================== Export/Import Types ====================

export interface ExportData {
  version: string;
  exportDate: string;
  profile: UserProfile | null;
  settings: AppSettings;
  tasks: Task[];
  notes: Note[];
}

// Default settings
export const DEFAULT_SETTINGS: AppSettings = {
  theme: 'auto',
  density: 'comfortable',
  fontSize: 16,
  weekStart: 'monday',
  defaultView: 'weekly',
  workingHoursStart: '09:00',
  workingHoursEnd: '17:00',
  enableReminders: true,
  reminderMinutesBefore: 15,
  developerMode: false,
  onboardingCompleted: false,
};

