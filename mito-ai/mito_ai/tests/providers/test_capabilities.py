# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

import pytest
from unittest.mock import MagicMock, patch
from mito_ai.completions.providers import OpenAIProvider
from mito_ai.tests.providers.utils import mock_azure_openai_client, mock_openai_client, patch_server_limits
from traitlets.config import Config

FAKE_API_KEY = "sk-1234567890"

@pytest.fixture
def provider_config() -> Config:
    """Create a proper Config object for the OpenAIProvider."""
    config = Config()
    config.OpenAIProvider = Config()
    config.OpenAIClient = Config()
    return config

@pytest.mark.parametrize("test_case", [
    {
        "name": "mito_server_fallback_no_keys",
        "setup": {
            "OPENAI_API_KEY": None,
            "CLAUDE_API_KEY": None, 
            "GEMINI_API_KEY": None,
            "is_azure_configured": False,
        },
        "expected_provider": "Mito server",
        "expected_key_type": "mito_server_key"
    },
    {
        "name": "claude_when_only_claude_key",
        "setup": {
            "OPENAI_API_KEY": None,
            "CLAUDE_API_KEY": "claude-test-key",
            "GEMINI_API_KEY": None,
            "is_azure_configured": False,
        },
        "expected_provider": "Claude",
        "expected_key_type": "claude"
    },
    {
        "name": "gemini_when_only_gemini_key",
        "setup": {
            "OPENAI_API_KEY": None,
            "CLAUDE_API_KEY": None,
            "GEMINI_API_KEY": "gemini-test-key",
            "is_azure_configured": False,
        },
        "expected_provider": "Gemini", 
        "expected_key_type": "gemini"
    },
    {
        "name": "openai_when_openai_key",
        "setup": {
            "OPENAI_API_KEY": 'openai-test-key',
            "CLAUDE_API_KEY": None,
            "GEMINI_API_KEY": None,
            "is_azure_configured": False,
        },
        "expected_provider": "OpenAI (user key)",
        "expected_key_type": "user_key"
    },
    {
        "name": "claude_priority_over_gemini",
        "setup": {
            "OPENAI_API_KEY": None,
            "CLAUDE_API_KEY": "claude-test-key",
            "GEMINI_API_KEY": "gemini-test-key",
            "is_azure_configured": False,
        },
        "expected_provider": "Claude",
        "expected_key_type": "claude"
    },
])
def test_provider_capabilities_real_logic(
    test_case: dict,
    monkeypatch: pytest.MonkeyPatch, 
    provider_config: Config
) -> None:
    """Test the actual provider selection logic in OpenAIProvider.capabilities"""
    
    # Set up the environment based on test case
    setup = test_case["setup"]
    
    # CRITICAL: Set up ALL mocks BEFORE creating any clients
    for key, value in setup.items():
        if key == "is_azure_configured":
            if value:
                # For Azure case, mock to return True and set required constants
                monkeypatch.setattr("mito_ai.enterprise.utils.is_azure_openai_configured", lambda: True)
                monkeypatch.setattr("mito_ai.constants.AZURE_OPENAI_MODEL", "gpt-4o")
            else:
                # For non-Azure case, mock to return False
                monkeypatch.setattr("mito_ai.enterprise.utils.is_azure_openai_configured", lambda: False)
        else:
            monkeypatch.setattr(f"mito_ai.constants.{key}", value)
    
    # Clear the provider config API key to ensure it uses constants
    provider_config.OpenAIProvider.api_key = None
    
    # Mock HTTP calls but let the real logic run
    with patch("openai.OpenAI") as mock_openai_constructor:
        with patch("openai.AsyncOpenAI") as mock_async_openai:
            with patch("openai.AsyncAzureOpenAI") as mock_async_azure_openai:
                # Mock successful API key validation for OpenAI
                mock_openai_instance = MagicMock()
                mock_openai_instance.models.list.return_value = [MagicMock(id="gpt-4o-mini")]
                mock_openai_constructor.return_value = mock_openai_instance
                
                # Mock server limits for Mito server fallback
                with patch_server_limits():
                    # NOW create the provider after ALL mocks are set up
                    llm = OpenAIProvider(config=provider_config)
                    
                    # Test capabilities 
                    capabilities = llm.capabilities
                    assert capabilities.provider == test_case["expected_provider"], f"Test case: {test_case['name']}"
                    assert llm.key_type == test_case["expected_key_type"], f"Test case: {test_case['name']}"
