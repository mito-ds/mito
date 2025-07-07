/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import { JupyterFrontEnd, JupyterFrontEndPlugin } from '@jupyterlab/application';
import { INotebookTracker, Notebook } from '@jupyterlab/notebook';
import { ReactWidget } from '@jupyterlab/ui-components';
import NotebookFooter from './NotebookFooter';
import React from 'react';
import { IChatTracker } from '../AiChat/token';

export class MitoNotebookFooter extends ReactWidget {
  constructor(protected notebookTracker: INotebookTracker, protected app: JupyterFrontEnd) {
    super();
  }

  render(): JSX.Element {
    return (
      <NotebookFooter notebookTracker={this.notebookTracker} app={this.app} />
    );
  }
}

const NotebookFooterPlugin: JupyterFrontEndPlugin<void> = {
  id: 'mito-ai:notebook-footer',
  autoStart: true,
  requires: [INotebookTracker, IChatTracker],
  activate: (app: JupyterFrontEnd, notebookTracker: INotebookTracker) => {

    const replaceFooter = (notebook: Notebook): void => {
      const layout = notebook.layout;

      if (layout === undefined) {
        return;
      }

      const customFooter = new MitoNotebookFooter(notebookTracker, app);
      (layout as any).footer = customFooter;
    };

    notebookTracker.forEach(widget => {
      replaceFooter(widget.content);
    });

    notebookTracker.widgetAdded.connect((sender, widget) => {
      setTimeout(() => {
        replaceFooter(widget.content);
      }, 100);
    });
  }
};

export default NotebookFooterPlugin;

