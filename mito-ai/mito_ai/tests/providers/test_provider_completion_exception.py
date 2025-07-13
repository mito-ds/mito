# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

from mito_ai.utils.mito_server_utils import ProviderCompletionException
import pytest


class TestProviderCompletionException:
    """Test the ProviderCompletionException class."""
    
    @pytest.mark.parametrize("error_message,provider_name,error_type,expected_title,expected_hint_contains", [
        (
            "Something went wrong", 
            "LLM Provider", 
            "LLMProviderError",
            "LLM Provider Error: Something went wrong",
            "LLM Provider"
        ),
        (
            "API key is invalid",
            "OpenAI", 
            "AuthenticationError",
            "OpenAI Error: API key is invalid",
            "OpenAI"
        ),
        (
            "There was an error accessing the Anthropic API: Error code: 529 - {'type': 'error', 'error': {'type': 'overloaded_error', 'message': 'Overloaded'}}",
            "Anthropic",
            "LLMProviderError",
            "Anthropic Error: There was an error accessing the Anthropic API: Error code: 529 - {'type': 'error', 'error': {'type': 'overloaded_error', 'message': 'Overloaded'}}",
            "Anthropic"
        ),
    ])
    def test_exception_initialization(
        self, 
        error_message: str, 
        provider_name: str, 
        error_type: str,
        expected_title: str,
        expected_hint_contains: str
    ):
        """Test exception initialization with various parameter combinations."""
        exception = ProviderCompletionException(
            error_message, 
            provider_name=provider_name, 
            error_type=error_type
        )
        
        assert exception.error_message == error_message
        assert exception.provider_name == provider_name
        assert exception.error_type == error_type
        assert exception.user_friendly_title == expected_title
        assert expected_hint_contains in exception.user_friendly_hint
        assert str(exception) == expected_title
        assert exception.args[0] == expected_title
    
    def test_default_initialization(self):
        """Test exception initialization with default values."""
        error_msg = "Something went wrong"
        exception = ProviderCompletionException(error_msg)
        
        assert exception.error_message == error_msg
        assert exception.provider_name == "LLM Provider"
        assert exception.error_type == "LLMProviderError"
        assert exception.user_friendly_title == "LLM Provider Error: Something went wrong"
        assert "LLM Provider" in exception.user_friendly_hint
