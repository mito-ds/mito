# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

from typing import List, Union, Optional, AsyncGenerator, Callable

from openai.types.chat import ChatCompletionMessageParam
from mito_ai.models import ChatMessageMetadata, MessageType, CompletionRequest, CompletionStreamChunk, CompletionReply
from mito_ai.prompt_builders.chat_prompt import create_chat_prompt
from mito_ai.providers import OpenAIProvider
from mito_ai.message_history import GlobalMessageHistory
from mito_ai.completion_handlers.completion_handler import CompletionHandler
from mito_ai.completion_handlers.open_ai_models import MESSAGE_TYPE_TO_MODEL
from mito_ai.completion_handlers.utils import append_chat_system_message, create_ai_optimized_message

__all__ = ["get_chat_completion", "stream_chat_completion"]

class ChatCompletionHandler(CompletionHandler[ChatMessageMetadata]):
    """Handler for chat completions."""
    
    @staticmethod
    async def get_completion(
        metadata: ChatMessageMetadata,
        provider: OpenAIProvider,
        message_history: GlobalMessageHistory
    ) -> str:
        """Get a chat completion from the AI provider."""

        if metadata.index is not None:
            message_history.truncate_histories(
                index=metadata.index,
                thread_id=metadata.threadId
            )

        # Add the system message if it doesn't alredy exist
        await append_chat_system_message(message_history, provider, metadata.threadId)
        
        # Create the prompt
        prompt = create_chat_prompt(
            metadata.variables or [], 
            metadata.files or [],
            metadata.activeCellCode or '', 
            metadata.base64EncodedActiveCellOutput is not None and metadata.base64EncodedActiveCellOutput != '',
            metadata.input
        )
        display_prompt = f"```python{metadata.activeCellCode or ''}```{metadata.input}"
        
        # Add the prompt to the message history
        new_ai_optimized_message = create_ai_optimized_message(prompt, metadata.base64EncodedActiveCellOutput)
        new_display_optimized_message: ChatCompletionMessageParam = {"role": "user", "content": display_prompt}
        await message_history.append_message(new_ai_optimized_message, new_display_optimized_message, provider, metadata.threadId)
        
        # Get the completion (non-streaming)
        completion = await provider.request_completions(
            messages=message_history.get_ai_optimized_history(metadata.threadId), 
            model=MESSAGE_TYPE_TO_MODEL[MessageType.CHAT],
            message_type=MessageType.CHAT,
            user_input=metadata.input,
            thread_id=metadata.threadId
        )
        
        ai_response_message: ChatCompletionMessageParam = {"role": "assistant", "content": completion}
        await message_history.append_message(ai_response_message, ai_response_message, provider, metadata.threadId)

        return completion
    
    @staticmethod
    async def stream_completion(
        metadata: ChatMessageMetadata,
        provider: OpenAIProvider,
        message_history: GlobalMessageHistory,
        message_id: str,
        reply_fn: Callable[[Union[CompletionReply, CompletionStreamChunk]], None]
    ) -> str:
        """Stream chat completions from the AI provider.
        
        Args:
            metadata: The metadata for the chat completion request.
            provider: The AI provider to use.
            message_history: The message history for this conversation.
            message_id: The ID of the message being processed.
            reply_fn: Function to call with each chunk for streaming replies.
            
        Returns:
            The accumulated response string.
        """
        index = metadata.index

        if index is not None:
            message_history.truncate_histories(
                index=index,
                thread_id=metadata.threadId
            )
        
        # Add the system message if it doesn't already exist
        await append_chat_system_message(message_history, provider, metadata.threadId)
        
        # Create the prompt
        prompt = create_chat_prompt(
            metadata.variables or [], 
            metadata.files or [],
            metadata.activeCellCode or '', 
            metadata.base64EncodedActiveCellOutput is not None and metadata.base64EncodedActiveCellOutput != '',
            metadata.input
        )
        display_prompt = f"```python{metadata.activeCellCode or ''}```{metadata.input}"
        
        # Add the prompt to the message history
        new_ai_optimized_message = create_ai_optimized_message(prompt, metadata.base64EncodedActiveCellOutput)
        new_display_optimized_message: ChatCompletionMessageParam = {"role": "user", "content": display_prompt}
        await message_history.append_message(new_ai_optimized_message, new_display_optimized_message, provider, metadata.threadId)
        
        # Stream the completions using the provider's stream method
        accumulated_response = await provider.stream_completions(
            message_type=MessageType.CHAT,
            messages=message_history.get_ai_optimized_history(metadata.threadId),
            model=MESSAGE_TYPE_TO_MODEL[MessageType.CHAT],
            message_id=message_id,
            reply_fn=reply_fn,
            user_input=metadata.input,
            thread_id=metadata.threadId
        )

        # Save the accumulated response to message history
        ai_response_message: ChatCompletionMessageParam = {
            "role": "assistant",
            "content": accumulated_response,
        }
        await message_history.append_message(
            ai_response_message, ai_response_message, provider, metadata.threadId
        )

        return accumulated_response

# Use the static methods directly
get_chat_completion = ChatCompletionHandler.get_completion
stream_chat_completion = ChatCompletionHandler.stream_completion
