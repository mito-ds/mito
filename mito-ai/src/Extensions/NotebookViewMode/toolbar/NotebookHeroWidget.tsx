/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React from 'react';
import { NotebookPanel } from '@jupyterlab/notebook';
import { ReactWidget } from '@jupyterlab/ui-components';
import RunCellButton from '../../../components/RunCellButton';

interface INotebookHeroContentProps {
  panel: NotebookPanel;
}

const NotebookHeroContent: React.FC<INotebookHeroContentProps> = ({ panel }) => {
  return <RunCellButton notebookPanel={panel} />;
};

export class NotebookHeroWidget extends ReactWidget {
  private _panel: NotebookPanel | null = null;

  constructor() {
    super();
    this.addClass('mito-top-toolbar-notebook-hero');
  }

  setPanel(panel: NotebookPanel | null): void {
    this._panel = panel;
    this.update();
  }

  render(): JSX.Element | null {
    if (!this._panel) {
      return null;
    }
    return <NotebookHeroContent panel={this._panel} />;
  }
}
