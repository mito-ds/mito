/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

/************************************

LOG ENDPOINTS

************************************/

export const logEvent = async (logEvent: string, params?: Record<string, any>): Promise<void> => {
    const resp = await requestAPI<void>('log', {
        method: 'PUT',
        body: JSON.stringify({ 
            log_event: logEvent,
            params: params || {}
        }),
    });
    
    if (resp.error) {
        console.error(resp.error.message);
    }
}


/************************************

SETTINGS ENDPOINTS

************************************/

import { requestAPI } from "./utils";

export const getSetting = async (settingsKey: string): Promise<string | undefined> => {

    const resp = await requestAPI<{key: string, value: string} | undefined>(`settings/${settingsKey}`)
    if (resp.error) {
        throw new Error(resp.error.message);
    }

    return resp.data?.value || undefined;
}

export const updateSettings = async (settingsKey: string, settingsValue: string): Promise<string> => {
    const resp = await requestAPI<string>(`settings/${settingsKey}`, {
        method: 'PUT',
        body: JSON.stringify({ value: settingsValue }),
    })
    if (resp.error) {
        throw new Error(resp.error.message);
    }
    return resp.data || '';
}


/************************************

RULES ENDPOINTS

************************************/

export const setRule = async(ruleName: string, ruleContent: string): Promise<string> => {
    const resp = await requestAPI<string>(`rules/${ruleName}`, {
        method: 'PUT',
        body: JSON.stringify({ content: ruleContent }),
    })
    if (resp.error) {
        throw new Error(resp.error.message);
    }

    return resp.data || '';
}

export const getRule = async(ruleName: string): Promise<string | undefined> => {
    const resp = await requestAPI<{key: string, content: string}>(`rules/${ruleName}`)
    if (resp.error) {
        throw new Error(resp.error.message);
    }

    return resp.data?.content;
}

export const getRules = async(): Promise<string[]> => {
    const resp = await requestAPI<string[]>(`rules`)
    if (resp.error) {
        throw new Error(resp.error.message);
    }
    return resp.data || [];
}
