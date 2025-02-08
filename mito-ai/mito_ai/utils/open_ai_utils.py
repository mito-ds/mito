#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.

import json
from typing import Any, Dict, List, Optional, Type, Final, Union
from datetime import datetime, timedelta

from pydantic import BaseModel
from tornado.httpclient import AsyncHTTPClient

from .db import get_user_field
from .schema import UJ_STATIC_USER_ID, UJ_USER_EMAIL
from .telemetry_utils import (
    MITO_SERVER_FREE_TIER_LIMIT_REACHED,
    log,
)
from .version_utils import is_pro
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


def check_mito_server_quota(n_counts: int, first_usage_date: str) -> None:
    """Check whether the user has reached the limit of completions for the free tier or not.

    Args:
        n_counts: The number of completions the user has made so far.
        first_usage_date: The date of the user's first usage.
    Raises:
        PermissionError: If the user has reached the limit.
    """
    pro = is_pro()

    if pro:
        return

    if n_counts >= OPEN_SOURCE_AI_COMPLETIONS_LIMIT:
        log(MITO_SERVER_FREE_TIER_LIMIT_REACHED)
        raise PermissionError(MITO_SERVER_FREE_TIER_LIMIT_REACHED)

    if first_usage_date != "":
        first_use = datetime.strptime(first_usage_date, "%Y-%m-%d")
        one_month_later = first_use + timedelta(days=OPEN_SOURCE_INLINE_COMPLETIONS_LIMIT)
        if datetime.now() > one_month_later:
            log(MITO_SERVER_FREE_TIER_LIMIT_REACHED)
            raise PermissionError(MITO_SERVER_FREE_TIER_LIMIT_REACHED)


async def get_ai_completion_from_mito_server(
    last_message_content: Union[str, None],
    ai_completion_data: Dict[str, Any],
    timeout: int,
    max_retries: int,
    n_counts: int,
    first_usage_date: str,
) -> str:
    global __user_email, __user_id

    if __user_email is None:
        __user_email = get_user_field(UJ_USER_EMAIL)
    if __user_id is None:
        __user_id = get_user_field(UJ_STATIC_USER_ID)

    check_mito_server_quota(n_counts, first_usage_date)

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

    http_client = AsyncHTTPClient(defaults=dict(user_agent="Mito-AI client"))
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
        return content["completion"]
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
        "response_format": response_format,
    }
    
    # o3-mini will error if we try setting the temperature
    if model == "gpt-4o-mini":
        completion_function_params["temperature"] = 0.0

    return completion_function_params