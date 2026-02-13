/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React from 'react';
import '../../../style/button.css';
import '../../../style/NotebookViewModeSwitcher.css';
import { classNames } from '../../utils/classNames';
import type { NotebookViewMode } from './NotebookViewModePlugin';
import NotepadIcon from '../../icons/NotepadIcon';
import FileIcon from '../../icons/FileIcon';
import AppIcon from '../../icons/AppIcon';

export interface INotebookViewModeSwitcherProps {
  mode: NotebookViewMode;
  onModeChange: (mode: NotebookViewMode) => void;
}

const MODES: {
  id: NotebookViewMode;
  label: string;
  tooltip: string;
  Icon: React.FC;
}[] = [
  {
    id: 'Notebook',
    label: 'Notebook',
    tooltip: 'Full notebook view with code and outputs',
    Icon: NotepadIcon
  },
  {
    id: 'Document',
    label: 'Document',
    tooltip: 'Markdown and outputs only; double-click output to edit',
    Icon: FileIcon
  },
  {
    id: 'App',
    label: 'App',
    tooltip: 'View the analysis as an interactive app',
    Icon: AppIcon
  }
];

const NotebookViewModeSwitcher: React.FC<INotebookViewModeSwitcherProps> = ({
  mode,
  onModeChange
}) => {
  return (
    <div className={classNames('mode-switcher-container')}>
      {MODES.map(({ id, label, tooltip, Icon }) => (
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
          <span className="mode-switcher-segment-icon" aria-hidden>
            <Icon />
          </span>
          {label}
        </button>
      ))}
    </div>
  );
};

export default NotebookViewModeSwitcher;
