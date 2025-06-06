# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

from typing import List
from openai.types.chat import ChatCompletionMessageParam
from mito_ai.completions.models import InlineCompleterMetadata, MessageType
from mito_ai.completions.prompt_builders.inline_completer_prompt import create_inline_prompt
from mito_ai.completions.providers import OpenAIProvider
from mito_ai.completions.message_history import GlobalMessageHistory
from mito_ai.completions.completion_handlers.completion_handler import CompletionHandler

__all__ = ["get_inline_completion"]

class InlineCompleterHandler(CompletionHandler[InlineCompleterMetadata]):
    """Handler for inline completions."""
    
    @staticmethod
    async def get_completion(
        metadata: InlineCompleterMetadata,
        provider: OpenAIProvider,
        message_history: GlobalMessageHistory,
        model: str
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
            model=model,
            message_type=MessageType.INLINE_COMPLETION,
            thread_id=None
        )
        
        return completion

# Use the static method directly
get_inline_completion = InlineCompleterHandler.get_completion
