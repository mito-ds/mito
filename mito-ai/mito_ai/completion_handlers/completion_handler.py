from typing import Protocol, List, TypeVar
from openai.types.chat import ChatCompletionMessageParam
from mito_ai.models import ChatMessageMetadata, SmartDebugMetadata, CodeExplainMetadata, AgentPlanningMetadata, InlineCompleterMetadata
from mito_ai.providers import OpenAIProvider

T = TypeVar('T', ChatMessageMetadata, SmartDebugMetadata, CodeExplainMetadata, AgentPlanningMetadata, InlineCompleterMetadata, contravariant=True)

class CompletionHandler(Protocol[T]):
    """Protocol defining the interface for completion handlers."""
    
    async def get_completion(
        self,
        metadata: T,
        provider: OpenAIProvider,
        message_history: list[ChatCompletionMessageParam]
    ) -> str:
        """Get a completion from the AI provider.
        
        Args:
            metadata: Metadata about the completion request
            provider: The AI provider to use
            message_history: The history of messages in the conversation
            
        Returns:
            The completion string from the AI
        """
        ...
    
    
    
    