'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const ThemeContext = createContext(null);

export function ThemeProvider({ initialTheme, children }) {
  const [theme, setThemeState] = useState(initialTheme === 'light' ? 'light' : 'dark');

  // Keep the <html data-theme> in sync even if it changes via setTheme
  // after the initial blocking script already applied a value.
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const setTheme = useCallback((next) => {
    const resolved = next === 'light' ? 'light' : 'dark';
    setThemeState(resolved);
    try {
      document.cookie = `scraplens_theme=${resolved}; path=/; max-age=31536000; samesite=lax`;
      window.localStorage.setItem('scraplens_theme', resolved);
    } catch {
      // Storage unavailable — in-memory state still works for this session.
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  }, [theme, setTheme]);

  const value = useMemo(() => ({ theme, setTheme, toggleTheme }), [theme, setTheme, toggleTheme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return ctx;
}

// Inline, render-blocking script string: sets data-theme on <html> before
// paint so toggling never causes a flash of the wrong theme. Injected via
// dangerouslySetInnerHTML from the root layout (server component).
export const THEME_BLOCKING_SCRIPT = `
(function () {
  try {
    var stored = window.localStorage.getItem('scraplens_theme');
    var theme = stored === 'light' || stored === 'dark'
      ? stored
      : (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
    document.documentElement.setAttribute('data-theme', theme);
  } catch (e) {
    document.documentElement.setAttribute('data-theme', 'dark');
  }
})();
`;
