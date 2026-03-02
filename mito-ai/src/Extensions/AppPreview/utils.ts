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
import { getNotebookID } from '../../utils/notebookMetadata';

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

/**
 * From an app file path (e.g. .../mito-app-abc123.py), find the associated notebook panel
 * (by matching notebook_id in metadata) and open the app preview. If no matching notebook
 * is open, shows a notification. Optionally can open the notebook by path via documentManager
 * (same directory, mito-notebook-<id>.ipynb) and then open preview once it appears.
 */
export const openAppPreviewFromAppFilePath = async (
  app: JupyterFrontEnd,
  appPath: string,
  notebookTracker: INotebookTracker,
  streamlitPreviewManager: IStreamlitPreviewManager
): Promise<void> => {
  const notebookID = getNotebookIDFromAppFilePath(appPath);
  if (!notebookID) {
    Notification.emit('Could not determine notebook ID from app file path.', 'error');
    return;
  }
  const notebookPanel = findNotebookPanelByNotebookID(notebookTracker, notebookID);
  if (notebookPanel) {
    await streamlitPreviewManager.openAppPreview(app, notebookPanel);
    return;
  }
  Notification.emit(
    'Open the source notebook (mito-notebook-*.ipynb) to use App Mode from this file.',
    'warning',
    { autoClose: 5000 }
  );
};