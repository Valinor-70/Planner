/**
 * Onboarding Wizard Component
 * A 3-step onboarding flow for first-time users
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User,
  Palette,
  Calendar,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Sun,
  Moon,
  Monitor,
  Check,
  LayoutGrid,
  List,
  CalendarDays,
  Rocket
} from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { Theme, DefaultView, WeekStart, OnboardingData } from '../../types';
import { saveProfile, saveSettings, loadDemoData, hasExistingData } from '../../lib/db';
import { saveTheme, applyTheme } from '../../lib/theme';

const cn = (...inputs: (string | undefined | false)[]) => twMerge(clsx(inputs));

interface OnboardingWizardProps {
  onComplete: () => void;
}

const steps = [
  { id: 'welcome', title: 'Welcome', icon: User },
  { id: 'appearance', title: 'Appearance', icon: Palette },
  { id: 'preferences', title: 'Preferences', icon: Calendar },
];

export function OnboardingWizard({ onComplete }: OnboardingWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [data, setData] = useState<OnboardingData>({
    name: '',
    theme: 'auto',
    defaultView: 'weekly',
    weekStart: 'monday',
    loadDemoData: true,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check for existing data on mount
  useEffect(() => {
    async function checkData() {
      const exists = await hasExistingData();
      if (exists) {
        // User has data, skip to dashboard
        onComplete();
      }
    }
    checkData();
  }, [onComplete]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    setIsSubmitting(true);
    
    try {
      // Save profile
      await saveProfile({
        name: data.name || 'User',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      });

      // Save settings
      await saveSettings({
        theme: data.theme,
        defaultView: data.defaultView,
        weekStart: data.weekStart,
        onboardingCompleted: true,
      });

      // Apply theme
      applyTheme(data.theme);
      await saveTheme(data.theme);

      // Load demo data if requested
      if (data.loadDemoData) {
        await loadDemoData();
      }

      onComplete();
    } catch (error) {
      console.error('Failed to complete onboarding:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateData = (updates: Partial<OnboardingData>) => {
    setData(prev => ({ ...prev, ...updates }));
  };

  const canProceed = () => {
    switch (currentStep) {
      case 0:
        return data.name.trim().length > 0;
      default:
        return true;
    }
  };

  return (
    <div className="min-h-screen bg-bg-primary flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Progress indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = index === currentStep;
              const isCompleted = index < currentStep;

              return (
                <div key={step.id} className="flex items-center">
                  <div
                    className={cn(
                      'w-10 h-10 rounded-full flex items-center justify-center transition-all',
                      isActive && 'bg-primary-500 text-white scale-110',
                      isCompleted && 'bg-success-500 text-white',
                      !isActive && !isCompleted && 'bg-neutral-200 dark:bg-neutral-700 text-text-muted'
                    )}
                  >
                    {isCompleted ? (
                      <Check className="w-5 h-5" />
                    ) : (
                      <Icon className="w-5 h-5" />
                    )}
                  </div>
                  {index < steps.length - 1 && (
                    <div
                      className={cn(
                        'w-16 h-1 mx-2 rounded-full transition-all',
                        isCompleted ? 'bg-success-500' : 'bg-neutral-200 dark:bg-neutral-700'
                      )}
                    />
                  )}
                </div>
              );
            })}
          </div>
          <p className="text-center text-text-muted text-sm">
            Step {currentStep + 1} of {steps.length}
          </p>
        </div>

        {/* Card */}
        <motion.div
          className="card p-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <AnimatePresence mode="wait">
            {/* Step 1: Welcome */}
            {currentStep === 0 && (
              <motion.div
                key="welcome"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                <div className="text-center">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center mx-auto mb-4">
                    <Sparkles className="w-8 h-8 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-text-primary mb-2">
                    Welcome to ZenPlan! 🎉
                  </h2>
                  <p className="text-text-secondary">
                    Let's personalize your planning experience. This will only take a minute.
                  </p>
                </div>

                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-text-primary mb-2">
                    What should we call you?
                  </label>
                  <input
                    id="name"
                    type="text"
                    value={data.name}
                    onChange={(e) => updateData({ name: e.target.value })}
                    placeholder="Enter your name"
                    className="input text-lg"
                    autoFocus
                  />
                </div>

                <div className="p-4 rounded-xl bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800">
                  <h3 className="font-medium text-primary-700 dark:text-primary-400 mb-2">
                    What makes ZenPlan special?
                  </h3>
                  <ul className="space-y-2 text-sm text-primary-600 dark:text-primary-400">
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4" />
                      100% offline - your data stays on your device
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4" />
                      Beautiful, calm interface designed for focus
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4" />
                      Keyboard-first with powerful shortcuts
                    </li>
                  </ul>
                </div>
              </motion.div>
            )}

            {/* Step 2: Appearance */}
            {currentStep === 1 && (
              <motion.div
                key="appearance"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-text-primary mb-2">
                    Choose your style
                  </h2>
                  <p className="text-text-secondary">
                    Pick a theme that works best for you. You can always change this later.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-primary mb-3">
                    Theme
                  </label>
                  <div className="grid grid-cols-3 gap-4">
                    {([
                      { value: 'light', label: 'Light', icon: Sun, preview: 'from-slate-100 to-white' },
                      { value: 'dark', label: 'Dark', icon: Moon, preview: 'from-slate-800 to-slate-900' },
                      { value: 'auto', label: 'Auto', icon: Monitor, preview: 'from-slate-100 via-slate-400 to-slate-800' },
                    ] as const).map((theme) => {
                      const Icon = theme.icon;
                      const isSelected = data.theme === theme.value;

                      return (
                        <button
                          key={theme.value}
                          onClick={() => {
                            updateData({ theme: theme.value });
                            applyTheme(theme.value);
                          }}
                          className={cn(
                            'p-4 rounded-xl border-2 transition-all text-center',
                            isSelected
                              ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                              : 'border-surface-border hover:border-primary-300 dark:hover:border-primary-700'
                          )}
                        >
                          <div className={cn(
                            'w-full aspect-video rounded-lg bg-gradient-to-br mb-3',
                            theme.preview
                          )} />
                          <Icon className={cn(
                            'w-5 h-5 mx-auto mb-1',
                            isSelected ? 'text-primary-600' : 'text-text-secondary'
                          )} />
                          <span className={cn(
                            'text-sm font-medium',
                            isSelected ? 'text-primary-600' : 'text-text-primary'
                          )}>
                            {theme.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-primary mb-3">
                    Week starts on
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    {(['monday', 'sunday'] as WeekStart[]).map((day) => (
                      <button
                        key={day}
                        onClick={() => updateData({ weekStart: day })}
                        className={cn(
                          'p-4 rounded-xl border-2 transition-all capitalize',
                          data.weekStart === day
                            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-600'
                            : 'border-surface-border hover:border-primary-300 dark:hover:border-primary-700 text-text-primary'
                        )}
                      >
                        {day}
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 3: Preferences */}
            {currentStep === 2 && (
              <motion.div
                key="preferences"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-text-primary mb-2">
                    Almost there!
                  </h2>
                  <p className="text-text-secondary">
                    Just a few more preferences to set up your workspace.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-primary mb-3">
                    Default calendar view
                  </label>
                  <div className="grid grid-cols-3 gap-4">
                    {([
                      { value: 'daily', label: 'Day', icon: List },
                      { value: 'weekly', label: 'Week', icon: LayoutGrid },
                      { value: 'monthly', label: 'Month', icon: CalendarDays },
                    ] as const).map((view) => {
                      const Icon = view.icon;
                      const isSelected = data.defaultView === view.value;

                      return (
                        <button
                          key={view.value}
                          onClick={() => updateData({ defaultView: view.value })}
                          className={cn(
                            'p-4 rounded-xl border-2 transition-all text-center',
                            isSelected
                              ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                              : 'border-surface-border hover:border-primary-300 dark:hover:border-primary-700'
                          )}
                        >
                          <Icon className={cn(
                            'w-6 h-6 mx-auto mb-2',
                            isSelected ? 'text-primary-600' : 'text-text-secondary'
                          )} />
                          <span className={cn(
                            'text-sm font-medium',
                            isSelected ? 'text-primary-600' : 'text-text-primary'
                          )}>
                            {view.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 border border-surface-border">
                  <div>
                    <div className="font-medium text-text-primary">Load demo data</div>
                    <div className="text-sm text-text-secondary">
                      Add sample tasks and notes to help you get started
                    </div>
                  </div>
                  <button
                    onClick={() => updateData({ loadDemoData: !data.loadDemoData })}
                    className={cn(
                      'relative w-12 h-6 rounded-full transition-colors',
                      data.loadDemoData ? 'bg-primary-500' : 'bg-neutral-300 dark:bg-neutral-600'
                    )}
                    role="switch"
                    aria-checked={data.loadDemoData}
                  >
                    <span 
                      className={cn(
                        'absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform',
                        data.loadDemoData && 'translate-x-6'
                      )} 
                    />
                  </button>
                </div>

                <div className="p-4 rounded-xl bg-success-50 dark:bg-success-900/20 border border-success-200 dark:border-success-800">
                  <h3 className="font-medium text-success-700 dark:text-success-400 mb-2 flex items-center gap-2">
                    <Rocket className="w-4 h-4" />
                    Quick tips to get started
                  </h3>
                  <ul className="space-y-1 text-sm text-success-600 dark:text-success-400">
                    <li>Press <kbd className="px-1.5 py-0.5 bg-success-100 dark:bg-success-900/50 rounded text-xs">⌘K</kbd> to open the command palette</li>
                    <li>Press <kbd className="px-1.5 py-0.5 bg-success-100 dark:bg-success-900/50 rounded text-xs">⌘N</kbd> to create a new task</li>
                    <li>Drag and drop tasks between days to reschedule</li>
                  </ul>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation buttons */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-surface-border">
            <button
              onClick={handleBack}
              disabled={currentStep === 0}
              className={cn(
                'btn-ghost',
                currentStep === 0 && 'opacity-0 pointer-events-none'
              )}
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </button>

            {currentStep < steps.length - 1 ? (
              <button
                onClick={handleNext}
                disabled={!canProceed()}
                className="btn-primary"
              >
                Continue
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleComplete}
                disabled={isSubmitting}
                className="btn-primary"
              >
                {isSubmitting ? (
                  <>
                    <span className="animate-spin">⏳</span>
                    Setting up...
                  </>
                ) : (
                  <>
                    <Rocket className="w-4 h-4" />
                    Launch ZenPlan
                  </>
                )}
              </button>
            )}
          </div>
        </motion.div>

        {/* Skip link */}
        <p className="text-center mt-6">
          <button
            onClick={() => {
              // Skip onboarding with defaults
              handleComplete();
            }}
            className="text-sm text-text-muted hover:text-text-secondary transition-colors"
          >
            Skip setup and go to dashboard →
          </button>
        </p>
      </div>
    </div>
  );
}

export default OnboardingWizard;
