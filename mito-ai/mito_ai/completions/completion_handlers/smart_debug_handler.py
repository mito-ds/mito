# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

from typing import List, Union, Optional, AsyncGenerator, Callable

from openai.types.chat import ChatCompletionMessageParam
from mito_ai.completions.models import (
    SmartDebugMetadata,
    MessageType,
    CompletionRequest,
    CompletionStreamChunk,
    CompletionReply,
)
from mito_ai.completions.prompt_builders.smart_debug_prompt import (
    create_error_prompt,
    remove_inner_thoughts_from_message,
)
from mito_ai.completions.providers import OpenAIProvider
from mito_ai.completions.message_history import GlobalMessageHistory
from mito_ai.completions.completion_handlers.completion_handler import CompletionHandler
from mito_ai.completions.completion_handlers.open_ai_models import MESSAGE_TYPE_TO_MODEL
from mito_ai.completions.completion_handlers.utils import append_chat_system_message

__all__ = ["get_smart_debug_completion", "stream_smart_debug_completion"]


class SmartDebugHandler(CompletionHandler[SmartDebugMetadata]):
    """Handler for smart debug completions."""

    @staticmethod
    async def get_completion(
        metadata: SmartDebugMetadata,
        provider: OpenAIProvider,
        message_history: GlobalMessageHistory,
    ) -> str:
        """Get a smart debug completion from the AI provider."""

        error_message = metadata.errorMessage
        active_cell_code = metadata.activeCellCode
        active_cell_id = metadata.activeCellId
        variables = metadata.variables or []
        files = metadata.files or []
        thread_id = metadata.threadId

        # Add the system message if it doesn't alredy exist
        await append_chat_system_message(message_history, provider, thread_id)

        # Create the prompt
        prompt = create_error_prompt(error_message, active_cell_code, active_cell_id, variables, files)
        display_prompt = (
            f"```python{metadata.activeCellCode or ''}```{metadata.errorMessage}"
        )

        # Add the prompt to the message history
        new_ai_optimized_message: ChatCompletionMessageParam = {
            "role": "user",
            "content": prompt,
        }
        new_display_optimized_message: ChatCompletionMessageParam = {
            "role": "user",
            "content": display_prompt,
        }
        await message_history.append_message(
            new_ai_optimized_message, new_display_optimized_message, provider, thread_id
        )

        # Get the completion
        completion = await provider.request_completions(
            messages=message_history.get_ai_optimized_history(thread_id),
            model=MESSAGE_TYPE_TO_MODEL[MessageType.SMART_DEBUG],
            message_type=MessageType.SMART_DEBUG,
            user_input=metadata.errorMessage,
            thread_id=thread_id
        )

        # Process the completion to remove inner thoughts
        display_completion = remove_inner_thoughts_from_message(completion)

        # Add the response to message history
        ai_response_message: ChatCompletionMessageParam = {
            "role": "assistant",
            "content": completion,
        }
        display_response_message: ChatCompletionMessageParam = {
            "role": "assistant",
            "content": display_completion,
        }
        await message_history.append_message(
            ai_response_message, display_response_message, provider, thread_id
        )

        return display_completion

    @staticmethod
    async def stream_completion(
        metadata: SmartDebugMetadata,
        provider: OpenAIProvider,
        message_history: GlobalMessageHistory,
        message_id: str,
        reply_fn: Callable[[Union[CompletionReply, CompletionStreamChunk]], None],
    ) -> str:
        """Stream smart debug completions from the AI provider.

        Args:
            metadata: The metadata for the smart debug completion request.
            provider: The AI provider to use.
            message_history: The message history for this conversation.
            message_id: The ID of the message being processed.
            reply_fn: Function to call with each chunk for streaming replies.

        Returns:
            The accumulated response string.
        """
        error_message = metadata.errorMessage
        active_cell_code = metadata.activeCellCode
        active_cell_id = metadata.activeCellId
        variables = metadata.variables or []
        files = metadata.files or []
        thread_id = metadata.threadId

        # Add the system message if it doesn't already exist
        await append_chat_system_message(message_history, provider, thread_id)

        # Create the prompt
        prompt = create_error_prompt(error_message, active_cell_code, active_cell_id, variables, files)
        display_prompt = (
            f"```python{metadata.activeCellCode or ''}```{metadata.errorMessage}"
        )

        # Add the prompt to the message history
        new_ai_optimized_message: ChatCompletionMessageParam = {
            "role": "user",
            "content": prompt,
        }
        new_display_optimized_message: ChatCompletionMessageParam = {
            "role": "user",
            "content": display_prompt,
        }
        await message_history.append_message(
            new_ai_optimized_message, new_display_optimized_message, provider, thread_id
        )

        # Stream the completions using the provider's stream method
        accumulated_response = await provider.stream_completions(
            message_type=MessageType.SMART_DEBUG,
            messages=message_history.get_ai_optimized_history(thread_id),
            model=MESSAGE_TYPE_TO_MODEL[MessageType.SMART_DEBUG],
            message_id=message_id,
            reply_fn=reply_fn,
            thread_id=thread_id
        )

        # Process the completion to remove inner thoughts
        display_completion = remove_inner_thoughts_from_message(accumulated_response)

        # Save the accumulated response to message history
        ai_response_message: ChatCompletionMessageParam = {
            "role": "assistant",
            "content": accumulated_response,
        }
        display_response_message: ChatCompletionMessageParam = {
            "role": "assistant",
            "content": display_completion,
        }
        await message_history.append_message(
            ai_response_message, display_response_message, provider, thread_id
        )

        return display_completion


# Use the static methods directly
get_smart_debug_completion = SmartDebugHandler.get_completion
stream_smart_debug_completion = SmartDebugHandler.stream_completion
