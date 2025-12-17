// Client-side only database layer using Dexie (IndexedDB)
import Dexie, { type Table } from 'dexie';
import type { Task } from '../types';

// Define the ZenPlanDB class extending Dexie
class ZenPlanDB extends Dexie {
  tasks!: Table<Task, number>;

  constructor() {
    super('ZenPlanDB');
    
    this.version(1).stores({
      tasks: '++id, title, date, status, priority',
    });
  }
}

// Create and export the database instance
export const db = new ZenPlanDB();

// CRUD utility functions

/**
 * Add a new task to the database
 */
export async function addTask(task: Omit<Task, 'id'>): Promise<number> {
  const now = new Date().toISOString();
  return await db.tasks.add({
    ...task,
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
 * Toggle task completion status
 */
export async function toggleTaskStatus(id: number): Promise<void> {
  const task = await db.tasks.get(id);
  if (task) {
    const newStatus = task.status === 'done' ? 'todo' : 'done';
    await updateTask(id, { status: newStatus });
  }
}
