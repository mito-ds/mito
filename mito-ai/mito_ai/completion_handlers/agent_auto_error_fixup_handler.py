from openai.types.chat import ChatCompletionMessageParam
from mito_ai.models import SmartDebugMetadata, MessageType
from mito_ai.prompt_builders.smart_debug_prompt import create_error_prompt, remove_inner_thoughts_from_message
from mito_ai.providers import OpenAIProvider
from mito_ai.message_history import GlobalMessageHistory
from mito_ai.completion_handlers.completion_handler import CompletionHandler
from mito_ai.completion_handlers.open_ai_models import MESSAGE_TYPE_TO_MODEL

__all__ = ["get_agent_auto_error_fixup_completion"]

class AgentAutoErrorFixupHandler(CompletionHandler[SmartDebugMetadata]):
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
        # Create the prompt
        prompt = create_error_prompt(
            error_message, 
            active_cell_code, 
            variables,
            files
        )
        
        # Add the prompt to the message history
        new_ai_optimized_message: ChatCompletionMessageParam = {"role": "user", "content": prompt}
        new_display_optimized_message: ChatCompletionMessageParam = {"role": "user", "content": error_message}
        message_history.append_message(new_ai_optimized_message, new_display_optimized_message)
        
        # Get the completion
        completion = await provider.request_completions(
            messages=message_history.ai_optimized_history, 
            model=MESSAGE_TYPE_TO_MODEL[MessageType.AGENT_AUTO_ERROR_FIXUP],
            message_type=MessageType.AGENT_AUTO_ERROR_FIXUP
        )
        
        # Process the completion to remove inner thoughts
        display_completion = remove_inner_thoughts_from_message(completion)
        
        # Add the response to message history
        ai_response_message: ChatCompletionMessageParam = {"role": "assistant", "content": completion}
        display_response_message: ChatCompletionMessageParam = {"role": "assistant", "content": display_completion}
        message_history.append_message(ai_response_message, display_response_message)

        return display_completion

# Use the static method directly
get_agent_auto_error_fixup_completion = AgentAutoErrorFixupHandler.get_completion
