/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React from 'react';
import { NotebookPanel } from '@jupyterlab/notebook';
import { ReactWidget } from '@jupyterlab/ui-components';
import NotebookViewModeSwitcher from '../NotebookViewModeSwitcher';
import { INotebookViewMode } from '../NotebookViewModePlugin';

interface IModeSwitcherContentProps {
  panel: NotebookPanel | null;
  viewMode: INotebookViewMode;
}

const ModeSwitcherContent: React.FC<IModeSwitcherContentProps> = ({
  panel,
  viewMode
}) => {
  return (
    <NotebookViewModeSwitcher
      mode={panel ? viewMode.getMode() : 'Notebook'}
      disabled={!panel}
      onModeChange={(mode) => {
        if (!panel) {
          return;
        }
        if (mode === 'App') {
          void viewMode.openPreviewAndSwitchToAppMode(panel);
          return;
        }
        viewMode.setMode(mode);
      }}
    />
  );
};

export class ModeSwitcherWidget extends ReactWidget {
  constructor(
    private readonly viewMode: INotebookViewMode,
    private readonly getActivePanel: () => NotebookPanel | null
  ) {
    super();
    this.addClass('mito-top-toolbar-center');
    this.viewMode.modeChanged.connect(() => this.update());
  }

  render(): JSX.Element {
    return (
      <ModeSwitcherContent
        panel={this.getActivePanel()}
        viewMode={this.viewMode}
      />
    );
  }
}
