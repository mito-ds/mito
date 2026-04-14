#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.

"""
LLM completion for AI notes features (annotations, etc.).
Uses BYO URL, OPENAI_API_KEY (long JSON-friendly responses), or Mito-hosted API (shorter limit).
"""

from __future__ import annotations

import os
from typing import Any, Dict

import requests  # type: ignore

from mitosheet.api.get_ai_completion import (
    OPEN_AI_URL,
    _get_ai_completion_from_mito_server,
)
from mitosheet.types import StepsManagerType


def ai_notes_backend_completion(
    prompt: str,
    steps_manager: StepsManagerType,
    *,
    user_input: str = "ai-notes",
    prefer_json_object: bool = False,
) -> str:
    """
    Returns raw model text (caller parses JSON / strips fences).
    """
    byo_url = steps_manager.mito_config.llm_url
    openai_key = os.environ.get("OPENAI_API_KEY")

    model = os.environ.get("MITO_OPENAI_MODEL", "gpt-4o-mini")
    max_tokens = int(os.environ.get("MITO_AI_NOTES_MAX_TOKENS", "3500"))

    if byo_url is not None:
        data: Dict[str, Any] = {
            "model": model,
            "messages": [{"role": "user", "content": prompt}],
            "max_tokens": max_tokens,
            "temperature": 0.2,
        }
        if prefer_json_object:
            data["response_format"] = {"type": "json_object"}
        headers = {"Content-Type": "application/json"}
        res = requests.post(byo_url, headers=headers, json=data, timeout=120)
        if res.status_code != 200:
            try:
                err = res.json()
            except Exception:
                err = res.text
            raise RuntimeError(f"LLM error ({res.status_code}): {err}")
        return str(res.json()["choices"][0]["message"]["content"]).strip()

    if openai_key:
        data = {
            "model": model,
            "messages": [{"role": "user", "content": prompt}],
            "max_tokens": max_tokens,
            "temperature": 0.2,
        }
        if prefer_json_object:
            data["response_format"] = {"type": "json_object"}
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {openai_key}",
        }
        res = requests.post(OPEN_AI_URL, headers=headers, json=data, timeout=120)
        if res.status_code != 200:
            raise RuntimeError(
                f"OpenAI error: {res.json().get('error', res.text)}"
            )
        return str(res.json()["choices"][0]["message"]["content"]).strip()

    out = _get_ai_completion_from_mito_server(user_input, prompt)
    if isinstance(out, dict) and out.get("error"):
        raise RuntimeError(str(out["error"]))
    if not isinstance(out, dict) or "completion" not in out:
        raise RuntimeError("Unexpected response from Mito AI API.")
    return str(out["completion"]).strip()
