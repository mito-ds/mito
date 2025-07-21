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

# Mito AI Base URLs and Endpoint Paths
MITO_PROD_BASE_URL = "https://7eax4i53f5odkshhlry4gw23by0yvnuv.lambda-url.us-east-1.on.aws/v1"
MITO_DEV_BASE_URL = "https://g5vwmogjg7gh7aktqezyrvcq6a0hyfnr.lambda-url.us-east-1.on.aws/v1"

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

# Streamlit conversion endpoints
MITO_STREAMLIT_DEV_BASE_URL = "https://fr12uvtfy5.execute-api.us-east-1.amazonaws.com"
MITO_STREAMLIT_TEST_BASE_URL = "https://iyual08t6d.execute-api.us-east-1.amazonaws.com"

# Set ACTIVE_BASE_URL manually
# TODO: Modify to PROD url before release
ACTIVE_STREAMLIT_BASE_URL = MITO_STREAMLIT_DEV_BASE_URL  # Change to MITO_STREAMLIT_DEV_BASE_URL for dev

# AWS Cognito configuration
COGNITO_CONFIG_DEV = {
    'TOKEN_ENDPOINT': 'https://mito-app-auth.auth.us-east-1.amazoncognito.com/oauth2/token',
    'CLIENT_ID': '6ara3u3l8sss738hrhbq1qtiqf',
    'CLIENT_SECRET': '',
    'REDIRECT_URI': 'http://localhost:8888/lab'
}

ACTIVE_COGNITO_CONFIG = COGNITO_CONFIG_DEV # Change to COGNITO_CONFIG_DEV for dev
