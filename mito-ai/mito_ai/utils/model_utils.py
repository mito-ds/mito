# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

from typing import List, Tuple, Union, cast
from mito_ai import constants
from mito_ai.utils.version_utils import is_enterprise

# Model ordering: [fastest, ..., slowest] for each provider
ANTHROPIC_MODEL_ORDER = [
    "claude-haiku-4-5-20251001",  # Fastest
    "claude-sonnet-4-5-20250929",  # Slower
]

OPENAI_MODEL_ORDER = [
    "gpt-4.1",      # Fastest
    "gpt-5.2",      # Slower
]

GEMINI_MODEL_ORDER = [
    "gemini-3-flash-preview",  # Fastest
    "gemini-3-pro-preview",     # Slower
]

# Standard model names (used when not in enterprise mode or when LiteLLM is not configured)
STANDARD_MODELS = [
    "gpt-4.1",
    "gpt-5.2",
    "claude-sonnet-4-5-20250929",
    "claude-haiku-4-5-20251001",
    "gemini-3-flash-preview",
    "gemini-3-pro-preview",
]


def get_available_models() -> List[str]:
    """
    Determine which models are available based on enterprise mode and LiteLLM configuration.
    
    Returns:
        List of available model names. If enterprise mode is enabled AND LiteLLM is configured,
        returns LiteLLM models. Otherwise, returns standard models.
    """
    # Check if enterprise mode is enabled AND LiteLLM is configured
    if is_enterprise() and constants.LITELLM_BASE_URL and constants.LITELLM_MODELS:
        # Return LiteLLM models (with provider prefixes)
        return constants.LITELLM_MODELS
    else:
        # Return standard models
        return STANDARD_MODELS


def get_fast_model_for_selected_model(selected_model: str) -> str:
    """
    Get the fastest model for the client of the selected model.
    
    - For standard providers, returns the first (fastest) model from that provider's order.
    - For LiteLLM models, finds the fastest available model from LiteLLM by comparing indices in the model order lists.
    """
    # Check if this is a LiteLLM model (has provider prefix like "openai/gpt-4o")
    if "/" in selected_model:
        
        # Find the fastest model from available LiteLLM models
        available_models = get_available_models()
        if not available_models:
            return selected_model
        
        # Filter to only LiteLLM models (those with "/") before splitting
        litellm_models = [model for model in available_models if "/" in model]
        if not litellm_models:
            return selected_model
        
        available_provider_model_pairs: List[List[str]] = [model.split("/", 1) for model in litellm_models]

        fastest_pair = min(available_provider_model_pairs, key=get_model_order_index)
        fastest_model = f"{fastest_pair[0]}/{fastest_pair[1]}"
        
        # If we found a fastest model, return it. Otherwise, use the selected model
        if fastest_model:
            return fastest_model
        else:
            return selected_model
    
    # Standard provider logic - ensure we return a model from the same provider
    model_lower = selected_model.lower()
    
    # Determine provider and get fastest model
    if model_lower.startswith('claude') and selected_model in ANTHROPIC_MODEL_ORDER:
        return ANTHROPIC_MODEL_ORDER[0]
    elif model_lower.startswith('gpt') and selected_model in OPENAI_MODEL_ORDER:
        return OPENAI_MODEL_ORDER[0]
    elif model_lower.startswith('gemini') and selected_model in GEMINI_MODEL_ORDER:
        return GEMINI_MODEL_ORDER[0]

    return selected_model

def get_smartest_model_for_selected_model(selected_model: str) -> str:
    """
    Get the smartest model for the client of the selected model.
    
    - For standard providers, returns the last (smartest) model from that provider's order.
    - For LiteLLM models, finds the smartest available model from LiteLLM by comparing indices in the model order lists.
    """
    # Check if this is a LiteLLM model (has provider prefix like "openai/gpt-4o")
    if "/" in selected_model:
        
        # Find the smartest model from available LiteLLM models
        available_models = get_available_models()
        if not available_models:
            return selected_model
        
        # Filter to only LiteLLM models (those with "/") before splitting
        litellm_models = [model for model in available_models if "/" in model]
        if not litellm_models:
            return selected_model
        
        available_provider_model_pairs: List[List[str]] = [model.split("/", 1) for model in litellm_models]

        smartest_pair = max(available_provider_model_pairs, key=get_model_order_index)
        smartest_model = f"{smartest_pair[0]}/{smartest_pair[1]}"
        
        # If we found a smartest model, return it. Otherwise, use the selected model
        if smartest_model:
            return smartest_model
        else:
            return selected_model
    
    # Standard provider logic
    model_lower = selected_model.lower()
    
    # Determine provider and get smartest model
    if model_lower.startswith('claude') and selected_model in ANTHROPIC_MODEL_ORDER:
        return ANTHROPIC_MODEL_ORDER[-1]
    elif model_lower.startswith('gpt') and selected_model in OPENAI_MODEL_ORDER:
        return OPENAI_MODEL_ORDER[-1]
    elif model_lower.startswith('gemini') and selected_model in GEMINI_MODEL_ORDER:
        return GEMINI_MODEL_ORDER[-1]

    return selected_model

def get_model_order_index(pair: List[str]) -> Union[int, float]:
    provider, model_name = pair
    if provider == "openai":
        try:
            return OPENAI_MODEL_ORDER.index(model_name)
        except ValueError:
            return float('inf')
    elif provider == "anthropic":
        try:
            return ANTHROPIC_MODEL_ORDER.index(model_name)
        except ValueError:
            return float('inf')
    elif provider == "google":
        try:
            return GEMINI_MODEL_ORDER.index(model_name)
        except ValueError:
            return float('inf')
    else:
        return float('inf')