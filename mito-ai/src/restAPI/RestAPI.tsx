/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import { requestAPI } from "./utils";
import { StreamlitPreviewResponseError, StreamlitPreviewResponseSuccess } from "../Extensions/AppPreview/StreamlitPreviewPlugin";


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
    notebookID: string | undefined,
    force_recreate: boolean = false,
    edit_prompt: string = ''
): Promise<StreamlitPreviewResponseSuccess | StreamlitPreviewResponseError> => {
    const response = await requestAPI<StreamlitPreviewResponseSuccess>('streamlit-preview', {
        method: 'POST',
        body: JSON.stringify({ 
            notebook_path: notebookPath, 
            notebook_id: notebookID,
            force_recreate: force_recreate,
            edit_prompt: edit_prompt
        })
    })
    
    if (response.error) {
        const streamlitPreviewReponseError: StreamlitPreviewResponseError = {
            type: 'error',
            message: response.error.message
        }
        return streamlitPreviewReponseError
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

/************************************

CHAT HISTORY ENDPOINTS

************************************/

export interface ChatThreadMetadata {
    thread_id: string;
    name: string;
    creation_ts: number;
    last_interaction_ts: number;
}

export interface ChatThread {
    thread_id: string;
    name: string;
    creation_ts: number;
    last_interaction_ts: number;
    display_history: Array<{role: string, content: string}>;
    ai_optimized_history: Array<{role: string, content: string}>;
}

export const getChatHistoryThreads = async (): Promise<ChatThreadMetadata[]> => {
    const resp = await requestAPI<{threads: ChatThreadMetadata[]}>('chat-history/threads')
    if (resp.error) {
        throw new Error(resp.error.message);
    }
    return resp.data?.threads || [];
}

export const getChatHistoryThread = async (threadId: string): Promise<ChatThread> => {
    const resp = await requestAPI<ChatThread>(`chat-history/threads/${threadId}`)
    if (resp.error) {
        throw new Error(resp.error.message);
    }
    return resp.data!;
}