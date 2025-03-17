from typing import List
from openai.types.chat import ChatCompletionMessageParam
from mito_ai.models import CodeExplainMetadata, MessageType
from mito_ai.prompt_builders.explain_code_prompt import create_explain_code_prompt
from mito_ai.providers import OpenAIProvider
from mito_ai.message_history import GlobalMessageHistory
from mito_ai.completion_handlers.completion_handler import CompletionHandler
from mito_ai.completion_handlers.open_ai_models import MESSAGE_TYPE_TO_MODEL
from mito_ai.completion_handlers.utils import append_chat_system_message

__all__ = ["get_code_explain_completion"]

class CodeExplainHandler(CompletionHandler[CodeExplainMetadata]):
    """Handler for code explain completions."""
    
    @staticmethod
    async def get_completion(
        metadata: CodeExplainMetadata,
        provider: OpenAIProvider,
        message_history: GlobalMessageHistory
    ) -> str:
        """Get a code explain completion from the AI provider."""
        
        # Add the system message if it doens't alredy exist
        await append_chat_system_message(message_history, provider)
        
        active_cell_code = metadata.activeCellCode or ''
        
        # Create the prompt
        prompt = create_explain_code_prompt(active_cell_code)
        display_prompt = f"```python{metadata.activeCellCode or ''}```Explain this code"
        
        # Add the prompt to the message history
        new_ai_optimized_message: ChatCompletionMessageParam = {"role": "user", "content": prompt}
        new_display_optimized_message: ChatCompletionMessageParam = {"role": "user", "content": display_prompt}
        await message_history.append_message(new_ai_optimized_message, new_display_optimized_message, provider)
        
        # Get the completion
        completion = await provider.request_completions(
            messages=message_history.ai_optimized_history, 
            model=MESSAGE_TYPE_TO_MODEL[MessageType.CODE_EXPLAIN],
            message_type=MessageType.CODE_EXPLAIN
        )
        
        # Add the response to message history
        ai_response_message: ChatCompletionMessageParam = {"role": "assistant", "content": completion}
        await message_history.append_message(ai_response_message, ai_response_message, provider)

        return completion

# Use the static method directly
get_code_explain_completion = CodeExplainHandler.get_completion
