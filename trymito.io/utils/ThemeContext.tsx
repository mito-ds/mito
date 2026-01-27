/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

type Theme = 'light' | 'dark' | 'system';
type ResolvedTheme = 'light' | 'dark';

interface ThemeContextValue {
  theme: Theme;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const getStoredTheme = (): Theme | null => {
  if (typeof window === 'undefined') {
    return null;
  }
  try {
    const stored = window.localStorage.getItem('theme');
    if (stored === 'light' || stored === 'dark' || stored === 'system') {
      return stored;
    }
  } catch (error) {
    return null;
  }
  return null;
};

const getSystemTheme = (): ResolvedTheme => {
  if (typeof window === 'undefined') {
    return 'dark';
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

const applyResolvedTheme = (resolvedTheme: ResolvedTheme) => {
  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('data-theme', resolvedTheme);
  }
};

export const ThemeProvider = ({ children }: { children: React.ReactNode }): JSX.Element => {
  const [theme, setTheme] = useState<Theme>('system');
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>('dark');

  useEffect(() => {
    const stored = getStoredTheme();
    if (stored) {
      setTheme(stored);
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const resolve = () => {
      const nextResolved = theme === 'system' ? getSystemTheme() : theme;
      setResolvedTheme(nextResolved);
      applyResolvedTheme(nextResolved);
    };

    resolve();

    const handleChange = () => {
      if (theme === 'system') {
        resolve();
      }
    };

    if (theme === 'system') {
      if (media.addEventListener) {
        media.addEventListener('change', handleChange);
      } else {
        media.addListener(handleChange);
      }
    }

    return () => {
      if (media.removeEventListener) {
        media.removeEventListener('change', handleChange);
      } else {
        media.removeListener(handleChange);
      }
    };
  }, [theme]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    try {
      window.localStorage.setItem('theme', theme);
    } catch (error) {
      return;
    }
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((prevTheme) => {
      if (prevTheme === 'light') {
        return 'dark';
      }
      if (prevTheme === 'dark') {
        return 'light';
      }
      return resolvedTheme === 'dark' ? 'light' : 'dark';
    });
  }, [resolvedTheme]);

  const value = useMemo(
    () => ({
      theme,
      resolvedTheme,
      setTheme,
      toggleTheme,
    }),
    [theme, resolvedTheme, toggleTheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = (): ThemeContextValue => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};
