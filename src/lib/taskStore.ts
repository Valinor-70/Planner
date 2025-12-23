import { createSignal } from 'solid-js';
import { v4 as uuidv4 } from 'uuid';
import type { Task, UndoAction } from '../types';
import { getAllTasks, saveTask, deleteTask, initDB } from './storage';
import { getUserTimeZone } from './dateUtils';

// Global task store
const [tasks, setTasks] = createSignal<Task[]>([]);
const [loading, setLoading] = createSignal(true);
const undoStack: UndoAction[] = [];
const MAX_UNDO_STACK = 50;

// Initialize store
export async function initStore(): Promise<void> {
  try {
    await initDB();
    const loadedTasks = await getAllTasks();
    setTasks(loadedTasks);
  } catch (error) {
    console.error('Failed to initialize store:', error);
  } finally {
    setLoading(false);
  }
}

// Get tasks
export function getTasks() {
  return tasks;
}

// Get loading state
export function isLoading() {
  return loading;
}

// Create a new task
export async function createTask(data: Partial<Task>): Promise<Task> {
  const now = new Date().toISOString();
  const currentTasks = tasks();
  const maxOrder = currentTasks.length > 0 
    ? Math.max(...currentTasks.map(t => t.order)) 
    : 0;
  
  const task: Task = {
    id: uuidv4(),
    title: data.title || 'Untitled Task',
    type: data.type || 'life',
    subject: data.subject || null,
    notes: data.notes || null,
    createdAt: now,
    updatedAt: now,
    dueDate: data.dueDate || null,
    dueTime: data.dueTime || null,
    scheduledDate: data.scheduledDate || null,
    scheduledTime: data.scheduledTime || null,
    timeZone: getUserTimeZone(),
    estimatedMinutes: data.estimatedMinutes || null,
    priority: data.priority || null,
    pomodoroCount: 0,
    completed: false,
    completedAt: null,
    order: maxOrder + 1,
  };

  await saveTask(task);
  setTasks([...currentTasks, task]);
  
  addToUndoStack({ type: 'create', task });
  
  return task;
}

// Update a task
export async function updateTask(id: string, updates: Partial<Task>): Promise<Task | null> {
  const currentTasks = tasks();
  const index = currentTasks.findIndex(t => t.id === id);
  
  if (index === -1) return null;
  
  const previousTask = currentTasks[index];
  const updatedTask = {
    ...previousTask,
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  
  await saveTask(updatedTask);
  const newTasks = [...currentTasks];
  newTasks[index] = updatedTask;
  setTasks(newTasks);
  
  addToUndoStack({ type: 'update', task: updatedTask, previousTask });
  
  return updatedTask;
}

// Delete a task
export async function removeTask(id: string): Promise<void> {
  const currentTasks = tasks();
  const task = currentTasks.find(t => t.id === id);
  
  if (!task) return;
  
  await deleteTask(id);
  setTasks(currentTasks.filter(t => t.id !== id));
  
  addToUndoStack({ type: 'delete', task });
}

// Toggle task completion
export async function toggleTaskCompletion(id: string): Promise<void> {
  const task = tasks().find(t => t.id === id);
  if (!task) return;
  
  const updates: Partial<Task> = {
    completed: !task.completed,
    completedAt: !task.completed ? new Date().toISOString() : null,
  };
  
  await updateTask(id, updates);
}

// Increment pomodoro count
export async function incrementPomodoro(id: string): Promise<void> {
  const task = tasks().find(t => t.id === id);
  if (!task) return;
  
  await updateTask(id, { pomodoroCount: task.pomodoroCount + 1 });
}

// Undo last action
export async function undo(): Promise<void> {
  const action = undoStack.pop();
  if (!action) return;
  
  const currentTasks = tasks();
  
  if (action.type === 'create') {
    // Remove the created task
    await deleteTask(action.task.id);
    setTasks(currentTasks.filter(t => t.id !== action.task.id));
  } else if (action.type === 'update' && action.previousTask) {
    // Restore the previous version
    await saveTask(action.previousTask);
    const index = currentTasks.findIndex(t => t.id === action.previousTask!.id);
    if (index >= 0) {
      const newTasks = [...currentTasks];
      newTasks[index] = action.previousTask;
      setTasks(newTasks);
    }
  } else if (action.type === 'delete') {
    // Restore the deleted task
    await saveTask(action.task);
    setTasks([...currentTasks, action.task]);
  }
}

// Can undo
export function canUndo(): boolean {
  return undoStack.length > 0;
}

// Add to undo stack
function addToUndoStack(action: UndoAction): void {
  undoStack.push(action);
  if (undoStack.length > MAX_UNDO_STACK) {
    undoStack.shift();
  }
}

// Get undo stack length (for testing)
export function getUndoStackLength(): number {
  return undoStack.length;
}

// Clear undo stack
export function clearUndoStack(): void {
  undoStack.length = 0;
}
