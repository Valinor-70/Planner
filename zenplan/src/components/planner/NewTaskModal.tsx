import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Flag, AlignLeft, Sparkles } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format } from 'date-fns';

import { addTask } from '../../lib/db';
import type { Priority, TaskFormData } from '../../types';

interface NewTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultDate?: string | null;
}

const cn = (...inputs: (string | undefined | false)[]) => twMerge(clsx(inputs));

const priorities: { value: Priority; label: string; color: string }[] = [
  { value: 'low', label: 'Low', color: 'bg-sky-100 text-sky-700 border-sky-200' },
  { value: 'med', label: 'Medium', color: 'bg-amber-100 text-amber-700 border-amber-200' },
  { value: 'high', label: 'High', color: 'bg-rose-100 text-rose-700 border-rose-200' },
];

export function NewTaskModal({ isOpen, onClose, defaultDate }: NewTaskModalProps) {
  const [formData, setFormData] = useState<TaskFormData>({
    title: '',
    date: defaultDate || format(new Date(), 'yyyy-MM-dd'),
    priority: 'med',
    description: '',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof TaskFormData, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const titleInputRef = useRef<HTMLInputElement>(null);

  // Update date when defaultDate changes
  useEffect(() => {
    if (defaultDate) {
      setFormData(prev => ({ ...prev, date: defaultDate }));
    }
  }, [defaultDate]);

  // Focus title input when modal opens
  useEffect(() => {
    if (isOpen && titleInputRef.current) {
      setTimeout(() => titleInputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setFormData({
        title: '',
        date: defaultDate || format(new Date(), 'yyyy-MM-dd'),
        priority: 'med',
        description: '',
      });
      setErrors({});
    }
  }, [isOpen, defaultDate]);

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof TaskFormData, string>> = {};
    
    if (!formData.title.trim()) {
      newErrors.title = 'Task title is required';
    } else if (formData.title.length > 100) {
      newErrors.title = 'Title must be less than 100 characters';
    }

    if (!formData.date) {
      newErrors.date = 'Please select a date';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      await addTask({
        title: formData.title.trim(),
        date: formData.date,
        priority: formData.priority,
        description: formData.description?.trim() || undefined,
        status: 'todo',
      });
      onClose();
    } catch (error) {
      console.error('Failed to add task:', error);
      setErrors({ title: 'Failed to create task. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', duration: 0.3 }}
            onKeyDown={handleKeyDown}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg z-50"
          >
            <div className="bg-white rounded-2xl shadow-2xl overflow-hidden mx-4">
              {/* Header */}
              <div className="relative px-6 pt-6 pb-4 bg-gradient-to-r from-violet-500 to-violet-600">
                <button
                  onClick={onClose}
                  className="absolute right-4 top-4 p-1 rounded-lg hover:bg-white/20 text-white/80 hover:text-white transition-colors"
                  aria-label="Close modal"
                >
                  <X className="w-5 h-5" />
                </button>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-white">Create New Task</h2>
                    <p className="text-sm text-white/70">Add a new task to your planner</p>
                  </div>
                </div>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="p-6 space-y-5">
                {/* Title */}
                <div>
                  <label htmlFor="task-title" className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                    <AlignLeft className="w-4 h-4" />
                    Task Title
                  </label>
                  <input
                    ref={titleInputRef}
                    id="task-title"
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Enter task title..."
                    className={cn(
                      'w-full px-4 py-3 rounded-xl border transition-all',
                      'focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500',
                      errors.title ? 'border-rose-300 bg-rose-50' : 'border-slate-200 bg-slate-50'
                    )}
                  />
                  {errors.title && (
                    <p className="mt-1.5 text-sm text-rose-500">{errors.title}</p>
                  )}
                </div>

                {/* Date */}
                <div>
                  <label htmlFor="task-date" className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                    <Calendar className="w-4 h-4" />
                    Due Date
                  </label>
                  <input
                    id="task-date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                    className={cn(
                      'w-full px-4 py-3 rounded-xl border transition-all',
                      'focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500',
                      errors.date ? 'border-rose-300 bg-rose-50' : 'border-slate-200 bg-slate-50'
                    )}
                  />
                  {errors.date && (
                    <p className="mt-1.5 text-sm text-rose-500">{errors.date}</p>
                  )}
                </div>

                {/* Priority */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                    <Flag className="w-4 h-4" />
                    Priority
                  </label>
                  <div className="flex gap-2">
                    {priorities.map(({ value, label, color }) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, priority: value }))}
                        className={cn(
                          'flex-1 px-4 py-2.5 rounded-xl border-2 text-sm font-medium transition-all',
                          formData.priority === value
                            ? cn(color, 'border-current')
                            : 'bg-slate-50 text-slate-500 border-transparent hover:bg-slate-100'
                        )}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Description (Optional) */}
                <div>
                  <label htmlFor="task-description" className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                    <AlignLeft className="w-4 h-4" />
                    Description
                    <span className="text-slate-400 font-normal">(optional)</span>
                  </label>
                  <textarea
                    id="task-description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Add more details..."
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 transition-all resize-none"
                  />
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 px-4 py-3 rounded-xl border border-slate-200 text-slate-600 font-medium hover:bg-slate-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={cn(
                      'flex-1 px-4 py-3 rounded-xl font-medium transition-all',
                      'bg-gradient-to-r from-violet-500 to-violet-600 text-white',
                      'hover:shadow-lg hover:shadow-violet-500/25',
                      'disabled:opacity-50 disabled:cursor-not-allowed'
                    )}
                  >
                    {isSubmitting ? 'Creating...' : 'Create Task'}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
