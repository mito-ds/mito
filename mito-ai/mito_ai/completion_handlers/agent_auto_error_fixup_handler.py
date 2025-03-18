from openai.types.chat import ChatCompletionMessageParam
from mito_ai.models import AgentResponse, AgentSmartDebugMetadata, MessageType, ResponseFormatInfo
from mito_ai.prompt_builders.agent_smart_debug_prompt import create_agent_smart_debug_prompt
from mito_ai.providers import OpenAIProvider
from mito_ai.message_history import GlobalMessageHistory
from mito_ai.completion_handlers.completion_handler import CompletionHandler
from mito_ai.completion_handlers.open_ai_models import MESSAGE_TYPE_TO_MODEL
from mito_ai.completion_handlers.utils import append_agent_system_message


__all__ = ["get_agent_auto_error_fixup_completion"]

class AgentAutoErrorFixupHandler(CompletionHandler[AgentSmartDebugMetadata]):
    """Handler for smart debug completions."""
    
    @staticmethod
    async def get_completion(
        metadata: AgentSmartDebugMetadata,
        provider: OpenAIProvider,
        message_history: GlobalMessageHistory
    ) -> str:
        """Get a smart debug completion from the AI provider."""
        
        # Add the system message if it doens't alredy exist
        await append_agent_system_message(message_history, provider)
        
        # Create the prompt
        prompt = create_agent_smart_debug_prompt(metadata)
        display_prompt = metadata.errorMessage
        
        # Add the prompt to the message history
        new_ai_optimized_message: ChatCompletionMessageParam = {"role": "user", "content": prompt}
        new_display_optimized_message: ChatCompletionMessageParam = {"role": "user", "content": display_prompt}
        await message_history.append_message(new_ai_optimized_message, new_display_optimized_message, provider)
        
        # Get the completion
        completion = await provider.request_completions(
            messages=message_history.ai_optimized_history, 
            model=MESSAGE_TYPE_TO_MODEL[MessageType.AGENT_AUTO_ERROR_FIXUP],
            response_format_info=ResponseFormatInfo(
                name='agent_response',
                format=AgentResponse
            ),
            message_type=MessageType.AGENT_AUTO_ERROR_FIXUP
        )
        
        # Add the response to message history
        ai_response_message: ChatCompletionMessageParam = {"role": "assistant", "content": completion}
        display_response_message: ChatCompletionMessageParam = {"role": "assistant", "content": completion}
        await message_history.append_message(ai_response_message, display_response_message, provider)

        return completion

# Use the static method directly
get_agent_auto_error_fixup_completion = AgentAutoErrorFixupHandler.get_completion
