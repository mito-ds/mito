/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import { INotebookTracker } from '@jupyterlab/notebook';
import { PathExt } from '@jupyterlab/coreutils';
import { Notification } from '@jupyterlab/apputils';
import { generateRequirementsTxt } from './requirementsUtils';
import { saveFileWithKernel } from './fileUtils';
import { IAppBuilderService } from './AppBuilderPlugin';
import { UUID } from '@lumino/coreutils';
import { deployAppNotification } from './DeployAppNotification';
import { IBuildAppReply, IBuildAppRequest } from '../../websockets/appBuilder/appBuilderModels';
import { checkAuthenticationAndRedirect, getJWTToken } from './auth';

/* 
This function generates a requirements.txt file that lists the dependencies for the streamlit app
*/
export const convertNotebookToStreamlit = async (
  notebookTracker: INotebookTracker,
  appBuilderService?: IAppBuilderService,
): Promise<void> => {
  // Check authentication before proceeding with deployment
  const isAuthenticated = await checkAuthenticationAndRedirect();
  if (!isAuthenticated) {
    console.log('User not authenticated, redirected to signup');
    return;
  }

  const notebookPanel = notebookTracker.currentWidget;
  if (!notebookPanel) {
    console.error('No notebook is currently active');
    return;
  }

  const notebookPath = notebookPanel.context.path;
  const notebookName = PathExt.basename(notebookPath, '.ipynb');
  console.log('Notebook path:', notebookPath);
  console.log('Notebook name:', notebookName);
  console.log('Current working directory info:', notebookPanel.context);

  // Build the requirements.txt file
  console.debug("Building requirements.txt file")
  const requirementsContent = await generateRequirementsTxt(notebookTracker);

  // Save the files to the current directory
  await saveFileWithKernel(notebookTracker, './requirements.txt', requirementsContent);

  // After building the files, we need to send a request to the backend to deploy the app
  if (appBuilderService) {
    try {
      console.log("Sending request to deploy the app");
      
      // Get JWT token for authentication
      const jwtToken = getJWTToken();
      
      const response: IBuildAppReply = await appBuilderService.client.sendMessage<IBuildAppRequest, IBuildAppReply>({
        type: 'build-app',
        message_id: UUID.uuid4(),
        notebook_path: notebookPath,
        jwt_token: jwtToken || appBuilderService.client.serverSettings.token
      });

      if (response.error) {
        Notification.emit(response.error.title, 'error', {
            autoClose: false
        });
      }
      else{
        console.log("App deployment response:", response);
        const url = response.url;
        deployAppNotification(url);
      }
    } catch (error) {
      // TODO: Do something with the error
      console.error("Error deploying app:", error);
    }
  } else {
    console.warn("AppBuilderService not provided - app will not be deployed");
  }
};