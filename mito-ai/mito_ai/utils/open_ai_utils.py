#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.

import json
from typing import Any, Dict
from datetime import datetime, timedelta

from tornado.httpclient import AsyncHTTPClient

from .db import get_user_field
from .schema import UJ_STATIC_USER_ID, UJ_USER_EMAIL
from .telemetry_utils import (
    MITO_SERVER_FREE_TIER_LIMIT_REACHED,
    log,
)
from .version_utils import is_pro

MITO_AI_URL = "https://ogtzairktg.execute-api.us-east-1.amazonaws.com/Prod/completions/"

OPEN_SOURCE_AI_COMPLETIONS_LIMIT = 500
OPEN_SOURCE_INLINE_COMPLETIONS_LIMIT = 30 # days

__user_email = None
__user_id = None


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
    last_message_content: str,
    ai_completion_data: Dict[str, Any],
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
        "email": __user_email,
        "user_id": __user_id,
        "data": ai_completion_data,
        "user_input": last_message_content,  # We add this just for logging purposes
    }

    headers = {
        "Content-Type": "application/json",
    }

    http_client = AsyncHTTPClient(defaults=dict(user_agent="Mito-AI client"))
    try:
        res = await http_client.fetch(
            MITO_AI_URL, method="POST", headers=headers, body=json.dumps(data)
        )
    finally:
        http_client.close()

    # The lambda function returns a dictionary with a completion entry in it,
    # so we just return that.
    content = json.loads(res.body)

    return content.get("completion", "")
