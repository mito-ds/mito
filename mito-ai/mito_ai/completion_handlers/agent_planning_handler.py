from typing import List, Optional, Type

from openai.types.chat import ChatCompletionMessageParam
from pydantic import BaseModel
from mito_ai.models import AgentPlanningMetadata
from mito_ai.prompt_builders.agent_planning_prompt import create_agent_prompt
from mito_ai.providers import OpenAIProvider
from mito_ai.utils.open_ai_utils import (
    get_ai_completion_from_mito_server,
    get_open_ai_completion_function_params,
)

# Model constants
MODEL = "o3-mini"

# Response format for agent planning
class PlanOfAttack(BaseModel):
    actions: List[str]
    dependencies: List[str]

async def get_completion(
    metadata: AgentPlanningMetadata,
    provider: OpenAIProvider,
    message_history: list[ChatCompletionMessageParam]
) -> str:
    """Get an agent planning completion from the AI provider."""
    
    # Create the prompt
    prompt = create_agent_prompt(
        "", # fileType is not in metadata
        [], # columnSamples is not in metadata
        metadata.input,
        metadata.variables or []
    )
    
    # Add the prompt to the message history
    message_history.append({"role": "user", "content": prompt})
    
    # Get the completion
    completion = await _get_completion(
        provider=provider, 
        messages=message_history, 
        model=MODEL,
        response_format=PlanOfAttack
    )

    return completion

async def _get_completion(
    provider: OpenAIProvider, 
    messages: List[ChatCompletionMessageParam], 
    model: str,
    response_format: Optional[Type[BaseModel]] = None
) -> str:
    """Internal helper to get the completion from the provider."""
    
    completion_function_params = get_open_ai_completion_function_params(
        model, messages, False, response_format
    )
    
    if provider._openAI_sync_client:
        completion = provider._openAI_sync_client.chat.completions.create(**completion_function_params)
        return completion.choices[0].message.content or ""
    else: 
        last_message_content = str(messages[-1].get("content", "")) if messages else None
        completion = await get_ai_completion_from_mito_server(
            last_message_content,
            completion_function_params,
            provider.timeout,
            provider.max_retries,
        )
        return completion 