/**
 * Command Palette Component
 * A command palette (Cmd/Ctrl+K) for quick navigation and actions
 */

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Calendar,
  Plus,
  Settings,
  Moon,
  Sun,
  FileText,
  LayoutGrid,
  List,
  CalendarDays,
  Home,
  ArrowRight,
  Command,
  Focus,
  Download,
  Trash2
} from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { Command as CommandType } from '../../types';

const cn = (...inputs: (string | undefined | false)[]) => twMerge(clsx(inputs));

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onAction: (actionId: string) => void;
}

interface CommandGroup {
  label: string;
  commands: CommandType[];
}

export function CommandPalette({ isOpen, onClose, onAction }: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Define available commands
  const commandGroups: CommandGroup[] = useMemo(() => [
    {
      label: 'Quick Actions',
      commands: [
        {
          id: 'new-task',
          label: 'New Task',
          description: 'Create a new task',
          icon: 'Plus',
          shortcut: '⌘N',
          action: () => onAction('new-task'),
          category: 'actions',
        },
        {
          id: 'new-note',
          label: 'New Note',
          description: 'Create a new note',
          icon: 'FileText',
          shortcut: '⌘⇧N',
          action: () => onAction('new-note'),
          category: 'actions',
        },
        {
          id: 'focus-mode',
          label: 'Toggle Focus Mode',
          description: 'Enter distraction-free mode',
          icon: 'Focus',
          action: () => onAction('focus-mode'),
          category: 'actions',
        },
      ],
    },
    {
      label: 'Navigation',
      commands: [
        {
          id: 'go-dashboard',
          label: 'Go to Dashboard',
          description: 'View your task board',
          icon: 'Home',
          action: () => { window.location.href = '/dashboard'; },
          category: 'navigation',
        },
        {
          id: 'go-settings',
          label: 'Go to Settings',
          description: 'Configure your preferences',
          icon: 'Settings',
          action: () => { window.location.href = '/settings'; },
          category: 'navigation',
        },
      ],
    },
    {
      label: 'View',
      commands: [
        {
          id: 'view-day',
          label: 'Day View',
          description: 'Switch to daily view',
          icon: 'List',
          action: () => onAction('view-day'),
          category: 'view',
        },
        {
          id: 'view-week',
          label: 'Week View',
          description: 'Switch to weekly view',
          icon: 'LayoutGrid',
          action: () => onAction('view-week'),
          category: 'view',
        },
        {
          id: 'view-month',
          label: 'Month View',
          description: 'Switch to monthly view',
          icon: 'CalendarDays',
          action: () => onAction('view-month'),
          category: 'view',
        },
      ],
    },
    {
      label: 'Theme',
      commands: [
        {
          id: 'theme-light',
          label: 'Light Theme',
          description: 'Switch to light mode',
          icon: 'Sun',
          action: () => onAction('theme-light'),
          category: 'theme',
        },
        {
          id: 'theme-dark',
          label: 'Dark Theme',
          description: 'Switch to dark mode',
          icon: 'Moon',
          action: () => onAction('theme-dark'),
          category: 'theme',
        },
      ],
    },
    {
      label: 'Data',
      commands: [
        {
          id: 'export-data',
          label: 'Export Data',
          description: 'Download your data as JSON',
          icon: 'Download',
          action: () => onAction('export-data'),
          category: 'data',
        },
      ],
    },
  ], [onAction]);

  // Filter commands based on query
  const filteredGroups = useMemo(() => {
    if (!query.trim()) return commandGroups;

    const lowerQuery = query.toLowerCase();
    return commandGroups
      .map((group) => ({
        ...group,
        commands: group.commands.filter(
          (cmd) =>
            cmd.label.toLowerCase().includes(lowerQuery) ||
            cmd.description?.toLowerCase().includes(lowerQuery) ||
            cmd.category?.toLowerCase().includes(lowerQuery)
        ),
      }))
      .filter((group) => group.commands.length > 0);
  }, [query, commandGroups]);

  // Flatten commands for keyboard navigation
  const allFilteredCommands = useMemo(
    () => filteredGroups.flatMap((g) => g.commands),
    [filteredGroups]
  );

  // Reset selection when query or results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Focus input when palette opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex((prev) =>
            prev < allFilteredCommands.length - 1 ? prev + 1 : 0
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex((prev) =>
            prev > 0 ? prev - 1 : allFilteredCommands.length - 1
          );
          break;
        case 'Enter':
          e.preventDefault();
          if (allFilteredCommands[selectedIndex]) {
            allFilteredCommands[selectedIndex].action();
            onClose();
          }
          break;
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
      }
    },
    [allFilteredCommands, selectedIndex, onClose]
  );

  // Scroll selected item into view
  useEffect(() => {
    const selectedElement = listRef.current?.querySelector(
      `[data-index="${selectedIndex}"]`
    );
    selectedElement?.scrollIntoView({ block: 'nearest' });
  }, [selectedIndex]);

  // Get icon component
  const getIcon = (iconName: string) => {
    const icons: Record<string, typeof Search> = {
      Search,
      Calendar,
      Plus,
      Settings,
      Moon,
      Sun,
      FileText,
      LayoutGrid,
      List,
      CalendarDays,
      Home,
      Focus,
      Download,
      Trash2,
    };
    return icons[iconName] || Search;
  };

  // Calculate command index across all groups
  let globalIndex = 0;

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
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />

          {/* Palette Container */}
          <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              transition={{ duration: 0.15 }}
              className="w-full max-w-xl"
            >
              <div className="bg-surface-primary rounded-2xl shadow-2xl border border-surface-border overflow-hidden">
                {/* Search Input */}
                <div className="flex items-center gap-3 px-4 py-3 border-b border-surface-border">
                  <Search className="w-5 h-5 text-text-muted" />
                  <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Type a command or search..."
                    className="flex-1 bg-transparent text-text-primary placeholder-text-muted focus:outline-none text-lg"
                  />
                  <kbd className="hidden sm:flex items-center gap-1 px-2 py-1 text-xs font-medium text-text-muted bg-neutral-100 dark:bg-neutral-800 rounded">
                    ESC
                  </kbd>
                </div>

                {/* Command List */}
                <div
                  ref={listRef}
                  className="max-h-80 overflow-y-auto py-2"
                >
                  {filteredGroups.length === 0 ? (
                    <div className="px-4 py-8 text-center text-text-muted">
                      No commands found for "{query}"
                    </div>
                  ) : (
                    filteredGroups.map((group) => (
                      <div key={group.label}>
                        <div className="px-4 py-2 text-xs font-semibold text-text-muted uppercase tracking-wider">
                          {group.label}
                        </div>
                        {group.commands.map((command) => {
                          const currentIndex = globalIndex++;
                          const Icon = getIcon(command.icon || 'Search');
                          const isSelected = selectedIndex === currentIndex;

                          return (
                            <button
                              key={command.id}
                              data-index={currentIndex}
                              onClick={() => {
                                command.action();
                                onClose();
                              }}
                              onMouseEnter={() => setSelectedIndex(currentIndex)}
                              className={cn(
                                'w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors',
                                isSelected
                                  ? 'bg-primary-100 dark:bg-primary-900/30'
                                  : 'hover:bg-neutral-100 dark:hover:bg-neutral-800'
                              )}
                            >
                              <div
                                className={cn(
                                  'w-8 h-8 rounded-lg flex items-center justify-center',
                                  isSelected
                                    ? 'bg-primary-500 text-white'
                                    : 'bg-neutral-100 dark:bg-neutral-800 text-text-secondary'
                                )}
                              >
                                <Icon className="w-4 h-4" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div
                                  className={cn(
                                    'font-medium',
                                    isSelected
                                      ? 'text-primary-700 dark:text-primary-400'
                                      : 'text-text-primary'
                                  )}
                                >
                                  {command.label}
                                </div>
                                {command.description && (
                                  <div className="text-sm text-text-muted truncate">
                                    {command.description}
                                  </div>
                                )}
                              </div>
                              {command.shortcut && (
                                <kbd className="hidden sm:flex px-2 py-1 text-xs font-medium text-text-muted bg-neutral-100 dark:bg-neutral-800 rounded">
                                  {command.shortcut}
                                </kbd>
                              )}
                              {isSelected && (
                                <ArrowRight className="w-4 h-4 text-primary-500" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    ))
                  )}
                </div>

                {/* Footer */}
                <div className="px-4 py-2 border-t border-surface-border bg-neutral-50 dark:bg-neutral-900/50">
                  <div className="flex items-center justify-between text-xs text-text-muted">
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1">
                        <kbd className="px-1.5 py-0.5 bg-neutral-200 dark:bg-neutral-700 rounded">↑</kbd>
                        <kbd className="px-1.5 py-0.5 bg-neutral-200 dark:bg-neutral-700 rounded">↓</kbd>
                        <span className="ml-1">to navigate</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <kbd className="px-1.5 py-0.5 bg-neutral-200 dark:bg-neutral-700 rounded">↵</kbd>
                        <span className="ml-1">to select</span>
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Command className="w-3 h-3" />
                      <span>K to open</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

export default CommandPalette;
