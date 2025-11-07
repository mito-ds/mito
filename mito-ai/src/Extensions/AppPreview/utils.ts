/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import { PathExt } from "@jupyterlab/coreutils";
import { startStreamlitPreview } from "../../restAPI/RestAPI";
import { StreamlitPreviewResponseError, StreamlitPreviewResponseSuccess } from "./StreamlitPreviewPlugin";
import { Dialog, Notification, showDialog } from "@jupyterlab/apputils";
import { NotebookPanel } from '@jupyterlab/notebook';


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

  const previewData = await startStreamlitPreview(notebookPath, notebookID, force_recreate, edit_prompt);

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
    void startStreamlitPreviewAndNotify(notebookPath, notebookID, true, undefined, 'Recreating app from scratch...', 'App recreated successfully!');
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