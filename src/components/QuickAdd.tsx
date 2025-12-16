import { createSignal } from 'solid-js';
import type { Task } from '../types';

interface QuickAddProps {
  onSave: (data: Partial<Task>) => void;
  onCancel: () => void;
}

export default function QuickAdd(props: QuickAddProps) {
  const [title, setTitle] = createSignal('');
  const [type, setType] = createSignal<'homework' | 'life'>('homework');
  const [subject, setSubject] = createSignal('');
  const [notes, setNotes] = createSignal('');
  const [dueDate, setDueDate] = createSignal('');
  const [dueTime, setDueTime] = createSignal('');
  const [scheduledDate, setScheduledDate] = createSignal('');
  const [scheduledTime, setScheduledTime] = createSignal('');
  const [estimatedMinutes, setEstimatedMinutes] = createSignal<number | null>(null);
  const [priority, setPriority] = createSignal<'low' | 'medium' | 'high' | null>(null);

  const handleSubmit = (e: Event) => {
    e.preventDefault();
    
    if (!title().trim()) return;
    
    const data: Partial<Task> = {
      title: title().trim(),
      type: type(),
      subject: subject().trim() || null,
      notes: notes().trim() || null,
      dueDate: dueDate() || null,
      dueTime: dueTime() || null,
      scheduledDate: scheduledDate() || null,
      scheduledTime: scheduledTime() || null,
      estimatedMinutes: estimatedMinutes(),
      priority: priority(),
    };
    
    props.onSave(data);
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleSubmit(e);
    }
  };

  return (
    <div 
      class="fixed inset-0 bg-black bg-opacity-30 flex items-start justify-center pt-20 px-4 z-50"
      onClick={props.onCancel}
    >
      <div 
        class="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 class="text-2xl font-bold mb-4">New Task</h2>
        
        <form onSubmit={handleSubmit} onKeyDown={handleKeyDown}>
          {/* Title */}
          <div class="mb-4">
            <label class="block text-sm font-medium mb-1">
              Title <span class="text-calm-danger">*</span>
            </label>
            <input
              type="text"
              value={title()}
              onInput={(e) => setTitle(e.currentTarget.value)}
              placeholder="What do you need to do?"
              class="w-full px-3 py-2 border border-calm-border rounded-lg focus:outline-none focus:ring-2 focus:ring-calm-accent"
              autofocus
            />
          </div>

          {/* Type */}
          <div class="mb-4">
            <label class="block text-sm font-medium mb-1">Type</label>
            <div class="flex gap-2">
              <button
                type="button"
                onClick={() => setType('homework')}
                class={`px-4 py-2 rounded-lg transition-calm focus:outline-none focus:ring-2 focus:ring-calm-accent ${
                  type() === 'homework' 
                    ? 'bg-purple-100 text-purple-700 font-medium' 
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                📚 Homework
              </button>
              <button
                type="button"
                onClick={() => setType('life')}
                class={`px-4 py-2 rounded-lg transition-calm focus:outline-none focus:ring-2 focus:ring-calm-accent ${
                  type() === 'life' 
                    ? 'bg-blue-100 text-blue-700 font-medium' 
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                🌟 Life
              </button>
            </div>
          </div>

          {/* Subject */}
          <div class="mb-4">
            <label class="block text-sm font-medium mb-1">Subject/Category</label>
            <input
              type="text"
              value={subject()}
              onInput={(e) => setSubject(e.currentTarget.value)}
              placeholder="e.g., Math, Computer Science, Personal"
              class="w-full px-3 py-2 border border-calm-border rounded-lg focus:outline-none focus:ring-2 focus:ring-calm-accent"
            />
          </div>

          {/* Due Date/Time */}
          <div class="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label class="block text-sm font-medium mb-1">Due Date</label>
              <input
                type="date"
                value={dueDate()}
                onInput={(e) => setDueDate(e.currentTarget.value)}
                class="w-full px-3 py-2 border border-calm-border rounded-lg focus:outline-none focus:ring-2 focus:ring-calm-accent"
              />
            </div>
            <div>
              <label class="block text-sm font-medium mb-1">Due Time</label>
              <input
                type="time"
                value={dueTime()}
                onInput={(e) => setDueTime(e.currentTarget.value)}
                class="w-full px-3 py-2 border border-calm-border rounded-lg focus:outline-none focus:ring-2 focus:ring-calm-accent"
              />
            </div>
          </div>

          {/* Scheduled Date/Time */}
          <div class="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label class="block text-sm font-medium mb-1">Scheduled Date</label>
              <input
                type="date"
                value={scheduledDate()}
                onInput={(e) => setScheduledDate(e.currentTarget.value)}
                class="w-full px-3 py-2 border border-calm-border rounded-lg focus:outline-none focus:ring-2 focus:ring-calm-accent"
              />
            </div>
            <div>
              <label class="block text-sm font-medium mb-1">Scheduled Time</label>
              <input
                type="time"
                value={scheduledTime()}
                onInput={(e) => setScheduledTime(e.currentTarget.value)}
                class="w-full px-3 py-2 border border-calm-border rounded-lg focus:outline-none focus:ring-2 focus:ring-calm-accent"
              />
            </div>
          </div>

          {/* Estimated Minutes */}
          <div class="mb-4">
            <label class="block text-sm font-medium mb-1">Estimated Time (minutes)</label>
            <input
              type="number"
              value={estimatedMinutes() || ''}
              onInput={(e) => {
                const val = parseInt(e.currentTarget.value);
                setEstimatedMinutes(isNaN(val) ? null : val);
              }}
              placeholder="e.g., 30, 60, 120"
              class="w-full px-3 py-2 border border-calm-border rounded-lg focus:outline-none focus:ring-2 focus:ring-calm-accent"
            />
          </div>

          {/* Priority */}
          <div class="mb-6">
            <label class="block text-sm font-medium mb-1">Priority</label>
            <div class="flex gap-2">
              <button
                type="button"
                onClick={() => setPriority(priority() === 'high' ? null : 'high')}
                class={`px-4 py-2 rounded-lg transition-calm focus:outline-none focus:ring-2 focus:ring-red-400 ${
                  priority() === 'high' 
                    ? 'bg-red-100 text-red-700 font-medium' 
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                🔴 High
              </button>
              <button
                type="button"
                onClick={() => setPriority(priority() === 'medium' ? null : 'medium')}
                class={`px-4 py-2 rounded-lg transition-calm focus:outline-none focus:ring-2 focus:ring-yellow-400 ${
                  priority() === 'medium' 
                    ? 'bg-yellow-100 text-yellow-700 font-medium' 
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                🟡 Medium
              </button>
              <button
                type="button"
                onClick={() => setPriority(priority() === 'low' ? null : 'low')}
                class={`px-4 py-2 rounded-lg transition-calm focus:outline-none focus:ring-2 focus:ring-green-400 ${
                  priority() === 'low' 
                    ? 'bg-green-100 text-green-700 font-medium' 
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                🟢 Low
              </button>
            </div>
          </div>

          {/* Notes */}
          <div class="mb-6">
            <label class="block text-sm font-medium mb-1">Notes</label>
            <textarea
              value={notes()}
              onInput={(e) => setNotes(e.currentTarget.value)}
              placeholder="Additional details..."
              rows={3}
              class="w-full px-3 py-2 border border-calm-border rounded-lg focus:outline-none focus:ring-2 focus:ring-calm-accent resize-none"
            />
          </div>

          {/* Actions */}
          <div class="flex justify-end gap-2">
            <button
              type="button"
              onClick={props.onCancel}
              class="px-6 py-2 bg-gray-200 text-calm-text rounded-lg hover:bg-gray-300 transition-calm focus:outline-none focus:ring-2 focus:ring-gray-400"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!title().trim()}
              class="px-6 py-2 bg-calm-accent text-white rounded-lg hover:bg-indigo-600 transition-calm focus:outline-none focus:ring-2 focus:ring-calm-accent disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Create Task
            </button>
          </div>
          
          <p class="text-xs text-gray-500 mt-2 text-right">
            Press Enter or Ctrl/Cmd+Enter to save
          </p>
        </form>
      </div>
    </div>
  );
}
