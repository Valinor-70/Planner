import { useState, useCallback } from 'react';
import { DndContext, closestCenter, DragOverlay } from '@dnd-kit/core';
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import { useLiveQuery } from 'dexie-react-hooks';
import { format, addDays, startOfWeek, startOfMonth, endOfMonth, eachDayOfInterval, subDays } from 'date-fns';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Calendar, ChevronLeft, ChevronRight, LayoutGrid, List, CalendarDays, Plus, Search, Settings, Bell } from 'lucide-react';

import { db, updateTask, toggleTaskStatus, deleteTask } from '../../lib/db';
import type { Task, ViewMode } from '../../types';
import { Column } from './Column';
import { NewTaskModal } from './NewTaskModal';
import { TaskCard } from './TaskCard';

const cn = (...inputs: (string | undefined | false)[]) => twMerge(clsx(inputs));

export function TaskBoard() {
  const [viewMode, setViewMode] = useState<ViewMode>('weekly');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [activeTask, setActiveTask] = useState<Task | null>(null);

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-violet-50/30 to-slate-100">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-violet-600 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-violet-600 to-violet-800 bg-clip-text text-transparent">
                ZenPlan
              </span>
            </div>

            {/* Search Bar */}
            <div className="hidden md:flex flex-1 max-w-md mx-8">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search tasks..."
                  className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-100 border-0 focus:ring-2 focus:ring-violet-500/50 text-sm"
                />
              </div>
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-2">
              <button className="p-2 rounded-lg hover:bg-slate-100 text-slate-500">
                <Bell className="w-5 h-5" />
              </button>
              <button className="p-2 rounded-lg hover:bg-slate-100 text-slate-500">
                <Settings className="w-5 h-5" />
              </button>
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-400 to-violet-600 flex items-center justify-center text-white text-sm font-medium">
                U
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Dashboard Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              {viewMode === 'daily' && format(currentDate, 'EEEE, MMMM d')}
              {viewMode === 'weekly' && `Week of ${format(startOfWeek(currentDate, { weekStartsOn: 1 }), 'MMM d')}`}
              {viewMode === 'monthly' && format(currentDate, 'MMMM yyyy')}
            </h1>
            <p className="text-slate-500 mt-1">
              {completedTasks} of {totalTasks} tasks completed ({completionRate}%)
            </p>
          </div>

          <button
            onClick={openNewTaskModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-500 to-violet-600 text-white font-medium shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 transition-all hover:-translate-y-0.5"
          >
            <Plus className="w-5 h-5" />
            New Task
          </button>
        </div>

        {/* Controls Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 p-4 bg-white/60 backdrop-blur-sm rounded-2xl border border-slate-200/50">
          {/* Navigation */}
          <div className="flex items-center gap-2">
            <button
              onClick={goToPrevious}
              className="p-2 rounded-lg hover:bg-slate-100 text-slate-600"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={goToToday}
              className="px-3 py-1.5 rounded-lg text-sm font-medium text-violet-600 hover:bg-violet-100 transition-colors"
            >
              Today
            </button>
            <button
              onClick={goToNext}
              className="p-2 rounded-lg hover:bg-slate-100 text-slate-600"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* View Mode Switcher */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl">
            {viewModes.map(({ mode, icon: Icon, label }) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={cn(
                  'flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all',
                  viewMode === mode
                    ? 'bg-white text-violet-600 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
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
