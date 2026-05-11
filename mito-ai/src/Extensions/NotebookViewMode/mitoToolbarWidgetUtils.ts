/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import { PathExt } from '@jupyterlab/coreutils';
import { NotebookPanel } from '@jupyterlab/notebook';
import { Widget } from '@lumino/widgets';
import { getOperatingSystem } from '../../utils/user';

const MAX_FILENAME_LENGTH = 24;
const IPYNB_EXTENSION = '.ipynb';

export const LAUNCHER_COMMAND = 'launcher:create';
export const CLOSE_CURRENT_WIDGET_COMMAND = 'application:close';

export const getShortcutLabel = (): string => {
  // Reuse the extension-wide OS detection so shortcut labels stay consistent.
  return getOperatingSystem() === 'mac' ? '⌘ K' : 'Ctrl K';
};

export const getDisplayName = (panel: NotebookPanel): string => {
  return PathExt.basename(panel.context.path) || panel.title.label;
};

export const getSelectedMainAreaTabLabel = (): string | null => {
  if (typeof document === 'undefined') {
    return null;
  }

  const selectedTabLabels = Array.from(
    document.querySelectorAll<HTMLElement>('[role="tab"][aria-selected="true"]')
  )
    .map(tab => tab.textContent?.trim())
    .filter((label): label is string => Boolean(label));
  const launcherLabel = selectedTabLabels.find(label => label === 'Launcher');
  if (launcherLabel) {
    return launcherLabel;
  }
  const ignoredTabLabels = new Set([
    'Notebook',
    'Document',
    'App',
    'File Browser (⇧ ⌘ F)',
    'Running Terminals and Kernels',
    'Table of Contents',
    'Extension Manager',
    'AI Chat for your JupyterLab',
    'Property Inspector',
    'Debugger'
  ]);
  return selectedTabLabels.find(label => !ignoredTabLabels.has(label)) ?? null;
};

export const getCurrentWidgetDisplayName = (widget: Widget | null): string => {
  if (!widget) {
    return getSelectedMainAreaTabLabel() ?? 'No active notebook';
  }
  if (widget.title.label === 'Launcher' || widget.id.toLowerCase().includes('launcher')) {
    return 'Launcher';
  }
  return widget.title.label || 'Untitled';
};

export const middleTruncateFilename = (filename: string): string => {
  if (filename.length <= MAX_FILENAME_LENGTH) {
    return filename;
  }

  const extension = filename.endsWith(IPYNB_EXTENSION) ? IPYNB_EXTENSION : '';
  const stem = extension ? filename.slice(0, -extension.length) : filename;
  const availableStemLength = MAX_FILENAME_LENGTH - extension.length - 1;
  const prefixLength = Math.ceil(availableStemLength / 2);
  const suffixLength = Math.floor(availableStemLength / 2);

  return `${stem.slice(0, prefixLength)}…${stem.slice(-suffixLength)}${extension}`;
};

export const isToday = (timestamp: number): boolean => {
  const date = new Date(timestamp);
  const today = new Date();
  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  );
};

export const getRelativeTimestamp = (timestamp: number): string => {
  const elapsedMs = Date.now() - timestamp;
  const elapsedMinutes = Math.floor(elapsedMs / 60000);

  if (elapsedMinutes < 1) {
    return 'now';
  }
  if (elapsedMinutes < 60) {
    return `${elapsedMinutes} min ago`;
  }

  const elapsedHours = Math.floor(elapsedMinutes / 60);
  if (elapsedHours < 24) {
    return `${elapsedHours} hr ago`;
  }
  if (elapsedHours < 48) {
    return 'Yesterday';
  }

  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric'
  }).format(new Date(timestamp));
};
