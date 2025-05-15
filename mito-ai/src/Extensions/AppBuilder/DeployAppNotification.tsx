import { Notification } from '@jupyterlab/apputils';

export const deployAppNotification = (): void => {
    // Total deployment time in milliseconds (2 minutes = 120000ms)
    const totalDeploymentTime = 10000;
    
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
                                window.open("https://www.trymito.io/", '_blank');
                            }
                        }
                    ]
                })
            });
        }, i * stepInterval);
    }
}