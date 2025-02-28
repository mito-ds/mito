#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.

import json
from typing import Any, Dict, List, Optional, Type, Final, Union
from datetime import datetime, timedelta
import os

from mito_ai.utils.utils import is_running_test
from pydantic import BaseModel
from tornado.httpclient import AsyncHTTPClient
from mito_ai.models import MessageType
from mito_ai.utils.schema import UJ_STATIC_USER_ID, UJ_USER_EMAIL, UJ_MITO_AI_FIRST_USAGE_DATE, UJ_AI_MITO_API_NUM_USAGES
from mito_ai.utils.telemetry_utils import (MITO_SERVER_FREE_TIER_LIMIT_REACHED, log)
from mito_ai.utils.db import get_completion_count, get_first_completion_date, get_user_field, set_user_field
from mito_ai.utils.version_utils import is_pro
from openai.types.chat import ChatCompletionMessageParam
MITO_AI_PROD_URL: Final[str] = "https://ogtzairktg.execute-api.us-east-1.amazonaws.com/Prod/completions/"
MITO_AI_DEV_URL: Final[str] = "https://x0l7hinm12.execute-api.us-east-1.amazonaws.com/Prod/completions/"

# If you want to test the dev endpoint, change this to MITO_AI_DEV_URL.
# Note that we have a pytest that ensures that the MITO_AI_URL is always set to MITO_AI_PROD_URL 
# before merging into dev because we always want our users to be using the prod endpoint!
MITO_AI_URL: Final[str] = MITO_AI_PROD_URL

OPEN_SOURCE_AI_COMPLETIONS_LIMIT: Final[int] = 500
OPEN_SOURCE_INLINE_COMPLETIONS_LIMIT: Final[int] = 30 # days

__user_email: Optional[str] = None
__user_id: Optional[str] = None
    

def check_mito_server_quota() -> None:
    """
    Checks if the user has exceeded their Mito server quota. Pro users have no limits.
    Raises PermissionError if the user has exceeded their quota.
    """
    if is_pro():
        return

    # Using these helper functions lets us mock their results in tests so 
    # we can test the logic of this function.
    completion_count = get_completion_count()
    first_completion_date = get_first_completion_date()

    if completion_count >= OPEN_SOURCE_AI_COMPLETIONS_LIMIT:
        log(MITO_SERVER_FREE_TIER_LIMIT_REACHED)
        raise PermissionError(MITO_SERVER_FREE_TIER_LIMIT_REACHED)

    if first_completion_date != "":
        first_use = datetime.strptime(first_completion_date, "%Y-%m-%d")
        one_month_later = first_use + timedelta(days=OPEN_SOURCE_INLINE_COMPLETIONS_LIMIT)
        if datetime.now() > one_month_later:
            log(MITO_SERVER_FREE_TIER_LIMIT_REACHED)
            raise PermissionError(MITO_SERVER_FREE_TIER_LIMIT_REACHED)

def update_mito_server_quota(message_type: MessageType) -> None:
    """Update the user's quota for the Mito Server."""
    
    n_counts = get_user_field(UJ_AI_MITO_API_NUM_USAGES)
    first_usage_date = get_user_field(UJ_MITO_AI_FIRST_USAGE_DATE)
    
    if n_counts is None:
        n_counts = 0
    
    if message_type != MessageType.INLINE_COMPLETION:
        # We don't increment the count for inline completions because they are not
        # counted towards the quota.
        n_counts = n_counts + 1
    
    if first_usage_date is None:
        first_usage_date = datetime.now().strftime("%Y-%m-%d")
        
    try: 
        set_user_field(UJ_AI_MITO_API_NUM_USAGES, n_counts)
        set_user_field(UJ_MITO_AI_FIRST_USAGE_DATE, first_usage_date)
    except Exception as e:
        raise e
        

async def get_ai_completion_from_mito_server(
    last_message_content: Union[str, None],
    ai_completion_data: Dict[str, Any],
    timeout: int,
    max_retries: int,
) -> str:
    
    # First check that the user is allowed to use the Mito Server
    check_mito_server_quota()
    
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
    
    http_client = None
    if is_running_test():
        # If we are running in a test environment, setting the request_timeout fails for some reason.
        http_client = AsyncHTTPClient(defaults=dict(user_agent="Mito-AI client"))
    else:
        
        # The HTTP client timesout after 20 seconds by default. We update this to match the timeout
        # we give to OpenAI. The OpenAI timeouts are denoted in seconds, wherease the HTTP client
        # expects milliseconds. We also give the HTTP client a 10 second buffer to account for
        # the time it takes to send the request, etc.
        http_client_timeout = timeout * 1000 * max_retries + 10000
        http_client = AsyncHTTPClient(defaults=dict(user_agent="Mito-AI client"), request_timeout=http_client_timeout)
    
    try:
        res = await http_client.fetch(
            # Important: DO NOT CHANGE MITO_AI_URL. If you want to use the dev endpoint, 
            # go to the top of this file and change MITO_AI_URL to MITO_AI_DEV_URL. We 
            # have a pytest that ensures that the MITO_AI_URL is always set to MITO_AI_PROD_URL 
            # before merging into dev. So if you change which variable we are using here, the 
            # test will not catch our mistakes.
            MITO_AI_URL, method="POST", headers=headers, body=json.dumps(data)
        )
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
    response_format: Optional[Type[BaseModel]] = None,
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
    if response_format:
        json_schema = response_format.schema()
        completion_function_params["response_format"] = {
            "type": "json_schema",
            "json_schema": {
                "name": "plan_of_attack",
                "schema": {
                    **json_schema,
                    "additionalProperties": False
                },
                "strict": True
            }
        }
    
    # o3-mini will error if we try setting the temperature
    if model == "gpt-4o-mini":
        completion_function_params["temperature"] = 0.0

    return completion_function_params
