# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

"""Copilot chat model ids (GitHub API). Order: fast → slow for fast/smart helpers."""

import os
from typing import List

# Default ids for POST https://api.githubcopilot.com/chat/completions (after stripping copilot/ prefix).
# Put widely available models first: some accounts return model_not_supported for ids like gpt-4.1 until
# enabled under https://github.com/settings/copilot/features (or org policy).
_DEFAULT_GITHUB_COPILOT_CHAT_MODEL_IDS: List[str] = [
    "gpt-4o",
    "gpt-5-mini",
    "gpt-5",
    "gpt-4.1",
    "claude-sonnet-4.5",
    "claude-sonnet-4",
    "gemini-2.5-pro",
]


def _chat_model_ids_from_env() -> List[str]:
    raw = os.environ.get("MITO_AI_COPILOT_CHAT_MODEL_IDS", "").strip()
    if not raw:
        return list(_DEFAULT_GITHUB_COPILOT_CHAT_MODEL_IDS)
    parsed = [x.strip() for x in raw.split(",") if x.strip()]
    return parsed if parsed else list(_DEFAULT_GITHUB_COPILOT_CHAT_MODEL_IDS)


def get_github_copilot_chat_model_ids() -> List[str]:
    """Underlying Copilot API model names (no copilot/ prefix). Honors MITO_AI_COPILOT_CHAT_MODEL_IDS."""
    return _chat_model_ids_from_env()


def get_github_copilot_models_prefixed() -> List[str]:
    """Models exposed to the frontend / allowlist (copilot/<api_id>)."""
    return [f"copilot/{mid}" for mid in get_github_copilot_chat_model_ids()]


def strip_copilot_prefix(model: str) -> str:
    if model.lower().startswith("copilot/"):
        return model[8:]
    return model
