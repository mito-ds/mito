# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

from openai.types.chat import ChatCompletionMessageParam
from mito_ai.completions.models import AgentResponse, AgentSmartDebugMetadata, MessageType, ResponseFormatInfo
from mito_ai.completions.prompt_builders.agent_smart_debug_prompt import create_agent_smart_debug_prompt
from mito_ai.completions.providers import OpenAIProvider
from mito_ai.completions.message_history import GlobalMessageHistory
from mito_ai.completions.completion_handlers.completion_handler import CompletionHandler
from mito_ai.completions.completion_handlers.utils import append_agent_system_message

__all__ = ["get_agent_auto_error_fixup_completion"]

class AgentAutoErrorFixupHandler(CompletionHandler[AgentSmartDebugMetadata]):
    """Handler for agent auto error fixup completions."""
    
    @staticmethod
    async def get_completion(
        metadata: AgentSmartDebugMetadata,
        provider: OpenAIProvider,
        message_history: GlobalMessageHistory,
        model: str
    ) -> str:
        """Get an agent auto error fixup completion from the AI provider."""
        
        # Add the system message if it doesn't alredy exist
        await append_agent_system_message(message_history, model, provider, metadata.threadId, metadata.isChromeBrowser)
        
        # Create the prompt
        prompt = create_agent_smart_debug_prompt(metadata)
        display_prompt = metadata.errorMessage
        
        # Add the prompt to the message history
        new_ai_optimized_message: ChatCompletionMessageParam = {"role": "user", "content": prompt}
        new_display_optimized_message: ChatCompletionMessageParam = {"role": "user", "content": display_prompt}
        
        await message_history.append_message(new_ai_optimized_message, new_display_optimized_message, model, provider, metadata.threadId)
        
        # Get the completion
        completion = await provider.request_completions(
            messages=message_history.get_ai_optimized_history(metadata.threadId), 
            model=model,
            response_format_info=ResponseFormatInfo(
                name='agent_response',
                format=AgentResponse
            ),
            message_type=MessageType.AGENT_AUTO_ERROR_FIXUP,
            user_input=metadata.errorMessage,
            thread_id=metadata.threadId
        )
        
        ai_response_message: ChatCompletionMessageParam = {"role": "assistant", "content": completion}
        
        await message_history.append_message(ai_response_message, ai_response_message, model, provider, metadata.threadId)
        
        return completion

# Use the static method directly
get_agent_auto_error_fixup_completion = AgentAutoErrorFixupHandler.get_completion
