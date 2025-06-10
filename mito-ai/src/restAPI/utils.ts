/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import { URLExt } from "@jupyterlab/coreutils";
import { ServerConnection } from '@jupyterlab/services';

interface APIResponse<T> {
    data?: T;
    error?: {
        message: string;
        status?: number;
        type: 'network' | 'response' | 'parse';
    };
}

/**
 * Call the API extension
 *
 * @param endPoint API REST end point for the extension
 * @param init Initial values for the request
 * @returns The response body interpreted as JSON
 */
export async function requestAPI<T>(
    endPoint = '',
    init: RequestInit = {}
): Promise<APIResponse<T>> {
    // Make request to Jupyter API
    const settings = ServerConnection.makeSettings();
    const requestUrl = URLExt.join(
        settings.baseUrl,
        'mito-ai', // API Namespace
        endPoint
    );

    let response: Response;
    try {
        response = await ServerConnection.makeRequest(requestUrl, init, settings);
    } catch (error) {
        console.log(error);
        return {
            error: {
                message: (error as Error).message || 'Network error occurred',
                type: 'network'
            }
        };
    }

    let data: any = await response.text();

    if (!response.ok) {
        try {
            data = JSON.parse(data);
            return {
                error: {
                    message: data.error || 'Server error occurred',
                    type: 'response',
                    status: response.status
                }
            };
        } catch (error) {
            return {
                error: {
                    message: 'Server error occurred',
                    type: 'response',
                    status: response.status
                }
            };
        }
    }

    if (data.length > 0) {
        try {
            data = JSON.parse(data);
        } catch (error) {
            return {
                error: {
                    message: 'Invalid JSON response from server',
                    type: 'parse',
                    status: response.status
                }
            };
        }
    }

    return { data };
}

export const getXsrfToken = (): string | null | undefined => {
    const cookies = document.cookie.split(';');
    const xsrfCookie = cookies.find(cookie => cookie.trim().startsWith('_xsrf='));
    if (xsrfCookie) {
        return xsrfCookie.split('=')[1];
    }
    return null;
}
