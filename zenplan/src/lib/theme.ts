/**
 * Theme utilities for ZenPlan
 * Handles theme persistence (IndexedDB with localStorage fallback) and application
 */

export type Theme = 'light' | 'dark' | 'auto';

const THEME_KEY = 'zenplan_theme';
const DB_NAME = 'ZenPlanSettings';
const DB_VERSION = 1;
const STORE_NAME = 'settings';

/**
 * Opens the IndexedDB database for settings storage
 */
function openSettingsDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'key' });
      }
    };
  });
}

/**
 * Saves theme preference to IndexedDB, with localStorage fallback
 */
export async function saveTheme(theme: Theme): Promise<void> {
  // Always save to localStorage as fallback
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {
    console.warn('Unable to save theme to localStorage');
  }

  // Try to save to IndexedDB
  try {
    const db = await openSettingsDB();
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    
    await new Promise<void>((resolve, reject) => {
      const request = store.put({ key: THEME_KEY, value: theme });
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
    
    db.close();
  } catch (error) {
    console.warn('Unable to save theme to IndexedDB, using localStorage fallback:', error);
  }
}

/**
 * Loads theme preference from IndexedDB, with localStorage fallback
 */
export async function loadTheme(): Promise<Theme> {
  // Try IndexedDB first
  try {
    const db = await openSettingsDB();
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    
    const result = await new Promise<Theme | null>((resolve, reject) => {
      const request = store.get(THEME_KEY);
      request.onsuccess = () => {
        const data = request.result;
        resolve(data?.value as Theme | null);
      };
      request.onerror = () => reject(request.error);
    });
    
    db.close();
    
    if (result && isValidTheme(result)) {
      return result;
    }
  } catch (error) {
    console.warn('Unable to load theme from IndexedDB, trying localStorage:', error);
  }

  // Fallback to localStorage
  try {
    const stored = localStorage.getItem(THEME_KEY);
    if (stored && isValidTheme(stored as Theme)) {
      return stored as Theme;
    }
  } catch {
    console.warn('Unable to load theme from localStorage');
  }

  // Default to auto
  return 'auto';
}

/**
 * Type guard to validate theme value
 */
function isValidTheme(value: unknown): value is Theme {
  return value === 'light' || value === 'dark' || value === 'auto';
}

/**
 * Gets the effective theme (resolves 'auto' to actual theme)
 */
export function getEffectiveTheme(theme: Theme): 'light' | 'dark' {
  if (theme === 'auto') {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  }
  return theme;
}

/**
 * Applies theme to the document
 */
export function applyTheme(theme: Theme): void {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;
  root.setAttribute('data-theme', theme);

  // Update meta theme-color for mobile browsers
  const effectiveTheme = getEffectiveTheme(theme);
  const metaThemeColor = document.querySelector('meta[name="theme-color"]');
  if (metaThemeColor) {
    metaThemeColor.setAttribute('content', effectiveTheme === 'dark' ? '#0f172a' : '#8b5cf6');
  }
}

/**
 * Sets up listener for system theme changes (only relevant when theme is 'auto')
 */
export function setupThemeListener(callback: (theme: 'light' | 'dark') => void): () => void {
  if (typeof window === 'undefined' || !window.matchMedia) {
    return () => {};
  }

  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  
  const handleChange = (e: MediaQueryListEvent) => {
    callback(e.matches ? 'dark' : 'light');
  };

  mediaQuery.addEventListener('change', handleChange);
  
  return () => {
    mediaQuery.removeEventListener('change', handleChange);
  };
}

/**
 * Initialize theme on page load
 * Call this in a script tag or useEffect to prevent flash
 */
export async function initializeTheme(): Promise<Theme> {
  const theme = await loadTheme();
  applyTheme(theme);
  return theme;
}
