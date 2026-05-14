/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React from 'react';
import { createRoot, Root } from 'react-dom/client';
import { JupyterFrontEnd, JupyterFrontEndPlugin } from '@jupyterlab/application';
import { INotebookTracker, NotebookPanel } from '@jupyterlab/notebook';
import { ITableOfContentsRegistry, TableOfContents } from '@jupyterlab/toc';
import { INotebookViewMode } from '../NotebookViewMode/NotebookViewModePlugin';
import DocumentTableOfContents from './DocumentTableOfContents';

import '../../../style/DocumentTableOfContents.css';

const HOST_CLASS = 'mito-toc-host';

const mountForPanel = (
  panel: NotebookPanel,
  tocRegistry: ITableOfContentsRegistry,
  viewMode: INotebookViewMode
): void => {
  // Wait for the panel to be ready so the TOC model can be created.
  void panel.context.ready.then(() => {
    if (panel.isDisposed) {
      return;
    }

    const model = tocRegistry.getModel(
      panel as unknown as Parameters<ITableOfContentsRegistry['getModel']>[0]
    ) as TableOfContents.Model | undefined;
    if (!model) {
      return;
    }

    // Keep the model active even when the JupyterLab TOC panel is hidden,
    // so headings stay populated and active-heading tracking continues.
    model.isActive = true;

    if (panel.node.querySelector(`.${HOST_CLASS}`)) {
      return;
    }

    const host = document.createElement('div');
    host.className = HOST_CLASS;
    panel.node.appendChild(host);

    const root: Root = createRoot(host);
    root.render(
      <DocumentTableOfContents
        model={model}
        viewMode={viewMode}
        panel={panel}
      />
    );

    panel.disposed.connect(() => {
      root.unmount();
      host.remove();
    });
  });
};

const DocumentTableOfContentsPlugin: JupyterFrontEndPlugin<void> = {
  id: 'mito-ai:document-table-of-contents',
  description: 'Notion-style table of contents overlay for document mode',
  autoStart: true,
  requires: [
    INotebookTracker,
    ITableOfContentsRegistry,
    INotebookViewMode
  ] as JupyterFrontEndPlugin<void>['requires'],
  activate: (
    _app: JupyterFrontEnd,
    notebookTracker: INotebookTracker,
    tocRegistry: ITableOfContentsRegistry,
    viewMode: INotebookViewMode
  ): void => {
    notebookTracker.forEach(panel => {
      mountForPanel(panel, tocRegistry, viewMode);
    });
    notebookTracker.widgetAdded.connect((_, panel) => {
      mountForPanel(panel, tocRegistry, viewMode);
    });
  }
};

export default DocumentTableOfContentsPlugin;
