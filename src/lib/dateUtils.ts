import { format, parseISO, isToday, isTomorrow, isPast, differenceInMinutes } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import type { Task } from '../types';

// Get user's timezone
export function getUserTimeZone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

// Format date in user's timezone
export function formatDate(date: Date | string, formatString: string = 'yyyy-MM-dd'): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, formatString);
}

// Format time
export function formatTime(time: string): string {
  return time; // Already in HH:mm format
}

// Combine date and time into a Date object
export function combineDateAndTime(date: string, time: string | null, timeZone: string): Date {
  const dateTimeString = time ? `${date}T${time}:00` : `${date}T00:00:00`;
  return toZonedTime(dateTimeString, timeZone);
}

// Get task's due date as Date object
export function getTaskDueDate(task: Task): Date | null {
  if (!task.dueDate) return null;
  return combineDateAndTime(task.dueDate, task.dueTime, task.timeZone);
}

// Get task's scheduled date as Date object
export function getTaskScheduledDate(task: Task): Date | null {
  if (!task.scheduledDate) return null;
  return combineDateAndTime(task.scheduledDate, task.scheduledTime, task.timeZone);
}

// Check if task is overdue
export function isTaskOverdue(task: Task): boolean {
  if (task.completed) return false;
  const dueDate = getTaskDueDate(task);
  if (!dueDate) return false;
  return isPast(dueDate);
}

// Check if task is due today
export function isTaskDueToday(task: Task): boolean {
  const dueDate = getTaskDueDate(task);
  if (!dueDate) return false;
  return isToday(dueDate);
}

// Check if task is due tomorrow
export function isTaskDueTomorrow(task: Task): boolean {
  const dueDate = getTaskDueDate(task);
  if (!dueDate) return false;
  return isTomorrow(dueDate);
}

// Check if task is scheduled for today
export function isTaskScheduledToday(task: Task): boolean {
  const scheduledDate = getTaskScheduledDate(task);
  if (!scheduledDate) return false;
  return isToday(scheduledDate);
}

// Get urgency score (lower is more urgent)
export function getTaskUrgency(task: Task): number {
  if (task.completed) return Infinity;
  
  const now = new Date();
  const dueDate = getTaskDueDate(task);
  
  if (!dueDate) return Infinity;
  
  // Calculate minutes until due
  const minutesUntilDue = differenceInMinutes(dueDate, now);
  
  // Overdue tasks are most urgent
  if (minutesUntilDue < 0) return minutesUntilDue;
  
  // Apply priority multiplier
  let priorityMultiplier = 1;
  if (task.priority === 'high') priorityMultiplier = 0.5;
  if (task.priority === 'low') priorityMultiplier = 1.5;
  
  // Homework tasks are prioritized over life tasks when due soon
  const typeMultiplier = task.type === 'homework' ? 0.9 : 1.1;
  
  return minutesUntilDue * priorityMultiplier * typeMultiplier;
}

// Group tasks by urgency
export function groupTasksByUrgency(tasks: Task[]): {
  urgent: Task[];
  today: Task[];
  upcoming: Task[];
  someday: Task[];
} {
  const now = new Date();
  const urgent: Task[] = [];
  const today: Task[] = [];
  const upcoming: Task[] = [];
  const someday: Task[] = [];
  
  for (const task of tasks) {
    if (task.completed) continue;
    
    const dueDate = getTaskDueDate(task);
    const scheduledDate = getTaskScheduledDate(task);
    
    // Urgent: overdue or due today
    if (dueDate && (isPast(dueDate) || isToday(dueDate))) {
      urgent.push(task);
    }
    // Today: scheduled for today
    else if (scheduledDate && isToday(scheduledDate)) {
      today.push(task);
    }
    // Upcoming: has a due date in the near future (next 7 days)
    else if (dueDate && differenceInMinutes(dueDate, now) < 7 * 24 * 60) {
      upcoming.push(task);
    }
    // Someday: everything else
    else {
      someday.push(task);
    }
  }
  
  // Sort each group by urgency
  urgent.sort((a, b) => getTaskUrgency(a) - getTaskUrgency(b));
  today.sort((a, b) => getTaskUrgency(a) - getTaskUrgency(b));
  upcoming.sort((a, b) => getTaskUrgency(a) - getTaskUrgency(b));
  someday.sort((a, b) => a.order - b.order);
  
  return { urgent, today, upcoming, someday };
}

// Format relative time (e.g., "in 2 hours", "2 days ago")
export function formatRelativeTime(date: Date): string {
  const now = new Date();
  const minutes = differenceInMinutes(date, now);
  
  if (minutes < 0) {
    const absMinutes = Math.abs(minutes);
    if (absMinutes < 60) return `${absMinutes}m ago`;
    if (absMinutes < 1440) return `${Math.floor(absMinutes / 60)}h ago`;
    return `${Math.floor(absMinutes / 1440)}d ago`;
  } else {
    if (minutes < 60) return `in ${minutes}m`;
    if (minutes < 1440) return `in ${Math.floor(minutes / 60)}h`;
    return `in ${Math.floor(minutes / 1440)}d`;
  }
}

// Get current date in YYYY-MM-DD format
export function getCurrentDate(): string {
  return formatDate(new Date(), 'yyyy-MM-dd');
}

// Get current time in HH:mm format
export function getCurrentTime(): string {
  return format(new Date(), 'HH:mm');
}
