import { Notification } from '@jupyterlab/apputils';

export const deployAppNotification = (): void => {
    
    // Create initial "in progress" notification
    const deployingId = Notification.emit('Deploying your app. This will take about 2 minutes...', 'in-progress', {
        autoClose: false
    });
    
    // After 2 minutes, dismiss the "in progress" notification and show the "deployed" notification
    setTimeout(() => {
        // Dismiss the initial notification
        if (deployingId) {
            Notification.dismiss(deployingId);
        }
        
        // Show the "deployed" notification
        Notification.emit('Your app has been successfully deployed!', 'success', {
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
    }, 120000); // 2 minutes = 120000ms
}