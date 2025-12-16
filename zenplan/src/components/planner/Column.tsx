import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { format, isToday, isTomorrow, isYesterday, parseISO } from 'date-fns';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { TaskCard } from './TaskCard';
import type { Task } from '../../types';
import { Calendar, Plus } from 'lucide-react';

interface ColumnProps {
  id: string;
  date: string;
  tasks: Task[];
  onToggleComplete: (id: number) => void;
  onDelete: (id: number) => void;
  onAddTask: (date: string) => void;
}

export function Column({ id, date, tasks, onToggleComplete, onDelete, onAddTask }: ColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id });

  const cn = (...inputs: (string | undefined | false)[]) => twMerge(clsx(inputs));

  const parsedDate = parseISO(date);
  
  const getDateLabel = () => {
    if (isToday(parsedDate)) return 'Today';
    if (isTomorrow(parsedDate)) return 'Tomorrow';
    if (isYesterday(parsedDate)) return 'Yesterday';
    return format(parsedDate, 'EEE d');
  };

  const getMonthLabel = () => format(parsedDate, 'MMM');

  const todoTasks = tasks.filter(t => t.status === 'todo');
  const doneTasks = tasks.filter(t => t.status === 'done');

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'flex flex-col min-h-[400px] rounded-2xl p-4 transition-all duration-200',
        'bg-slate-50/80 backdrop-blur-sm border border-slate-200/50',
        isOver && 'ring-2 ring-violet-400/50 bg-violet-50/50',
        isToday(parsedDate) && 'ring-2 ring-violet-500/30 bg-violet-50/30'
      )}
    >
      {/* Column Header */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-200/50">
        <div className="flex items-center gap-2">
          <div className={cn(
            'w-10 h-10 rounded-xl flex flex-col items-center justify-center',
            isToday(parsedDate) 
              ? 'bg-violet-500 text-white' 
              : 'bg-white text-slate-700 shadow-sm'
          )}>
            <span className="text-[10px] font-medium uppercase leading-none">
              {getMonthLabel()}
            </span>
            <span className="text-lg font-bold leading-none">
              {format(parsedDate, 'd')}
            </span>
          </div>
          <div>
            <h3 className={cn(
              'font-semibold',
              isToday(parsedDate) ? 'text-violet-700' : 'text-slate-700'
            )}>
              {getDateLabel()}
            </h3>
            <p className="text-xs text-slate-400">
              {tasks.length} task{tasks.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        
        <button
          onClick={() => onAddTask(date)}
          className={cn(
            'p-2 rounded-lg transition-all',
            'hover:bg-violet-100 text-slate-400 hover:text-violet-600'
          )}
          aria-label={`Add task for ${getDateLabel()}`}
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      {/* Tasks Container */}
      <div className="flex-1 space-y-3 overflow-y-auto">
        <SortableContext items={tasks.map(t => t.id!)} strategy={verticalListSortingStrategy}>
          {/* To-do tasks first */}
          {todoTasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onToggleComplete={onToggleComplete}
              onDelete={onDelete}
            />
          ))}
          
          {/* Separator if both types exist */}
          {todoTasks.length > 0 && doneTasks.length > 0 && (
            <div className="flex items-center gap-2 py-2">
              <div className="flex-1 h-px bg-slate-200" />
              <span className="text-xs text-slate-400">Completed</span>
              <div className="flex-1 h-px bg-slate-200" />
            </div>
          )}
          
          {/* Done tasks */}
          {doneTasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onToggleComplete={onToggleComplete}
              onDelete={onDelete}
            />
          ))}
        </SortableContext>

        {/* Empty State */}
        {tasks.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Calendar className="w-12 h-12 text-slate-300 mb-3" />
            <p className="text-sm text-slate-400">No tasks</p>
            <button
              onClick={() => onAddTask(date)}
              className="mt-2 text-sm text-violet-500 hover:text-violet-600 font-medium"
            >
              Add a task
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
