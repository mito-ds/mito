# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

import os

# Active model selections (updated by UI)
ACTIVE_CLAUDE_MODEL = None
ACTIVE_GEMINI_MODEL = None
ACTIVE_OLLAMA_MODEL = None
ACTIVE_OPENAI_MODEL = None

# Claude Base URL
CLAUDE_MODEL = os.environ.get("CLAUDE_MODEL")
CLAUDE_BASE_URL = "https://api.anthropic.com/v1"
CLAUDE_API_KEY = os.environ.get("CLAUDE_API_KEY")

# Gemini Base URL
GEMINI_MODEL = os.environ.get("GEMINI_MODEL")
GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/openai/"
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")

# Ollama Config
OLLAMA_MODEL = os.environ.get("OLLAMA_MODEL")
OLLAMA_BASE_URL = os.environ.get("OLLAMA_BASE_URL", "http://localhost:11434/v1")

# OpenAI API KEY
OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY")

# Azure OpenAI Config
AZURE_OPENAI_API_KEY = os.environ.get("AZURE_OPENAI_API_KEY")
AZURE_OPENAI_API_VERSION = os.environ.get("AZURE_OPENAI_API_VERSION")
AZURE_OPENAI_ENDPOINT = os.environ.get("AZURE_OPENAI_ENDPOINT")
AZURE_OPENAI_MODEL = os.environ.get("AZURE_OPENAI_MODEL")


def set_active_model(model):
    """
    Set the active model based on the model prefix.
    This will override the environment variable settings.
    """
    global ACTIVE_CLAUDE_MODEL, ACTIVE_GEMINI_MODEL, ACTIVE_OLLAMA_MODEL, ACTIVE_OPENAI_MODEL

    # Reset all active models
    ACTIVE_CLAUDE_MODEL = None
    ACTIVE_GEMINI_MODEL = None
    ACTIVE_OLLAMA_MODEL = None
    ACTIVE_OPENAI_MODEL = None

    # Set the appropriate active model based on the prefix
    if model.startswith('claude'):
        ACTIVE_CLAUDE_MODEL = model
    elif model.startswith('gemini'):
        ACTIVE_GEMINI_MODEL = model
    elif model.startswith('ollama'):
        ACTIVE_OLLAMA_MODEL = model
    elif model.startswith('gpt') or model.startswith('o3'):
        ACTIVE_OPENAI_MODEL = model

    return model


def get_active_model(model_type=None):
    """
    Get the active model for a given type, with fallback to env variables
    """
    if model_type == 'claude':
        return ACTIVE_CLAUDE_MODEL or CLAUDE_MODEL
    elif model_type == 'gemini':
        return ACTIVE_GEMINI_MODEL or GEMINI_MODEL
    elif model_type == 'ollama':
        return ACTIVE_OLLAMA_MODEL or OLLAMA_MODEL
    elif model_type == 'openai':
        return ACTIVE_OPENAI_MODEL or None

    # If no type specified, return the first active model
    for model in [ACTIVE_CLAUDE_MODEL, ACTIVE_GEMINI_MODEL, ACTIVE_OLLAMA_MODEL, ACTIVE_OPENAI_MODEL]:
        if model:
            return model

    # Default to environment variables if no active models
    for model in [CLAUDE_MODEL, GEMINI_MODEL, OLLAMA_MODEL]:
        if model:
            return model

    return None