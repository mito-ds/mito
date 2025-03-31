# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

from openai.types.chat import ChatCompletionMessageParam
from mito_ai.models import SmartDebugMetadata, MessageType
from mito_ai.prompt_builders.smart_debug_prompt import create_error_prompt, remove_inner_thoughts_from_message
from mito_ai.providers import OpenAIProvider
from mito_ai.message_history import GlobalMessageHistory
from mito_ai.completion_handlers.completion_handler import CompletionHandler
from mito_ai.completion_handlers.open_ai_models import MESSAGE_TYPE_TO_MODEL
from mito_ai.completion_handlers.utils import append_chat_system_message
__all__ = ["get_smart_debug_completion"]

class SmartDebugHandler(CompletionHandler[SmartDebugMetadata]):
    """Handler for smart debug completions."""
    
    @staticmethod
    async def get_completion(
        metadata: SmartDebugMetadata,
        provider: OpenAIProvider,
        message_history: GlobalMessageHistory
    ) -> str:
        """Get a smart debug completion from the AI provider."""
        
        error_message = metadata.errorMessage
        active_cell_code = metadata.activeCellCode or ''
        variables = metadata.variables or []
        files = metadata.files or []
        thread_id = metadata.threadId

        # Add the system message if it doesn't alredy exist
        await append_chat_system_message(message_history, provider, thread_id)
        
        # Create the prompt
        prompt = create_error_prompt(
            error_message, 
            active_cell_code, 
            variables,
            files
        )
        display_prompt = f"```python{metadata.activeCellCode or ''}```{metadata.errorMessage}"
        
        # Add the prompt to the message history
        new_ai_optimized_message: ChatCompletionMessageParam = {"role": "user", "content": prompt}
        new_display_optimized_message: ChatCompletionMessageParam = {"role": "user", "content": display_prompt}
        await message_history.append_message(new_ai_optimized_message, new_display_optimized_message, provider, thread_id)
        
        # Get the completion
        completion = await provider.request_completions(
            messages=message_history.get_ai_optimized_history(thread_id), 
            model=MESSAGE_TYPE_TO_MODEL[MessageType.SMART_DEBUG],
            message_type=MessageType.SMART_DEBUG
        )
        
        # Process the completion to remove inner thoughts
        display_completion = remove_inner_thoughts_from_message(completion)
        
        # Add the response to message history
        ai_response_message: ChatCompletionMessageParam = {"role": "assistant", "content": completion}
        display_response_message: ChatCompletionMessageParam = {"role": "assistant", "content": display_completion}
        await message_history.append_message(ai_response_message, display_response_message, provider, thread_id)

        return display_completion

# Use the static method directly
get_smart_debug_completion = SmartDebugHandler.get_completion
