# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

"""Copilot chat model ids (GitHub API)."""

from typing import List

# Fallback model ids shown in the UI before the /models API has responded.
# Once the user is logged in, get_available_models() uses the live /models
# response from the Copilot API instead of this list.
_FALLBACK_COPILOT_CHAT_MODEL_IDS: List[str] = [
    "gpt-4o",
    "gpt-5-mini",
    "gpt-5",
    "gpt-4.1",
    "claude-sonnet-4.5",
    "claude-sonnet-4",
    "gemini-2.5-pro",
]


def get_fallback_copilot_models_prefixed() -> List[str]:
    """Fallback models (copilot/<api_id>) used before /models API responds."""
    return [f"copilot/{mid}" for mid in _FALLBACK_COPILOT_CHAT_MODEL_IDS]


def strip_copilot_prefix(model: str) -> str:
    if model.lower().startswith("copilot/"):
        return model[8:]
    return model
