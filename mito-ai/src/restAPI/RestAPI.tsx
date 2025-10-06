/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import { requestAPI } from "./utils";
import { StreamlitPreviewResponse } from "../Extensions/AppPreview/StreamlitPreviewPlugin";


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

export const fetchGoogleDriveContent = async (url: string): Promise<{content: string, file_type: string, file_id: string}> => {
    const resp = await requestAPI<{content: string, file_type: string, file_id: string}>(`rules`, {
        method: 'POST',
        body: JSON.stringify({
            action: 'fetch_google_drive_content',
            url: url
        }),
    })
    if (resp.error) {
        throw new Error(resp.error.message);
    }
    return resp.data!;
}

export const refreshGoogleDriveRules = async (): Promise<{success: string[], errors: Array<{rule: string, error: string}>}> => {
    const resp = await requestAPI<{success: string[], errors: Array<{rule: string, error: string}>}>(`rules`, {
        method: 'POST',
        body: JSON.stringify({
            action: 'refresh_google_drive_rules'
        }),
    })
    if (resp.error) {
        throw new Error(resp.error.message);
    }
    return resp.data!;
}

/************************************

DATABASE ENDPOINTS

************************************/

export const getDatabaseConnections = async (): Promise<Record<string, any>> => {
    const resp = await requestAPI<Record<string, any>>('db/connections')
    if (resp.error) {
        throw new Error(resp.error.message);
    }
    return resp.data || {};
}

/************************************

STREAMLIT PREVIEW ENDPOINTS

************************************/


export const startStreamlitPreview = async(
    notebookPath: string, 
    force_recreate: boolean = false,
    edit_prompt: string = ''
): Promise<StreamlitPreviewResponse> => {
    const response = await requestAPI<StreamlitPreviewResponse>('streamlit-preview', {
        method: 'POST',
        body: JSON.stringify({ 
            notebook_path: notebookPath, 
            force_recreate: force_recreate,
            edit_prompt: edit_prompt
        })
    })
    
    if (response.error) {
        throw new Error(response.error.message);
    }

    return response.data!;
}

export const stopStreamlitPreview = async (previewId: string): Promise<void> => {
    const response = await requestAPI<void>(`streamlit-preview/${previewId}`, {
        method: 'DELETE',
    })
    
    if (response.error) {
        throw new Error(response.error.message);
    }
}

/************************************

USER ENDPOINTS

************************************/

export const getUserKey = async (key: string): Promise<string | undefined> => {
    const resp = await requestAPI<{key: string, value: string}>(`user/${key}`)
    if (resp.error) {
        throw new Error(resp.error.message);
    }

    return resp.data?.value;
}

export const setUserKey = async (key: string, value: string): Promise<string> => {
    const resp = await requestAPI<string>(`user/${key}`, {
        method: 'PUT',
        body: JSON.stringify({ value: value }),
    })
    if (resp.error) {
        throw new Error(resp.error.message);
    }
    return resp.data || '';
}