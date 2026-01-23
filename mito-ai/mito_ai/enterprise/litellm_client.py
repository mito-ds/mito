# Copyright (c) Saga Inc.
# Distributed under the terms of the The Mito Enterprise license.

from typing import Optional, List, Callable, Union, Dict, Any
from openai.types.chat import ChatCompletionMessageParam
from mito_ai.completions.models import (
    MessageType,
    ResponseFormatInfo,
    CompletionReply,
    CompletionStreamChunk,
    CompletionItem,
)
from mito_ai.utils.litellm_utils import get_litellm_completion_function_params
import litellm

class LiteLLMClient:
    """
    A client for interacting with LiteLLM server endpoints.
    LiteLLM provides an OpenAI-compatible API, so we use the LiteLLM SDK directly.
    """
    
    def __init__(self, api_key: Optional[str], base_url: str, timeout: int = 30, max_retries: int = 1):
        self.api_key = api_key
        self.base_url = base_url
        self.timeout = timeout
        self.max_retries = max_retries
    
    async def request_completions(
        self,
        messages: List[ChatCompletionMessageParam],
        model: str,  # Should include provider prefix (e.g., "openai/gpt-4o")
        response_format_info: Optional[ResponseFormatInfo] = None,
        message_type: MessageType = MessageType.CHAT
    ) -> str:
        """
        Request completions from LiteLLM server.
        
        Args:
            messages: List of chat messages
            model: Model name with provider prefix (e.g., "openai/gpt-4o")
            response_format_info: Optional response format specification
            message_type: Type of message (chat, agent execution, etc.)
            
        Returns:
            The completion text response
        """
        # Prepare parameters for LiteLLM
        params = get_litellm_completion_function_params(
            model=model,
            messages=messages,
            api_key=self.api_key,
            api_base=self.base_url,
            timeout=self.timeout,
            stream=False,
            response_format_info=response_format_info,
        )
        
        try:
            # Use LiteLLM's acompletion function
            response = await litellm.acompletion(**params)
            
            # Extract content from response
            if response and response.choices and len(response.choices) > 0:
                content = response.choices[0].message.content
                return content or ""
            else:
                return ""
        except Exception as e:
            raise Exception(f"LiteLLM completion error: {str(e)}")
    
    async def stream_completions(
        self,
        messages: List[ChatCompletionMessageParam],
        model: str,
        message_type: MessageType,
        message_id: str,
        reply_fn: Callable[[Union[CompletionReply, CompletionStreamChunk]], None],
        response_format_info: Optional[ResponseFormatInfo] = None
    ) -> str:
        """
        Stream completions from LiteLLM server.
        
        Args:
            messages: List of chat messages
            model: Model name with provider prefix (e.g., "openai/gpt-4o")
            message_type: Type of message (chat, agent execution, etc.)
            message_id: ID of the message being processed
            reply_fn: Function to call with each chunk for streaming replies
            response_format_info: Optional response format specification
            
        Returns:
            The accumulated response string
        """
        accumulated_response = ""
        
        # Prepare parameters for LiteLLM
        params = get_litellm_completion_function_params(
            model=model,
            messages=messages,
            api_key=self.api_key,
            api_base=self.base_url,
            timeout=self.timeout,
            stream=True,
            response_format_info=response_format_info,
        )
        
        try:
            # Use LiteLLM's acompletion with stream=True
            # When stream=True, acompletion returns an async iterable after awaiting
            stream = await litellm.acompletion(**params)
            
            # Process streaming chunks
            async for chunk in stream:
                if chunk and chunk.choices and len(chunk.choices) > 0:
                    delta = chunk.choices[0].delta
                    content = delta.content if delta and delta.content else ""
                    
                    if content:
                        accumulated_response += content
                        
                        # Check if this is the final chunk
                        is_finished = chunk.choices[0].finish_reason is not None
                        
                        # Send chunk to frontend
                        reply_fn(CompletionStreamChunk(
                            parent_id=message_id,
                            chunk=CompletionItem(
                                content=content,
                                isIncomplete=not is_finished,
                                token=message_id,
                            ),
                            done=is_finished,
                        ))
            
            return accumulated_response
        except Exception as e:
            raise Exception(f"LiteLLM streaming error: {str(e)}")
