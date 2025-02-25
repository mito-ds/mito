import os
from datetime import datetime
from unittest.mock import patch
from mito_ai.providers import OpenAIProvider
from mito_ai.utils.open_ai_utils import OPEN_SOURCE_AI_COMPLETIONS_LIMIT

REALLY_OLD_DATE = "2020-01-01"
TODAY = datetime.now().strftime("%Y-%m-%d")


def test_os_user_mito_server_below_limit() -> None:
    """
    Open source user, with no OpenAI API key set (Mito server), below both limits.
    No error should be thrown.
    """

    llm = OpenAIProvider()

    with (
        patch.dict(os.environ, {"OPENAI_API_KEY": ""}),
        patch("mito_ai.utils.open_ai_utils.get_completion_count", return_value=1),
        patch("mito_ai.utils.open_ai_utils.get_first_completion_date", return_value=TODAY)
    ):
        capabilities = llm.capabilities

        assert capabilities.provider == "Mito server"
        assert llm.last_error is None


def test_os_user_mito_server_above_limit() -> None:
    """
    Open source user, with no OpenAI API key set (Mito server), above both limits.
    An error should be thrown.
    """

    llm = OpenAIProvider()

    # Above the chat limit
    with (
        patch.dict(os.environ, {"OPENAI_API_KEY": ""}),
        patch("mito_ai.utils.open_ai_utils.get_completion_count", return_value=OPEN_SOURCE_AI_COMPLETIONS_LIMIT + 1),
        patch("mito_ai.utils.open_ai_utils.get_first_completion_date", return_value=TODAY),
    ):
        capabilities = llm.capabilities

        assert capabilities.provider == "Mito server"
        assert llm.last_error is not None
        assert llm.last_error.title == "mito_server_free_tier_limit_reached"

    # Above the inline limit
    with (
        patch.dict(os.environ, {"OPENAI_API_KEY": ""}),
        patch("mito_ai.utils.open_ai_utils.get_completion_count", return_value=OPEN_SOURCE_AI_COMPLETIONS_LIMIT),
        patch("mito_ai.utils.open_ai_utils.get_first_completion_date", return_value=REALLY_OLD_DATE),
    ):
        capabilities = llm.capabilities

        assert capabilities.provider == "Mito server"
        assert llm.last_error is not None
        assert llm.last_error.title == "mito_server_free_tier_limit_reached"


def test_os_user_openai_key_set_below_limit() -> None:
    """
    Open source user, with OpenAI API key set, below both limits.
    No error should be thrown.
    """

    llm = OpenAIProvider()

    with (
        patch("mito_ai.utils.open_ai_utils.get_completion_count", return_value=1),
        patch("mito_ai.utils.open_ai_utils.get_first_completion_date", return_value=TODAY),
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
        patch("mito_ai.utils.open_ai_utils.get_completion_count", return_value=OPEN_SOURCE_AI_COMPLETIONS_LIMIT + 1),
        patch("mito_ai.utils.open_ai_utils.get_first_completion_date", return_value=TODAY),
    ):
        capabilities = llm.capabilities

        assert "user key" in capabilities.provider
        assert llm.last_error is None

    # Above the inline limit
    with (
        patch("mito_ai.utils.open_ai_utils.get_completion_count", return_value=OPEN_SOURCE_AI_COMPLETIONS_LIMIT),
        patch("mito_ai.utils.open_ai_utils.get_first_completion_date", return_value=REALLY_OLD_DATE),
    ):
        capabilities = llm.capabilities

        assert "user key" in capabilities.provider
        assert llm.last_error is None


def test_pro_user_mito_server_set_below_limit() -> None:
    """
    Pro user, with no OpenAI API key set (Mito server), below chat limit.
    No error should be thrown.
    """

    llm = OpenAIProvider()

    with (
        patch.dict(os.environ, {"OPENAI_API_KEY": ""}),
        patch("mito_ai.utils.open_ai_utils.get_completion_count", return_value=1),
        patch("mito_ai.utils.open_ai_utils.get_first_completion_date", return_value=TODAY),
        patch("mito_ai.utils.open_ai_utils.is_pro", return_value=True),
    ):
        capabilities = llm.capabilities

        assert capabilities.provider == "Mito server"
        assert llm.last_error is None


def test_pro_user_mito_server_above_limit() -> None:
    """
    Pro user, with no OpenAI API key set (Mito server), with usage above both limits.
    No error should be thrown since pro users don't have limits.
    """

    llm = OpenAIProvider()

    # Above the chat limit
    with (
        patch.dict(os.environ, {"OPENAI_API_KEY": ""}),
        patch("mito_ai.utils.open_ai_utils.get_completion_count", return_value=OPEN_SOURCE_AI_COMPLETIONS_LIMIT + 1),
        patch("mito_ai.utils.open_ai_utils.get_first_completion_date", return_value=TODAY),
        patch("mito_ai.utils.open_ai_utils.is_pro", return_value=True),
    ):
        capabilities = llm.capabilities
        assert capabilities.provider == "Mito server"
        assert llm.last_error is None

    # Above the inline limit
    with (
        patch.dict(os.environ, {"OPENAI_API_KEY": ""}),
        patch("mito_ai.utils.open_ai_utils.get_completion_count", return_value=OPEN_SOURCE_AI_COMPLETIONS_LIMIT),
        patch("mito_ai.utils.open_ai_utils.get_first_completion_date", return_value=REALLY_OLD_DATE),
        patch("mito_ai.utils.open_ai_utils.is_pro", return_value=True),
    ):
        capabilities = llm.capabilities
        assert capabilities.provider == "Mito server"
        assert llm.last_error is None


def test_pro_user_openai_key_set_below_limit() -> None:
    """
    Pro user, with OpenAI API key set, below chat limit.
    No error should be thrown.
    """

    llm = OpenAIProvider()

    with (
        patch("mito_ai.utils.open_ai_utils.get_completion_count", return_value=1),
        patch("mito_ai.utils.open_ai_utils.get_first_completion_date", return_value=TODAY),
        patch("mito_ai.utils.open_ai_utils.is_pro", return_value=True),
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
        patch("mito_ai.utils.open_ai_utils.get_completion_count", return_value=OPEN_SOURCE_AI_COMPLETIONS_LIMIT + 1),
        patch("mito_ai.utils.open_ai_utils.get_first_completion_date", return_value=TODAY),
        patch("mito_ai.utils.open_ai_utils.is_pro", return_value=True),
    ):
        capabilities = llm.capabilities

        assert "user key" in capabilities.provider
        assert llm.last_error is None

    # Above the inline limit
    with (
        patch("mito_ai.utils.open_ai_utils.get_completion_count", return_value=OPEN_SOURCE_AI_COMPLETIONS_LIMIT),
        patch("mito_ai.utils.open_ai_utils.get_first_completion_date", return_value=REALLY_OLD_DATE),
        patch("mito_ai.utils.open_ai_utils.is_pro", return_value=True),
    ):
        capabilities = llm.capabilities

        assert "user key" in capabilities.provider
        assert llm.last_error is None
