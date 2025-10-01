/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import { INotebookTracker } from '@jupyterlab/notebook';
import { Notification } from '@jupyterlab/apputils';
import { generateRequirementsTxt } from './requirementsUtils';
import { saveFileWithKernel } from './fileUtils';
import { IAppDeployService } from './AppDeployPlugin';
import { IAppManagerService } from '../AppManager/ManageAppsPlugin';
import { UUID } from '@lumino/coreutils';
import { deployAppNotification } from './DeployAppNotification';
import { IDeployAppReply, IDeployAppRequest } from '../../websockets/appDeploy/appDeployModels';
import {getJWTToken } from './auth';
import { showAuthenticationPopup } from './authPopupUtils';
import { fileSelectorPopup } from './FilesSelectorUtils';


/* 
This function generates the requirements.txt file needed to host the streamlit app, 
and deploys it! 
*/
export const deployStreamlitApp = async (
  notebookTracker: INotebookTracker,
  appDeployService: IAppDeployService,
  appManagerService: IAppManagerService,
): Promise<void> => {

  let selectedFiles: string[] = [];
  let jwtToken = await getJWTToken();
  if (!jwtToken) {
    // No token found, show authentication popup
    console.log('User not authenticated, redirected to signup');
    try {
      const user = await showAuthenticationPopup();
      console.log('User authenticated successfully:', user);
      // Try to get the JWT token again after successful authentication
      jwtToken = await getJWTToken();
      if (!jwtToken) {
        console.error('JWT token still not available after authentication');
        Notification.emit('Authentication failed - JWT token not found', 'error', {
          autoClose: false
        });
        return;
      }
    } catch (error) {
      console.log('Authentication cancelled or failed:', error);
      return; // Exit early if authentication was cancelled
    }
  }

  const notebookPanel = notebookTracker.currentWidget;
  if (!notebookPanel) {
    console.error('No notebook is currently active');
    return;
  }
  const notebookPath = notebookPanel.context.path;

  const notificationId = Notification.emit('Step 1/7: Gathering requirements...', 'in-progress', {
    autoClose: false
  });

  // Build the requirements.txt file
  const requirementsContent = await generateRequirementsTxt(notebookTracker);

  // Save the files to the current directory
  await saveFileWithKernel(notebookTracker, './requirements.txt', requirementsContent);

  try{
    Notification.dismiss(notificationId);
    selectedFiles = await fileSelectorPopup(notebookPath);
  }catch (error) {
      console.log('File selection failed:', error);
      return;
  }

  const newNotificationId = Notification.emit("Step 2/7: Preparing your app...", 'in-progress', {
      autoClose: false
    });

  // After building the files, we need to send a request to the backend to deploy the app
  try {
    console.log("Sending request to deploy the app");

    // Use the JWT token that was already obtained or refreshed above
    const response: IDeployAppReply = await appDeployService.client.sendMessage<IDeployAppRequest, IDeployAppReply>({
      type: 'deploy-app',
      message_id: UUID.uuid4(),
      notebook_path: notebookPath,
      jwt_token: jwtToken,
      selected_files: selectedFiles
    });

    if (response.error) {
      Notification.update({
        id: newNotificationId,
        message: response.error.title,
        type: 'error',
        autoClose: false
      });
    } else {
      console.log("App deployment response:", response);
      const url = response.url;
      deployAppNotification(url, appManagerService, newNotificationId);
    }
  } catch (error) {
    // TODO: Do something with the error
    console.error("Error deploying app:", error);
  }
};
