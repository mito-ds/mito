/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React from 'react';
import themeToggleStyles from './ThemeToggle.module.css';
import { useTheme } from '../../utils/ThemeContext';

const ThemeToggle = (): JSX.Element => {
  const { resolvedTheme, toggleTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  return (
    <button
      className={themeToggleStyles.toggle}
      onClick={toggleTheme}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} theme`}
      type="button"
    >
      <span className={themeToggleStyles.icon} aria-hidden="true">
        {isDark ? (
          <svg viewBox="0 0 24 24" fill="none">
            <path
              d="M21 15.5C19.7 16.3 18.2 16.8 16.5 16.8C11.8 16.8 8 13 8 8.3C8 6.6 8.5 5.1 9.3 3.8C6.1 4.7 3.8 7.7 3.8 11.3C3.8 15.7 7.3 19.2 11.7 19.2C15.3 19.2 18.4 16.9 19.2 13.7"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="4.5" stroke="currentColor" strokeWidth="1.8" />
            <path
              d="M12 2.8V5.2M12 18.8V21.2M4.2 4.2L5.9 5.9M18.1 18.1L19.8 19.8M2.8 12H5.2M18.8 12H21.2M4.2 19.8L5.9 18.1M18.1 5.9L19.8 4.2"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
          </svg>
        )}
      </span>
    </button>
  );
};

export default ThemeToggle;
