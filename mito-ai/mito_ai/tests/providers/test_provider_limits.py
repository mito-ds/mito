# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

import pytest
from mito_ai.completions.providers import OpenAIProvider
from mito_ai.tests.providers.utils import mock_openai_client, patch_server_limits
from mito_ai.utils.server_limits import OS_MONTHLY_AI_COMPLETIONS_LIMIT
from traitlets.config import Config

FAKE_API_KEY = "sk-1234567890"

@pytest.fixture
def provider_config() -> Config:
    """Create a proper Config object for the OpenAIProvider."""
    config = Config()
    config.OpenAIProvider = Config()
    config.OpenAIClient = Config()
    return config

@pytest.mark.parametrize("is_pro,completion_count", [
    (False, 1),  # OS user below limit
    (False, OS_MONTHLY_AI_COMPLETIONS_LIMIT + 1),  # OS user above limit
    (True, 1),   # Pro user below limit
    (True, OS_MONTHLY_AI_COMPLETIONS_LIMIT + 1),   # Pro user above limit
])
def test_openai_provider_with_limits(
    is_pro: bool, 
    completion_count: int, 
    monkeypatch: pytest.MonkeyPatch, 
    provider_config: Config) -> None:
    """Test OpenAI provider behavior with different user types and usage limits."""
    monkeypatch.setenv("OPENAI_API_KEY", FAKE_API_KEY)
    monkeypatch.setattr("mito_ai.constants.OPENAI_API_KEY", FAKE_API_KEY)

    with (
        patch_server_limits(is_pro=is_pro, completion_count=completion_count),
        mock_openai_client()
    ):
        llm = OpenAIProvider(config=provider_config)
        capabilities = llm.capabilities
        assert "user key" in capabilities.provider
        assert llm.last_error is None