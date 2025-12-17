// Client-side only database layer using Dexie (IndexedDB)
import Dexie, { type Table } from 'dexie';
import type { Task, Note, UserProfile, AppSettings, ExportData } from '../types';
import { DEFAULT_SETTINGS } from '../types';

// Database version
const DB_VERSION = 2;

// Define the ZenPlanDB class extending Dexie
class ZenPlanDB extends Dexie {
  tasks!: Table<Task, number>;
  notes!: Table<Note, number>;
  profiles!: Table<UserProfile, number>;
  settings!: Table<AppSettings, number>;

  constructor() {
    super('ZenPlanDB');
    
    // Version 1: Original schema
    this.version(1).stores({
      tasks: '++id, title, date, status, priority',
    });

    // Version 2: Add notes, profiles, settings, and enhanced task fields
    this.version(2).stores({
      tasks: '++id, title, date, status, priority, *tags, createdAt, updatedAt',
      notes: '++id, title, *tags, isPinned, linkedDate, createdAt, updatedAt',
      profiles: '++id',
      settings: '++id',
    }).upgrade(async (tx) => {
      // Migrate existing tasks to add new fields
      await tx.table('tasks').toCollection().modify((task: Task) => {
        if (task.status === 'done' || task.status === 'todo') {
          // Keep existing status
        } else {
          task.status = 'todo';
        }
        if (!task.tags) task.tags = [];
        if (!task.subtasks) task.subtasks = [];
      });
    });
  }
}

// Create and export the database instance
export const db = new ZenPlanDB();

// ==================== Task CRUD Operations ====================

/**
 * Add a new task to the database
 */
export async function addTask(task: Omit<Task, 'id'>): Promise<number> {
  const now = new Date().toISOString();
  return await db.tasks.add({
    ...task,
    tags: task.tags || [],
    subtasks: task.subtasks || [],
    createdAt: now,
    updatedAt: now,
  });
}

/**
 * Update an existing task
 */
export async function updateTask(id: number, updates: Partial<Task>): Promise<number> {
  return await db.tasks.update(id, {
    ...updates,
    updatedAt: new Date().toISOString(),
  });
}

/**
 * Delete a task from the database
 */
export async function deleteTask(id: number): Promise<void> {
  await db.tasks.delete(id);
}

/**
 * Get a single task by ID
 */
export async function getTask(id: number): Promise<Task | undefined> {
  return await db.tasks.get(id);
}

/**
 * Get all tasks
 */
export async function getAllTasks(): Promise<Task[]> {
  return await db.tasks.toArray();
}

/**
 * Get tasks by date
 */
export async function getTasksByDate(date: string): Promise<Task[]> {
  return await db.tasks.where('date').equals(date).toArray();
}

/**
 * Get tasks by date range
 */
export async function getTasksByDateRange(startDate: string, endDate: string): Promise<Task[]> {
  return await db.tasks
    .where('date')
    .between(startDate, endDate, true, true)
    .toArray();
}

/**
 * Get tasks by tag
 */
export async function getTasksByTag(tag: string): Promise<Task[]> {
  return await db.tasks.where('tags').equals(tag).toArray();
}

/**
 * Toggle task completion status
 */
export async function toggleTaskStatus(id: number): Promise<void> {
  const task = await db.tasks.get(id);
  if (task) {
    const newStatus = task.status === 'done' ? 'todo' : 'done';
    await updateTask(id, { status: newStatus });
  }
}

/**
 * Search tasks by title or description
 */
export async function searchTasks(query: string): Promise<Task[]> {
  const lowerQuery = query.toLowerCase();
  return await db.tasks.filter((task) => {
    return (
      task.title.toLowerCase().includes(lowerQuery) ||
      (task.description?.toLowerCase().includes(lowerQuery) ?? false)
    );
  }).toArray();
}

// ==================== Note CRUD Operations ====================

/**
 * Add a new note
 */
export async function addNote(note: Omit<Note, 'id'>): Promise<number> {
  const now = new Date().toISOString();
  return await db.notes.add({
    ...note,
    tags: note.tags || [],
    isPinned: note.isPinned || false,
    createdAt: now,
    updatedAt: now,
  });
}

/**
 * Update an existing note
 */
export async function updateNote(id: number, updates: Partial<Note>): Promise<number> {
  return await db.notes.update(id, {
    ...updates,
    updatedAt: new Date().toISOString(),
  });
}

/**
 * Delete a note
 */
export async function deleteNote(id: number): Promise<void> {
  await db.notes.delete(id);
}

/**
 * Get a single note by ID
 */
export async function getNote(id: number): Promise<Note | undefined> {
  return await db.notes.get(id);
}

/**
 * Get all notes
 */
export async function getAllNotes(): Promise<Note[]> {
  return await db.notes.toArray();
}

/**
 * Get pinned notes
 */
export async function getPinnedNotes(): Promise<Note[]> {
  return await db.notes.where('isPinned').equals(1).toArray();
}

/**
 * Get notes by tag
 */
export async function getNotesByTag(tag: string): Promise<Note[]> {
  return await db.notes.where('tags').equals(tag).toArray();
}

/**
 * Get notes by date
 */
export async function getNotesByDate(date: string): Promise<Note[]> {
  return await db.notes.where('linkedDate').equals(date).toArray();
}

/**
 * Search notes by title or content
 */
export async function searchNotes(query: string): Promise<Note[]> {
  const lowerQuery = query.toLowerCase();
  return await db.notes.filter((note) => {
    return (
      note.title.toLowerCase().includes(lowerQuery) ||
      note.content.toLowerCase().includes(lowerQuery)
    );
  }).toArray();
}

/**
 * Toggle note pinned status
 */
export async function toggleNotePinned(id: number): Promise<void> {
  const note = await db.notes.get(id);
  if (note) {
    await updateNote(id, { isPinned: !note.isPinned });
  }
}

// ==================== Profile Operations ====================

/**
 * Get the user profile (there should only be one)
 */
export async function getProfile(): Promise<UserProfile | undefined> {
  const profiles = await db.profiles.toArray();
  return profiles[0];
}

/**
 * Save or update the user profile
 */
export async function saveProfile(profile: Omit<UserProfile, 'id' | 'createdAt' | 'updatedAt'>): Promise<number> {
  const now = new Date().toISOString();
  const existing = await getProfile();
  
  if (existing?.id) {
    await db.profiles.update(existing.id, {
      ...profile,
      updatedAt: now,
    });
    return existing.id;
  } else {
    return await db.profiles.add({
      ...profile,
      createdAt: now,
      updatedAt: now,
    });
  }
}

// ==================== Settings Operations ====================

/**
 * Get app settings (there should only be one record)
 */
export async function getSettings(): Promise<AppSettings> {
  const settingsArray = await db.settings.toArray();
  return settingsArray[0] || DEFAULT_SETTINGS;
}

/**
 * Save or update app settings
 */
export async function saveSettings(settings: Partial<AppSettings>): Promise<number> {
  const now = new Date().toISOString();
  const existing = await db.settings.toArray();
  
  if (existing[0]?.id) {
    await db.settings.update(existing[0].id, {
      ...settings,
      updatedAt: now,
    });
    return existing[0].id;
  } else {
    return await db.settings.add({
      ...DEFAULT_SETTINGS,
      ...settings,
      updatedAt: now,
    });
  }
}

// ==================== Data Export/Import ====================

/**
 * Export all data to JSON
 */
export async function exportAllData(): Promise<ExportData> {
  const [tasks, notes, profile, settings] = await Promise.all([
    getAllTasks(),
    getAllNotes(),
    getProfile(),
    getSettings(),
  ]);

  return {
    version: '2.0',
    exportDate: new Date().toISOString(),
    profile: profile || null,
    settings,
    tasks,
    notes,
  };
}

/**
 * Import data from JSON backup
 */
export async function importData(data: ExportData): Promise<void> {
  // Validate data structure
  if (!data.version || !data.tasks) {
    throw new Error('Invalid backup file format');
  }

  // Clear existing data
  await db.transaction('rw', [db.tasks, db.notes, db.profiles, db.settings], async () => {
    await db.tasks.clear();
    await db.notes.clear();
    await db.profiles.clear();
    await db.settings.clear();

    // Import tasks
    if (data.tasks.length > 0) {
      await db.tasks.bulkAdd(data.tasks.map(t => ({ ...t, id: undefined })));
    }

    // Import notes
    if (data.notes?.length > 0) {
      await db.notes.bulkAdd(data.notes.map(n => ({ ...n, id: undefined })));
    }

    // Import profile
    if (data.profile) {
      await db.profiles.add({ ...data.profile, id: undefined });
    }

    // Import settings
    if (data.settings) {
      await db.settings.add({ ...data.settings, id: undefined });
    }
  });
}

/**
 * Clear all local data
 */
export async function clearAllData(): Promise<void> {
  await db.transaction('rw', [db.tasks, db.notes, db.profiles, db.settings], async () => {
    await db.tasks.clear();
    await db.notes.clear();
    await db.profiles.clear();
    await db.settings.clear();
  });
}

/**
 * Check if there is any existing data
 */
export async function hasExistingData(): Promise<boolean> {
  const taskCount = await db.tasks.count();
  const noteCount = await db.notes.count();
  const profileCount = await db.profiles.count();
  return taskCount > 0 || noteCount > 0 || profileCount > 0;
}

// ==================== Demo Data ====================

/**
 * Generate demo data for first-time users
 */
export async function loadDemoData(): Promise<void> {
  const today = new Date().toISOString().split('T')[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
  const dayAfter = new Date(Date.now() + 172800000).toISOString().split('T')[0];

  const demoTasks: Omit<Task, 'id'>[] = [
    {
      title: 'Welcome to ZenPlan! 🎉',
      description: 'This is your first task. Click to mark it complete!',
      date: today,
      status: 'todo',
      priority: 'high',
      tags: ['getting-started'],
    },
    {
      title: 'Try creating a new task',
      description: 'Click the "New Task" button or press Cmd/Ctrl + N',
      date: today,
      status: 'todo',
      priority: 'med',
      tags: ['getting-started'],
    },
    {
      title: 'Explore the calendar views',
      description: 'Switch between Day, Week, and Month views using the buttons above',
      date: tomorrow,
      status: 'todo',
      priority: 'low',
      tags: ['getting-started'],
    },
    {
      title: 'Try the command palette',
      description: 'Press Cmd/Ctrl + K to open the command palette for quick actions',
      date: dayAfter,
      status: 'todo',
      priority: 'med',
      tags: ['tips'],
    },
  ];

  const demoNotes: Omit<Note, 'id'>[] = [
    {
      title: 'Getting Started with ZenPlan',
      content: `# Welcome to ZenPlan! 🧘

This is your first note. Notes support **Markdown** formatting.

## Quick Tips

- Use tags to organize your notes
- Pin important notes to keep them at the top
- Link notes to tasks for better organization

## Keyboard Shortcuts

- \`Cmd/Ctrl + K\` - Open command palette
- \`Cmd/Ctrl + N\` - New task
- \`Cmd/Ctrl + Shift + N\` - New note

Happy planning! 🌟`,
      tags: ['welcome', 'tips'],
      isPinned: true,
    },
  ];

  await db.transaction('rw', [db.tasks, db.notes], async () => {
    for (const task of demoTasks) {
      await addTask(task);
    }
    for (const note of demoNotes) {
      await addNote(note);
    }
  });
}
