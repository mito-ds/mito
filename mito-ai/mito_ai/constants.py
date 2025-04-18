# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

import os

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