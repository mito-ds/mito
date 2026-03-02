/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import { PathExt } from "@jupyterlab/coreutils";
import { startStreamlitAppPreview } from "../../restAPI/RestAPI";
import { StreamlitPreviewResponseError, StreamlitPreviewResponseSuccess } from "./StreamlitPreviewPlugin";
import { Dialog, Notification, showDialog } from "@jupyterlab/apputils";
import { INotebookTracker, NotebookPanel } from '@jupyterlab/notebook';
import { JupyterFrontEnd } from '@jupyterlab/application';
import type { IStreamlitPreviewManager } from './StreamlitPreviewPlugin';
import { getNotebookID, MITO_NOTEBOOK_ID_KEY } from '../../utils/notebookMetadata';
import type { IDocumentManager } from '@jupyterlab/docmanager';

const MITO_APP_PY_PATTERN = /^mito-app-.+\.py$/;

/**
 * Returns true if the path's basename matches mito-app-<id>.py (Mito-generated Streamlit app file).
 */
export const isMitoAppPyFilePath = (path: string): boolean => {
  const basename = PathExt.basename(path);
  return MITO_APP_PY_PATTERN.test(basename);
};

/**
 * Derives the notebook_id (e.g. mito-notebook-abc123) from an app file path (e.g. .../mito-app-abc123.py).
 * Returns undefined if the path does not match mito-app-<id>.py.
 */
export const getNotebookIDFromAppFilePath = (path: string): string | undefined => {
  const basename = PathExt.basename(path, '.py');
  if (!basename.startsWith('mito-app-') || basename === 'mito-app-') {
    return undefined;
  }
  const idSuffix = basename.slice('mito-app-'.length);
  return idSuffix ? `mito-notebook-${idSuffix}` : undefined;
};


export const startStreamlitPreviewAndNotify = async (
  notebookPath: string,
  notebookID: string | undefined,
  force_recreate: boolean = false,
  edit_prompt: string = '',
  start_notification_message: string = 'Building App Preview...',
  success_notification_message: string = 'Streamlit preview started successfully!'
): Promise<StreamlitPreviewResponseSuccess | StreamlitPreviewResponseError> => {

  const notificationId = Notification.emit(
    start_notification_message,
    'in-progress',
    { autoClose: false }
  );


  // TODO: I can have one function for creating new streamlit app and another function for editing a streamlit app
  const previewData = await startStreamlitAppPreview(notebookPath, notebookID, force_recreate, edit_prompt);

  if (previewData.type === 'success') {
    // Update notification to success
    Notification.update({
      id: notificationId,
      message: success_notification_message,
      type: 'success',
      autoClose: 5 * 1000
    });
  } else {
    // Display error notification
    Notification.update({
      id: notificationId,
      message: "Failed to start app preview: " + String(previewData.message),
      type: 'error',
      autoClose: 5 * 1000
    });
  }

  return previewData;
}


export async function showRecreateAppConfirmation(notebookPath: string, notebookID: string | undefined): Promise<void> {
  const result = await showDialog({
    title: 'Recreate App',
    body: 'This will recreate the app from scratch, discarding all your current edits. This action cannot be undone. Are you sure you want to continue?',
    buttons: [
      Dialog.cancelButton({ label: 'Cancel' }),
      Dialog.warnButton({ label: 'Recreate App' })
    ],
    defaultButton: 1
  });

  if (result.button.accept) {
    void startStreamlitPreviewAndNotify(notebookPath, notebookID, true, '', 'Recreating app from scratch...', 'App recreated successfully!');
  }
}

export const getAppPreviewNameFromNotebookPanel = (notebookPanel: NotebookPanel): string => {
  const notebookPath = notebookPanel.context.path;
  const notebookName = PathExt.basename(notebookPath, '.ipynb');
  return `App Preview (${notebookName})`;
}

export const getAppNameFromNotebookID= (notebookID: string): string => {
  let appName = notebookID.replace('mito-notebook-', 'mito-app-')
  appName = appName + '.py'
  return appName
}

/**
 * Find a notebook panel whose metadata has the given notebook_id.
 */
export const findNotebookPanelByNotebookID = (
  notebookTracker: INotebookTracker,
  notebookID: string
): NotebookPanel | undefined => {
  let found: NotebookPanel | undefined;
  notebookTracker.forEach((widget: NotebookPanel) => {
    if (getNotebookID(widget) === notebookID) {
      found = widget;
    }
  });
  return found;
};

/** Notebook file model from contents API: content has metadata. */
interface INotebookContentModel {
  type?: string;
  content?: { metadata?: Record<string, unknown> };
}

/**
 * Find the path of an .ipynb file in the given directory whose metadata
 * contains the given notebook_id (mito-notebook-<id>). Reads each .ipynb
 * via the contents API and checks metadata['mito-notebook-id'].
 */
export const findNotebookPathByNotebookIDInDirectory = async (
  app: JupyterFrontEnd,
  dirPath: string,
  notebookID: string
): Promise<string | undefined> => {
  const contents = app.serviceManager.contents;
  try {
    const dir = await contents.get(dirPath);
    if (dir.type !== 'directory' || !Array.isArray(dir.content)) {
      return undefined;
    }
    const ipynbEntries = dir.content.filter(
      (entry: { name?: string }) => entry.name?.endsWith('.ipynb')
    );
    for (const entry of ipynbEntries as { name: string; path?: string }[]) {
      const fullPath = entry.path ?? PathExt.join(dirPath, entry.name);
      const model = await contents.get(fullPath) as INotebookContentModel;
      const fileNotebookID = model?.content?.metadata?.[MITO_NOTEBOOK_ID_KEY];
      if (fileNotebookID === notebookID) {
        return fullPath;
      }
    }
  } catch {
    // ignore: directory or file read errors
  }
  return undefined;
};

const WAIT_FOR_PANEL_MS = 5000;
const WAIT_POLL_MS = 200;

/**
 * Wait for a notebook panel with the given notebook_id to appear in the tracker (e.g. after opening by path).
 */
const waitForNotebookPanelByNotebookID = (
  notebookTracker: INotebookTracker,
  notebookID: string
): Promise<NotebookPanel | undefined> => {
  return new Promise((resolve) => {
    const deadline = Date.now() + WAIT_FOR_PANEL_MS;
    const check = (): void => {
      const panel = findNotebookPanelByNotebookID(notebookTracker, notebookID);
      if (panel) {
        resolve(panel);
        return;
      }
      if (Date.now() >= deadline) {
        resolve(undefined);
        return;
      }
      setTimeout(check, WAIT_POLL_MS);
    };
    check();
  });
};

/**
 * From an app file path (e.g. .../mito-app-abc123.py), determine the notebook_id from the
 * filename (id after "mito-app-" prefix), then find the notebook by:
 * 1. Matching an already-open notebook panel's metadata, or
 * 2. Listing .ipynb files in the same directory and reading their metadata via the contents API.
 * If a matching notebook is found (or opened), opens the app preview. Otherwise shows an error.
 */
export const openAppPreviewFromAppFilePath = async (
  app: JupyterFrontEnd,
  appPath: string,
  notebookTracker: INotebookTracker,
  streamlitPreviewManager: IStreamlitPreviewManager,
  documentManager: IDocumentManager
): Promise<void> => {
  const notebookID = getNotebookIDFromAppFilePath(appPath);
  if (!notebookID) {
    Notification.emit('Could not determine notebook ID from app file path.', 'error');
    return;
  }
  let notebookPanel = findNotebookPanelByNotebookID(notebookTracker, notebookID);
  if (notebookPanel) {
    await streamlitPreviewManager.openAppPreview(app, notebookPanel);
    return;
  }
  const dirPath = PathExt.dirname(appPath);
  const notebookPath = await findNotebookPathByNotebookIDInDirectory(app, dirPath, notebookID);
  if (!notebookPath) {
    Notification.emit(
      'No notebook in this directory matches this app file. Create the app from a notebook first.',
      'error',
      { autoClose: 5000 }
    );
    return;
  }
  void documentManager.open(notebookPath);
  notebookPanel = await waitForNotebookPanelByNotebookID(notebookTracker, notebookID);
  if (notebookPanel) {
    await streamlitPreviewManager.openAppPreview(app, notebookPanel);
  } else {
    Notification.emit(
      'Opened the source notebook but could not start App Mode. Try again.',
      'warning',
      { autoClose: 5000 }
    );
  }
};