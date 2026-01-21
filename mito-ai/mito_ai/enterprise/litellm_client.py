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
import litellm
import copy

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
        params: Dict[str, Any] = {
            "model": model,
            "messages": messages,
            "api_key": self.api_key,
            "api_base": self.base_url,
            "timeout": self.timeout,
        }
        
        # Handle response format if specified
        if response_format_info:
            # LiteLLM supports response_format for structured outputs
            # Convert ResponseFormatInfo to LiteLLM format
            if hasattr(response_format_info.format, 'model_json_schema'):
                # Pydantic model - get JSON schema
                # Make a deep copy to avoid mutating the original schema
                schema = copy.deepcopy(response_format_info.format.model_json_schema())
                
                # Add additionalProperties: False to the top-level schema
                # This is required by OpenAI's JSON schema mode
                schema["additionalProperties"] = False
                
                # Nested object definitions in $defs need to have additionalProperties set to False also
                if "$defs" in schema:
                    for def_name, def_schema in schema["$defs"].items():
                        if def_schema.get("type") == "object":
                            def_schema["additionalProperties"] = False
                
                params["response_format"] = {
                    "type": "json_schema",
                    "json_schema": {
                        "name": response_format_info.name,
                        "schema": schema,
                        "strict": True
                    }
                }
        
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
        params: Dict[str, Any] = {
            "model": model,
            "messages": messages,
            "api_key": self.api_key,
            "api_base": self.base_url,
            "timeout": self.timeout,
            "stream": True,
        }
        
        # Handle response format if specified
        if response_format_info:
            # LiteLLM supports response_format for structured outputs
            if hasattr(response_format_info.format, 'model_json_schema'):
                # Pydantic model - get JSON schema
                # Make a deep copy to avoid mutating the original schema
                schema = copy.deepcopy(response_format_info.format.model_json_schema())
                
                # Add additionalProperties: False to the top-level schema
                # This is required by OpenAI's JSON schema mode
                schema["additionalProperties"] = False
                
                # Nested object definitions in $defs need to have additionalProperties set to False also
                if "$defs" in schema:
                    for def_name, def_schema in schema["$defs"].items():
                        if def_schema.get("type") == "object":
                            def_schema["additionalProperties"] = False
                
                params["response_format"] = {
                    "type": "json_schema",
                    "json_schema": {
                        "name": response_format_info.name,
                        "schema": schema,
                        "strict": True
                    }
                }
        
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
