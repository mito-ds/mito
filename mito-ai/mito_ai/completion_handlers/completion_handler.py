from typing import Protocol, TypeVar
from abc import abstractmethod, ABCMeta
from mito_ai.models import ChatMessageMetadata, SmartDebugMetadata, CodeExplainMetadata, AgentPlanningMetadata, AgentExecutionMetadata, InlineCompleterMetadata
from mito_ai.providers import OpenAIProvider
from mito_ai.message_history import GlobalMessageHistory

T = TypeVar('T', ChatMessageMetadata, SmartDebugMetadata, CodeExplainMetadata, AgentPlanningMetadata, AgentExecutionMetadata, InlineCompleterMetadata, contravariant=True)

class CompletionHandler(Protocol[T], metaclass=ABCMeta):
    """Protocol defining the interface for completion handlers.
    
    All completion handler classes should implement this protocol to ensure
    they provide a get_completion static method with the correct signature.
    """
    
    @staticmethod
    @abstractmethod
    async def get_completion(
        metadata: T,
        provider: OpenAIProvider,
        message_history: GlobalMessageHistory
    ) -> str:
        """Get a completion from the AI provider.
        
        Args:
            metadata: Metadata about the completion request
            provider: The AI provider to use
            message_history: The history of messages in the conversation
            
        Returns:
            The completion string from the AI
        """
        pass
    
    
    
    