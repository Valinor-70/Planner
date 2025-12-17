/**
 * Settings Page Component
 * Comprehensive settings panel with appearance, profile, data management, and more
 */

import { useState, useEffect, useRef } from 'react';
import { 
  Settings as SettingsIcon, 
  Palette, 
  User, 
  Bell, 
  Database, 
  Code, 
  ChevronRight,
  Sun,
  Moon,
  Monitor,
  Download,
  Upload,
  Trash2,
  Calendar,
  ArrowLeft,
  Check,
  AlertTriangle
} from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { 
  getSettings, 
  saveSettings, 
  getProfile, 
  saveProfile,
  exportAllData,
  importData,
  clearAllData
} from '../../lib/db';
import type { AppSettings, UserProfile, Theme, UIDensity, WeekStart, DefaultView } from '../../types';
import { DEFAULT_SETTINGS } from '../../types';
import { ThemeToggle } from '../ui/ThemeToggle';
import { loadTheme, saveTheme, applyTheme } from '../../lib/theme';

const cn = (...inputs: (string | undefined | false)[]) => twMerge(clsx(inputs));

type SettingsTab = 'appearance' | 'profile' | 'notifications' | 'data' | 'developer';

interface SettingsTabItem {
  id: SettingsTab;
  label: string;
  icon: typeof SettingsIcon;
  description: string;
}

const settingsTabs: SettingsTabItem[] = [
  { id: 'appearance', label: 'Appearance', icon: Palette, description: 'Theme, density, and display options' },
  { id: 'profile', label: 'Profile', icon: User, description: 'Your name, avatar, and timezone' },
  { id: 'notifications', label: 'Notifications', icon: Bell, description: 'Reminders and alerts' },
  { id: 'data', label: 'Data Management', icon: Database, description: 'Export, import, and clear data' },
  { id: 'developer', label: 'Developer', icon: Code, description: 'Advanced options' },
];

export function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('appearance');
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load settings and profile on mount
  useEffect(() => {
    async function loadData() {
      const [loadedSettings, loadedProfile] = await Promise.all([
        getSettings(),
        getProfile(),
      ]);
      setSettings(loadedSettings);
      setProfile(loadedProfile || null);
    }
    loadData();
  }, []);

  // Auto-save settings when they change
  const handleSettingsChange = async (updates: Partial<AppSettings>) => {
    const newSettings = { ...settings, ...updates };
    setSettings(newSettings);
    setIsSaving(true);
    
    try {
      await saveSettings(updates);
      setSaveMessage('Settings saved');
      setTimeout(() => setSaveMessage(null), 2000);
    } catch (error) {
      console.error('Failed to save settings:', error);
      setSaveMessage('Failed to save');
    } finally {
      setIsSaving(false);
    }
  };

  // Save profile changes
  const handleProfileChange = async (updates: Partial<UserProfile>) => {
    const newProfile = { ...profile, ...updates } as UserProfile;
    setProfile(newProfile);
    setIsSaving(true);
    
    try {
      await saveProfile(newProfile);
      setSaveMessage('Profile saved');
      setTimeout(() => setSaveMessage(null), 2000);
    } catch (error) {
      console.error('Failed to save profile:', error);
      setSaveMessage('Failed to save');
    } finally {
      setIsSaving(false);
    }
  };

  // Export data
  const handleExport = async () => {
    try {
      const data = await exportAllData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `zenplan-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setSaveMessage('Data exported successfully');
      setTimeout(() => setSaveMessage(null), 2000);
    } catch (error) {
      console.error('Failed to export data:', error);
      setSaveMessage('Export failed');
    }
  };

  // Import data
  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const data = JSON.parse(text);
      await importData(data);
      
      // Reload settings and profile
      const [loadedSettings, loadedProfile] = await Promise.all([
        getSettings(),
        getProfile(),
      ]);
      setSettings(loadedSettings);
      setProfile(loadedProfile || null);
      
      setSaveMessage('Data imported successfully');
      setTimeout(() => setSaveMessage(null), 2000);
    } catch (error) {
      console.error('Failed to import data:', error);
      setSaveMessage('Import failed - invalid file');
    }
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Clear all data
  const handleClearData = async () => {
    try {
      await clearAllData();
      setSettings(DEFAULT_SETTINGS);
      setProfile(null);
      setShowClearConfirm(false);
      setSaveMessage('All data cleared');
      setTimeout(() => setSaveMessage(null), 2000);
    } catch (error) {
      console.error('Failed to clear data:', error);
      setSaveMessage('Failed to clear data');
    }
  };

  // Handle avatar upload
  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Read file as base64
    const reader = new FileReader();
    reader.onload = async (e) => {
      const avatar = e.target?.result as string;
      await handleProfileChange({ avatar });
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="min-h-screen bg-bg-primary">
      {/* Header */}
      <header className="sticky top-0 z-40 glass border-b border-surface-border-subtle">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <a 
                href="/dashboard" 
                className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-text-secondary"
                aria-label="Back to dashboard"
              >
                <ArrowLeft className="w-5 h-5" />
              </a>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center">
                  <SettingsIcon className="w-5 h-5 text-white" />
                </div>
                <h1 className="text-xl font-bold text-text-primary">Settings</h1>
              </div>
            </div>
            
            {/* Save indicator */}
            {saveMessage && (
              <div className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium",
                saveMessage.includes('failed') || saveMessage.includes('Failed')
                  ? "bg-danger-100 text-danger-700"
                  : "bg-success-100 text-success-700"
              )}>
                <Check className="w-4 h-4" />
                {saveMessage}
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Navigation */}
          <nav className="lg:w-64 flex-shrink-0">
            <ul className="space-y-1" role="tablist">
              {settingsTabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                
                // Hide developer tab unless enabled
                if (tab.id === 'developer' && !settings.developerMode) {
                  return null;
                }
                
                return (
                  <li key={tab.id}>
                    <button
                      role="tab"
                      aria-selected={isActive}
                      onClick={() => setActiveTab(tab.id)}
                      className={cn(
                        "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all",
                        isActive
                          ? "bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400"
                          : "hover:bg-neutral-100 dark:hover:bg-neutral-800 text-text-secondary"
                      )}
                    >
                      <Icon className="w-5 h-5" />
                      <div className="flex-1">
                        <div className="font-medium">{tab.label}</div>
                        <div className="text-xs text-text-muted">{tab.description}</div>
                      </div>
                      {isActive && <ChevronRight className="w-4 h-4" />}
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Content Area */}
          <div className="flex-1 min-w-0">
            <div className="card p-6">
              {/* Appearance Tab */}
              {activeTab === 'appearance' && (
                <div className="space-y-8">
                  <div>
                    <h2 className="text-lg font-semibold text-text-primary mb-4">Appearance</h2>
                    <p className="text-text-secondary mb-6">
                      Customize how ZenPlan looks and feels.
                    </p>
                  </div>

                  {/* Theme Selection */}
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-3">
                      Theme
                    </label>
                    <ThemeToggle variant="full" />
                  </div>

                  {/* UI Density */}
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-3">
                      UI Density
                    </label>
                    <div className="flex gap-2">
                      {(['compact', 'comfortable', 'spacious'] as UIDensity[]).map((density) => (
                        <button
                          key={density}
                          onClick={() => handleSettingsChange({ density })}
                          className={cn(
                            "flex-1 px-4 py-2.5 rounded-xl text-sm font-medium capitalize transition-all",
                            settings.density === density
                              ? "bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 border-2 border-primary-500"
                              : "bg-neutral-100 dark:bg-neutral-800 text-text-secondary hover:bg-neutral-200 dark:hover:bg-neutral-700 border-2 border-transparent"
                          )}
                        >
                          {density}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Font Size */}
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-3">
                      Font Size: {settings.fontSize}px
                    </label>
                    <input
                      type="range"
                      min="14"
                      max="20"
                      value={settings.fontSize}
                      onChange={(e) => handleSettingsChange({ fontSize: parseInt(e.target.value) })}
                      className="w-full h-2 bg-neutral-200 dark:bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-primary-500"
                    />
                    <div className="flex justify-between text-xs text-text-muted mt-1">
                      <span>Small</span>
                      <span>Large</span>
                    </div>
                  </div>

                  {/* Week Start */}
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-3">
                      Week Starts On
                    </label>
                    <div className="flex gap-2">
                      {(['sunday', 'monday'] as WeekStart[]).map((day) => (
                        <button
                          key={day}
                          onClick={() => handleSettingsChange({ weekStart: day })}
                          className={cn(
                            "flex-1 px-4 py-2.5 rounded-xl text-sm font-medium capitalize transition-all",
                            settings.weekStart === day
                              ? "bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 border-2 border-primary-500"
                              : "bg-neutral-100 dark:bg-neutral-800 text-text-secondary hover:bg-neutral-200 dark:hover:bg-neutral-700 border-2 border-transparent"
                          )}
                        >
                          {day}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Default View */}
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-3">
                      Default Calendar View
                    </label>
                    <div className="flex gap-2">
                      {(['daily', 'weekly', 'monthly'] as DefaultView[]).map((view) => (
                        <button
                          key={view}
                          onClick={() => handleSettingsChange({ defaultView: view })}
                          className={cn(
                            "flex-1 px-4 py-2.5 rounded-xl text-sm font-medium capitalize transition-all",
                            settings.defaultView === view
                              ? "bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 border-2 border-primary-500"
                              : "bg-neutral-100 dark:bg-neutral-800 text-text-secondary hover:bg-neutral-200 dark:hover:bg-neutral-700 border-2 border-transparent"
                          )}
                        >
                          {view.replace('ly', '')}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Profile Tab */}
              {activeTab === 'profile' && (
                <div className="space-y-8">
                  <div>
                    <h2 className="text-lg font-semibold text-text-primary mb-4">Profile</h2>
                    <p className="text-text-secondary mb-6">
                      Personalize your ZenPlan experience.
                    </p>
                  </div>

                  {/* Avatar */}
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-3">
                      Avatar
                    </label>
                    <div className="flex items-center gap-4">
                      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-2xl font-bold overflow-hidden">
                        {profile?.avatar ? (
                          <img src={profile.avatar} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                          profile?.name?.[0]?.toUpperCase() || 'U'
                        )}
                      </div>
                      <div>
                        <label className="btn-secondary cursor-pointer">
                          <Upload className="w-4 h-4" />
                          Upload Photo
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleAvatarUpload}
                            className="hidden"
                          />
                        </label>
                        <p className="text-xs text-text-muted mt-2">JPG, PNG, or GIF. Max 2MB.</p>
                      </div>
                    </div>
                  </div>

                  {/* Name */}
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-text-primary mb-2">
                      Display Name
                    </label>
                    <input
                      id="name"
                      type="text"
                      value={profile?.name || ''}
                      onChange={(e) => handleProfileChange({ name: e.target.value })}
                      placeholder="Enter your name"
                      className="input max-w-md"
                    />
                  </div>

                  {/* Bio */}
                  <div>
                    <label htmlFor="bio" className="block text-sm font-medium text-text-primary mb-2">
                      Bio
                    </label>
                    <textarea
                      id="bio"
                      value={profile?.bio || ''}
                      onChange={(e) => handleProfileChange({ bio: e.target.value })}
                      placeholder="A short bio about yourself"
                      rows={3}
                      className="input max-w-md resize-none"
                    />
                  </div>

                  {/* Timezone */}
                  <div>
                    <label htmlFor="timezone" className="block text-sm font-medium text-text-primary mb-2">
                      Timezone
                    </label>
                    <select
                      id="timezone"
                      value={profile?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone}
                      onChange={(e) => handleProfileChange({ timezone: e.target.value })}
                      className="input max-w-md"
                    >
                      {Intl.supportedValuesOf('timeZone').map((tz) => (
                        <option key={tz} value={tz}>{tz}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Notifications Tab */}
              {activeTab === 'notifications' && (
                <div className="space-y-8">
                  <div>
                    <h2 className="text-lg font-semibold text-text-primary mb-4">Notifications</h2>
                    <p className="text-text-secondary mb-6">
                      Configure reminders and alerts. Note: All notifications are local to your device.
                    </p>
                  </div>

                  {/* Enable Reminders */}
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-text-primary">Enable Reminders</div>
                      <div className="text-sm text-text-secondary">Get notified before tasks are due</div>
                    </div>
                    <button
                      onClick={() => handleSettingsChange({ enableReminders: !settings.enableReminders })}
                      className={cn(
                        "relative w-12 h-6 rounded-full transition-colors",
                        settings.enableReminders ? "bg-primary-500" : "bg-neutral-300 dark:bg-neutral-600"
                      )}
                      role="switch"
                      aria-checked={settings.enableReminders}
                    >
                      <span 
                        className={cn(
                          "absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform",
                          settings.enableReminders && "translate-x-6"
                        )} 
                      />
                    </button>
                  </div>

                  {/* Reminder Time */}
                  {settings.enableReminders && (
                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-2">
                        Remind me before task ({settings.reminderMinutesBefore} minutes)
                      </label>
                      <input
                        type="range"
                        min="5"
                        max="60"
                        step="5"
                        value={settings.reminderMinutesBefore}
                        onChange={(e) => handleSettingsChange({ reminderMinutesBefore: parseInt(e.target.value) })}
                        className="w-full max-w-md h-2 bg-neutral-200 dark:bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-primary-500"
                      />
                      <div className="flex justify-between text-xs text-text-muted mt-1 max-w-md">
                        <span>5 min</span>
                        <span>60 min</span>
                      </div>
                    </div>
                  )}

                  {/* Working Hours */}
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-3">
                      Working Hours
                    </label>
                    <div className="flex items-center gap-4 max-w-md">
                      <div className="flex-1">
                        <label htmlFor="workStart" className="text-xs text-text-muted">Start</label>
                        <input
                          id="workStart"
                          type="time"
                          value={settings.workingHoursStart}
                          onChange={(e) => handleSettingsChange({ workingHoursStart: e.target.value })}
                          className="input"
                        />
                      </div>
                      <span className="text-text-muted mt-4">to</span>
                      <div className="flex-1">
                        <label htmlFor="workEnd" className="text-xs text-text-muted">End</label>
                        <input
                          id="workEnd"
                          type="time"
                          value={settings.workingHoursEnd}
                          onChange={(e) => handleSettingsChange({ workingHoursEnd: e.target.value })}
                          className="input"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Data Management Tab */}
              {activeTab === 'data' && (
                <div className="space-y-8">
                  <div>
                    <h2 className="text-lg font-semibold text-text-primary mb-4">Data Management</h2>
                    <p className="text-text-secondary mb-6">
                      Export, import, or clear your data. All data is stored locally on your device.
                    </p>
                  </div>

                  {/* Export */}
                  <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 border border-surface-border">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-lg bg-primary-100 dark:bg-primary-900/30 text-primary-600 flex items-center justify-center">
                        <Download className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-text-primary">Export Data</h3>
                        <p className="text-sm text-text-secondary mt-1">
                          Download all your tasks, notes, and settings as a JSON file.
                        </p>
                        <button onClick={handleExport} className="btn-primary mt-3">
                          <Download className="w-4 h-4" />
                          Export All Data
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Import */}
                  <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 border border-surface-border">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-lg bg-info-100 dark:bg-info-900/30 text-info-600 flex items-center justify-center">
                        <Upload className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-text-primary">Import Data</h3>
                        <p className="text-sm text-text-secondary mt-1">
                          Restore from a previously exported backup file. This will replace all existing data.
                        </p>
                        <label className="btn-secondary mt-3 cursor-pointer inline-flex">
                          <Upload className="w-4 h-4" />
                          Import Backup
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept=".json"
                            onChange={handleImport}
                            className="hidden"
                          />
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Clear Data */}
                  <div className="p-4 rounded-xl bg-danger-50 dark:bg-danger-900/20 border border-danger-200 dark:border-danger-800">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-lg bg-danger-100 dark:bg-danger-900/30 text-danger-600 flex items-center justify-center">
                        <Trash2 className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-danger-700 dark:text-danger-400">Clear All Data</h3>
                        <p className="text-sm text-danger-600 dark:text-danger-400 mt-1">
                          Permanently delete all your tasks, notes, and settings. This cannot be undone.
                        </p>
                        
                        {!showClearConfirm ? (
                          <button 
                            onClick={() => setShowClearConfirm(true)} 
                            className="mt-3 px-4 py-2 rounded-xl bg-danger-500 text-white font-medium hover:bg-danger-600 transition-colors"
                          >
                            <Trash2 className="w-4 h-4 inline mr-2" />
                            Clear All Data
                          </button>
                        ) : (
                          <div className="mt-3 p-3 bg-danger-100 dark:bg-danger-900/40 rounded-lg">
                            <div className="flex items-center gap-2 text-danger-700 dark:text-danger-400 mb-3">
                              <AlertTriangle className="w-4 h-4" />
                              <span className="font-medium">Are you sure?</span>
                            </div>
                            <div className="flex gap-2">
                              <button 
                                onClick={handleClearData}
                                className="px-4 py-2 rounded-lg bg-danger-500 text-white font-medium hover:bg-danger-600 transition-colors"
                              >
                                Yes, Delete Everything
                              </button>
                              <button 
                                onClick={() => setShowClearConfirm(false)}
                                className="px-4 py-2 rounded-lg bg-white dark:bg-neutral-800 text-text-secondary font-medium hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Developer Tab */}
              {activeTab === 'developer' && settings.developerMode && (
                <div className="space-y-8">
                  <div>
                    <h2 className="text-lg font-semibold text-text-primary mb-4">Developer Options</h2>
                    <p className="text-text-secondary mb-6">
                      Advanced settings for developers and power users.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-warning-50 dark:bg-warning-900/20 border border-warning-200 dark:border-warning-800">
                    <div className="flex items-center gap-2 text-warning-700 dark:text-warning-400 mb-2">
                      <AlertTriangle className="w-4 h-4" />
                      <span className="font-medium">Developer Mode Active</span>
                    </div>
                    <p className="text-sm text-warning-600 dark:text-warning-400">
                      These options are intended for developers and may affect application behavior.
                    </p>
                  </div>

                  {/* Future: Add developer options here */}
                  <div className="text-text-muted text-sm">
                    More developer options coming soon...
                  </div>
                </div>
              )}
            </div>

            {/* Developer Mode Toggle (at bottom of all tabs except developer) */}
            {activeTab !== 'developer' && (
              <div className="mt-6 text-center">
                <button
                  onClick={() => handleSettingsChange({ developerMode: !settings.developerMode })}
                  className="text-xs text-text-muted hover:text-text-secondary transition-colors"
                >
                  {settings.developerMode ? 'Disable' : 'Enable'} Developer Mode
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default SettingsPage;
