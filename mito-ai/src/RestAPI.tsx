/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import { PageConfig } from "@jupyterlab/coreutils";

const baseUrl = PageConfig.getBaseUrl();

export const getXsrfToken = (): string | null | undefined => {
    const cookies = document.cookie.split(';');
    const xsrfCookie = cookies.find(cookie => cookie.trim().startsWith('_xsrf='));
    if (xsrfCookie) {
        return xsrfCookie.split('=')[1];
    }
    return null;
}

/************************************

SETTINGS ENDPOINTS

************************************/

export const getSetting = async(settingsKey: string): Promise<string | undefined> => {
    const response = await fetch(`${baseUrl}mito-ai/settings/${settingsKey}`, {
        headers: {
            'Content-Type': 'application/json',
            'X-XSRFToken': getXsrfToken() || '',
        }
    });
    const data = await response.json();
    return data.value;
}

export const updateSettings = async(settingsKey: string, settingsValue: string): Promise<string> => {
    const response = await fetch(`${baseUrl}mito-ai/settings/${settingsKey}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'X-XSRFToken': getXsrfToken() || '',
        },
        body: JSON.stringify({ value: settingsValue }),
    });
    const data = await response.json();
    return data.value;
}
