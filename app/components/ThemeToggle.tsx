'use client';

import { useEffect, useState } from 'react';

type ThemeMode = 'light' | 'dark';
interface ThemeToggleProps {
  inline?: boolean;
  className?: string;
  showLabel?: boolean;
}

const THEME_STORAGE_KEY = 'safi_cavaliers_theme';
const THEME_META_COLORS: Record<ThemeMode, string> = {
  light: '#f6eee2',
  dark: '#17110e'
};

function getSystemTheme(): ThemeMode {
  if (typeof window === 'undefined') {
    return 'light';
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function getStoredTheme(): ThemeMode | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const value = window.localStorage.getItem(THEME_STORAGE_KEY);
  return value === 'light' || value === 'dark' ? value : null;
}

function applyTheme(theme: ThemeMode) {
  const root = document.documentElement;
  root.dataset.theme = theme;
  root.style.colorScheme = theme;

  const metaTheme = document.querySelector('meta[name="theme-color"]');
  if (metaTheme) {
    metaTheme.setAttribute('content', THEME_META_COLORS[theme]);
  }
}

export function ThemeToggle({ inline = false, className, showLabel = true }: ThemeToggleProps) {
  const [theme, setTheme] = useState<ThemeMode>('light');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const savedTheme = getStoredTheme();
    const initialTheme = savedTheme ?? getSystemTheme();
    applyTheme(initialTheme);
    setTheme(initialTheme);
    setReady(true);

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleMediaChange = () => {
      if (getStoredTheme()) {
        return;
      }

      const nextTheme = mediaQuery.matches ? 'dark' : 'light';
      applyTheme(nextTheme);
      setTheme(nextTheme);
    };

    const handleStorage = (event: StorageEvent) => {
      if (event.key !== THEME_STORAGE_KEY) {
        return;
      }

      const nextTheme = event.newValue === 'dark' || event.newValue === 'light' ? event.newValue : getSystemTheme();
      applyTheme(nextTheme);
      setTheme(nextTheme);
    };

    mediaQuery.addEventListener('change', handleMediaChange);
    window.addEventListener('storage', handleStorage);

    return () => {
      mediaQuery.removeEventListener('change', handleMediaChange);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  const toggleTheme = () => {
    const nextTheme: ThemeMode = theme === 'dark' ? 'light' : 'dark';
    window.localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
    applyTheme(nextTheme);
    setTheme(nextTheme);
  };

  if (!ready) {
    return null;
  }

  const isDark = theme === 'dark';

  const switchButton = (
    <button
      type="button"
      aria-label={isDark ? 'Activer le mode clair' : 'Activer le mode sombre'}
      aria-pressed={isDark}
      className={`theme-switch ${inline ? 'theme-switch-compact' : ''} ${isDark ? 'is-dark' : ''}`}
      onClick={toggleTheme}
    >
      <svg viewBox="0 0 24 24" className="theme-switch-icon theme-switch-icon-sun" aria-hidden="true">
        <path
          fill="currentColor"
          d="M12 4.5a1 1 0 0 1 1 1V7a1 1 0 1 1-2 0V5.5a1 1 0 0 1 1-1Zm0 12a4.5 4.5 0 1 0 0-9a4.5 4.5 0 0 0 0 9Zm7.5-5.5a1 1 0 0 1 1 1a1 1 0 0 1-1 1H18a1 1 0 1 1 0-2h1.5ZM6 12a1 1 0 0 1-1 1H3.5a1 1 0 1 1 0-2H5a1 1 0 0 1 1 1Zm10.95 4.95a1 1 0 0 1 1.414 0l1.06 1.06a1 1 0 0 1-1.414 1.414l-1.06-1.06a1 1 0 0 1 0-1.414ZM6.636 6.636a1 1 0 0 1 0 1.414l-1.06 1.06A1 1 0 0 1 4.162 7.696l1.06-1.06a1 1 0 0 1 1.414 0Zm12.788 0a1 1 0 0 1 0 1.414l-1.06 1.06A1 1 0 1 1 16.95 7.696l1.06-1.06a1 1 0 0 1 1.414 0ZM7.05 16.95a1 1 0 0 1 0 1.414l-1.06 1.06a1 1 0 0 1-1.414-1.414l1.06-1.06a1 1 0 0 1 1.414 0ZM12 17a1 1 0 0 1 1 1v1.5a1 1 0 1 1-2 0V18a1 1 0 0 1 1-1Z"
        />
      </svg>
      <svg viewBox="0 0 24 24" className="theme-switch-icon theme-switch-icon-moon" aria-hidden="true">
        <path
          fill="currentColor"
          d="M14.5 3.5a1 1 0 0 1 .84 1.54a7.5 7.5 0 1 0 3.62 10.12a1 1 0 0 1 1.83.8A9.5 9.5 0 1 1 13.7 3.12a1 1 0 0 1 .8.38Z"
        />
      </svg>
      <span className="theme-switch-thumb" aria-hidden="true" />
    </button>
  );

  if (inline) {
    return (
      <div className={`inline-flex items-center gap-2 ${className ?? ''}`} role="group" aria-label="Theme application">
        {showLabel && <span className="text-xs text-[var(--ink-700)]">{isDark ? 'Dark' : 'Light'}</span>}
        {switchButton}
      </div>
    );
  }

  return (
    <div className="theme-toggle-panel" role="group" aria-label="Theme application">
      <div className="theme-toggle-copy">
        <span className="theme-toggle-kicker">Ambiance</span>
        <strong>{isDark ? 'Mode sombre' : 'Mode clair'}</strong>
      </div>
      {switchButton}
    </div>
  );
}

export default ThemeToggle;
