import { URLExt } from '@jupyterlab/coreutils';
import { ServerConnection } from '@jupyterlab/services';

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
): Promise<T> {

    // Get the server settings
    const serverSettings = ServerConnection.makeSettings();

    // Construct the full URL
    const requestUrl = URLExt.join(
        serverSettings.baseUrl,
        'mito_ai', // This should match the base URL you set in your server extension
        endPoint
    );

    // Add default headers
    const defaultHeaders = {
        'Content-Type': 'application/json',
    };

    // Merge default headers with any provided headers
    init.headers = {
         ...defaultHeaders, 
         ...init.headers,   
    };

    // Make the request
    let response: Response;
    
    try {
        response = await ServerConnection.makeRequest(requestUrl, init, serverSettings);
    } catch (error) {
        throw new ServerConnection.NetworkError(error as any);
    }

    // Handle the response
    let data: any = await response.text();

    if (data.length > 0) {
        try {
            data = JSON.parse(data);
        } catch (error) {
            console.log('Not a JSON response body.', response);
        }
    }

    if (!response.ok) {
        throw new ServerConnection.ResponseError(response, data.message || data);
    }

    return data;
}
