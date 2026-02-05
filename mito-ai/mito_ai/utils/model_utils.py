# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

from typing import List, Tuple, Union, Optional, cast
from mito_ai import constants
from mito_ai.utils.version_utils import is_enterprise
from mito_ai.enterprise.utils import is_abacus_configured

# Model ordering: [fastest, ..., slowest] for each provider
ANTHROPIC_MODEL_ORDER = [
    "claude-haiku-4-5-20251001",  # Fastest
]

OPENAI_MODEL_ORDER = [
    "gpt-4.1",      # Fastest
    "gpt-5",
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
    "claude-haiku-4-5-20251001",
    "gemini-3-flash-preview",
    "gemini-3-pro-preview",
]


def get_available_models() -> List[str]:
    """
    Determine which models are available based on enterprise mode and router configuration.
    
    Priority order:
    1. Abacus (if configured)
    2. LiteLLM (if configured)
    3. Standard models
    
    Returns:
        List of available model names with appropriate prefixes.
    """
    # Check if enterprise mode is enabled AND Abacus is configured (highest priority)
    if is_abacus_configured():
        # Return Abacus models (with Abacus/ prefix)
        return constants.ABACUS_MODELS
    # Check if enterprise mode is enabled AND LiteLLM is configured
    elif is_enterprise() and constants.LITELLM_BASE_URL and constants.LITELLM_MODELS:
        # Return LiteLLM models (with LiteLLM/provider/ prefix or legacy provider/ prefix)
        return constants.LITELLM_MODELS
    else:
        # Return standard models
        return STANDARD_MODELS


def get_fast_model_for_selected_model(selected_model: str) -> str:
    """
    Get the fastest model for the client of the selected model.
    
    - For standard providers, returns the first (fastest) model from that provider's order.
    - For enterprise router models (Abacus/LiteLLM), finds the fastest available model by comparing indices.
    """
    # Check if this is an enterprise router model (has "/" or router prefix)
    if "/" in selected_model or selected_model.lower().startswith(('abacus/', 'litellm/')):
        # Find the fastest model from available models
        available_models = get_available_models()
        if not available_models:
            return selected_model
        
        # Filter to only router models (those with "/")
        router_models = [model for model in available_models if "/" in model]
        if not router_models:
            return selected_model
        
        # Extract provider/model pairs for ordering
        pairs_with_indices = []
        for model in router_models:
            # Strip router prefix to get underlying model info
            model_without_router = strip_router_prefix(model)
            
            # For Abacus: model_without_router is just the model name (e.g., "gpt-4.1")
            # For LiteLLM: model_without_router is "provider/model" (e.g., "openai/gpt-4.1")
            if "/" in model_without_router:
                # LiteLLM format: provider/model
                pair = model_without_router.split("/", 1)
            else:
                # Abacus format: just model name, need to determine provider
                provider = get_underlying_model_provider(model)
                if provider:
                    pair = [provider, model_without_router]
                else:
                    continue
            
            index = get_model_order_index(pair)
            if index is not None:
                pairs_with_indices.append((model, index))
        
        if not pairs_with_indices:
            return selected_model

        # Find the model with the minimum index (fastest model)
        fastest_model, _ = min(pairs_with_indices, key=lambda x: x[1])
        
        return fastest_model
    
    # Standard provider logic - ensure we return a model from the same provider
    model_lower = selected_model.lower()
    
    # Determine provider and get fastest model
    if model_lower.startswith('claude'):
        return ANTHROPIC_MODEL_ORDER[0]
    elif model_lower.startswith('gpt'):
        return OPENAI_MODEL_ORDER[0]
    elif model_lower.startswith('gemini'):
        return GEMINI_MODEL_ORDER[0]

    return selected_model

def get_smartest_model_for_selected_model(selected_model: str) -> str:
    """
    Get the smartest model for the client of the selected model.
    
    - For standard providers, returns the last (smartest) model from that provider's order.
    - For enterprise router models (Abacus/LiteLLM), finds the smartest available model by comparing indices.
    """
    # Check if this is an enterprise router model (has "/" or router prefix)
    if "/" in selected_model or selected_model.lower().startswith(('abacus/', 'litellm/')):
        # Extract underlying provider from selected model
        selected_provider = get_underlying_model_provider(selected_model)
        if not selected_provider:
            return selected_model
        
        # Find the smartest model from available models
        available_models = get_available_models()
        if not available_models:
            return selected_model
        
        # Filter to only router models with the same underlying provider
        router_models = []
        for model in available_models:
            if "/" in model:
                model_provider = get_underlying_model_provider(model)
                if model_provider == selected_provider:
                    router_models.append(model)
        
        if not router_models:
            return selected_model
        
        # Extract provider/model pairs for ordering
        pairs_with_indices = []
        for model in router_models:
            # Strip router prefix to get underlying model info
            model_without_router = strip_router_prefix(model)
            
            # For Abacus: model_without_router is just the model name (e.g., "gpt-4.1")
            # For LiteLLM: model_without_router is "provider/model" (e.g., "openai/gpt-4.1")
            if "/" in model_without_router:
                # LiteLLM format: provider/model
                pair = model_without_router.split("/", 1)
            else:
                # Abacus format: just model name, provider already determined
                pair = [selected_provider, model_without_router]
            
            index = get_model_order_index(pair)
            if index is not None:
                pairs_with_indices.append((model, index))
        
        if not pairs_with_indices:
            return selected_model

        # Find the model with the maximum index (smartest model)
        smartest_model, _ = max(pairs_with_indices, key=lambda x: x[1])
        
        return smartest_model
    
    # Standard provider logic
    model_lower = selected_model.lower()
    
    # Determine provider and get smartest model
    if model_lower.startswith('claude'):
        return ANTHROPIC_MODEL_ORDER[-1]
    elif model_lower.startswith('gpt'):
        return OPENAI_MODEL_ORDER[-1]
    elif model_lower.startswith('gemini'):
        return GEMINI_MODEL_ORDER[-1]

    return selected_model

def strip_router_prefix(model: str) -> str:
    """
    Strip router prefix from model name.
    
    Examples:
    - "Abacus/gpt-4.1" -> "gpt-4.1"
    - "LiteLLM/openai/gpt-4.1" -> "openai/gpt-4.1"
    - "gpt-4.1" -> "gpt-4.1" (no prefix, return as-is)
    """
    if model.lower().startswith('abacus/'):
        return model[7:]  # Strip "Abacus/"
    elif model.lower().startswith('litellm/'):
        return model[8:]  # Strip "LiteLLM/"
    return model

def get_underlying_model_provider(full_model_provider_id: str) -> Optional[str]:
    """
    Determine the underlying AI provider from a model identifier.
    
    For Abacus models (Abacus/model), determine the provider from model name pattern.
    For LiteLLM models (LiteLLM/provider/model), extract the provider from the prefix.
    
    Returns:
        Provider name ("openai", "anthropic", "google") or None if cannot determine.
    """
    # Strip router prefix first
    model_without_router = strip_router_prefix(full_model_provider_id)
    
    # Check if it's a LiteLLM format (provider/model)
    if "/" in model_without_router:
        provider, _ = model_without_router.split("/", 1)
        return provider.lower()
    
    # For Abacus models without provider prefix, determine from model name
    model_lower = model_without_router.lower()
    if model_lower.startswith('gpt'):
        return 'openai'
    elif model_lower.startswith('claude'):
        return 'anthropic'
    elif model_lower.startswith('gemini'):
        return 'google'
    
    return None

def get_model_order_index(pair: List[str]) -> Optional[int]:
    provider, model_name = pair
    if provider == "openai":
        try:
            return OPENAI_MODEL_ORDER.index(model_name)
        except ValueError:
            return None
    elif provider == "anthropic":
        try:
            return ANTHROPIC_MODEL_ORDER.index(model_name)
        except ValueError:
            return None
    elif provider == "google":
        try:
            return GEMINI_MODEL_ORDER.index(model_name)
        except ValueError:
            return None
    else:
        return None