/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

export const CLAUDE_SONNET_DISPLAY_NAME = 'Claude Sonnet 4.5';
export const CLAUDE_SONNET_MODEL_NAME = 'claude-sonnet-4-5-20250929';

export const CLAUDE_HAIKU_DISPLAY_NAME = 'Claude Haiku 4.5';
export const CLAUDE_HAIKU_MODEL_NAME = 'claude-haiku-4-5-20251001';

export const GPT_4_1_DISPLAY_NAME = 'GPT 4.1';
export const GPT_4_1_MODEL_NAME = 'gpt-4.1';

export const GPT_5_2_DISPLAY_NAME = 'GPT 5.2';
export const GPT_5_2_MODEL_NAME = 'gpt-5.2';

export const GEMINI_3_FLASH_DISPLAY_NAME = 'Gemini 3 Flash';
export const GEMINI_3_FLASH_MODEL_NAME = 'gemini-3-flash-preview';

export const GEMINI_3_PRO_DISPLAY_NAME = 'Gemini 3 Pro';
export const GEMINI_3_PRO_MODEL_NAME = 'gemini-3-pro-preview';

/**
 * Fetch available models from the backend API.
 * Returns the list of model names that are available based on enterprise mode and LiteLLM configuration.
 * 
 * @returns Promise resolving to an array of model names
 */
export async function getAvailableModels(): Promise<string[]> {
    // Lazy import to avoid loading JupyterLab dependencies when only constants are needed
    const { requestAPI } = await import('../restAPI/utils');
    const response = await requestAPI<{ models: string[] }>('available-models', {
        method: 'GET'
    });
    
    if (response.error) {
        console.error('Failed to fetch available models:', response.error.message);
        // Return default models as fallback
        return [
            GPT_4_1_MODEL_NAME,
            GPT_5_2_MODEL_NAME,
            CLAUDE_SONNET_MODEL_NAME,
            CLAUDE_HAIKU_MODEL_NAME,
            GEMINI_3_FLASH_MODEL_NAME,
            GEMINI_3_PRO_MODEL_NAME,
        ];
    }
    
    return response.data?.models || [];
}