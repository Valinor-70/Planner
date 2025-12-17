/**
 * ThemeToggle Component
 * Accessible theme switcher with light/dark/auto modes
 * Persists preference to IndexedDB with localStorage fallback
 */

import { useState, useEffect, useCallback } from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { 
  type Theme, 
  loadTheme, 
  saveTheme, 
  applyTheme, 
  getEffectiveTheme,
  setupThemeListener 
} from '../../lib/theme';

const cn = (...inputs: (string | undefined | false)[]) => twMerge(clsx(inputs));

interface ThemeOption {
  value: Theme;
  label: string;
  icon: typeof Sun;
  ariaLabel: string;
}

const themeOptions: ThemeOption[] = [
  { value: 'light', label: 'Light', icon: Sun, ariaLabel: 'Switch to light theme' },
  { value: 'dark', label: 'Dark', icon: Moon, ariaLabel: 'Switch to dark theme' },
  { value: 'auto', label: 'Auto', icon: Monitor, ariaLabel: 'Use system theme preference' },
];

interface ThemeToggleProps {
  /** Display mode: 'icon' shows only icons, 'full' shows icons with labels */
  variant?: 'icon' | 'full' | 'dropdown';
  /** Additional CSS classes */
  className?: string;
}

export function ThemeToggle({ variant = 'icon', className }: ThemeToggleProps) {
  const [theme, setTheme] = useState<Theme>('auto');
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  // Load initial theme
  useEffect(() => {
    setMounted(true);
    loadTheme().then((savedTheme) => {
      setTheme(savedTheme);
      applyTheme(savedTheme);
    });
  }, []);

  // Listen for system theme changes when in auto mode
  useEffect(() => {
    if (theme !== 'auto') return;

    const cleanup = setupThemeListener(() => {
      // Re-apply theme to update effective theme
      applyTheme('auto');
    });

    return cleanup;
  }, [theme]);

  const handleThemeChange = useCallback(async (newTheme: Theme) => {
    setTheme(newTheme);
    applyTheme(newTheme);
    await saveTheme(newTheme);
    setIsOpen(false);
  }, []);

  // Cycle through themes for icon-only mode
  const cycleTheme = useCallback(() => {
    const currentIndex = themeOptions.findIndex(opt => opt.value === theme);
    const nextIndex = (currentIndex + 1) % themeOptions.length;
    handleThemeChange(themeOptions[nextIndex].value);
  }, [theme, handleThemeChange]);

  // Don't render until mounted to avoid hydration mismatch
  if (!mounted) {
    return (
      <div className={cn('w-10 h-10 rounded-lg bg-neutral-200 animate-pulse', className)} />
    );
  }

  const currentOption = themeOptions.find(opt => opt.value === theme) || themeOptions[0];
  const CurrentIcon = currentOption.icon;
  const effectiveTheme = getEffectiveTheme(theme);

  // Icon-only button that cycles through themes
  if (variant === 'icon') {
    return (
      <button
        onClick={cycleTheme}
        className={cn(
          'relative p-2 rounded-lg transition-all',
          'hover:bg-neutral-100 dark:hover:bg-neutral-800',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500',
          'text-neutral-600 dark:text-neutral-300',
          className
        )}
        aria-label={`Current theme: ${currentOption.label}. Click to change.`}
        title={`Theme: ${currentOption.label}`}
      >
        <CurrentIcon className="w-5 h-5" />
        {theme === 'auto' && (
          <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-primary-500" />
        )}
      </button>
    );
  }

  // Full button group showing all options
  if (variant === 'full') {
    return (
      <div 
        className={cn(
          'flex items-center gap-1 p-1 rounded-xl bg-neutral-100 dark:bg-neutral-800',
          className
        )}
        role="radiogroup"
        aria-label="Theme selection"
      >
        {themeOptions.map((option) => {
          const Icon = option.icon;
          const isSelected = theme === option.value;
          
          return (
            <button
              key={option.value}
              onClick={() => handleThemeChange(option.value)}
              role="radio"
              aria-checked={isSelected}
              aria-label={option.ariaLabel}
              className={cn(
                'flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all',
                isSelected
                  ? 'bg-white dark:bg-neutral-700 text-primary-600 dark:text-primary-400 shadow-sm'
                  : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'
              )}
            >
              <Icon className="w-4 h-4" />
              <span className="sr-only sm:not-sr-only">{option.label}</span>
            </button>
          );
        })}
      </div>
    );
  }

  // Dropdown variant
  return (
    <div className={cn('relative', className)}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex items-center gap-2 p-2 rounded-lg transition-all',
          'hover:bg-neutral-100 dark:hover:bg-neutral-800',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500',
          'text-neutral-600 dark:text-neutral-300'
        )}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={`Theme: ${currentOption.label}`}
      >
        <CurrentIcon className="w-5 h-5" />
        <span className="text-sm font-medium">{currentOption.label}</span>
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />
          
          {/* Dropdown menu */}
          <div
            className={cn(
              'absolute right-0 top-full mt-2 z-50',
              'w-40 py-1 rounded-xl shadow-lg',
              'bg-white dark:bg-neutral-800',
              'border border-neutral-200 dark:border-neutral-700',
              'animate-scale-in origin-top-right'
            )}
            role="listbox"
            aria-label="Select theme"
          >
            {themeOptions.map((option) => {
              const Icon = option.icon;
              const isSelected = theme === option.value;
              
              return (
                <button
                  key={option.value}
                  onClick={() => handleThemeChange(option.value)}
                  role="option"
                  aria-selected={isSelected}
                  className={cn(
                    'flex items-center gap-3 w-full px-3 py-2 text-left text-sm transition-colors',
                    isSelected
                      ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                      : 'text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-700'
                  )}
                >
                  <Icon className="w-4 h-4" />
                  <span>{option.label}</span>
                  {isSelected && (
                    <span className="ml-auto text-primary-500">✓</span>
                  )}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

export default ThemeToggle;
