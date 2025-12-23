import { Show } from 'solid-js';
import type { Task } from '../types';
import { getTaskDueDate, formatRelativeTime, formatDate, isTaskOverdue } from '../lib/dateUtils';

interface TaskItemProps {
  task: Task;
  onComplete: (id: string) => void;
  onDelete: (id: string) => void;
  onStartPomodoro: (task: Task) => void;
}

export default function TaskItem(props: TaskItemProps) {
  const dueDate = () => getTaskDueDate(props.task);
  const isOverdue = () => isTaskOverdue(props.task);
  
  const dueDateDisplay = () => {
    if (!dueDate()) return null;
    const date = dueDate()!;
    return formatRelativeTime(date);
  };

  const typeColor = () => {
    return props.task.type === 'homework' ? 'text-purple-600' : 'text-blue-600';
  };

  const priorityIndicator = () => {
    if (props.task.priority === 'high') return '🔴';
    if (props.task.priority === 'medium') return '🟡';
    if (props.task.priority === 'low') return '🟢';
    return '';
  };

  return (
    <div 
      class={`
        p-4 bg-white rounded-lg border transition-calm
        ${isOverdue() ? 'border-calm-danger' : 'border-calm-border'}
        hover:shadow-md
      `}
    >
      <div class="flex items-start gap-3">
        {/* Checkbox */}
        <button
          onClick={() => props.onComplete(props.task.id)}
          class="mt-1 w-5 h-5 rounded border-2 border-calm-accent flex items-center justify-center hover:bg-indigo-50 transition-calm focus:outline-none focus:ring-2 focus:ring-calm-accent"
          aria-label="Complete task"
        >
          <Show when={props.task.completed}>
            <svg class="w-4 h-4 text-calm-accent" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
            </svg>
          </Show>
        </button>

        {/* Task Content */}
        <div class="flex-1 min-w-0">
          <div class="flex items-start justify-between gap-2">
            <div class="flex-1">
              <h3 class={`font-medium ${props.task.completed ? 'line-through text-gray-400' : ''}`}>
                {priorityIndicator()} {props.task.title}
              </h3>
              
              <div class="flex flex-wrap items-center gap-2 mt-1 text-sm">
                <span class={`${typeColor()} font-medium`}>
                  {props.task.type === 'homework' ? '📚 Homework' : '🌟 Life'}
                </span>
                
                <Show when={props.task.subject}>
                  <span class="text-gray-600">• {props.task.subject}</span>
                </Show>
                
                <Show when={dueDateDisplay()}>
                  <span class={`${isOverdue() ? 'text-calm-danger font-medium' : 'text-gray-600'}`}>
                    • Due {dueDateDisplay()}
                  </span>
                </Show>
                
                <Show when={props.task.scheduledDate}>
                  <span class="text-gray-600">
                    • Scheduled {formatDate(props.task.scheduledDate!)}
                  </span>
                </Show>
                
                <Show when={props.task.estimatedMinutes}>
                  <span class="text-gray-600">
                    • {props.task.estimatedMinutes}min
                  </span>
                </Show>
                
                <Show when={props.task.pomodoroCount > 0}>
                  <span class="text-gray-600">
                    • 🍅 {props.task.pomodoroCount}
                  </span>
                </Show>
              </div>
              
              <Show when={props.task.notes}>
                <p class="text-sm text-gray-600 mt-2">{props.task.notes}</p>
              </Show>
            </div>

            {/* Actions */}
            <div class="flex gap-1">
              <Show when={!props.task.completed}>
                <button
                  onClick={() => props.onStartPomodoro(props.task)}
                  class="p-2 text-gray-600 hover:text-calm-accent hover:bg-indigo-50 rounded transition-calm focus:outline-none focus:ring-2 focus:ring-calm-accent"
                  title="Start Pomodoro"
                >
                  🍅
                </button>
              </Show>
              
              <button
                onClick={() => props.onDelete(props.task.id)}
                class="p-2 text-gray-600 hover:text-calm-danger hover:bg-red-50 rounded transition-calm focus:outline-none focus:ring-2 focus:ring-calm-danger"
                title="Delete task"
              >
                🗑️
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
