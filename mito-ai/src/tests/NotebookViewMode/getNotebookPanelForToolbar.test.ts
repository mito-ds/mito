/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import { ILabShell } from '@jupyterlab/application';
import { INotebookTracker, NotebookPanel } from '@jupyterlab/notebook';
import { Widget } from '@lumino/widgets';
import { getNotebookPanelForToolbar } from '../../Extensions/NotebookViewMode/NotebookViewModePlugin';

describe('getNotebookPanelForToolbar', () => {
  it('returns tracked notebook when shell focus is on Chart Wizard', () => {
    const panel = { id: 'notebook-1' } as unknown as NotebookPanel;
    const chartWizard = new Widget();
    chartWizard.id = 'mito-ai-chart-wizard';
    const shell = { currentWidget: chartWizard } as unknown as ILabShell;
    const tracker = { currentWidget: panel } as unknown as INotebookTracker;

    expect(getNotebookPanelForToolbar(shell, tracker)).toBe(panel);
  });

  it('returns null when shell focus is on Chart Wizard but no tracked notebook', () => {
    const chartWizard = new Widget();
    chartWizard.id = 'mito-ai-chart-wizard';
    const shell = { currentWidget: chartWizard } as unknown as ILabShell;
    const tracker = { currentWidget: null } as unknown as INotebookTracker;

    expect(getNotebookPanelForToolbar(shell, tracker)).toBeNull();
  });

  it('returns null when shell focus is unrelated to a notebook', () => {
    const launcher = new Widget();
    launcher.id = 'launcher';
    const shell = { currentWidget: launcher } as unknown as ILabShell;
    const tracker = {
      currentWidget: { id: 'notebook-1' } as unknown as NotebookPanel
    } as unknown as INotebookTracker;

    expect(getNotebookPanelForToolbar(shell, tracker)).toBeNull();
  });
});
