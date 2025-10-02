/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import { startStreamlitPreview } from "../../restAPI/RestAPI";
import { StreamlitPreviewResponse } from "./StreamlitPreviewPlugin";
import { Notification } from "@jupyterlab/apputils";


export const startStreamlitPreviewAndNotify = async (notebookPath: string, force_recreate: boolean = false): 
    Promise<{ previewData: StreamlitPreviewResponse, notificationId: string }> => {
    
    
    const notificationId = Notification.emit(
      'Building App Preview...',
      'in-progress',
      { autoClose: false }
    );
    
    const previewData = await startStreamlitPreview(notebookPath, force_recreate);
  
    // Update notification to success
    Notification.update({
      id: notificationId,
      message: 'Streamlit preview started successfully!',
      type: 'default',
      autoClose: 5 * 1000
    });
  
    return { previewData, notificationId };
  }