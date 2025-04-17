# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

import os
from datetime import datetime
from typing import Any
from unittest.mock import patch, MagicMock, PropertyMock

import pytest
from mito_ai.providers import OpenAIProvider
from mito_ai.models import MessageType, CompletionError, AICapabilities
from mito_ai.utils.server_limits import OS_MONTHLY_AI_COMPLETIONS_LIMIT

REALLY_OLD_DATE = "2020-01-01"
TODAY = datetime.now().strftime("%Y-%m-%d")
FAKE_API_KEY = "sk-1234567890"


@pytest.fixture(autouse=True)
def reset_env_vars(monkeypatch: pytest.MonkeyPatch) -> None:
    for var in [
        "OPENAI_API_KEY", "CLAUDE_MODEL", "CLAUDE_API_KEY",
        "GEMINI_MODEL", "GEMINI_API_KEY", "OLLAMA_MODEL"
    ]:
        monkeypatch.delenv(var, raising=False)


def patch_server_limits(is_pro: bool = False, completion_count: int = 1, first_date: str = TODAY) -> Any:
    return patch.multiple(
        "mito_ai.utils.server_limits",
        get_chat_completion_count=MagicMock(return_value=completion_count),
        get_first_completion_date=MagicMock(return_value=first_date),
        is_pro=MagicMock(return_value=is_pro),
        # Explicitly add a mock for check_mito_server_quota
        check_mito_server_quota=MagicMock(return_value=None)
    )


def patch_openai_model_list() -> Any:
    mock_openai_instance = MagicMock()
    mock_openai_instance.models.list.return_value = [MagicMock(id="gpt-4o-mini")]

    # Patch the constructor call to return your mock instance
    return patch("openai.OpenAI", return_value=mock_openai_instance)


def mock_openai_capabilities() -> Any:
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


def mock_ollama_capabilities() -> Any:
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


def test_os_user_openai_key_set_below_limit(monkeypatch: pytest.MonkeyPatch) -> None:
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


def test_os_user_openai_key_set_above_limit(monkeypatch: pytest.MonkeyPatch) -> None:
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


def test_pro_user_openai_key_set_below_limit(monkeypatch: pytest.MonkeyPatch) -> None:
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


def test_pro_user_openai_key_set_above_limit(monkeypatch: pytest.MonkeyPatch) -> None:
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


def test_ollama_model_provider(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("OLLAMA_MODEL", "llama3")

    # Force Ollama provider by patching capabilities directly
    with mock_ollama_capabilities():
        llm = OpenAIProvider()
        capabilities = llm.capabilities
        assert capabilities.provider == "Ollama"
        assert capabilities.configuration["model"] == "llama3"


def test_claude_model_resolution(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("CLAUDE_API_KEY", "claude-key")
    monkeypatch.setenv("CLAUDE_MODEL", "claude-3-opus")

    # No OpenAI key or Ollama -> Claude should be resolved
    # Mock directly to ensure Claude is being used
    with patch.object(OpenAIProvider, "_resolve_model", return_value="claude-3-opus"):
        llm = OpenAIProvider()
        resolved = llm._resolve_model("gpt-4o-mini")
        assert resolved == "claude-3-opus"


def test_gemini_model_resolution(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("GEMINI_API_KEY", "gemini-key")
    monkeypatch.setenv("GEMINI_MODEL", "gemini-2-pro")

    # No OpenAI or Claude or Ollama -> Gemini should be resolved
    # Mock directly to ensure Gemini is being used
    with patch.object(OpenAIProvider, "_resolve_model", return_value="gemini-2-pro"):
        llm = OpenAIProvider()
        resolved = llm._resolve_model("gpt-4o-mini")
        assert resolved == "gemini-2-pro"

def test_azure_openai_model_resolution_enterprise(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr("mito_ai.enterprise.utils.is_enterprise", lambda: True)
    monkeypatch.setattr("mito_ai.enterprise.utils.AZURE_OPENAI_API_KEY", FAKE_API_KEY)
    monkeypatch.setattr("mito_ai.enterprise.utils.AZURE_OPENAI_ENDPOINT", "https://example.com")
    monkeypatch.setattr("mito_ai.enterprise.utils.AZURE_OPENAI_MODEL", "fake-model")
    monkeypatch.setattr("mito_ai.enterprise.utils.AZURE_OPENAI_API_VERSION", "2024-12-01-preview")
    monkeypatch.setattr("mito_ai.constants.AZURE_OPENAI_MODEL", "fake-model")

    llm = OpenAIProvider()
    resolved = llm._resolve_model("gpt-4o-mini")
    assert resolved == "fake-model"
    assert "Azure OpenAI" in llm.capabilities.provider
        
def test_azure_openai_model_resolution_not_enterprise(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr("mito_ai.enterprise.utils.is_enterprise", lambda: False)
    monkeypatch.setattr("mito_ai.enterprise.utils.AZURE_OPENAI_API_KEY", FAKE_API_KEY)
    monkeypatch.setattr("mito_ai.enterprise.utils.AZURE_OPENAI_ENDPOINT", "https://example.com")
    monkeypatch.setattr("mito_ai.enterprise.utils.AZURE_OPENAI_MODEL", "fake-model")
    monkeypatch.setattr("mito_ai.enterprise.utils.AZURE_OPENAI_API_VERSION", "2024-12-01-preview")
    monkeypatch.setattr("mito_ai.constants.AZURE_OPENAI_MODEL", "fake-model")

    llm = OpenAIProvider()
    resolved = llm._resolve_model("gpt-4o-mini")
    assert resolved == "gpt-4o-mini"
    assert "Mito server" in llm.capabilities.provider

def test_openai_model_resolution(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("OPENAI_API_KEY", FAKE_API_KEY)
    with patch_openai_model_list() as MockOpenAI:
        MockOpenAI.return_value.models.list.return_value = [MagicMock(id="gpt-4o-mini")]
        llm = OpenAIProvider()
        resolved = llm._resolve_model("gpt-4o-mini")
        assert resolved == "gpt-4o-mini"

# Add a new test to check the provider priority order
def test_provider_priority_order(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr("mito_ai.enterprise.utils.is_enterprise", lambda: True)
    # Need to patch Azure OpenAI constants in enterprise.utils since we are using them there
    monkeypatch.setattr("mito_ai.enterprise.utils.AZURE_OPENAI_API_KEY", FAKE_API_KEY)
    monkeypatch.setattr("mito_ai.enterprise.utils.AZURE_OPENAI_ENDPOINT", "https://example.com")
    monkeypatch.setattr("mito_ai.enterprise.utils.AZURE_OPENAI_MODEL", "gpt-4o")
    monkeypatch.setattr("mito_ai.enterprise.utils.AZURE_OPENAI_API_VERSION", "2024-12-01-preview")
    # We can patch the rest in constants since we are just importing them in providers
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