# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

from typing import List, Literal, Union
from openai.types.chat import ChatCompletionMessageParam
from mito_ai.completions.models import AgentExecutionMetadata, MessageType, ResponseFormatInfo, AgentResponse
from mito_ai.completions.prompt_builders.agent_execution_prompt import create_agent_execution_prompt
from mito_ai.provider_manager import ProviderManager
from mito_ai.completions.message_history import GlobalMessageHistory
from mito_ai.completions.completion_handlers.completion_handler import CompletionHandler
from mito_ai.completions.completion_handlers.utils import (
    append_agent_system_message,
    create_ai_optimized_message,
    normalize_agent_response_completion,
)

MAX_WEB_SEARCH_ITERATIONS = 3

__all__ = ["get_agent_execution_completion"]

class AgentExecutionHandler(CompletionHandler[AgentExecutionMetadata]):
    """Handler for agent execution completions."""
    
    @staticmethod
    async def get_completion(
        metadata: AgentExecutionMetadata,
        provider: ProviderManager,
        message_history: GlobalMessageHistory
    ) -> str:
        """Get an agent execution completion from the AI provider."""

        if metadata.index is not None:
            message_history.truncate_histories(
                thread_id=metadata.threadId,
                index=metadata.index
            )

        # Add the system message if it doesn't already exist
        await append_agent_system_message(
            message_history, provider, metadata.threadId, metadata.isChromeBrowser,
            web_search_available=provider.web_search_available
        )

        # Create the prompt
        prompt = create_agent_execution_prompt(metadata)
        display_prompt = metadata.input

        # Add the prompt to the message history
        new_ai_optimized_message = create_ai_optimized_message(prompt, metadata.base64EncodedActiveCellOutput, metadata.additionalContext)
        new_display_optimized_message: ChatCompletionMessageParam = {"role": "user", "content": display_prompt}

        await message_history.append_message(new_ai_optimized_message, new_display_optimized_message, provider, metadata.threadId)

        # Get the completion
        completion = await provider.request_completions(
            messages=message_history.get_ai_optimized_history(metadata.threadId),
            response_format_info=ResponseFormatInfo(
                name='agent_response',
                format=AgentResponse
            ),
            message_type=MessageType.AGENT_EXECUTION,
            user_input=metadata.input,
            thread_id=metadata.threadId
        )

        # Web search loop: if the agent requests a web search, execute it and loop back
        for _ in range(MAX_WEB_SEARCH_ITERATIONS):
            completion = normalize_agent_response_completion(completion)

            try:
                agent_response = AgentResponse.model_validate_json(completion)
            except Exception:
                break

            if agent_response.type != 'web_search':
                break

            # Record the agent's web search request in message history
            web_search_request_message: ChatCompletionMessageParam = {"role": "assistant", "content": completion}
            await message_history.append_message(web_search_request_message, web_search_request_message, provider, metadata.threadId)

            # Execute the web search
            search_query = agent_response.web_search_query or metadata.input
            search_results = await provider.request_web_search(search_query)

            if not search_results:
                search_results = "Web search is not available or returned no results."

            # Inject results as a user message and get the next completion
            results_message: ChatCompletionMessageParam = {
                "role": "user",
                "content": f"Web search results for '{search_query}':\n\n{search_results}\n\nPlease continue with the task using these results."
            }
            await message_history.append_message(results_message, results_message, provider, metadata.threadId)

            completion = await provider.request_completions(
                messages=message_history.get_ai_optimized_history(metadata.threadId),
                response_format_info=ResponseFormatInfo(
                    name='agent_response',
                    format=AgentResponse
                ),
                message_type=MessageType.AGENT_EXECUTION,
                user_input=metadata.input,
                thread_id=metadata.threadId
            )

        completion = normalize_agent_response_completion(completion)
        ai_response_message: ChatCompletionMessageParam = {"role": "assistant", "content": completion}

        await message_history.append_message(ai_response_message, ai_response_message, provider, metadata.threadId)

        return completion

# Use the static method directly
get_agent_execution_completion = AgentExecutionHandler.get_completion
