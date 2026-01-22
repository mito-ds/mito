#!/usr/bin/env python
# coding: utf-8
# Copyright (c) Saga Inc.
# Distributed under the terms of the The Mito Enterprise license.

from typing import Dict, Any, List, Optional
from openai.types.chat import ChatCompletionMessageParam
import copy

from mito_ai import constants
from mito_ai.completions.models import ResponseFormatInfo
from mito_ai.utils.version_utils import is_enterprise

def is_litellm_configured() -> bool:
    """
    Check if LiteLLM is configured for system use.
    
    Per enterprise documentation, LITELLM_API_KEY is user-controlled and optional
    for system configuration. This function only checks system-level configuration
    (BASE_URL and MODELS), not user-specific API keys.
    """
    return all([constants.LITELLM_BASE_URL, constants.LITELLM_MODELS, is_enterprise()])

def get_litellm_completion_function_params(
    model: str,
    messages: List[ChatCompletionMessageParam],
    api_key: Optional[str],
    api_base: str,
    timeout: int,
    stream: bool,
    response_format_info: Optional[ResponseFormatInfo] = None,
) -> Dict[str, Any]:
    """
    Prepare parameters for LiteLLM completion requests.
    
    Args:
        model: Model name with provider prefix (e.g., "openai/gpt-4o")
        messages: List of chat messages
        api_key: Optional API key for authentication
        api_base: Base URL for the LiteLLM server
        timeout: Request timeout in seconds
        stream: Whether to stream the response
        response_format_info: Optional response format specification
        
    Returns:
        Dictionary of parameters ready to be passed to litellm.acompletion()
    """
    params: Dict[str, Any] = {
        "model": model,
        "messages": messages,
        "api_key": api_key,
        "api_base": api_base,
        "timeout": timeout,
        "stream": stream,
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
    
    return params
