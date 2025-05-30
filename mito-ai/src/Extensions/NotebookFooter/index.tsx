import { JupyterFrontEnd, JupyterFrontEndPlugin } from '@jupyterlab/application';
import { INotebookTracker } from '@jupyterlab/notebook';
import { ReactWidget } from '@jupyterlab/ui-components';
import { NotebookFooterComponent } from './NotebookFooterComponent';
import React from 'react';

class AdvancedNotebookFooter extends ReactWidget {
  constructor(protected notebook: any) {
    super();
    this.addClass('jp-Notebook-footer-wrapper');
  }

  render(): JSX.Element {
    return (
      <NotebookFooterComponent notebook={this.notebook} />
    );
  }
}

const extension: JupyterFrontEndPlugin<void> = {
  id: 'advanced-react-footer',
  autoStart: true,
  requires: [INotebookTracker],
  activate: (app: JupyterFrontEnd, tracker: INotebookTracker) => {
    
    const replaceFooter = (notebook: any) => {
      const layout = notebook.layout;
      
      if (layout.footer) {
        layout.footer.dispose();
      }
      
      const customFooter = new AdvancedNotebookFooter(notebook);
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