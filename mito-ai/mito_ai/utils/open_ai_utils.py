#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.

import json
from typing import Any, Dict, List, Optional, Type, Final, Union
from datetime import datetime, timedelta
import os
import time
from mito_ai.utils.utils import is_running_test
from pydantic import BaseModel
from tornado.httpclient import AsyncHTTPClient
from mito_ai.models import MessageType, ResponseFormatInfo
from mito_ai.utils.schema import UJ_STATIC_USER_ID, UJ_USER_EMAIL
from mito_ai.utils.db import get_user_field
from mito_ai.utils.version_utils import is_pro
from mito_ai.utils.server_limits import check_mito_server_quota
from openai.types.chat import ChatCompletionMessageParam
MITO_AI_PROD_URL: Final[str] = "https://ogtzairktg.execute-api.us-east-1.amazonaws.com/Prod/completions/"
MITO_AI_DEV_URL: Final[str] = "https://x0l7hinm12.execute-api.us-east-1.amazonaws.com/Prod/completions/"

# If you want to test the dev endpoint, change this to MITO_AI_DEV_URL.
# Note that we have a pytest that ensures that the MITO_AI_URL is always set to MITO_AI_PROD_URL 
# before merging into dev because we always want our users to be using the prod endpoint!
MITO_AI_URL: Final[str] = MITO_AI_PROD_URL

__user_email: Optional[str] = None
__user_id: Optional[str] = None

async def get_ai_completion_from_mito_server(
    last_message_content: Union[str, None],
    ai_completion_data: Dict[str, Any],
    timeout: int,
    max_retries: int,
    message_type: MessageType,
) -> str:
    
    # First check that the user is allowed to use the Mito Server
    check_mito_server_quota(message_type)
    
    global __user_email, __user_id

    if __user_email is None:
        __user_email = get_user_field(UJ_USER_EMAIL)
    if __user_id is None:
        __user_id = get_user_field(UJ_STATIC_USER_ID)

    data = {
        "timeout": timeout,
        "max_retries": max_retries,
        "email": __user_email,
        "user_id": __user_id,
        "data": ai_completion_data,
        "user_input": last_message_content or "",  # We add this just for logging purposes
    }

    headers = {
        "Content-Type": "application/json",
    }
    
    
    # There are several types of timeout errors that can happen here. 
    # == 504 Timeout (tornado.httpclient.HTTPClientError: 504) ==  
    # The server (AWS Lambda) took too long to process your request
    # == 599 Timeout (tornado.httpclient.HTTPClientError: 599) ==  
    # The client (Tornado) gave up waiting for a response
    
    http_client = None
    if is_running_test():
        # If we are running in a test environment, setting the request_timeout fails for some reason.
        http_client = AsyncHTTPClient(defaults=dict(user_agent="Mito-AI client"))
        http_client_timeout = None
    else:
        # To avoid 599 client timeout errors, we set the request_timeout. By default, the HTTP client 
        # timesout after 20 seconds. We update this to match the timeout we give to OpenAI. 
        # The OpenAI timeouts are denoted in seconds, whereas the HTTP client expects milliseconds. 
        # We also give the HTTP client a 10 second buffer to account for
        http_client_timeout = timeout * 1000 * max_retries + 10000
        http_client = AsyncHTTPClient(defaults=dict(user_agent="Mito-AI client", request_timeout=http_client_timeout))
        
    start_time = time.time()
    try:
        res = await http_client.fetch(
            # Important: DO NOT CHANGE MITO_AI_URL. If you want to use the dev endpoint, 
            # go to the top of this file and change MITO_AI_URL to MITO_AI_DEV_URL. We 
            # have a pytest that ensures that the MITO_AI_URL is always set to MITO_AI_PROD_URL 
            # before merging into dev. So if you change which variable we are using here, the 
            # test will not catch our mistakes.
            MITO_AI_URL, 
            method="POST", 
            headers=headers, 
            body=json.dumps(data), 
            # For some reason, we need to add the request_timeout here as well
            request_timeout=http_client_timeout
        )
        print(f"Request completed in {time.time() - start_time:.2f} seconds")
    except Exception as e:
        print(f"Request failed after {time.time() - start_time:.2f} seconds with error: {str(e)}")
        raise
    finally:
        http_client.close()

    # The lambda function returns a dictionary with a completion entry in it,
    # so we just return that.
    content = json.loads(res.body)
    
    if "completion" in content:
        return content["completion"] # type: ignore
    elif "error" in content:
        raise Exception(f"{content['error']}")
    else:
        raise Exception(f"No completion found in response: {content}")


def get_open_ai_completion_function_params(
    model: str, 
    messages: List[ChatCompletionMessageParam], 
    stream: bool,
    response_format_info: Optional[ResponseFormatInfo] = None,
) -> Dict[str, Any]:
    
    completion_function_params = {
        "model": model,
        "stream": stream,
        "messages": messages,
    }
    
    # If a response format is provided, we need to convert it to a json schema.
    # Pydantic models are supported by the OpenAI API, however, we need to be able to 
    # serialize it for requests that are going to be sent to the mito server. 
    # OpenAI expects a very specific schema as seen below. 
    if response_format_info:
        json_schema = response_format_info.format.schema()
        
        # Add additionalProperties: False to the top-level schema
        json_schema["additionalProperties"] = False
        
        # Nested object definitions in $defs need to have additionalProperties set to False also
        if "$defs" in json_schema:
            for def_name, def_schema in json_schema["$defs"].items():
                if def_schema.get("type") == "object":
                    def_schema["additionalProperties"] = False
        
        completion_function_params["response_format"] = {
            "type": "json_schema",
            "json_schema": {
                "name": f"{response_format_info.name}",
                "schema": json_schema,
                "strict": True
            }
        }
    
    # o3-mini will error if we try setting the temperature
    if model == "gpt-4o-mini":
        completion_function_params["temperature"] = 0.0

    return completion_function_params
