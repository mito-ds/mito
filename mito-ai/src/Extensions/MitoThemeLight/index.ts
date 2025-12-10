// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
/**
 * @packageDocumentation
 * @module mito-theme-extension
 */

import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';
import { IThemeManager } from '@jupyterlab/apputils';
import { ITranslator } from '@jupyterlab/translation';
import { INotebookTracker } from '@jupyterlab/notebook';
import { ReactWidget } from '@jupyterlab/ui-components';
import React from 'react';
import RunCellButton from '../../components/RunCellButton';
import '../../../style/RunCellButton.css';

/**
 * A plugin for the Mito Light Theme.
 */
const plugin: JupyterFrontEndPlugin<void> = {
  id: 'mito_ai:theme',
  description: 'Adds the Mito Light theme.',
  requires: [IThemeManager, ITranslator, INotebookTracker],
  activate: (
    app: JupyterFrontEnd,
    manager: IThemeManager,
    translator: ITranslator,
    notebookTracker: INotebookTracker
  ) => {
    const trans = translator.load('jupyterlab');
    const style = 'mito_ai/index.css';
    
    manager.register({
      name: 'Mito Light',
      displayName: trans.__('Mito Light'),
      isLight: true,
      themeScrollbars: false,
      load: () => manager.loadCSS(style),
      unload: () => Promise.resolve(undefined)
    });

    // Note: The toolbar button disabling is handled in style/base.css
    // which is loaded when the Mito Light theme is active.

    // Add Run Cell button to notebook toolbar
    const addRunCellButton = (notebookPanel: any): void => {
      const toolbar = notebookPanel.toolbar;
      if (!toolbar) {
        return;
      }

      // Check if button already exists
      if (toolbar.node.querySelector('.mito-run-cell-button-widget')) {
        return;
      }

      // Create React widget with notebookTracker
      class RunCellButtonWidget extends ReactWidget {
        constructor() {
          super();
          this.addClass('mito-run-cell-button-widget');
        }

        render(): JSX.Element {
          return React.createElement(RunCellButton, { app: app, notebookTracker: notebookTracker });
        }
      }

      const runCellWidget = new RunCellButtonWidget();
      
      // Add to the right side of the toolbar by inserting after spacer or at the end
      // Try to insert after spacer first, otherwise add at the end
      try {
        toolbar.insertAfter('spacer', 'mito-run-cell-button', runCellWidget);
      } catch {
        // If spacer doesn't exist, add at the end
        toolbar.addItem('mito-run-cell-button', runCellWidget);
      }
    };

    // Add button to existing notebooks
    notebookTracker.forEach(widget => {
      addRunCellButton(widget);
    });

    // Add button to new notebooks
    notebookTracker.widgetAdded.connect((sender, widget) => {
      setTimeout(() => {
        addRunCellButton(widget);
      }, 100);
    });
  },
  autoStart: true
};

export default plugin;
