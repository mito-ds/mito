/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import { Notification } from '@jupyterlab/apputils';
import { checkAppStatus } from '../AppManager/CheckAppStatusAPI';
import type { IAppManagerService } from '../AppManager/ManageAppsPlugin';

export const deployAppNotification = (url: string, appManagerService: IAppManagerService, notificationId: string): void => {
    // Total deployment time in milliseconds (3 minutes = 180000ms)
    const totalDeploymentTime = 180000;
    
    // Create an array of deployment steps
    const deploymentSteps = [
        "Step 2/7: Preparing your app...",
        "Step 3/7: Assembling clouds...",
        "Step 4/7: Building your app...",
        "Step 5/7: Configuring network settings...",
        "Step 6/7: Adding final touches...",
        "Step 7/7: Running security checks...",
        "Deployment complete! Your app is ready."
    ];


    // Calculate time between steps (evenly distribute throughout the total deployment time)
    const stepInterval = totalDeploymentTime / (deploymentSteps.length - 1);
    let retryCount = 5;
    
    // Update message at each step interval
    for (let i = 0; i < deploymentSteps.length; i++) {
        setTimeout(() => {
            const isLastStep = i === deploymentSteps.length - 1;
            if (isLastStep) {
            const checkUrlAndUpdate = async (): Promise<void> => {
                if (retryCount < 0) {
                  console.log("Retries done")
                  Notification.update({
                    id: notificationId,
                    message: "Unable to deploy. Your app is not reachable",
                    type: 'warning',
                    autoClose: false
                  });
                  return;
                }
                
                try {
                  console.log("Awaiting response")
                  const urlIsUp = await checkAppStatus(url, appManagerService);
                  console.log(`App status check result for ${url}: ${urlIsUp}`);

                  if (urlIsUp) {
                      // Update notification with the button
                      Notification.update({
                          id: notificationId,
                          message: deploymentSteps[i],
                          type: 'default',
                          autoClose: false,
                          actions: [
                              {
                                  label: "Launch Application Now",
                                  displayType: 'accent',
                                  callback: () => {
                                      window.open(url, '_blank');
                                  }
                              }
                          ]
                      });
                  } else {
                      // Retry after 30s
                      console.log("In retry for url to be up")
                      retryCount = retryCount - 1;
                      setTimeout(() => void checkUrlAndUpdate(), 30000);
                  }
                } catch (error) {
                  // Retry after 30s
                  console.error("Error checking app status:", error);
                  retryCount = retryCount - 1;
                  setTimeout(() => void checkUrlAndUpdate(), 30000);
              }
            };

            void checkUrlAndUpdate();
          } else{
            // Regular intermediate step
            Notification.update({
                id: notificationId,
                message: deploymentSteps[i],
                type: 'in-progress',
                autoClose: false
            });
          }
        }, i * stepInterval);
    }
};