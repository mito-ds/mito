# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

import os
from typing import Union

# Claude
CLAUDE_API_KEY = os.environ.get("CLAUDE_API_KEY")

# Gemini
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")

# Ollama
OLLAMA_MODEL = os.environ.get("OLLAMA_MODEL")
OLLAMA_BASE_URL = os.environ.get("OLLAMA_BASE_URL", "http://localhost:11434/v1")

# OpenAI
OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY")

# Azure OpenAI Config 
AZURE_OPENAI_API_KEY = os.environ.get("AZURE_OPENAI_API_KEY")
AZURE_OPENAI_API_VERSION = os.environ.get("AZURE_OPENAI_API_VERSION")
AZURE_OPENAI_ENDPOINT = os.environ.get("AZURE_OPENAI_ENDPOINT")
AZURE_OPENAI_MODEL = os.environ.get("AZURE_OPENAI_MODEL")

def get_model_provider(model: str) -> Union[str, None]:
    """
    Determine the model type based on the model name prefix
    """
    if not model:
        return None

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


# Mito AI Base URLs and Endpoint Paths
MITO_PROD_BASE_URL = "https://x3rafympznv4abp7phos44gzgu0clbui.lambda-url.us-east-1.on.aws"
MITO_DEV_BASE_URL = "https://x3rafympznv4abp7phos44gzgu0clbui.lambda-url.us-east-1.on.aws"

# Set ACTIVE_BASE_URL manually
ACTIVE_BASE_URL = MITO_PROD_BASE_URL  # Change to MITO_DEV_BASE_URL for dev

# Endpoint paths
ANTHROPIC_PATH = "anthropic/completions"
GEMINI_PATH = "gemini/completions"
OPENAI_PATH = "openai/completions"

# Full URLs (always use ACTIVE_BASE_URL)
MITO_ANTHROPIC_URL = f"{ACTIVE_BASE_URL}/{ANTHROPIC_PATH}"
MITO_GEMINI_URL = f"{ACTIVE_BASE_URL}/{GEMINI_PATH}"
MITO_OPENAI_URL = f"{ACTIVE_BASE_URL}/{OPENAI_PATH}"