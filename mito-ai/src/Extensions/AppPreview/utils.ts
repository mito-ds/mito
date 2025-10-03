/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import { startStreamlitPreview } from "../../restAPI/RestAPI";
import { StreamlitPreviewResponse } from "./StreamlitPreviewPlugin";
import { Notification } from "@jupyterlab/apputils";


export const startStreamlitPreviewAndNotify = async (
  notebookPath: string, 
  force_recreate: boolean = false,
  edit_prompt: string = '',
  start_notification_message: string = 'Building App Preview...',
  success_notification_message: string = 'Streamlit preview started successfully!'
): Promise<StreamlitPreviewResponse | undefined> => {
    
    const notificationId = Notification.emit(
      start_notification_message,
      'in-progress',
      { autoClose: false }
    );
    
    try {
      const previewData = await startStreamlitPreview(notebookPath, force_recreate, edit_prompt);
    
      // Update notification to success
      Notification.update({
        id: notificationId,
        message: success_notification_message,
        type: 'success',
        autoClose: 5 * 1000
      });

      return previewData;

    } catch (error) {

      // Display error notification
      Notification.update({
        id: notificationId,
        message: "Failed to start app preview: " + String(error),
        type: 'error',
        autoClose: 5 * 1000
      });

      return undefined;
    }
  }