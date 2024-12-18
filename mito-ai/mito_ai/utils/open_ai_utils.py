#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.

import os
import requests
from typing import Any, Dict, List
from .db import get_user_field, set_user_field
from .schema import UJ_AI_MITO_API_NUM_USAGES, UJ_STATIC_USER_ID, UJ_USER_EMAIL
from .version_utils import is_pro
from .create import initialize_user
from .telemetry_utils import (
    log,
    log_ai_completion_success,
    KEY_TYPE_PARAM,
    MITO_SERVER_KEY,
    USER_KEY,
    MITO_AI_COMPLETION_SUCCESS,
    MITO_AI_COMPLETION_ERROR,
    MITO_SERVER_NUM_USAGES,
    MITO_SERVER_FREE_TIER_LIMIT_REACHED,
)

OPEN_AI_URL = "https://api.openai.com/v1/chat/completions"
MITO_AI_URL = "https://ogtzairktg.execute-api.us-east-1.amazonaws.com/Prod/completions/"

OPEN_SOURCE_AI_COMPLETIONS_LIMIT = 500

__user_email = None
__user_id = None
__num_usages = None


def _get_ai_completion_data(messages: List[Dict[str, Any]]) -> Dict[str, Any]:
    return {
        "model": "gpt-4o-mini",
        "messages": messages,
        "temperature": 0,
    }


def _get_ai_completion_with_key(
    ai_completion_data: Dict[str, Any], OPENAI_API_KEY: str
) -> Dict[str, Any]:
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {OPENAI_API_KEY}",
    }

    res = requests.post(OPEN_AI_URL, headers=headers, json=ai_completion_data)

    # If the response status code is in the 200s, this does nothing
    # If the response status code indicates an error (4xx or 5xx),
    # raise an HTTPError exception with details about what went wrong
    res.raise_for_status()

    completion = res.json()["choices"][0]["message"]["content"]
    return {"completion": completion}


def _get_ai_completion_from_mito_server(
    last_message_content: str, ai_completion_data: Dict[str, Any]
) -> Dict[str, Any]:

    global __user_email, __user_id, __num_usages

    if __user_email is None:
        __user_email = get_user_field(UJ_USER_EMAIL)
    if __user_id is None:
        __user_id = get_user_field(UJ_STATIC_USER_ID)
    if __num_usages is None:
        __num_usages = get_user_field(UJ_AI_MITO_API_NUM_USAGES)

    if __num_usages is None:
        __num_usages = 0

    pro = is_pro()

    if not pro and __num_usages >= OPEN_SOURCE_AI_COMPLETIONS_LIMIT:
        log(MITO_SERVER_FREE_TIER_LIMIT_REACHED)
        raise PermissionError(MITO_SERVER_FREE_TIER_LIMIT_REACHED)

    data = {
        "email": __user_email,
        "user_id": __user_id,
        "data": ai_completion_data,
        "user_input": last_message_content,  # We add this just for logging purposes
    }

    headers = {
        "Content-Type": "application/json",
    }

    res = requests.post(MITO_AI_URL, headers=headers, json=data)

    # If the response status code is in the 200s, this does nothing
    # If the response status code indicates an error (4xx or 5xx),
    # raise an HTTPError exception with details about what went wrong
    res.raise_for_status()

    # The lambda function returns a dictionary with a completion entry in it,
    # so we just return that.
    return res.json()


def get_open_ai_completion(
    messages: List[Dict[str, Any]], prompt_type: str
) -> Dict[str, Any]:

    initialize_user()

    OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY")

    # Prep the ai completion data
    ai_completion_data = _get_ai_completion_data(messages)
    last_message_content = messages[-1]["content"]

    # Try to get the AI response
    try:
        if OPENAI_API_KEY is None:
            # If they don't have an Open AI key, use the mito server to get a completion
            response = _get_ai_completion_from_mito_server(
                last_message_content, ai_completion_data
            )

            # Increment the number of usages
            global __num_usages
            __num_usages = __num_usages + 1
            set_user_field(UJ_AI_MITO_API_NUM_USAGES, __num_usages)

            # Log the successful completion
            log_ai_completion_success(
                MITO_SERVER_KEY,
                prompt_type,
                last_message_content,
                response,
                __num_usages,
            )
            return response
        else:
            # If they DO have an Open AI key, use it to get a completion
            response = _get_ai_completion_with_key(ai_completion_data, OPENAI_API_KEY)
            log_ai_completion_success(
                USER_KEY, prompt_type, last_message_content, response
            )
            return response
    except Exception as e:
        key_type = MITO_SERVER_KEY if OPENAI_API_KEY is None else USER_KEY
        log(
            MITO_AI_COMPLETION_ERROR,
            params={KEY_TYPE_PARAM: key_type, "prompt_type": prompt_type},
            error=e,
        )
        raise e
