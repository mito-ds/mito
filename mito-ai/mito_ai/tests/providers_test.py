import os
from datetime import datetime
from unittest.mock import patch, MagicMock, PropertyMock
from mito_ai.providers import OpenAIProvider
from mito_ai.utils.server_limits import OS_MONTHLY_AI_COMPLETIONS_LIMIT, OS_MONTHLY_AUTOCOMPLETE_LIMIT
from mito_ai.models import MessageType, CompletionError, AICapabilities
from mito_ai.utils.telemetry_utils import MITO_SERVER_FREE_TIER_LIMIT_REACHED

# Constants for testing
REALLY_OLD_DATE = "2020-01-01"
TODAY = datetime.now().strftime("%Y-%m-%d")
FAKE_API_KEY = "sk-1234567890"


def test_os_user_openai_key_set_below_limit() -> None:
    """
    Open source user, with OpenAI API key set, below both limits.
    No error should be thrown.
    """

    llm = OpenAIProvider()

    with (
        patch("mito_ai.utils.server_limits.get_chat_completion_count", return_value=1),
        patch("mito_ai.utils.server_limits.get_first_completion_date", return_value=TODAY),
        patch("mito_ai.utils.server_limits.is_pro", return_value=False),
    ):
        capabilities = llm.capabilities

        assert "user key" in capabilities.provider
        assert llm.last_error is None


def test_os_user_openai_key_set_above_limit() -> None:
    """
    Open source user, with OpenAI API key set, above both limits.
    No error should be thrown, since the user is using their own key.
    """

    llm = OpenAIProvider()

    # Above the chat limit
    with (
        patch("mito_ai.utils.server_limits.get_chat_completion_count", return_value=OS_MONTHLY_AI_COMPLETIONS_LIMIT + 1),
        patch("mito_ai.utils.server_limits.get_first_completion_date", return_value=TODAY),
        patch("mito_ai.utils.server_limits.is_pro", return_value=False),
    ):
        capabilities = llm.capabilities

        assert "user key" in capabilities.provider
        assert llm.last_error is None

    # Above the inline limit
    with (
        patch("mito_ai.utils.server_limits.get_chat_completion_count", return_value=OS_MONTHLY_AI_COMPLETIONS_LIMIT),
        patch("mito_ai.utils.server_limits.get_first_completion_date", return_value=REALLY_OLD_DATE),
        patch("mito_ai.utils.server_limits.is_pro", return_value=False),
    ):
        capabilities = llm.capabilities

        assert "user key" in capabilities.provider
        assert llm.last_error is None


def test_pro_user_openai_key_set_below_limit() -> None:
    """
    Pro user, with OpenAI API key set, below chat limit.
    No error should be thrown.
    """

    llm = OpenAIProvider()

    with (
        patch("mito_ai.utils.server_limits.get_chat_completion_count", return_value=1),
        patch("mito_ai.utils.server_limits.get_first_completion_date", return_value=TODAY),
        patch("mito_ai.utils.server_limits.is_pro", return_value=True),
    ):
        capabilities = llm.capabilities

        assert "user key" in capabilities.provider
        assert llm.last_error is None


def test_pro_user_openai_key_set_above_limit() -> None:
    """
    Pro user, with OpenAI API key set, above both limits.
    No error should be thrown since pro users don't have limits.
    """

    llm = OpenAIProvider()

    # Above the chat limit
    with (
        patch("mito_ai.utils.server_limits.get_chat_completion_count", return_value=OS_MONTHLY_AI_COMPLETIONS_LIMIT + 1),
        patch("mito_ai.utils.server_limits.get_first_completion_date", return_value=TODAY),
        patch("mito_ai.utils.server_limits.is_pro", return_value=True),
    ):
        capabilities = llm.capabilities

        assert "user key" in capabilities.provider
        assert llm.last_error is None

    # Above the inline limit
    with (
        patch("mito_ai.utils.server_limits.get_chat_completion_count", return_value=OS_MONTHLY_AI_COMPLETIONS_LIMIT),
        patch("mito_ai.utils.server_limits.get_first_completion_date", return_value=REALLY_OLD_DATE),
        patch("mito_ai.utils.server_limits.is_pro", return_value=True),
    ):
        capabilities = llm.capabilities

        assert "user key" in capabilities.provider
        assert llm.last_error is None
