# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

from __future__ import annotations

import re
from typing import List

from mito_ai_core.utils.model_utils import get_available_models

_COMMON_MODEL_PREFIX_ALIASES = {
    "haiku45": "claude-haiku-4-5",
    "claudehaiku45": "claude-haiku-4-5",
    "gpt41": "gpt-4.1",
    "gpt52": "gpt-5.2",
    "gpt55": "gpt-5.5",
    "gemini3flash": "gemini-3-flash",
    "gemini31pro": "gemini-3.1-pro",
}


def normalize_alnum(value: str) -> str:
    """
    Normalize a string to alphanumeric characters only to make
    alias matching easier. ie: Haiku 4.5 -> haiku45
    """
    return re.sub(r"[^a-z0-9]", "", value.lower())


def tokenize_model_name(value: str) -> List[str]:
    """
    Tokenize a model name into a list of tokens.
    ie: gpt-4.1 -> ["gpt", "4", "1"]
    """
    return [token for token in re.split(r"[^a-z0-9]+", value.lower()) if token]


def resolve_cli_model_name(user_model_name: str) -> str:
    """
    Find the matching mode name from the available models.
    """
    requested = user_model_name.strip()
    available_models = get_available_models()
    if requested in available_models:
        return requested

    # Prefer exact case-insensitive matches first.
    requested_lower = requested.lower()
    for model in available_models:
        if model.lower() == requested_lower:
            return model

    normalized_requested = normalize_alnum(requested)
    alias_prefix = _COMMON_MODEL_PREFIX_ALIASES.get(normalized_requested)
    if alias_prefix:
        alias_matches = [m for m in available_models if m.lower().startswith(alias_prefix)]
        if len(alias_matches) == 1:
            return alias_matches[0]

    requested_tokens = tokenize_model_name(requested)
    token_matches = []
    for model in available_models:
        model_tokens = set(tokenize_model_name(model))
        if all(token in model_tokens for token in requested_tokens):
            token_matches.append(model)

    if len(token_matches) == 1:
        return token_matches[0]

    if len(token_matches) > 1:
        raise ValueError(
            f"Model {user_model_name} is ambiguous. Matching models: {token_matches}. "
            "Please use a more specific model name."
        )

    raise ValueError(
        f"Model {user_model_name} is not in the allowed model list: {available_models}"
    )
