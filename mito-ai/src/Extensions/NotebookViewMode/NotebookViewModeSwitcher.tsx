/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React from 'react';
import '../../../style/NotebookViewModeSwitcher.css';
import { classNames } from '../../utils/classNames';
import type { NotebookViewMode } from './NotebookViewModePlugin';
import NotepadIcon from '../../icons/NotepadIcon';
import FileIcon from '../../icons/FileIcon';
import AppIcon from '../../icons/AppIcon';

export interface INotebookViewModeSwitcherProps {
  mode: NotebookViewMode;
  onModeChange: (mode: NotebookViewMode) => void;
  disabled?: boolean;
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
  onModeChange,
  disabled = false
}) => {
  const modeIndex = MODES.findIndex(({ id }) => id === mode);
  const tabRefs = React.useRef<Record<NotebookViewMode, HTMLButtonElement | null>>({
    Notebook: null,
    Document: null,
    App: null
  });

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>): void => {
    if (disabled || modeIndex === -1) {
      return;
    }

    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') {
      return;
    }

    event.preventDefault();
    const direction = event.key === 'ArrowRight' ? 1 : -1;
    const nextMode = MODES[(modeIndex + direction + MODES.length) % MODES.length];
    if (!nextMode) {
      return;
    }
    onModeChange(nextMode.id);
    tabRefs.current[nextMode.id]?.focus();
  };

  return (
    <div
      className={classNames('mode-switcher-container')}
      role="tablist"
      aria-disabled={disabled}
      onKeyDown={handleKeyDown}
    >
      {MODES.map(({ id, label, tooltip, Icon }) => (
        <button
          key={id}
          type="button"
          role="tab"
          aria-selected={mode === id}
          tabIndex={mode === id ? 0 : -1}
          className={classNames(
            'mode-switcher-segment',
            mode === id ? 'selected' : 'unselected'
          )}
          onClick={() => onModeChange(id)}
          title={tooltip}
          disabled={disabled}
          ref={(node) => {
            tabRefs.current[id] = node;
          }}
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
