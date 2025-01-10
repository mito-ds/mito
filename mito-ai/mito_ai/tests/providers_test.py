import pytest
from datetime import datetime
from unittest.mock import patch
import os
from unittest.mock import mock_open
from mito_ai.providers import OpenAIProvider

CHAT_LIMIT = 500


def test_os_user_mito_server_below_limit():
    """
    Open source user, with no OpenAI API key set (Mito server), below both limits.
    No error should be thrown.
    """

    llm = OpenAIProvider()
    today = datetime.now().strftime("%Y-%m-%d")

    with (
        patch.dict(os.environ, {"OPENAI_API_KEY": ""}),
        patch("mito_ai.providers._num_usages", 1),
        patch("mito_ai.providers._first_usage_date", today),
    ):
        capabilities = llm.capabilities

        assert capabilities.provider == "Mito server"
        assert llm.last_error is None


def test_os_user_mito_server_above_limit():
    """
    Open source user, with no OpenAI API key set (Mito server), above chat limit.
    An error should be thrown.
    """

    llm = OpenAIProvider()
    today = datetime.now().strftime("%Y-%m-%d")

    with (
        patch.dict(os.environ, {"OPENAI_API_KEY": ""}),
        patch("mito_ai.providers._num_usages", CHAT_LIMIT + 1),
        patch("mito_ai.providers._first_usage_date", today),
    ):
        capabilities = llm.capabilities

        assert capabilities.provider == "Mito server"
        assert llm.last_error is not None
        assert llm.last_error.title == "mito_server_free_tier_limit_reached"


def test_os_user_openai_key_set_below_limit():
    """
    Open source user, with OpenAI API key set, below both limits.
    No error should be thrown.
    """

    llm = OpenAIProvider()
    today = datetime.now().strftime("%Y-%m-%d")

    with (
        patch("mito_ai.providers._num_usages", 1),
        patch("mito_ai.providers._first_usage_date", today),
    ):
        capabilities = llm.capabilities

        assert "user key" in capabilities.provider
        assert llm.last_error is None


def test_os_user_openai_key_set_above_limit():
    """
    Open source user, with OpenAI API key set, above chat limit.
    No error should be thrown, since the user is using their own key.
    """

    llm = OpenAIProvider()
    today = datetime.now().strftime("%Y-%m-%d")

    with (
        patch("mito_ai.providers._num_usages", CHAT_LIMIT + 1),
        patch("mito_ai.providers._first_usage_date", today),
    ):
        capabilities = llm.capabilities

        assert "user key" in capabilities.provider
        assert llm.last_error is None
