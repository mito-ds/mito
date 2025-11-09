/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import { UUID } from '@lumino/coreutils';
import { CompletionWebsocketClient } from '../../../websockets/completions/CompletionsWebsocketClient';
import { DEFAULT_MODEL } from '../../../components/ModelSelector';

/**
 * Hook to manage model configuration for the chat taskpane.
 * 
 * Provides:
 * - updateModelOnBackend: Function to update the model configuration on the backend
 * - getInitialModel: Function to get the initial model from localStorage or default
 * 
 * @param websocketClient - The websocket client for sending messages to the backend
 */
export const useModelConfig = (websocketClient: CompletionWebsocketClient): {
    updateModelOnBackend: (model: string) => Promise<void>;
    getInitialModel: () => string;
} => {
    const updateModelOnBackend = async (model: string): Promise<void> => {
        try {
            await websocketClient.sendMessage({
                type: "update_model_config",
                message_id: UUID.uuid4(),
                metadata: {
                    promptType: "update_model_config",
                    model: model
                },
                stream: false
            });

            console.log('Model configuration updated on backend:', model);
        } catch (error) {
            console.error('Failed to update model configuration on backend:', error);
        }
    };

    const getInitialModel = (): string => {
        // Check for saved model preference in localStorage
        const storedConfig = localStorage.getItem('llmModelConfig');
        let initialModel = DEFAULT_MODEL;
        if (storedConfig) {
            try {
                const parsedConfig = JSON.parse(storedConfig);
                initialModel = parsedConfig.model || DEFAULT_MODEL;
            } catch (e) {
                console.error('Failed to parse stored LLM config', e);
            }
        }
        return initialModel;
    };

    return {
        updateModelOnBackend,
        getInitialModel,
    };
};

