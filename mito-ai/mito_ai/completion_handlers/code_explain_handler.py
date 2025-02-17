from typing import List
from openai.types.chat import ChatCompletionMessageParam
from mito_ai.models import CodeExplainMetadata, MessageType
from mito_ai.prompt_builders.explain_code_prompt import create_explain_code_prompt
from mito_ai.providers import OpenAIProvider
from mito_ai.message_history import GlobalMessageHistory
from mito_ai.completion_handlers.completion_handler import CompletionHandler

# Model constants
MODEL = "gpt-4o-mini"

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
        
        active_cell_code = metadata.activeCellCode or ''
        
        # Create the prompt
        prompt = create_explain_code_prompt(active_cell_code)
        
        # Add the prompt to the message history
        new_ai_optimized_message: ChatCompletionMessageParam = {"role": "user", "content": prompt}
        new_display_optimized_message: ChatCompletionMessageParam = {"role": "user", "content": active_cell_code}
        message_history.append_message(new_ai_optimized_message, new_display_optimized_message)
        
        # Get the completion
        completion = await provider.request_completions(
            messages=message_history.ai_optimized_history, 
            model=MODEL,
            message_type=MessageType.CODE_EXPLAIN
        )
        
        # Add the response to message history
        ai_response_message: ChatCompletionMessageParam = {"role": "assistant", "content": completion}
        message_history.append_message(ai_response_message, ai_response_message)

        return completion

# Use the static method directly
get_code_explain_completion = CodeExplainHandler.get_completion
