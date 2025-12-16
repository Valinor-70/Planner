import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, GripVertical, Trash2, Clock } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { Task } from '../../types';

interface TaskCardProps {
  task: Task;
  onToggleComplete: (id: number) => void;
  onDelete: (id: number) => void;
}

const priorityBorderColors = {
  high: 'border-l-rose-500',
  med: 'border-l-amber-500',
  low: 'border-l-sky-500',
};

const priorityBadgeColors = {
  high: 'bg-rose-100 text-rose-700',
  med: 'bg-amber-100 text-amber-700',
  low: 'bg-sky-100 text-sky-700',
};

export function TaskCard({ task, onToggleComplete, onDelete }: TaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id! });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const cn = (...inputs: (string | undefined | false)[]) => twMerge(clsx(inputs));

  const isDone = task.status === 'done';

  return (
    <AnimatePresence mode="wait">
      <motion.div
        ref={setNodeRef}
        style={style}
        initial={{ opacity: 0, y: 10 }}
        animate={{ 
          opacity: isDone ? 0.7 : 1, 
          y: 0,
          scale: isDone ? 0.98 : 1,
        }}
        exit={{ opacity: 0, scale: 0.95 }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        transition={{ duration: 0.2 }}
        className={cn(
          'group relative overflow-hidden rounded-xl border-l-4 p-4',
          'bg-white/60 backdrop-blur-sm shadow-sm',
          'hover:shadow-md hover:bg-white/80',
          'transition-all duration-200',
          priorityBorderColors[task.priority],
          isDragging && 'shadow-lg ring-2 ring-violet-400/50 z-50',
          isDone && 'bg-slate-100/60'
        )}
      >
        {/* Drag Handle */}
        <div
          {...attributes}
          {...listeners}
          className="absolute left-0 top-0 bottom-0 w-8 flex items-center justify-center cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <GripVertical className="w-4 h-4 text-slate-400" />
        </div>

        <div className="ml-4">
          {/* Header with checkbox and title */}
          <div className="flex items-start gap-3">
            <button
              onClick={() => onToggleComplete(task.id!)}
              className={cn(
                'flex-shrink-0 w-5 h-5 rounded-full border-2 transition-all duration-200',
                'flex items-center justify-center',
                isDone 
                  ? 'bg-emerald-500 border-emerald-500' 
                  : 'border-slate-300 hover:border-violet-400'
              )}
            >
              {isDone && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                >
                  <Check className="w-3 h-3 text-white" />
                </motion.div>
              )}
            </button>

            <div className="flex-1 min-w-0">
              <h3
                className={cn(
                  'font-medium text-slate-900 transition-all duration-200',
                  isDone && 'line-through text-slate-500'
                )}
              >
                {task.title}
              </h3>
              
              {task.description && (
                <p className={cn(
                  'mt-1 text-sm text-slate-500 line-clamp-2',
                  isDone && 'line-through'
                )}>
                  {task.description}
                </p>
              )}
            </div>
          </div>

          {/* Footer with priority badge and actions */}
          <div className="mt-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={cn(
                'text-xs font-medium px-2 py-0.5 rounded-full capitalize',
                priorityBadgeColors[task.priority]
              )}>
                {task.priority}
              </span>
              
              {task.createdAt && (
                <span className="flex items-center gap-1 text-xs text-slate-400">
                  <Clock className="w-3 h-3" />
                </span>
              )}
            </div>

            <button
              onClick={() => onDelete(task.id!)}
              className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-rose-100 text-slate-400 hover:text-rose-500 transition-all"
              aria-label="Delete task"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Completion celebration effect */}
        {isDone && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="absolute top-2 right-2"
          >
            <span className="text-emerald-500 text-lg">✓</span>
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
