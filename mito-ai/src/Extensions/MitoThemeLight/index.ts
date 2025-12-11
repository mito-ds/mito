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
import { INotebookTracker, NotebookPanel } from '@jupyterlab/notebook';
import { ReactWidget } from '@jupyterlab/ui-components';
import React from 'react';
import RunCellButton from '../../components/RunCellButton';
import '../../../style/RunCellButton.css';

/**
 * A plugin for the Mito Light Theme.
 * 
 * The Run Cell Button and hidden default toolbar buttons only apply
 * when the Mito Light theme is active.
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
    
    // Store connection for cleanup
    let widgetAddedConnection: ((sender: INotebookTracker, widget: NotebookPanel) => void) | null = null;

    // Add Run Cell button to notebook toolbar
    const addRunCellButton = (notebookPanel: NotebookPanel): void => {
      const toolbar = notebookPanel.toolbar;
      if (!toolbar) {
        return;
      }

      // Check if button already exists
      if (toolbar.node.querySelector('.mito-run-cell-button-widget')) {
        return;
      }

      // Create React widget with the specific notebook panel
      class RunCellButtonWidget extends ReactWidget {
        constructor(private panel: NotebookPanel) {
          super();
          this.addClass('mito-run-cell-button-widget');
        }

        render(): JSX.Element {
          return React.createElement(RunCellButton, { app: app, notebookPanel: this.panel });
        }
      }

      const runCellWidget = new RunCellButtonWidget(notebookPanel);
      
      // Add to the right side of the toolbar by inserting after spacer or at the end
      try {
        toolbar.insertAfter('spacer', 'mito-run-cell-button', runCellWidget);
      } catch {
        // If spacer doesn't exist, add at the end
        toolbar.addItem('mito-run-cell-button', runCellWidget);
      }
    };

    // Remove Run Cell button from notebook toolbar
    const removeRunCellButton = (notebookPanel: NotebookPanel): void => {
      const toolbar = notebookPanel.toolbar;
      if (!toolbar) {
        return;
      }

      // Find and remove the button widget by iterating toolbar items
      for (const name of toolbar.names()) {
        if (name === 'mito-run-cell-button') {
          // Hide the widget (disposal happens automatically when panel is disposed)
          const widget = Array.from(toolbar.children()).find(
            w => w.hasClass('mito-run-cell-button-widget')
          );
          if (widget) {
            widget.dispose();
          }
          break;
        }
      }
    };

    // Add buttons to all notebooks
    const addButtonsToAllNotebooks = (): void => {
      notebookTracker.forEach(widget => {
        addRunCellButton(widget);
      });

      // Connect to new notebooks
      widgetAddedConnection = (sender: INotebookTracker, widget: NotebookPanel): void => {
        setTimeout(() => {
          // Only add if Mito Light theme is still active
          if (manager.theme === 'Mito Light') {
            addRunCellButton(widget);
          }
        }, 100);
      };
      notebookTracker.widgetAdded.connect(widgetAddedConnection);
    };

    // Remove buttons from all notebooks
    const removeButtonsFromAllNotebooks = (): void => {
      // Disconnect from new notebooks
      if (widgetAddedConnection) {
        notebookTracker.widgetAdded.disconnect(widgetAddedConnection);
        widgetAddedConnection = null;
      }

      // Remove from all existing notebooks
      notebookTracker.forEach(widget => {
        removeRunCellButton(widget);
      });
    };

    manager.register({
      name: 'Mito Light',
      displayName: trans.__('Mito Light'),
      isLight: true,
      themeScrollbars: false,
      load: async () => {
        // Load theme CSS (hides default buttons)
        await manager.loadCSS(style);
        // Add Run Cell buttons to all notebooks
        addButtonsToAllNotebooks();
      },
      unload: async () => {
        // Remove Run Cell buttons from all notebooks
        removeButtonsFromAllNotebooks();
      }
    });
  },
  autoStart: true
};

export default plugin;
