from typing import List, Optional, Type

from openai.types.chat import ChatCompletionMessageParam
from pydantic import BaseModel
from mito_ai.models import InlineCompleterMetadata
from mito_ai.prompt_builders.inline_completer_prompt import create_inline_prompt
from mito_ai.providers import OpenAIProvider
from mito_ai.utils.open_ai_utils import (
    get_ai_completion_from_mito_server,
    get_open_ai_completion_function_params,
)

# Model constants
MODEL = "gpt-4o-mini"

async def get_completion(
    metadata: InlineCompleterMetadata,
    provider: OpenAIProvider,
    message_history: list[ChatCompletionMessageParam]
) -> str:
    """Get an inline completion from the AI provider."""
    
    # Create the prompt
    prompt = create_inline_prompt(
        metadata.prefix or '', 
        metadata.suffix or '', 
        metadata.variables or []
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