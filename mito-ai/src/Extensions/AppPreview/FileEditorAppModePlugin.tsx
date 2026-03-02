/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import { JupyterFrontEnd, JupyterFrontEndPlugin } from '@jupyterlab/application';
import { INotebookTracker } from '@jupyterlab/notebook';
import { IEditorTracker } from '@jupyterlab/fileeditor';
import { ToolbarButton } from '@jupyterlab/apputils';
import { IStreamlitPreviewManager } from './StreamlitPreviewPlugin';
import { isMitoAppPyFilePath, openAppPreviewFromAppFilePath } from './utils';

const MITO_APP_MODE_BUTTON_ID = 'mito-app-mode-button';
const MITO_APP_MODE_BUTTON_WIDGET_CLASS = 'mito-app-mode-button-widget';

/** Minimal type for editor widget: we only use context.path and toolbar. */
interface IEditorWidgetWithToolbar {
  context: { path: string };
  toolbar: {
    insertAfter: (ref: string, id: string, widget: ToolbarButton) => void;
    addItem: (id: string, widget: ToolbarButton) => void;
    node: HTMLElement;
    querySelector: (selectors: string) => Element | null;
  };
}

/**
 * Add App Mode button to the file editor toolbar when the opened file is mito-app-<id>.py.
 * Uses the same pattern as StreamlitPreviewPlugin (toolbar.insertAfter) and MitoThemes (widgetAdded).
 */
const FileEditorAppModePlugin: JupyterFrontEndPlugin<void> = {
  id: 'mito-ai:file-editor-app-mode',
  description: 'Add App Mode button to file editor toolbar for mito-app-*.py files',
  autoStart: true,
  requires: [IEditorTracker, INotebookTracker, IStreamlitPreviewManager],
  activate: (
    app: JupyterFrontEnd,
    editorTracker: IEditorTracker,
    notebookTracker: INotebookTracker,
    streamlitPreviewManager: IStreamlitPreviewManager
  ): void => {
    const addAppModeButtonIfNeeded = (): void => {
      const widget = editorTracker.currentWidget;
      if (!widget || !widget.toolbar) {
        return;
      }
      const path = widget.context.path;
      if (!isMitoAppPyFilePath(path)) {
        return;
      }
      const toolbar = widget.toolbar;
      if (toolbar.node.querySelector(`.${MITO_APP_MODE_BUTTON_WIDGET_CLASS}`)) {
        return;
      }
      const appModeButton = new ToolbarButton({
        className: `text-button-mito-ai button-base button-blue button-small jp-ToolbarButton ${MITO_APP_MODE_BUTTON_WIDGET_CLASS}`,
        onClick: (): void => {
          void openAppPreviewFromAppFilePath(
            app,
            widget.context.path,
            notebookTracker,
            streamlitPreviewManager
          );
        },
        tooltip: 'Preview notebook as app and turn on App Mode',
        label: 'App Mode'
      });
      try {
        toolbar.insertAfter('spacer', MITO_APP_MODE_BUTTON_ID, appModeButton);
      } catch {
        toolbar.addItem(MITO_APP_MODE_BUTTON_ID, appModeButton);
      }
    };

    editorTracker.widgetAdded.connect((_sender: unknown, widget: unknown) => {
      const w = widget as IEditorWidgetWithToolbar;
      if (!w.context || !w.toolbar) {
        return;
      }
      if (!isMitoAppPyFilePath(w.context.path)) {
        return;
      }
      if (w.toolbar.node.querySelector(`.${MITO_APP_MODE_BUTTON_WIDGET_CLASS}`)) {
        return;
      }
      const appModeButton = new ToolbarButton({
        className: `text-button-mito-ai button-base button-blue button-small jp-ToolbarButton ${MITO_APP_MODE_BUTTON_WIDGET_CLASS}`,
        onClick: (): void => {
          void openAppPreviewFromAppFilePath(
            app,
            w.context.path,
            notebookTracker,
            streamlitPreviewManager
          );
        },
        tooltip: 'Preview notebook as app and turn on App Mode',
        label: 'App Mode'
      });
      try {
        w.toolbar.insertAfter('spacer', MITO_APP_MODE_BUTTON_ID, appModeButton);
      } catch {
        w.toolbar.addItem(MITO_APP_MODE_BUTTON_ID, appModeButton);
      }
    });

    editorTracker.currentChanged.connect(addAppModeButtonIfNeeded);
    addAppModeButtonIfNeeded();

    console.log('mito-ai: FileEditorAppModePlugin activated');
  }
};

export default FileEditorAppModePlugin;
