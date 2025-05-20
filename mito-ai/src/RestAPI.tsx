import { PageConfig } from "@jupyterlab/coreutils";

const baseUrl = PageConfig.getBaseUrl();

/************************************

SETTINGS ENDPOINTS

************************************/

export const getSetting = async(settingsKey: string): Promise<string | undefined> => {
    const response = await fetch(`${baseUrl}mito-ai/settings/${settingsKey}`, {
        headers: {
            'Content-Type': 'application/json',
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
        },
        body: JSON.stringify({ value: settingsValue }),
    });
    const data = await response.json();
    return data.value;
}
