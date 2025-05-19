/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import { Notification } from '@jupyterlab/apputils';

export const deployAppNotification = (url: string): void => {
    // Total deployment time in milliseconds (3 minutes = 180000ms)
    const totalDeploymentTime = 180000;
    
    // Create an array of deployment steps
    const deploymentSteps = [
        "Step 1/7: Preparing your app...",
        "Step 2/7: Assembling clouds...",
        "Step 3/7: Building your app...",
        "Step 4/7: Configuring network settings...",
        "Step 5/7: Adding final touches...",
        "Step 6/7: Running security checks...",
        "Deployment complete! Your app is ready."
    ];
    
    // Create initial "in progress" notification to get notificaiton id
    const notificationId = Notification.emit(deploymentSteps[0]!, 'in-progress', {
        autoClose: false
    });
    
    // Calculate time between steps (evenly distribute throughout the total deployment time)
    const stepInterval = totalDeploymentTime / (deploymentSteps.length - 1);
    
    // Update message at each step interval
    for (let i = 1; i < deploymentSteps.length; i++) {
        setTimeout(() => {
            const isLastStep = i === deploymentSteps.length - 1;
            Notification.update({
                id: notificationId,
                message: deploymentSteps[i],
                type: isLastStep ? 'default' : 'in-progress',
                autoClose: false,
                ...(isLastStep && {
                    actions: [
                        {
                            label: "Launch Application Now",
                            displayType: 'accent', // Change display type to link
                            callback: () => {
                                window.open(url, '_blank');
                            }
                        }
                    ]
                })
            });
        }, i * stepInterval);
    }
}