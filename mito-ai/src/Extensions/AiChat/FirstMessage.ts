const getFirstMessageFromUrlParams = (): string | null => {
    const urlParams = new URLSearchParams(window.location.search);
    const firstMessage = urlParams.get('mito-ai-first-message');
    
    if (firstMessage) {
        // Remove the parameter from the URL to avoid processing it again
        urlParams.delete('mito-ai-first-message');
        const newUrl = window.location.pathname + (urlParams.toString() ? '?' + urlParams.toString() : '');
        window.history.replaceState({}, '', newUrl);
        return decodeURIComponent(firstMessage);
    }
    
    return null;
}

export const processFirstMessageFromSessionStorage = (
    startAgentExecution: (message: string) => Promise<void>
): void => {
    const firstMessage = getFirstMessageFromUrlParams();
    console.log('First message from URL params:', firstMessage);
    
    if (firstMessage) {
        void startAgentExecution(firstMessage);
    }
}