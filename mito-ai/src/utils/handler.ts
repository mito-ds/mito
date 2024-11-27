import { URLExt } from '@jupyterlab/coreutils';
import { ServerConnection } from '@jupyterlab/services';
import OpenAI from "openai";


export type SuccessfulAPIResponse = {
    'type': 'success',
    response: OpenAI.Chat.Completions.ChatCompletionMessage
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
        // This 401 error is set by the OpenAICompletionHandler class in the mito-ai python package.
        return {
            type: 'error',
            errorMessage: "You're missing the OPENAI_API_KEY environment variable. Run the following code in your terminal to set the environment variable and then relaunch the jupyter server ```python\nexport OPENAI_API_KEY=<your-api-key>\n```",
        }
    }
    if (response.status === 403) {
        // This 403 error is set by the OpenAICompletionHandler class in the mito-ai python package.
        // It is raised when the user has reached the free tier limit for Mito AI.
        return {
            type: 'error',
            errorMessage: "You've reached the free tier limit for Mito AI. Upgrade to Pro for unlimited uses or supply your own OpenAI API key.",
        }
    }
    if (response.status === 404 ) {
        // This 404 error is set by Jupyter when sending a request to the mito-ai endpoint that does not exist.
        return {
            type: 'error',
            errorMessage: "The Mito AI server is not enabled. You can enable it by running ```python\n!jupyter server extension enable mito-ai\n```",
        }
    }
    if (response.status === 500) {
        // This 500 error is set by the OpenAICompletionHandler class in the mito-ai python package. It is a 
        // generic error that is set when we haven't handled the error specifically.
        return {
            type: 'error',
            errorMessage: "There was an error communicating with OpenAI. This might be due to an incorrect API key, a temporary OpenAI outage, or a problem with your internet connection. Please try again.",
        }
    }
    
    // Handle the response
    let data: any = await response.text();

    try {
        data = JSON.parse(data);
        
        // TODO: Update the lambda funciton to return the entire message instead of
        // just the content so we don't have to recreate the message here.
        if ('completion' in data) {
            const aiMessage: OpenAI.Chat.Completions.ChatCompletionMessage = {
                role: 'assistant',
                content: data['completion'],
                refusal: null
            }

            return {
                type: 'success',
                response: aiMessage            
            }
        } else {
            throw new Error('Invalid response from the Mito AI server')
        }

        
    } catch (error) {
        console.error('Not a JSON response body.', response);
        return {
            type: 'error',
            errorMessage: "An error occurred while calling the Mito AI server",
        }
    }
}
