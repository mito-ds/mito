from typing import List, Optional, Type

import openai
from openai.types.chat import ChatCompletionMessageParam
from pydantic import BaseModel
from mito_ai.models import ChatMessageMetadata
from mito_ai.prompt_builders.chat_prompt import create_chat_prompt
from mito_ai.providers import OpenAIProvider
from mito_ai.utils.open_ai_utils import (
    get_ai_completion_from_mito_server,
    get_open_ai_completion_function_params,
)

# Model constants
MODEL = "o3-mini"

async def get_completion(
    metadata: ChatMessageMetadata,
    provider: OpenAIProvider,
    message_history: list[ChatCompletionMessageParam]
) -> str:
    """Get a chat completion from the AI provider."""
    
    # Create the prompt
    prompt = create_chat_prompt(
        metadata.variables or [], 
        metadata.activeCellCode or '', 
        metadata.input
    )
    
    # Add the prompt to the message history
    message_history.append({"role": "user", "content": prompt})
    
    # Get the completion
    completion = await _get_completion(
        provider=provider, 
        messages=message_history, 
        model=MODEL
    )

    return completion

async def _get_completion(
    provider: OpenAIProvider, 
    messages: List[ChatCompletionMessageParam], 
    model: str,
    response_format: Optional[Type[BaseModel]] = None
) -> str:
    """Internal helper to get the completion from the provider."""
    
    completion_function_params = get_open_ai_completion_function_params(
        model, messages, False, response_format
    )
    
    if provider._openAI_sync_client:
        completion = provider._openAI_sync_client.chat.completions.create(**completion_function_params)
        return completion.choices[0].message.content or ""
    else: 
        last_message_content = str(messages[-1].get("content", "")) if messages else None
        completion = await get_ai_completion_from_mito_server(
            last_message_content,
            completion_function_params,
            provider.timeout,
            provider.max_retries,
        )
        return completion
        