# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

from typing import List, Union, Optional, AsyncGenerator, Callable
from openai.types.chat import ChatCompletionMessageParam
from mito_ai.completions.models import CodeExplainMetadata, MessageType, CompletionRequest, CompletionStreamChunk, CompletionReply
from mito_ai.completions.prompt_builders.explain_code_prompt import create_explain_code_prompt
from mito_ai.completions.providers import OpenAIProvider
from mito_ai.completions.message_history import GlobalMessageHistory
from mito_ai.completions.completion_handlers.completion_handler import CompletionHandler
from mito_ai.completions.completion_handlers.open_ai_models import MESSAGE_TYPE_TO_MODEL
from mito_ai.completions.completion_handlers.utils import append_chat_system_message

__all__ = ["get_code_explain_completion", "stream_code_explain_completion"]

class CodeExplainHandler(CompletionHandler[CodeExplainMetadata]):
    """Handler for code explain completions."""
    
    @staticmethod
    async def get_completion(
        metadata: CodeExplainMetadata,
        provider: OpenAIProvider,
        message_history: GlobalMessageHistory
    ) -> str:
        """Get a code explain completion from the AI provider."""

        active_cell_code = metadata.activeCellCode or ''
        thread_id = metadata.threadId

        # Add the system message if it doesn't alredy exist
        await append_chat_system_message(message_history, provider, thread_id)
        
        # Create the prompt
        prompt = create_explain_code_prompt(active_cell_code)
        display_prompt = f"```python{metadata.activeCellCode or ''}```Explain this code"
        
        # Add the prompt to the message history
        new_ai_optimized_message: ChatCompletionMessageParam = {"role": "user", "content": prompt}
        new_display_optimized_message: ChatCompletionMessageParam = {"role": "user", "content": display_prompt}
        await message_history.append_message(new_ai_optimized_message, new_display_optimized_message, provider, thread_id)
        
        # Get the completion
        completion = await provider.request_completions(
            messages=message_history.get_ai_optimized_history(thread_id), 
            model=MESSAGE_TYPE_TO_MODEL[MessageType.CODE_EXPLAIN],
            message_type=MessageType.CODE_EXPLAIN,
            thread_id=thread_id
        )
        
        # Add the response to message history
        ai_response_message: ChatCompletionMessageParam = {"role": "assistant", "content": completion}
        await message_history.append_message(ai_response_message, ai_response_message, provider, thread_id)

        return completion

    @staticmethod
    async def stream_completion(
        metadata: CodeExplainMetadata,
        provider: OpenAIProvider,
        message_history: GlobalMessageHistory,
        message_id: str,
        reply_fn: Callable[[Union[CompletionReply, CompletionStreamChunk]], None],
    ) -> str:
        """Stream code explain completions from the AI provider.

        Args:
            metadata: The metadata for the code explain completion request.
            provider: The AI provider to use.
            message_history: The message history for this conversation.
            message_id: The ID of the message being processed.
            reply_fn: Function to call with each chunk for streaming replies.

        Returns:
            The accumulated response string.
        """
        active_cell_code = metadata.activeCellCode or ''
        thread_id = metadata.threadId

        # Add the system message if it doesn't already exist
        await append_chat_system_message(message_history, provider, thread_id)
        
        # Create the prompt
        prompt = create_explain_code_prompt(active_cell_code)
        display_prompt = f"```python{metadata.activeCellCode or ''}```Explain this code"
        
        # Add the prompt to the message history
        new_ai_optimized_message: ChatCompletionMessageParam = {"role": "user", "content": prompt}
        new_display_optimized_message: ChatCompletionMessageParam = {"role": "user", "content": display_prompt}
        await message_history.append_message(new_ai_optimized_message, new_display_optimized_message, provider, thread_id)
        
        # Stream the completions using the provider's stream method
        accumulated_response = await provider.stream_completions(
            message_type=MessageType.CODE_EXPLAIN,
            messages=message_history.get_ai_optimized_history(thread_id),
            model=MESSAGE_TYPE_TO_MODEL[MessageType.CODE_EXPLAIN],
            message_id=message_id,
            reply_fn=reply_fn,
            thread_id=thread_id
        )

        # Add the response to message history
        ai_response_message: ChatCompletionMessageParam = {"role": "assistant", "content": accumulated_response}
        await message_history.append_message(ai_response_message, ai_response_message, provider, thread_id)

        return accumulated_response

# Use the static methods directly
get_code_explain_completion = CodeExplainHandler.get_completion
stream_code_explain_completion = CodeExplainHandler.stream_completion
