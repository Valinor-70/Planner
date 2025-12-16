import { describe, it, expect } from 'vitest';
import {
  formatDate,
  formatTime,
  getUserTimeZone,
  getTaskUrgency,
  groupTasksByUrgency,
  isTaskOverdue,
  getCurrentDate,
  getCurrentTime,
} from '../../src/lib/dateUtils';
import type { Task } from '../../src/types';

describe('Date Utils', () => {
  it('should get user timezone', () => {
    const tz = getUserTimeZone();
    expect(tz).toBeTruthy();
    expect(typeof tz).toBe('string');
  });

  it('should format date', () => {
    const date = new Date('2024-12-16T10:30:00');
    const formatted = formatDate(date);
    expect(formatted).toBe('2024-12-16');
  });

  it('should format time', () => {
    const time = '14:30';
    const formatted = formatTime(time);
    expect(formatted).toBe('14:30');
  });

  it('should get current date', () => {
    const date = getCurrentDate();
    expect(date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('should get current time', () => {
    const time = getCurrentTime();
    expect(time).toMatch(/^\d{2}:\d{2}$/);
  });

  it('should detect overdue tasks', () => {
    const overdueTask: Task = {
      id: '1',
      title: 'Overdue Task',
      type: 'homework',
      subject: null,
      notes: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      dueDate: '2020-01-01',
      dueTime: '10:00',
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

    expect(isTaskOverdue(overdueTask)).toBe(true);
  });

  it('should not mark completed tasks as overdue', () => {
    const completedTask: Task = {
      id: '2',
      title: 'Completed Task',
      type: 'homework',
      subject: null,
      notes: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      dueDate: '2020-01-01',
      dueTime: '10:00',
      scheduledDate: null,
      scheduledTime: null,
      timeZone: 'America/New_York',
      estimatedMinutes: null,
      priority: null,
      pomodoroCount: 0,
      completed: true,
      completedAt: new Date().toISOString(),
      order: 1,
    };

    expect(isTaskOverdue(completedTask)).toBe(false);
  });

  it('should calculate urgency scores', () => {
    const highPriorityTask: Task = {
      id: '3',
      title: 'High Priority',
      type: 'homework',
      subject: null,
      notes: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      dueDate: '2099-12-31',
      dueTime: '23:59',
      scheduledDate: null,
      scheduledTime: null,
      timeZone: 'America/New_York',
      estimatedMinutes: null,
      priority: 'high',
      pomodoroCount: 0,
      completed: false,
      completedAt: null,
      order: 1,
    };

    const lowPriorityTask: Task = {
      ...highPriorityTask,
      id: '4',
      priority: 'low',
    };

    const highUrgency = getTaskUrgency(highPriorityTask);
    const lowUrgency = getTaskUrgency(lowPriorityTask);

    // High priority should be more urgent (lower score)
    expect(highUrgency).toBeLessThan(lowUrgency);
  });

  it('should group tasks by urgency', () => {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const nextWeek = new Date(now);
    nextWeek.setDate(nextWeek.getDate() + 5);

    const tasks: Task[] = [
      {
        id: '1',
        title: 'Due Today',
        type: 'homework',
        subject: null,
        notes: null,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
        dueDate: formatDate(now),
        dueTime: '23:59',
        scheduledDate: null,
        scheduledTime: null,
        timeZone: 'America/New_York',
        estimatedMinutes: null,
        priority: null,
        pomodoroCount: 0,
        completed: false,
        completedAt: null,
        order: 1,
      },
      {
        id: '2',
        title: 'Scheduled Today',
        type: 'life',
        subject: null,
        notes: null,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
        dueDate: null,
        dueTime: null,
        scheduledDate: formatDate(now),
        scheduledTime: '15:00',
        timeZone: 'America/New_York',
        estimatedMinutes: null,
        priority: null,
        pomodoroCount: 0,
        completed: false,
        completedAt: null,
        order: 2,
      },
      {
        id: '3',
        title: 'Upcoming',
        type: 'homework',
        subject: null,
        notes: null,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
        dueDate: formatDate(nextWeek),
        dueTime: '12:00',
        scheduledDate: null,
        scheduledTime: null,
        timeZone: 'America/New_York',
        estimatedMinutes: null,
        priority: null,
        pomodoroCount: 0,
        completed: false,
        completedAt: null,
        order: 3,
      },
      {
        id: '4',
        title: 'Someday',
        type: 'life',
        subject: null,
        notes: null,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
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
        order: 4,
      },
    ];

    const grouped = groupTasksByUrgency(tasks);
    
    expect(grouped.urgent.length).toBeGreaterThan(0);
    expect(grouped.urgent[0].title).toBe('Due Today');
    expect(grouped.today.length).toBeGreaterThan(0);
    expect(grouped.upcoming.length).toBeGreaterThan(0);
    expect(grouped.someday.length).toBeGreaterThan(0);
  });
});
