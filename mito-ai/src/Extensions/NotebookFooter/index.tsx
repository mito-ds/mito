/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import { JupyterFrontEnd, JupyterFrontEndPlugin } from '@jupyterlab/application';
import { INotebookTracker } from '@jupyterlab/notebook';
import { ReactWidget } from '@jupyterlab/ui-components';
import { NotebookFooter } from './NotebookFooter';
import React from 'react';

class AdvancedNotebookFooter extends ReactWidget {
  constructor(protected notebook: INotebookTracker, protected app: JupyterFrontEnd) {
    super();
    this.addClass('jp-Notebook-footer-wrapper');
  }

  render(): JSX.Element {
    return (
      <NotebookFooter notebook={this.notebook} app={this.app} />
    );
  }
}

const extension: JupyterFrontEndPlugin<void> = {
  id: 'advanced-react-footer',
  autoStart: true,
  requires: [INotebookTracker],
  activate: (app: JupyterFrontEnd, tracker: INotebookTracker) => {
    
    const replaceFooter = (notebook: any): void => {
      const layout = notebook.layout;
      
      if (layout.footer) {
        layout.footer.dispose();
      }
      
      const customFooter = new AdvancedNotebookFooter(notebook, app);
      layout.footer = customFooter;
    };

    tracker.forEach(widget => {
      replaceFooter(widget.content);
    });

    tracker.widgetAdded.connect((sender, widget) => {
      setTimeout(() => {
        replaceFooter(widget.content);
      }, 100);
    });
  }
};

export default extension;