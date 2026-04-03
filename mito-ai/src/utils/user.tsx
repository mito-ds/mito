/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */


export type OperatingSystem = 'mac' | 'windows'

export const getOperatingSystem = (): OperatingSystem => {
    if (navigator.userAgent.includes('Macintosh')) {
        return 'mac'
    } else {
        return 'windows'
    }
}

export const isChromeBasedBrowser = (): boolean => {
    return /chrome/i.test(navigator.userAgent) && !/edge|edg/i.test(navigator.userAgent);
}

/**
 * True when the chat model is a GitHub Copilot API model (copilot/…).
 * Used to disable image/cell-output features that Copilot backends may not support.
 */
export const isCopilotModelSelected = (): boolean => {
    try {
        const stored = localStorage.getItem('llmModelConfig');
        if (!stored) {
            return false;
        }
        const parsed = JSON.parse(stored) as { model?: string };
        const m = parsed.model?.toLowerCase() ?? '';
        return m.startsWith('copilot/');
    } catch {
        return false;
    }
};


export const isElectronBasedFrontend = (): boolean => {
    /* 
    Checks if the user is using an Electron-based browser.
    This tells us that they are using Mito Desktop or JupyterLab Desktop.
    */
    const userAgent = navigator.userAgent.toLowerCase();
    return userAgent.includes('electron')
}