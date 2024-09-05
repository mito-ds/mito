import { URLExt } from '@jupyterlab/coreutils';
import { ServerConnection } from '@jupyterlab/services';
import OpenAI from 'openai';


export type SuccessfulAPIResponse = {
    'type': 'success',
    response: OpenAI.Chat.ChatCompletion
}
export type FailedAPIResponse = {
    type: 'error',
    errorMessage: string,
}
export type APIResponse = SuccessfulAPIResponse | FailedAPIResponse

/**
 * Call the API extension
 *
 * @param endPoint API REST end point for the extension
 * @param init Initial values for the request
 * @returns The response body interpreted as JSON
 */
export async function requestAPI(
    endPoint = '',
    init: RequestInit = {}
): Promise<APIResponse> {

    // Get the server settings
    const serverSettings = ServerConnection.makeSettings();

    // Construct the full URL
    const requestUrl = URLExt.join(
        serverSettings.baseUrl,
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
        console.error('Error connecting to the mito_ai server:', error);
        throw new ServerConnection.NetworkError(error as any);
    }

    if (response.status === 401) {
        return {
            type: 'error',
            errorMessage: "You're missing the OPENAI_API_KEY environment variable. Run the following code in your terminal to set the environment variable and then relaunch the jupyter server ```python\nexport OPENAI_API_KEY=<your-api-key>\n```",
        }
    }
    if (response.status === 404 ) {
        return {
            type: 'error',
            errorMessage: "The Mito AI server is not enabled. You can enable it by running ```python\n!jupyter server extension enable mito-ai\n```",
        }
    }
    if (response.status === 500) {
        return {
            type: 'error',
            errorMessage: "There was an error communicating with OpenAI. This might be due to an incorrect API key, a temporary OpenAI outage, or a problem with your internet connection. Please try again.",
        }
    }
    
    // Handle the response
    let data: any = await response.text();

    try {
        data = JSON.parse(data);
        return {
            type: 'success',
            response: data
        }
    } catch (error) {
        console.error('Not a JSON response body.', response);
        return {
            type: 'error',
            errorMessage: "An error occurred while calling the Mito AI server",
        }
    }
}
