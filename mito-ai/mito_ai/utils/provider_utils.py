# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

from typing import Union

from mito_ai.completions.models import MessageType


def get_model_provider(model: str) -> Union[str, None]:
    """
    Determine the model type based on the model name prefix
    """
    if not model:
        return None

    # Check if model is a LiteLLM model (has provider prefix)
    if "/" in model and any(
        model.startswith(prefix) for prefix in ["openai/", "anthropic/", "google/", "ollama/"]
    ):
        return 'litellm'

    model_lower = model.lower()

    if model_lower.startswith('claude'):
        return 'claude'
    elif model_lower.startswith('gemini'):
        return 'gemini'
    elif model_lower.startswith('ollama'):
        return 'ollama'
    elif model_lower.startswith('gpt'):
        return 'openai'

    return None
    