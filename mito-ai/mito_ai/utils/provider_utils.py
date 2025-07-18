# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

from typing import Union

from mito_ai.completions.models import MessageType


def get_model_provider(model: str) -> Union[str, None]:
    """
    Determine the model type based on the model name prefix
    """
    if not model:
        return None

    model_lower = model.lower()

    if model_lower.startswith('claude'):
        return 'claude'
    elif model_lower.startswith('gemini'):
        return 'gemini'
    elif model_lower.startswith('ollama'):
        return 'ollama'
    elif model_lower.startswith('gpt'):
        return 'openai'

    return None


def does_message_require_fast_model(message_type: MessageType) -> bool:
    """
    Determines if a message requires the fast model.
    
    The fast model is used for messages that are not chat messages.
    For example, inline completions and chat name generation need to be fast
    so they don't slow down the user's experience.
    """
    
    if message_type in (MessageType.CHAT, MessageType.SMART_DEBUG, MessageType.CODE_EXPLAIN, MessageType.AGENT_EXECUTION, MessageType.AGENT_AUTO_ERROR_FIXUP):
        return False
    elif message_type in (MessageType.INLINE_COMPLETION, MessageType.CHAT_NAME_GENERATION):
        return True
    elif message_type in (MessageType.START_NEW_CHAT, MessageType.FETCH_HISTORY, MessageType.GET_THREADS, MessageType.DELETE_THREAD, MessageType.UPDATE_MODEL_CONFIG):
        # These messages don't use any model, but we add them here for type safety
        return True
    else:
        raise ValueError(f"Invalid message type: {message_type}")
    
    