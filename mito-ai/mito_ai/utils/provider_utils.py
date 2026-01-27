# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

from typing import Union

from mito_ai.completions.models import MessageType


def get_model_provider(model: str) -> Union[str, None]:
    """
    Determine the model type based on the model name prefix.
    
    Priority order:
    1. Check for router prefixes (Abacus/, LiteLLM/)
    2. Check for legacy LiteLLM format (provider/model)
    3. Check for standard model name patterns
    """
    if not model:
        return None

    model_lower = model.lower()

    # Check for router prefixes first (highest priority)
    if model_lower.startswith('abacus/'):
        return 'abacus'
    elif model_lower.startswith('litellm/'):
        return 'litellm'    

    # Check for standard model name patterns
    if model_lower.startswith('claude'):
        return 'claude'
    elif model_lower.startswith('gemini'):
        return 'gemini'
    elif model_lower.startswith('ollama'):
        return 'ollama'
    elif model_lower.startswith('gpt'):
        return 'openai'

    return None
    