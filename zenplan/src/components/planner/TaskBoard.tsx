import { useState, useCallback, useEffect } from 'react';
import { DndContext, closestCenter, DragOverlay } from '@dnd-kit/core';
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import { useLiveQuery } from 'dexie-react-hooks';
import { format, addDays, startOfWeek, startOfMonth, endOfMonth, eachDayOfInterval, subDays } from 'date-fns';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Calendar, ChevronLeft, ChevronRight, LayoutGrid, List, CalendarDays, Plus, Search, Settings, Bell, Command, Focus } from 'lucide-react';

import { db, updateTask, toggleTaskStatus, deleteTask } from '../../lib/db';
import type { Task, ViewMode } from '../../types';
import { Column } from './Column';
import { NewTaskModal } from './NewTaskModal';
import { TaskCard } from './TaskCard';
import { ThemeToggle } from '../ui/ThemeToggle';

const cn = (...inputs: (string | undefined | false)[]) => twMerge(clsx(inputs));

export function TaskBoard() {
  const [viewMode, setViewMode] = useState<ViewMode>('weekly');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [focusMode, setFocusMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Reactive query for all tasks - updates automatically when DB changes
  const tasks = useLiveQuery(() => db.tasks.toArray(), []) ?? [];

  // Calculate date range based on view mode
  const getDateRange = useCallback(() => {
    switch (viewMode) {
      case 'daily':
        return [currentDate];
      case 'weekly':
        const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
        return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
      case 'monthly':
        const monthStart = startOfMonth(currentDate);
        const monthEnd = endOfMonth(currentDate);
        return eachDayOfInterval({ start: monthStart, end: monthEnd });
      default:
        return [currentDate];
    }
  }, [viewMode, currentDate]);

  const dateRange = getDateRange();

  // Get tasks for a specific date
  const getTasksForDate = useCallback(
    (date: Date) => {
      const dateStr = format(date, 'yyyy-MM-dd');
      return tasks.filter((task) => task.date === dateStr);
    },
    [tasks]
  );

  // Navigation handlers
  const goToPrevious = () => {
    switch (viewMode) {
      case 'daily':
        setCurrentDate(subDays(currentDate, 1));
        break;
      case 'weekly':
        setCurrentDate(subDays(currentDate, 7));
        break;
      case 'monthly':
        setCurrentDate(subDays(startOfMonth(currentDate), 1));
        break;
    }
  };

  const goToNext = () => {
    switch (viewMode) {
      case 'daily':
        setCurrentDate(addDays(currentDate, 1));
        break;
      case 'weekly':
        setCurrentDate(addDays(currentDate, 7));
        break;
      case 'monthly':
        setCurrentDate(addDays(endOfMonth(currentDate), 1));
        break;
    }
  };

  const goToToday = () => setCurrentDate(new Date());

  // Drag and Drop handlers
  const handleDragStart = (event: DragStartEvent) => {
    const taskId = event.active.id as number;
    const task = tasks.find(t => t.id === taskId);
    setActiveTask(task || null);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const taskId = active.id as number;
    const newDate = over.id as string;

    // Only update if dropped on a different date column
    const task = tasks.find(t => t.id === taskId);
    if (task && task.date !== newDate) {
      await updateTask(taskId, { date: newDate });
    }
  };

  // Task action handlers
  const handleToggleComplete = async (id: number) => {
    await toggleTaskStatus(id);
  };

  const handleDeleteTask = async (id: number) => {
    await deleteTask(id);
  };

  const handleAddTask = (date: string) => {
    setSelectedDate(date);
    setIsModalOpen(true);
  };

  const openNewTaskModal = () => {
    setSelectedDate(format(new Date(), 'yyyy-MM-dd'));
    setIsModalOpen(true);
  };

  // View mode buttons
  const viewModes: { mode: ViewMode; icon: typeof Calendar; label: string }[] = [
    { mode: 'daily', icon: List, label: 'Day' },
    { mode: 'weekly', icon: LayoutGrid, label: 'Week' },
    { mode: 'monthly', icon: CalendarDays, label: 'Month' },
  ];

  // Stats
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === 'done').length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + N: New task
      if ((e.metaKey || e.ctrlKey) && e.key === 'n') {
        e.preventDefault();
        openNewTaskModal();
      }
      // Cmd/Ctrl + K: Command palette (placeholder)
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        // TODO: Open command palette
      }
      // Escape: Exit focus mode
      if (e.key === 'Escape' && focusMode) {
        setFocusMode(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [focusMode]);

  return (
    <div className={cn(
      "min-h-screen transition-colors duration-normal",
      "bg-bg-primary",
      focusMode && "bg-bg-secondary"
    )}>
      {/* Top Navigation Bar */}
      <header className={cn(
        "sticky top-0 z-40 glass border-b border-surface-border-subtle",
        focusMode && "opacity-0 pointer-events-none"
      )}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold gradient-text">
                ZenPlan
              </span>
            </div>

            {/* Search Bar */}
            <div className="hidden md:flex flex-1 max-w-md mx-8">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                <input
                  type="text"
                  placeholder="Search tasks... (⌘K)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="input pl-10 py-2 text-sm"
                />
              </div>
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-2">
              {/* Focus Mode Toggle */}
              <button 
                onClick={() => setFocusMode(!focusMode)}
                className={cn(
                  "p-2 rounded-lg transition-all",
                  focusMode 
                    ? "bg-primary-100 text-primary-600" 
                    : "hover:bg-neutral-100 dark:hover:bg-neutral-800 text-text-secondary"
                )}
                aria-label={focusMode ? "Exit focus mode" : "Enter focus mode"}
                title="Focus Mode"
              >
                <Focus className="w-5 h-5" />
              </button>
              
              {/* Theme Toggle */}
              <ThemeToggle />
              
              <button className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-text-secondary">
                <Bell className="w-5 h-5" />
              </button>
              <a href="/settings" className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-text-secondary">
                <Settings className="w-5 h-5" />
              </a>
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-sm font-medium">
                U
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className={cn(
        "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6",
        focusMode && "pt-16"
      )}>
        {/* Focus Mode Header */}
        {focusMode && (
          <div className="fixed top-4 right-4 z-50">
            <button
              onClick={() => setFocusMode(false)}
              className="btn-secondary text-sm"
            >
              Exit Focus Mode (Esc)
            </button>
          </div>
        )}

        {/* Dashboard Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-text-primary">
              {viewMode === 'daily' && format(currentDate, 'EEEE, MMMM d')}
              {viewMode === 'weekly' && `Week of ${format(startOfWeek(currentDate, { weekStartsOn: 1 }), 'MMM d')}`}
              {viewMode === 'monthly' && format(currentDate, 'MMMM yyyy')}
            </h1>
            <p className="text-text-secondary mt-1">
              {completedTasks} of {totalTasks} tasks completed ({completionRate}%)
            </p>
          </div>

          <button
            onClick={openNewTaskModal}
            className="btn-primary"
          >
            <Plus className="w-5 h-5" />
            New Task
            <kbd className="hidden sm:inline-flex ml-2 px-1.5 py-0.5 text-xs bg-white/20 rounded">⌘N</kbd>
          </button>
        </div>

        {/* Controls Bar */}
        <div className={cn(
          "flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 p-4 rounded-2xl",
          "glass",
          focusMode && "hidden"
        )}>
          {/* Navigation */}
          <div className="flex items-center gap-2">
            <button
              onClick={goToPrevious}
              className="btn-ghost p-2"
              aria-label="Previous period"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={goToToday}
              className="px-3 py-1.5 rounded-lg text-sm font-medium text-primary-600 hover:bg-primary-100 dark:hover:bg-primary-900/30 transition-colors"
            >
              Today
            </button>
            <button
              onClick={goToNext}
              className="btn-ghost p-2"
              aria-label="Next period"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* View Mode Switcher */}
          <div className="flex items-center gap-1 p-1 bg-neutral-100 dark:bg-neutral-800 rounded-xl" role="tablist">
            {viewModes.map(({ mode, icon: Icon, label }) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                role="tab"
                aria-selected={viewMode === mode}
                className={cn(
                  'flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all',
                  viewMode === mode
                    ? 'bg-surface-primary text-primary-600 shadow-sm'
                    : 'text-text-secondary hover:text-text-primary'
                )}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Task Board with Drag and Drop */}
        <DndContext
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className={cn(
            'grid gap-4',
            viewMode === 'daily' && 'grid-cols-1 max-w-2xl mx-auto',
            viewMode === 'weekly' && 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-7',
            viewMode === 'monthly' && 'grid-cols-7'
          )}>
            {dateRange.map((date) => {
              const dateStr = format(date, 'yyyy-MM-dd');
              const dateTasks = getTasksForDate(date);
              
              return (
                <Column
                  key={dateStr}
                  id={dateStr}
                  date={dateStr}
                  tasks={dateTasks}
                  onToggleComplete={handleToggleComplete}
                  onDelete={handleDeleteTask}
                  onAddTask={handleAddTask}
                />
              );
            })}
          </div>

          {/* Drag Overlay */}
          <DragOverlay>
            {activeTask && (
              <div className="opacity-80">
                <TaskCard
                  task={activeTask}
                  onToggleComplete={() => {}}
                  onDelete={() => {}}
                />
              </div>
            )}
          </DragOverlay>
        </DndContext>
      </main>

      {/* New Task Modal */}
      <NewTaskModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        defaultDate={selectedDate}
      />
    </div>
  );
}
