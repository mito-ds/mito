from typing import List
from openai.types.chat import ChatCompletionMessageParam
from mito_ai.models import InlineCompleterMetadata, MessageType
from mito_ai.prompt_builders.inline_completer_prompt import create_inline_prompt
from mito_ai.providers import OpenAIProvider
from mito_ai.message_history import GlobalMessageHistory
from mito_ai.completion_handlers.completion_handler import CompletionHandler
from mito_ai.completion_handlers.open_ai_models import MESSAGE_TYPE_TO_MODEL

__all__ = ["get_inline_completion"]

class InlineCompleterHandler(CompletionHandler[InlineCompleterMetadata]):
    """Handler for inline completions."""
    
    @staticmethod
    async def get_completion(
        metadata: InlineCompleterMetadata,
        provider: OpenAIProvider,
        message_history: GlobalMessageHistory
    ) -> str:
        """Get an inline completion from the AI provider."""
        
        # Create the prompt
        prompt = create_inline_prompt(
            metadata.prefix or '', 
            metadata.suffix or '', 
            metadata.variables or [],
            metadata.files or []
        )
        
        # Each inline completer is independent and ephemeral. So we do not use the message history. 
        messages: List[ChatCompletionMessageParam] = [{"role": "user", "content": prompt}]
        
        # Get the completion
        completion = await provider.request_completions(
            messages=messages, 
            model=MESSAGE_TYPE_TO_MODEL[MessageType.INLINE_COMPLETION],
            message_type=MessageType.INLINE_COMPLETION
        )
        
        return completion

# Use the static method directly
get_inline_completion = InlineCompleterHandler.get_completion
