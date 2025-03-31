from typing import List
from openai.types.chat import ChatCompletionMessageParam
from mito_ai.models import ChatMessageMetadata, MessageType
from mito_ai.prompt_builders.chat_prompt import create_chat_prompt
from mito_ai.providers import OpenAIProvider
from mito_ai.message_history import GlobalMessageHistory
from mito_ai.completion_handlers.completion_handler import CompletionHandler
from mito_ai.completion_handlers.open_ai_models import MESSAGE_TYPE_TO_MODEL
from mito_ai.completion_handlers.utils import append_chat_system_message

__all__ = ["get_chat_completion"]

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
                index=metadata.index
            )

        # Add the system message if it doesn't alredy exist
        await append_chat_system_message(message_history, provider, metadata.threadId)
        
        # Create the prompt
        prompt = create_chat_prompt(
            metadata.variables or [], 
            metadata.files or [],
            metadata.activeCellCode or '', 
            metadata.input
        )
        display_prompt = f"```python{metadata.activeCellCode or ''}```{metadata.input}"
        
        # Add the prompt to the message history
        new_ai_optimized_message: ChatCompletionMessageParam = {"role": "user", "content": prompt}
        new_display_optimized_message: ChatCompletionMessageParam = {"role": "user", "content": display_prompt}
        await message_history.append_message(new_ai_optimized_message, new_display_optimized_message, provider, metadata.threadId)
        
        # Get the completion
        completion = await provider.request_completions(
            messages=message_history.get_ai_optimized_history(metadata.threadId), 
            model=MESSAGE_TYPE_TO_MODEL[MessageType.CHAT],
            message_type=MessageType.CHAT
        )
        
        ai_response_message: ChatCompletionMessageParam = {"role": "assistant", "content": completion}
        await message_history.append_message(ai_response_message, ai_response_message, provider, metadata.threadId)

        return completion

# Use the static method directly
get_chat_completion = ChatCompletionHandler.get_completion
