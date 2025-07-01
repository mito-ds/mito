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

const getFirstMessageFromCookies = (): string | null => {
    const firstMessage = getCookie('mito-ai-first-message');
    if (firstMessage) {
        // Clean up cookie after reading
        deleteCookie('mito-ai-first-message');
        return firstMessage;
    }
    return null;
}

export const getFirstMessageFromCookie = (): string | undefined => {
    // Primary: Check cookies (works through SSO flow)
    const firstMessage = getFirstMessageFromCookies();
    console.log('Cookie check:', firstMessage);

    return firstMessage || undefined;
}