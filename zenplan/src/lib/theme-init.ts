/**
 * Inline theme initialization script
 * Must be included in the <head> to prevent flash of wrong theme
 * This runs synchronously before React hydration
 */
export const themeInitScript = `
(function() {
  const THEME_KEY = 'zenplan_theme';
  
  function getStoredTheme() {
    try {
      return localStorage.getItem(THEME_KEY);
    } catch {
      return null;
    }
  }
  
  function getSystemTheme() {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  }
  
  const storedTheme = getStoredTheme();
  let effectiveTheme;
  
  if (storedTheme === 'dark') {
    effectiveTheme = 'dark';
  } else if (storedTheme === 'light') {
    effectiveTheme = 'light';
  } else {
    // 'auto' or no stored theme - use system preference
    effectiveTheme = getSystemTheme();
  }
  
  // Apply theme to prevent flash
  document.documentElement.setAttribute('data-theme', storedTheme || 'auto');
  
  // Update meta theme-color
  var meta = document.querySelector('meta[name="theme-color"]');
  if (meta) {
    meta.setAttribute('content', effectiveTheme === 'dark' ? '#0f172a' : '#8b5cf6');
  }
})();
`;

export default themeInitScript;
