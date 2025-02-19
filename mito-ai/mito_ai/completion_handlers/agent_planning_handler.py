from typing import List
from openai.types.chat import ChatCompletionMessageParam
from pydantic import BaseModel
from mito_ai.models import AgentPlanningMetadata, MessageType
from mito_ai.prompt_builders.agent_planning_prompt import create_agent_prompt
from mito_ai.providers import OpenAIProvider
from mito_ai.message_history import GlobalMessageHistory
from mito_ai.completion_handlers.completion_handler import CompletionHandler
from mito_ai.completion_handlers.open_ai_models import MESSAGE_TYPE_TO_MODEL

__all__ = ["get_agent_planning_completion"]

# Response format for agent planning
class PlanOfAttack(BaseModel):
    actions: List[str]
    dependencies: List[str]

class AgentPlanningHandler(CompletionHandler[AgentPlanningMetadata]):
    """Handler for agent planning completions."""
    
    @staticmethod
    async def get_completion(
        metadata: AgentPlanningMetadata,
        provider: OpenAIProvider,
        message_history: GlobalMessageHistory
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
        new_ai_optimized_message: ChatCompletionMessageParam = {"role": "user", "content": prompt}
        new_display_optimized_message: ChatCompletionMessageParam = {"role": "user", "content": metadata.input}
        message_history.append_message(new_ai_optimized_message, new_display_optimized_message)
        
        # Get the completion
        completion = await provider.request_completions(
            messages=message_history.ai_optimized_history, 
            model=MESSAGE_TYPE_TO_MODEL[MessageType.AGENT_PLANNING],
            response_format=PlanOfAttack,
            message_type=MessageType.AGENT_PLANNING
        )
        
        # Add the response to message history
        ai_response_message: ChatCompletionMessageParam = {"role": "assistant", "content": completion}
        message_history.append_message(ai_response_message, ai_response_message)

        return completion

# Use the static method directly
get_agent_planning_completion = AgentPlanningHandler.get_completion

