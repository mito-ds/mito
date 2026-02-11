/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React from 'react';
import '../../../style/button.css';
import '../../../style/NotebookViewModeSwitcher.css';
import { classNames } from '../../utils/classNames';
import type { NotebookViewMode } from './NotebookViewModePlugin';

export interface INotebookViewModeSwitcherProps {
  mode: NotebookViewMode;
  onModeChange: (mode: NotebookViewMode) => void;
}

const MODES: { id: NotebookViewMode; label: string; tooltip: string }[] = [
  { id: 'Notebook', label: 'Notebook', tooltip: 'Full notebook view with code and outputs' },
  { id: 'Document', label: 'Document', tooltip: 'Markdown and outputs only; double-click output to edit' },
  { id: 'App', label: 'App', tooltip: 'View the analysis as an interactive app' }
];

const NotebookViewModeSwitcher: React.FC<INotebookViewModeSwitcherProps> = ({
  mode,
  onModeChange
}) => {
  return (
    <div className={classNames('mode-switcher-container')}>
      {MODES.map(({ id, label, tooltip }) => (
        <button
          key={id}
          type="button"
          className={classNames(
            'mode-switcher-segment',
            'button-base',
            mode === id ? 'selected' : 'unselected'
          )}
          onClick={() => onModeChange(id)}
          title={tooltip}
        >
          {label}
        </button>
      ))}
    </div>
  );
};

export default NotebookViewModeSwitcher;
