import { createSignal, onCleanup } from 'solid-js';
import type { Task } from '../types';
import { incrementPomodoro } from '../lib/taskStore';

interface PomodoroTimerProps {
  task: Task;
  onClose: () => void;
}

const POMODORO_DURATION = 25 * 60; // 25 minutes in seconds
const BREAK_DURATION = 5 * 60; // 5 minutes in seconds

export default function PomodoroTimer(props: PomodoroTimerProps) {
  const [timeLeft, setTimeLeft] = createSignal(POMODORO_DURATION);
  const [isRunning, setIsRunning] = createSignal(false);
  const [isBreak, setIsBreak] = createSignal(false);
  
  let interval: number | undefined;

  const startTimer = () => {
    if (interval) return;
    
    setIsRunning(true);
    interval = window.setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          handleTimerComplete();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const pauseTimer = () => {
    if (interval) {
      clearInterval(interval);
      interval = undefined;
    }
    setIsRunning(false);
  };

  const resetTimer = () => {
    pauseTimer();
    setTimeLeft(isBreak() ? BREAK_DURATION : POMODORO_DURATION);
  };

  const handleTimerComplete = async () => {
    pauseTimer();
    
    if (!isBreak()) {
      // Pomodoro completed, increment count
      await incrementPomodoro(props.task.id);
      setIsBreak(true);
      setTimeLeft(BREAK_DURATION);
      
      // Play a subtle notification (if possible)
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Pomodoro Complete!', {
          body: 'Time for a break. Great work!',
          icon: '/favicon.svg'
        });
      }
    } else {
      // Break completed
      setIsBreak(false);
      setTimeLeft(POMODORO_DURATION);
      
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Break Complete!', {
          body: 'Ready to start another pomodoro?',
          icon: '/favicon.svg'
        });
      }
    }
  };

  onCleanup(() => {
    if (interval) {
      clearInterval(interval);
    }
  });

  const formatTime = () => {
    const minutes = Math.floor(timeLeft() / 60);
    const seconds = timeLeft() % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const progress = () => {
    const total = isBreak() ? BREAK_DURATION : POMODORO_DURATION;
    return ((total - timeLeft()) / total) * 100;
  };

  return (
    <div 
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center px-4 z-50"
      onClick={props.onClose}
    >
      <div 
        class="bg-white rounded-lg shadow-xl max-w-md w-full p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div class="text-center">
          <h2 class="text-2xl font-bold mb-2">
            {isBreak() ? '☕ Break Time' : '🍅 Focus Time'}
          </h2>
          <p class="text-gray-600 mb-6">{props.task.title}</p>

          {/* Timer Display */}
          <div class="relative mb-8">
            <svg class="w-48 h-48 mx-auto transform -rotate-90">
              <circle
                cx="96"
                cy="96"
                r="88"
                stroke="#e0e0e0"
                stroke-width="8"
                fill="none"
              />
              <circle
                cx="96"
                cy="96"
                r="88"
                stroke={isBreak() ? '#10b981' : '#6366f1'}
                stroke-width="8"
                fill="none"
                stroke-dasharray={`${2 * Math.PI * 88}`}
                stroke-dashoffset={`${2 * Math.PI * 88 * (1 - progress() / 100)}`}
                class="transition-all duration-1000"
              />
            </svg>
            <div class="absolute inset-0 flex items-center justify-center">
              <span class="text-5xl font-bold">{formatTime()}</span>
            </div>
          </div>

          {/* Controls */}
          <div class="flex justify-center gap-3 mb-6">
            {!isRunning() ? (
              <button
                onClick={startTimer}
                class="px-8 py-3 bg-calm-accent text-white rounded-lg hover:bg-indigo-600 transition-calm focus:outline-none focus:ring-2 focus:ring-calm-accent font-medium"
              >
                Start
              </button>
            ) : (
              <button
                onClick={pauseTimer}
                class="px-8 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-calm focus:outline-none focus:ring-2 focus:ring-orange-500 font-medium"
              >
                Pause
              </button>
            )}
            
            <button
              onClick={resetTimer}
              class="px-8 py-3 bg-gray-200 text-calm-text rounded-lg hover:bg-gray-300 transition-calm focus:outline-none focus:ring-2 focus:ring-gray-400 font-medium"
            >
              Reset
            </button>
          </div>

          {/* Stats */}
          <div class="text-sm text-gray-600 mb-6">
            <p>Pomodoros completed: {props.task.pomodoroCount}</p>
          </div>

          {/* Close */}
          <button
            onClick={props.onClose}
            class="text-gray-500 hover:text-gray-700 transition-calm"
          >
            Close (Esc)
          </button>
        </div>
      </div>
    </div>
  );
}
