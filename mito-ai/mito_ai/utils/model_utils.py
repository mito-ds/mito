# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

from typing import List
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
    Get the fastest model for the provider of the selected model.
    
    For standard providers, returns the first (fastest) model from that provider's order.
    For LiteLLM models, finds the fastest model by comparing indices in the model order lists.
    
    Args:
        selected_model: The currently selected model name
        
    Returns:
        The fastest model name for the same provider, or the selected model if already fastest
        or if provider cannot be determined.
    """
    # Check if this is a LiteLLM model (has provider prefix like "openai/gpt-4o")
    if "/" in selected_model:
        # Extract provider prefix and model name
        parts = selected_model.split("/", 1)
        if len(parts) != 2:
            return selected_model  # Invalid format, return as-is
        
        provider_prefix = parts[0].lower()
        model_name = parts[1]
        
        # Find the fastest model from available LiteLLM models
        available_models = get_available_models()
        if not available_models:
            return selected_model
        
        # Filter to only LiteLLM models (those with provider prefixes)
        litellm_models = [m for m in available_models if "/" in m]
        if not litellm_models:
            return selected_model
        
        # Find the fastest model from the same provider as the selected model
        selected_provider = provider_prefix.lower()
        fastest_model = None
        fastest_index = float('inf')
        
        # Filter to models from the same provider
        same_provider_models = [
            m for m in litellm_models 
            if m.split("/", 1)[0].lower() == selected_provider
        ]
        
        if not same_provider_models:
            # No models from same provider, return first available
            return litellm_models[0] if litellm_models else selected_model
        
        # Determine which model order list to use based on provider
        model_order = None
        if selected_provider == "openai":
            model_order = OPENAI_MODEL_ORDER
        elif selected_provider == "anthropic":
            model_order = ANTHROPIC_MODEL_ORDER
        elif selected_provider == "google":
            model_order = GEMINI_MODEL_ORDER
        
        if model_order:
            # Find the fastest model from same provider by comparing indices
            for model in same_provider_models:
                model_parts = model.split("/", 1)
                if len(model_parts) != 2:
                    continue
                
                model_name_only = model_parts[1]
                
                # Find the index of this model in the order list
                try:
                    index = model_order.index(model_name_only)
                    if index < fastest_index:
                        fastest_index = index
                        fastest_model = model
                except ValueError:
                    # Model not in order list, skip it
                    continue
        
        # If we found a fastest model, return it. Otherwise, return the first model from same provider.
        if fastest_model:
            return fastest_model
        elif same_provider_models:
            return same_provider_models[0]
        elif litellm_models:
            return litellm_models[0]
        else:
            return selected_model
    
    # Standard provider logic
    model_lower = selected_model.lower()
    
    # Determine provider and get fastest model
    if model_lower.startswith('claude'):
        # Anthropic provider
        if selected_model in ANTHROPIC_MODEL_ORDER:
            # Return the first (fastest) model from Anthropic order
            return ANTHROPIC_MODEL_ORDER[0]
        else:
            # Model not in order, return as-is
            return selected_model
    elif model_lower.startswith('gpt'):
        # OpenAI provider
        if selected_model in OPENAI_MODEL_ORDER:
            # Return the first (fastest) model from OpenAI order
            return OPENAI_MODEL_ORDER[0]
        else:
            # Model not in order, return as-is
            return selected_model
    elif model_lower.startswith('gemini'):
        # Gemini provider
        if selected_model in GEMINI_MODEL_ORDER:
            # Return the first (fastest) model from Gemini order
            return GEMINI_MODEL_ORDER[0]
        else:
            # Model not in order, return as-is
            return selected_model
    else:
        # Unknown provider, return as-is
        return selected_model
