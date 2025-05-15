import { Notification } from '@jupyterlab/apputils';

export const deployAppNotification = (): void => {
    // Create an array of loading messages to cycle through
    const loadingMessages: string[] = [
        'Deploying your app. This will take about 2 minutes...',
        'Setting up your app environment...',
        'Bundling application resources...',
        'Almost there! Finalizing deployment...'
    ];

    if (loadingMessages.length === 0) {
        return;
    }
    
    // Create initial "in progress" notification
    const notificationId = Notification.emit(loadingMessages[0]!, 'in-progress', {
        autoClose: false
    });
    
    // Update message every 30 seconds using a loop
    for (let i = 1; i < loadingMessages.length; i++) {
        setTimeout(() => {
            Notification.update({
                id: notificationId,
                message: loadingMessages[i],
                type: 'in-progress'
            });
        }, i * 5000); // i * 30 seconds
    }
    
    // After 2 minutes, update the notification to show deployment success
    setTimeout(() => {
        // Update the notification to success
        Notification.update({
            id: notificationId,
            message: 'Your app has been successfully deployed!',
            type: 'success',
            autoClose: false,
            actions: [
                {
                    label: "View App",
                    callback: () => {
                        window.open("https://www.trymito.io/", '_blank');
                    }
                }
            ]
        });
    }, 30000); // 2 minutes = 120000ms
}