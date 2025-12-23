import { describe, it, expect, beforeEach } from 'vitest';
import { 
  initDB, 
  getAllTasks, 
  saveTask, 
  deleteTask, 
  exportData, 
  clearAllData 
} from '../../src/lib/storage';
import type { Task } from '../../src/types';

describe('Storage', () => {
  beforeEach(async () => {
    // Use localStorage fallback for tests
    localStorage.clear();
  });

  it('should initialize database', async () => {
    await initDB();
    expect(true).toBe(true);
  });

  it('should save and retrieve a task', async () => {
    const task: Task = {
      id: 'test-1',
      title: 'Test Task',
      type: 'homework',
      subject: 'Math',
      notes: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      dueDate: '2024-12-20',
      dueTime: '15:00',
      scheduledDate: null,
      scheduledTime: null,
      timeZone: 'America/New_York',
      estimatedMinutes: 30,
      priority: 'high',
      pomodoroCount: 0,
      completed: false,
      completedAt: null,
      order: 1,
    };

    await saveTask(task);
    const tasks = await getAllTasks();
    
    expect(tasks).toHaveLength(1);
    expect(tasks[0].id).toBe('test-1');
    expect(tasks[0].title).toBe('Test Task');
  });

  it('should update an existing task', async () => {
    const task: Task = {
      id: 'test-2',
      title: 'Original Title',
      type: 'life',
      subject: null,
      notes: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      dueDate: null,
      dueTime: null,
      scheduledDate: null,
      scheduledTime: null,
      timeZone: 'America/New_York',
      estimatedMinutes: null,
      priority: null,
      pomodoroCount: 0,
      completed: false,
      completedAt: null,
      order: 1,
    };

    await saveTask(task);
    
    const updatedTask = { ...task, title: 'Updated Title' };
    await saveTask(updatedTask);
    
    const tasks = await getAllTasks();
    expect(tasks).toHaveLength(1);
    expect(tasks[0].title).toBe('Updated Title');
  });

  it('should delete a task', async () => {
    const task: Task = {
      id: 'test-3',
      title: 'To Delete',
      type: 'homework',
      subject: null,
      notes: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      dueDate: null,
      dueTime: null,
      scheduledDate: null,
      scheduledTime: null,
      timeZone: 'America/New_York',
      estimatedMinutes: null,
      priority: null,
      pomodoroCount: 0,
      completed: false,
      completedAt: null,
      order: 1,
    };

    await saveTask(task);
    await deleteTask('test-3');
    
    const tasks = await getAllTasks();
    expect(tasks).toHaveLength(0);
  });

  it('should export data', async () => {
    const task: Task = {
      id: 'test-4',
      title: 'Export Test',
      type: 'life',
      subject: null,
      notes: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      dueDate: null,
      dueTime: null,
      scheduledDate: null,
      scheduledTime: null,
      timeZone: 'America/New_York',
      estimatedMinutes: null,
      priority: null,
      pomodoroCount: 0,
      completed: false,
      completedAt: null,
      order: 1,
    };

    await saveTask(task);
    const data = await exportData();
    
    expect(data.tasks).toHaveLength(1);
    expect(data.tasks[0].title).toBe('Export Test');
    expect(data.metadata).toBeDefined();
    expect(data.metadata.schemaVersion).toBe(1);
  });

  it('should clear all data', async () => {
    const task: Task = {
      id: 'test-5',
      title: 'Clear Test',
      type: 'homework',
      subject: null,
      notes: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      dueDate: null,
      dueTime: null,
      scheduledDate: null,
      scheduledTime: null,
      timeZone: 'America/New_York',
      estimatedMinutes: null,
      priority: null,
      pomodoroCount: 0,
      completed: false,
      completedAt: null,
      order: 1,
    };

    await saveTask(task);
    await clearAllData();
    
    const tasks = await getAllTasks();
    expect(tasks).toHaveLength(0);
  });
});
