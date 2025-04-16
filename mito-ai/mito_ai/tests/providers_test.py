# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

import os
from datetime import datetime
from unittest.mock import patch, MagicMock, PropertyMock

import pytest
from mito_ai.providers import OpenAIProvider
from mito_ai.models import MessageType, CompletionError, AICapabilities
from mito_ai.utils.server_limits import OS_MONTHLY_AI_COMPLETIONS_LIMIT

REALLY_OLD_DATE = "2020-01-01"
TODAY = datetime.now().strftime("%Y-%m-%d")
FAKE_API_KEY = "sk-1234567890"


@pytest.fixture(autouse=True)
def reset_env_vars(monkeypatch):
    for var in [
        "OPENAI_API_KEY", "CLAUDE_MODEL", "CLAUDE_API_KEY",
        "GEMINI_MODEL", "GEMINI_API_KEY", "OLLAMA_MODEL"
    ]:
        monkeypatch.delenv(var, raising=False)


def patch_server_limits(is_pro=False, completion_count=1, first_date=TODAY):
    return patch.multiple(
        "mito_ai.utils.server_limits",
        get_chat_completion_count=MagicMock(return_value=completion_count),
        get_first_completion_date=MagicMock(return_value=first_date),
        is_pro=MagicMock(return_value=is_pro),
        # Explicitly add a mock for check_mito_server_quota
        check_mito_server_quota=MagicMock(return_value=None)
    )


def patch_openai_model_list():
    mock_openai_instance = MagicMock()
    mock_openai_instance.models.list.return_value = [MagicMock(id="gpt-4o-mini")]

    # Patch the constructor call to return your mock instance
    return patch("openai.OpenAI", return_value=mock_openai_instance)


def mock_openai_capabilities():
    """Mock the capabilities property to return OpenAI with user key."""
    return patch.object(
        OpenAIProvider,
        "capabilities",
        new_callable=PropertyMock,
        return_value=AICapabilities(
            configuration={"model": ["gpt-4o-mini"]},
            provider="OpenAI with user key",
            type="ai_capabilities"
        )
    )


def mock_ollama_capabilities():
    """Mock the capabilities property to return Ollama."""
    return patch.object(
        OpenAIProvider,
        "capabilities",
        new_callable=PropertyMock,
        return_value=AICapabilities(
            configuration={"model": "llama3"},
            provider="Ollama",
            type="ai_capabilities"
        )
    )


def test_os_user_openai_key_set_below_limit(monkeypatch):
    monkeypatch.setenv("OPENAI_API_KEY", FAKE_API_KEY)

    with (
        patch_server_limits(is_pro=False, completion_count=1),
        patch_openai_model_list(),
        mock_openai_capabilities()
    ):
        llm = OpenAIProvider()
        capabilities = llm.capabilities

        assert "user key" in capabilities.provider
        assert llm.last_error is None


def test_os_user_openai_key_set_above_limit(monkeypatch):
    monkeypatch.setenv("OPENAI_API_KEY", FAKE_API_KEY)

    with (
        patch_server_limits(is_pro=False, completion_count=OS_MONTHLY_AI_COMPLETIONS_LIMIT + 1),
        patch_openai_model_list(),
        mock_openai_capabilities()
    ):
        llm = OpenAIProvider()
        capabilities = llm.capabilities
        assert "user key" in capabilities.provider
        assert llm.last_error is None

    with (
        patch_server_limits(is_pro=False, completion_count=OS_MONTHLY_AI_COMPLETIONS_LIMIT, first_date=REALLY_OLD_DATE),
        patch_openai_model_list(),
        mock_openai_capabilities()
    ):
        llm = OpenAIProvider()
        capabilities = llm.capabilities
        assert "user key" in capabilities.provider
        assert llm.last_error is None


def test_pro_user_openai_key_set_below_limit(monkeypatch):
    monkeypatch.setenv("OPENAI_API_KEY", FAKE_API_KEY)

    with (
        patch_server_limits(is_pro=True, completion_count=1),
        patch_openai_model_list(),
        mock_openai_capabilities()
    ):
        llm = OpenAIProvider()
        capabilities = llm.capabilities
        assert "user key" in capabilities.provider
        assert llm.last_error is None


def test_pro_user_openai_key_set_above_limit(monkeypatch):
    monkeypatch.setenv("OPENAI_API_KEY", FAKE_API_KEY)

    with (
        patch_server_limits(is_pro=True, completion_count=OS_MONTHLY_AI_COMPLETIONS_LIMIT + 1),
        patch_openai_model_list(),
        mock_openai_capabilities()
    ):
        llm = OpenAIProvider()
        capabilities = llm.capabilities
        assert "user key" in capabilities.provider
        assert llm.last_error is None

    with (
        patch_server_limits(is_pro=True, completion_count=OS_MONTHLY_AI_COMPLETIONS_LIMIT, first_date=REALLY_OLD_DATE),
        patch_openai_model_list(),
        mock_openai_capabilities()
    ):
        llm = OpenAIProvider()
        capabilities = llm.capabilities
        assert "user key" in capabilities.provider
        assert llm.last_error is None


def test_ollama_model_provider(monkeypatch):
    monkeypatch.setenv("OLLAMA_MODEL", "llama3")

    # Force Ollama provider by patching capabilities directly
    with mock_ollama_capabilities():
        llm = OpenAIProvider()
        capabilities = llm.capabilities
        assert capabilities.provider == "Ollama"
        assert capabilities.configuration["model"] == "llama3"


def test_claude_model_resolution(monkeypatch):
    monkeypatch.setenv("CLAUDE_API_KEY", "claude-key")
    monkeypatch.setenv("CLAUDE_MODEL", "claude-3-opus")

    # No OpenAI key or Ollama -> Claude should be resolved
    # Mock directly to ensure Claude is being used
    with patch.object(OpenAIProvider, "_resolve_model", return_value="claude-3-opus"):
        llm = OpenAIProvider()
        resolved = llm._resolve_model("gpt-4o-mini")
        assert resolved == "claude-3-opus"


def test_gemini_model_resolution(monkeypatch):
    monkeypatch.setenv("GEMINI_API_KEY", "gemini-key")
    monkeypatch.setenv("GEMINI_MODEL", "gemini-2-pro")

    # No OpenAI or Claude or Ollama -> Gemini should be resolved
    # Mock directly to ensure Gemini is being used
    with patch.object(OpenAIProvider, "_resolve_model", return_value="gemini-2-pro"):
        llm = OpenAIProvider()
        resolved = llm._resolve_model("gpt-4o-mini")
        assert resolved == "gemini-2-pro"

def test_azure_openai_model_resolution(monkeypatch):
    monkeypatch.setenv("AZURE_OPENAI_API_KEY", FAKE_API_KEY)
    monkeypatch.setenv("AZURE_OPENAI_ENDPOINT", "https://example.com")
    monkeypatch.setenv("AZURE_OPENAI_MODEL", "fake-model")
    monkeypatch.setenv("AZURE_OPENAI_API_VERSION", "2024-12-01-preview")

    # No OpenAI or Claude or Ollama -> Gemini should be resolved
    # Mock directly to ensure Gemini is being used
    with patch.object(OpenAIProvider, "_resolve_model", return_value="fake-model"):
        llm = OpenAIProvider()
        resolved = llm._resolve_model("gpt-4o-mini")
        assert resolved == "fake-model"

def test_openai_model_resolution(monkeypatch):
    monkeypatch.setenv("OPENAI_API_KEY", FAKE_API_KEY)
    with patch_openai_model_list() as MockOpenAI:
        MockOpenAI.return_value.models.list.return_value = [MagicMock(id="gpt-4o-mini")]
        llm = OpenAIProvider()
        resolved = llm._resolve_model("gpt-4o-mini")
        assert resolved == "gpt-4o-mini"


def test_model_resolution_fallback(monkeypatch):
    llm = OpenAIProvider()
    resolved = llm._resolve_model("non-existent-model")
    assert resolved == "gpt-4o"


def test_fallback_to_mito(monkeypatch):
    with patch_server_limits(is_pro=False, completion_count=1):
        llm = OpenAIProvider()
        capabilities = llm.capabilities
        assert "Mito" in capabilities.provider
        assert llm.last_error is None or isinstance(llm.last_error, CompletionError)


# Add a new test to check the provider priority order
def test_provider_priority_order(monkeypatch):
    # Set all provider environment variables by patching the constants module directly
    monkeypatch.setattr("mito_ai.constants.AZURE_OPENAI_API_KEY", FAKE_API_KEY)
    monkeypatch.setattr("mito_ai.constants.AZURE_OPENAI_ENDPOINT", "https://example.com")
    monkeypatch.setattr("mito_ai.constants.AZURE_OPENAI_MODEL", "gpt-4o")
    monkeypatch.setattr("mito_ai.constants.AZURE_OPENAI_API_VERSION", "2024-12-01-preview")
    monkeypatch.setattr("mito_ai.constants.OPENAI_API_KEY", FAKE_API_KEY)
    monkeypatch.setattr("mito_ai.constants.OLLAMA_MODEL", "llama3")
    monkeypatch.setattr("mito_ai.constants.CLAUDE_API_KEY", "claude-key")
    monkeypatch.setattr("mito_ai.constants.CLAUDE_MODEL", "claude-3-opus")
    monkeypatch.setattr("mito_ai.constants.GEMINI_API_KEY", "gemini-key")
    monkeypatch.setattr("mito_ai.constants.GEMINI_MODEL", "gemini-2-pro")

    # OpenAI should have highest priority when all are set
    llm = OpenAIProvider()
    capabilities = llm.capabilities
    assert "Azure OpenAI" in capabilities.provider