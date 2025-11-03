/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

const getCookie = (name: string): string | null => {
    const nameEQ = name + "=";
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        if (!c) continue;
        while (c.charAt(0) === ' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
}

const deleteCookie = (name: string): void => {
    // Delete for current domain
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    // Delete for all subdomains
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.trymito.io;`;
}

export const getFirstMessageFromCookie = (): string | undefined => {
    // Primary: Check cookies (works through SSO flow)
    const firstMessage = getCookie('mito-ai-first-message');
    if (firstMessage) {
        // Clean up cookie after reading
        deleteCookie('mito-ai-first-message');
        return firstMessage;
    }
    console.log('Cookie check:', firstMessage);

    return firstMessage || undefined;
}


/**
 * Get the first message from the Electron Desktop app prompt.
 * This checks for window.mitoDesktopAIPrompt which is set by the Electron app
 * when a user submits a prompt from the welcome screen.
 */
export const getFirstMessageFromDesktopPrompt = (): string | undefined => {
    // Check if we're in the Electron desktop app environment
    const desktopPrompt = (window as any)?.mitoDesktopAIPrompt;
    
    if (desktopPrompt && typeof desktopPrompt === 'string') {
        // Clear the prompt after reading to avoid reusing it
        delete (window as any)?.mitoDesktopAIPrompt;
        console.log('Desktop prompt found:', desktopPrompt);
        return desktopPrompt;
    }
    
    return undefined;
}

/**
 * Get the first message from either cookies or the Electron Desktop app prompt.
 */
export const getFirstMessage = (): string | undefined => {
    // First, check for desktop app prompt (higher priority for desktop users)
    const desktopPrompt = getFirstMessageFromDesktopPrompt();
    if (desktopPrompt) {
        return desktopPrompt;
    }
    
    // Fallback to cookie-based prompt (works through SSO flow for web users)
    return getFirstMessageFromCookie();
}