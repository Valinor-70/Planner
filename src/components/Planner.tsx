import { createSignal, onMount, For, Show } from 'solid-js';
import type { Task } from '../types';
import { getTasks, isLoading, initStore, createTask, toggleTaskCompletion, removeTask, undo, canUndo } from '../lib/taskStore';
import { groupTasksByUrgency } from '../lib/dateUtils';
import { exportData, importData } from '../lib/storage';
import TaskItem from './TaskItem';
import QuickAdd from './QuickAdd';
import PomodoroTimer from './PomodoroTimer';

export default function Planner() {
  const [showQuickAdd, setShowQuickAdd] = createSignal(false);
  const [showPomodoro, setShowPomodoro] = createSignal(false);
  const [selectedTask, setSelectedTask] = createSignal<Task | null>(null);

  onMount(async () => {
    await initStore();
    
    // Keyboard shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd+K or N: new task
      if ((e.metaKey || e.ctrlKey) && e.key === 'k' || e.key === 'n' || e.key === 'N') {
        if (!showQuickAdd()) {
          e.preventDefault();
          setShowQuickAdd(true);
        }
      }
      
      // Ctrl/Cmd+Z: undo
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        e.preventDefault();
        if (canUndo()) {
          undo();
        }
      }
      
      // Escape: close modals
      if (e.key === 'Escape') {
        setShowQuickAdd(false);
        setShowPomodoro(false);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  const groupedTasks = () => {
    const allTasks = getTasks();
    return groupTasksByUrgency(allTasks());
  };

  const handleTaskComplete = async (id: string) => {
    await toggleTaskCompletion(id);
  };

  const handleTaskDelete = async (id: string) => {
    await removeTask(id);
  };

  const handleQuickAdd = async (data: Partial<Task>) => {
    await createTask(data);
    setShowQuickAdd(false);
  };

  const handleStartPomodoro = (task: Task) => {
    setSelectedTask(task);
    setShowPomodoro(true);
  };

  const handleExport = async () => {
    const data = await exportData();
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `planner-export-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const text = await file.text();
        const data = JSON.parse(text);
        await importData(data);
        window.location.reload();
      }
    };
    input.click();
  };

  return (
    <div class="min-h-screen bg-calm-bg text-calm-text">
      <div class="max-w-content mx-auto px-4 py-8">
        {/* Header */}
        <header class="mb-8">
          <h1 class="text-3xl font-bold mb-2">Planner</h1>
          <p class="text-gray-600">What should I work on today?</p>
          
          <div class="flex gap-2 mt-4">
            <button
              onClick={() => setShowQuickAdd(true)}
              class="px-4 py-2 bg-calm-accent text-white rounded-lg hover:bg-indigo-600 transition-calm focus:outline-none focus:ring-2 focus:ring-calm-accent"
            >
              + New Task (N)
            </button>
            
            <button
              onClick={handleExport}
              class="px-4 py-2 bg-gray-200 text-calm-text rounded-lg hover:bg-gray-300 transition-calm focus:outline-none focus:ring-2 focus:ring-gray-400"
            >
              Export
            </button>
            
            <button
              onClick={handleImport}
              class="px-4 py-2 bg-gray-200 text-calm-text rounded-lg hover:bg-gray-300 transition-calm focus:outline-none focus:ring-2 focus:ring-gray-400"
            >
              Import
            </button>
            
            <Show when={canUndo()}>
              <button
                onClick={() => undo()}
                class="px-4 py-2 bg-gray-200 text-calm-text rounded-lg hover:bg-gray-300 transition-calm focus:outline-none focus:ring-2 focus:ring-gray-400"
                title="Undo (Ctrl/Cmd+Z)"
              >
                ↶ Undo
              </button>
            </Show>
          </div>
        </header>

        {/* Quick Add Modal */}
        <Show when={showQuickAdd()}>
          <QuickAdd
            onSave={handleQuickAdd}
            onCancel={() => setShowQuickAdd(false)}
          />
        </Show>

        {/* Pomodoro Timer */}
        <Show when={showPomodoro() && selectedTask()}>
          <PomodoroTimer
            task={selectedTask()!}
            onClose={() => setShowPomodoro(false)}
          />
        </Show>

        {/* Loading State */}
        <Show when={isLoading()}>
          <div class="text-center py-12">
            <p class="text-gray-500">Loading tasks...</p>
          </div>
        </Show>

        {/* Task Groups */}
        <Show when={!isLoading()}>
          <div class="space-y-8">
            {/* Urgent/Due Soon */}
            <Show when={groupedTasks().urgent.length > 0}>
              <section>
                <h2 class="text-xl font-semibold mb-4 text-calm-danger">
                  🔥 Urgent / Due Soon
                </h2>
                <div class="space-y-2">
                  <For each={groupedTasks().urgent}>
                    {(task) => (
                      <TaskItem
                        task={task}
                        onComplete={handleTaskComplete}
                        onDelete={handleTaskDelete}
                        onStartPomodoro={handleStartPomodoro}
                      />
                    )}
                  </For>
                </div>
              </section>
            </Show>

            {/* Today */}
            <Show when={groupedTasks().today.length > 0}>
              <section>
                <h2 class="text-xl font-semibold mb-4">
                  📅 Today
                </h2>
                <div class="space-y-2">
                  <For each={groupedTasks().today}>
                    {(task) => (
                      <TaskItem
                        task={task}
                        onComplete={handleTaskComplete}
                        onDelete={handleTaskDelete}
                        onStartPomodoro={handleStartPomodoro}
                      />
                    )}
                  </For>
                </div>
              </section>
            </Show>

            {/* Upcoming */}
            <Show when={groupedTasks().upcoming.length > 0}>
              <section>
                <h2 class="text-xl font-semibold mb-4 text-gray-600">
                  📆 Upcoming
                </h2>
                <div class="space-y-2">
                  <For each={groupedTasks().upcoming}>
                    {(task) => (
                      <TaskItem
                        task={task}
                        onComplete={handleTaskComplete}
                        onDelete={handleTaskDelete}
                        onStartPomodoro={handleStartPomodoro}
                      />
                    )}
                  </For>
                </div>
              </section>
            </Show>

            {/* Someday */}
            <Show when={groupedTasks().someday.length > 0}>
              <section>
                <h2 class="text-xl font-semibold mb-4 text-gray-500">
                  💭 Someday
                </h2>
                <div class="space-y-2">
                  <For each={groupedTasks().someday}>
                    {(task) => (
                      <TaskItem
                        task={task}
                        onComplete={handleTaskComplete}
                        onDelete={handleTaskDelete}
                        onStartPomodoro={handleStartPomodoro}
                      />
                    )}
                  </For>
                </div>
              </section>
            </Show>

            {/* Empty State */}
            <Show when={getTasks()().length === 0}>
              <div class="text-center py-12">
                <p class="text-gray-500 mb-4">No tasks yet. Create your first task!</p>
                <button
                  onClick={() => setShowQuickAdd(true)}
                  class="px-6 py-3 bg-calm-accent text-white rounded-lg hover:bg-indigo-600 transition-calm focus:outline-none focus:ring-2 focus:ring-calm-accent"
                >
                  + Create Task
                </button>
              </div>
            </Show>
          </div>
        </Show>
      </div>
    </div>
  );
}
