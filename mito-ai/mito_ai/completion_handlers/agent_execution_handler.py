# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

from typing import List, Literal, Union
from openai.types.chat import ChatCompletionMessageParam
from mito_ai.models import AgentExecutionMetadata, MessageType, ResponseFormatInfo, AgentResponse
from mito_ai.prompt_builders.agent_execution_prompt import create_agent_execution_prompt
from mito_ai.providers import OpenAIProvider
from mito_ai.message_history import GlobalMessageHistory
from mito_ai.completion_handlers.completion_handler import CompletionHandler
from mito_ai.completion_handlers.open_ai_models import MESSAGE_TYPE_TO_MODEL
from mito_ai.completion_handlers.utils import append_agent_system_message, create_ai_optimized_message

__all__ = ["get_agent_execution_completion"]

class AgentExecutionHandler(CompletionHandler[AgentExecutionMetadata]):
    """Handler for agent execution completions."""
    
    @staticmethod
    async def get_completion(
        metadata: AgentExecutionMetadata,
        provider: OpenAIProvider,
        message_history: GlobalMessageHistory
    ) -> str:
        """Get an agent execution completion from the AI provider."""

        if metadata.index is not None:
            message_history.truncate_histories(
                thread_id=metadata.threadId,
                index=metadata.index
            )

        # Add the system message if it doesn't alredy exist
        await append_agent_system_message(message_history, provider, metadata.threadId, metadata.isChromeBrowser)
        
        # Create the prompt
        prompt = create_agent_execution_prompt(metadata)
        display_prompt = metadata.input
        
        # Add the prompt to the message history
        new_ai_optimized_message = create_ai_optimized_message(prompt, metadata.base64EncodedActiveCellOutput)
        new_display_optimized_message: ChatCompletionMessageParam = {"role": "user", "content": display_prompt}
        
        await message_history.append_message(new_ai_optimized_message, new_display_optimized_message, provider, metadata.threadId)
        
        # Get the completion
        completion = await provider.request_completions(
            messages=message_history.get_ai_optimized_history(metadata.threadId), 
            model=MESSAGE_TYPE_TO_MODEL[MessageType.AGENT_EXECUTION],
            response_format_info=ResponseFormatInfo(
                name='agent_response',
                format=AgentResponse
            ),
            message_type=MessageType.AGENT_EXECUTION,
            user_input=metadata.input
        )
        
        ai_response_message: ChatCompletionMessageParam = {"role": "assistant", "content": completion}
        
        await message_history.append_message(ai_response_message, ai_response_message, provider, metadata.threadId)

        return completion

# Use the static method directly
get_agent_execution_completion = AgentExecutionHandler.get_completion
