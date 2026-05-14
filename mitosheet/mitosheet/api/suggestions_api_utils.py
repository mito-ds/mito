#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

from __future__ import annotations

import os
import re
from typing import Any, Dict, List, Optional

import requests  # type: ignore

from mitosheet.user.db import get_user_field, increment_user_field
from mitosheet.user.schemas import (
    UJ_AI_MITO_API_NUM_USAGES,
    UJ_STATIC_USER_ID,
    UJ_USER_EMAIL,
)
from mitosheet.user.utils import is_pro

OPEN_AI_URL = "https://api.openai.com/v1/chat/completions"
MITO_AI_URL = "https://ogtzairktg.execute-api.us-east-1.amazonaws.com/Prod/completions/"

OPEN_SOURCE_AI_COMPLETIONS_LIMIT = 100

__user_email = None
__user_id = None


def get_suggestions_llm_payload(prompt: str) -> Dict[str, Any]:
    return {
        "model": "gpt-4.1",
        "messages": [{"role": "user", "content": prompt}],
        # AI Alerts embeds suggested fix code per alert and can return up to
        # 8 alerts, which pushes the response well past the original 900-token
        # cap. 2400 leaves comfortable headroom; salvage_truncated_json handles
        # the rare case where the model still runs over.
        "max_tokens": 2400,
        "temperature": 0.2,
    }


def strip_json_fences(text: str) -> str:
    stripped = text.strip()
    match = re.search(r"```(?:json)?\s*([\s\S]*?)```", stripped)
    if match:
        return match.group(1).strip()
    return stripped


def salvage_truncated_json(text: str) -> Optional[str]:
    """Best-effort recovery of JSON that was truncated mid-response.

    Walks the text tracking string and bracket state, and closes any open
    brackets at the latest position where the structure was valid. Returns
    None if no safe truncation point exists. Useful when an LLM response is
    cut off by max_tokens partway through an array of items.
    """
    stack: List[str] = []
    in_string = False
    escape = False
    last_safe_pos = -1
    last_safe_stack: List[str] = []

    for i, ch in enumerate(text):
        if escape:
            escape = False
            continue
        if in_string:
            if ch == "\\":
                escape = True
            elif ch == '"':
                in_string = False
            continue

        if ch == '"':
            in_string = True
        elif ch == "{" or ch == "[":
            stack.append(ch)
        elif ch == "}" or ch == "]":
            if not stack:
                return None
            opener = stack.pop()
            if (ch == "}" and opener != "{") or (ch == "]" and opener != "["):
                return None
            last_safe_pos = i + 1
            last_safe_stack = list(stack)

    if last_safe_pos == -1:
        return None

    closing = "".join("}" if c == "{" else "]" for c in reversed(last_safe_stack))
    return text[:last_safe_pos] + closing


def get_suggestions_from_mito_server(feature_name: str, prompt: str) -> Dict[str, Any]:
    global __user_email, __user_id

    if __user_email is None:
        __user_email = get_user_field(UJ_USER_EMAIL)
    if __user_id is None:
        __user_id = get_user_field(UJ_STATIC_USER_ID)

    num_usages = get_user_field(UJ_AI_MITO_API_NUM_USAGES) or 0
    if not is_pro() and num_usages >= OPEN_SOURCE_AI_COMPLETIONS_LIMIT:
        return {"error": f"You have used Mito AI {OPEN_SOURCE_AI_COMPLETIONS_LIMIT} times."}

    data = {
        "email": __user_email,
        "user_id": __user_id,
        "user_input": feature_name,
        "data": get_suggestions_llm_payload(prompt),
    }
    headers = {"Content-Type": "application/json"}

    try:
        response = requests.post(MITO_AI_URL, headers=headers, json=data)
    except Exception:
        return {
            "error": "There was an error accessing the Mito AI API. This is likely due to internet connectivity problems or a firewall."
        }

    if response.status_code == 200:
        increment_user_field(UJ_AI_MITO_API_NUM_USAGES)
        return {"completion": response.json()["completion"]}

    try:
        return {
            "error": f'There was an error accessing the MitoAI API. {response.json()["error"]}'
        }
    except Exception:
        return {"error": "There was an error accessing the MitoAI API."}


def get_suggestions_from_open_ai_compatible(url: str, prompt: str) -> Dict[str, Any]:
    data = get_suggestions_llm_payload(prompt)
    headers = {"Content-Type": "application/json"}

    try:
        response = requests.post(url, headers=headers, json=data)
    except Exception:
        return {
            "error": f"There was an error accessing the API at {url}. This is likely due to internet connectivity problems or a firewall."
        }

    if response.status_code == 200:
        completion: str = response.json()["choices"][0]["message"]["content"].strip()
        return {"completion": completion}

    try:
        return {
            "error": f"There was an error accessing the API at {url}. {response.json()['error']['message']}"
        }
    except Exception:
        return {"error": f"There was an error accessing the API at {url}."}


def get_suggestions_from_openai_key(prompt: str) -> Dict[str, Any]:
    data = get_suggestions_llm_payload(prompt)
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {os.environ.get('OPENAI_API_KEY')}",
    }

    try:
        response = requests.post(OPEN_AI_URL, headers=headers, json=data)
    except Exception:
        return {
            "error": "There was an error accessing the OpenAI API. This is likely due to internet connectivity problems or a firewall."
        }

    if response.status_code == 200:
        completion: str = response.json()["choices"][0]["message"]["content"].strip()
        return {"completion": completion}

    try:
        return {
            "error": f"There was an error accessing the OpenAI API. {response.json()['error']['message']}"
        }
    except Exception:
        return {"error": "There was an error accessing the OpenAI API."}
