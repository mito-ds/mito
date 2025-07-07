# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

import pytest
import json
import time
from unittest.mock import MagicMock, patch, AsyncMock
from tornado.httpclient import HTTPResponse

from mito_ai.utils.mito_server_utils import (
    ProviderCompletionException,
    get_response_from_mito_server
)
from mito_ai.completions.models import MessageType


@pytest.fixture
def mock_request_params():
    """Standard request parameters for testing."""
    return {
        "url": "https://api.example.com",
        "headers": {"Content-Type": "application/json"},
        "data": {"query": "test query"},
        "timeout": 30,
        "max_retries": 3,
        "message_type": MessageType.CHAT,
        "provider_name": "Test Provider"
    }


@pytest.fixture
def mock_http_dependencies():
    """Mock the HTTP client and related dependencies."""
    with patch('mito_ai.utils.mito_server_utils._create_http_client') as mock_create_client, \
         patch('mito_ai.utils.mito_server_utils.update_mito_server_quota') as mock_update_quota, \
         patch('mito_ai.utils.mito_server_utils.check_mito_server_quota') as mock_check_quota, \
         patch('mito_ai.utils.mito_server_utils.time.time') as mock_time:
        
        # Setup mock HTTP client
        mock_http_client = MagicMock()
        mock_create_client.return_value = (mock_http_client, 30)
        
        # Setup mock time
        mock_time.side_effect = [0.0, 1.5]  # start_time, end_time
        
        yield {
            'mock_check_quota': mock_check_quota,
            'mock_create_client': mock_create_client,
            'mock_http_client': mock_http_client,
            'mock_update_quota': mock_update_quota,
            'mock_time': mock_time
        }


def create_mock_response(body_content: dict):
    """Helper to create mock HTTP response."""
    mock_response = MagicMock(spec=HTTPResponse)
    mock_response.body.decode.return_value = json.dumps(body_content)
    return mock_response


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


class TestGetResponseFromMitoServer:
    """Test the get_response_from_mito_server function."""
    
    @pytest.mark.parametrize("completion_value,message_type", [
        ("This is the AI response", MessageType.CHAT),
        ("Code completion here", MessageType.INLINE_COMPLETION),
        ("", MessageType.CHAT),  # Empty string
        (None, MessageType.INLINE_COMPLETION),  # None value
        ("Multi-line\nresponse\nhere", MessageType.CHAT),  # Multi-line response
    ])
    @pytest.mark.asyncio
    async def test_successful_completion_responses(
        self, 
        completion_value,
        message_type: MessageType,
        mock_request_params,
        mock_http_dependencies
    ):
        """Test successful responses with various completion values."""
        # Setup
        response_body = {"completion": completion_value}
        mock_response = create_mock_response(response_body)
        mock_http_dependencies['mock_http_client'].fetch = AsyncMock(return_value=mock_response)
        
        # Update request params
        mock_request_params["message_type"] = message_type
        
        # Execute
        result = await get_response_from_mito_server(**mock_request_params)
        
        # Verify
        assert result == completion_value
        mock_http_dependencies['mock_check_quota'].assert_called_once_with(message_type)
        mock_http_dependencies['mock_update_quota'].assert_called_once_with(message_type)
        mock_http_dependencies['mock_http_client'].close.assert_called_once()
        
        # Verify HTTP request was made correctly
        mock_http_dependencies['mock_http_client'].fetch.assert_called_once_with(
            mock_request_params["url"],
            method="POST",
            headers=mock_request_params["headers"],
            body=json.dumps(mock_request_params["data"]),
            request_timeout=30
        )
    
    @pytest.mark.parametrize("error_message,provider_name,expected_exception_provider", [
        (
            "There was an error accessing the Anthropic API: Error code: 529 - {'type': 'error', 'error': {'type': 'overloaded_error', 'message': 'Overloaded'}}",
            "Anthropic",
            "Anthropic"
        ),
        (
            "Rate limit exceeded",
            "OpenAI",
            "OpenAI"
        ),
        (
            "Invalid API key",
            "Custom Provider",
            "Custom Provider"
        ),
        (
            "Server timeout",
            "Mito Server",
            "Mito Server"
        ),
    ])
    @pytest.mark.asyncio
    async def test_error_responses_from_server(
        self, 
        error_message: str,
        provider_name: str,
        expected_exception_provider: str,
        mock_request_params,
        mock_http_dependencies
    ):
        """Test server returns error response with various error messages and providers."""
        # Setup
        response_body = {"error": error_message}
        mock_response = create_mock_response(response_body)
        mock_http_dependencies['mock_http_client'].fetch = AsyncMock(return_value=mock_response)
        
        # Update request params
        mock_request_params["provider_name"] = provider_name
        
        # Execute and verify exception
        with pytest.raises(ProviderCompletionException) as exc_info:
            await get_response_from_mito_server(**mock_request_params)
        
        # Verify exception details
        exception = exc_info.value
        assert exception.error_message == error_message
        assert exception.provider_name == expected_exception_provider
        assert f"{expected_exception_provider} Error" in str(exception)
        
        # Verify quota was updated and client was closed
        mock_http_dependencies['mock_update_quota'].assert_called_once_with(mock_request_params["message_type"])
        mock_http_dependencies['mock_http_client'].close.assert_called_once()
    
    @pytest.mark.parametrize("response_body,expected_error_contains", [
        ({"some_other_field": "value"}, "No completion found in response"),
        ({"data": "value", "status": "ok"}, "No completion found in response"),
        ({}, "No completion found in response"),
        ({"completion": None, "error": "also present"}, None),  # completion takes precedence
    ])
    @pytest.mark.asyncio
    async def test_invalid_response_formats(
        self, 
        response_body: dict,
        expected_error_contains: str,
        mock_request_params,
        mock_http_dependencies
    ):
        """Test responses with invalid formats."""
        # Setup
        mock_response = create_mock_response(response_body)
        mock_http_dependencies['mock_http_client'].fetch = AsyncMock(return_value=mock_response)
        
        if "completion" in response_body:
            # This should succeed because completion field exists
            result = await get_response_from_mito_server(**mock_request_params)
            assert result == response_body["completion"]
            mock_http_dependencies['mock_update_quota'].assert_called_once()
        else:
            # Execute and verify exception
            with pytest.raises(ProviderCompletionException) as exc_info:
                await get_response_from_mito_server(**mock_request_params)
            
            # Verify exception details
            exception = exc_info.value
            assert expected_error_contains in exception.error_message
            assert str(response_body) in exception.error_message
            assert exception.provider_name == mock_request_params["provider_name"]
            
            # Verify quota was NOT updated
            mock_http_dependencies['mock_update_quota'].assert_called_once_with(mock_request_params["message_type"])
        
        # Client should always be closed
        mock_http_dependencies['mock_http_client'].close.assert_called_once()
    
    @pytest.mark.parametrize("invalid_json_content,expected_error_contains", [
        ("invalid json content", "Error parsing response"),
        ('{"incomplete": json', "Error parsing response"),
        ("", "Error parsing response"),
        ('{"malformed":', "Error parsing response"),
    ])
    @pytest.mark.asyncio
    async def test_json_parsing_errors(
        self, 
        invalid_json_content: str,
        expected_error_contains: str,
        mock_request_params,
        mock_http_dependencies
    ):
        """Test response with invalid or malformed JSON."""
        # Setup
        mock_response = MagicMock(spec=HTTPResponse)
        mock_response.body.decode.return_value = invalid_json_content
        mock_http_dependencies['mock_http_client'].fetch = AsyncMock(return_value=mock_response)
        
        # Execute and verify exception
        with pytest.raises(ProviderCompletionException) as exc_info:
            await get_response_from_mito_server(**mock_request_params)
        
        # Verify exception details
        exception = exc_info.value
        assert expected_error_contains in exception.error_message
        assert exception.provider_name == mock_request_params["provider_name"]
        
        # Verify quota was updated and client was closed
        mock_http_dependencies['mock_update_quota'].assert_called_once_with(mock_request_params["message_type"])
        mock_http_dependencies['mock_http_client'].close.assert_called_once()
    
    @pytest.mark.parametrize("timeout,max_retries", [
        (30, 3),
        (45, 5),
        (60, 1),
        (15, 0),
    ])
    @pytest.mark.asyncio
    async def test_http_client_creation_parameters(
        self, 
        timeout: int,
        max_retries: int,
        mock_request_params,
        mock_http_dependencies
    ):
        """Test that HTTP client is created with correct parameters."""
        # Setup
        response_body = {"completion": "test response"}
        mock_response = create_mock_response(response_body)
        mock_http_dependencies['mock_http_client'].fetch = AsyncMock(return_value=mock_response)
        
        # Update request params
        mock_request_params["timeout"] = timeout
        mock_request_params["max_retries"] = max_retries
        
        # Execute
        await get_response_from_mito_server(**mock_request_params)
        
        # Verify HTTP client creation
        mock_http_dependencies['mock_create_client'].assert_called_once_with(timeout, max_retries)
    
    @pytest.mark.parametrize("exception_type,exception_message", [
        (Exception, "Network error"),
        (ConnectionError, "Connection failed"),
        (TimeoutError, "Request timed out"),
        (RuntimeError, "Runtime error occurred"),
    ])
    @pytest.mark.asyncio
    async def test_http_client_always_closed_on_exception(
        self, 
        exception_type,
        exception_message: str,
        mock_request_params,
        mock_http_dependencies
    ):
        """Test that HTTP client is always closed even when exceptions occur."""
        # Setup - make fetch raise an exception
        test_exception = exception_type(exception_message)
        mock_http_dependencies['mock_http_client'].fetch = AsyncMock(side_effect=test_exception)
        
        # Execute and expect exception to bubble up
        with pytest.raises(exception_type, match=exception_message):
            await get_response_from_mito_server(**mock_request_params)
        
        # Verify client was still closed despite the exception
        mock_http_dependencies['mock_http_client'].close.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_default_provider_name(self, mock_http_dependencies):
        """Test that default provider name is used when not specified."""
        # Setup
        error_message = "Test error"
        response_body = {"error": error_message}
        mock_response = create_mock_response(response_body)
        mock_http_dependencies['mock_http_client'].fetch = AsyncMock(return_value=mock_response)
        
        # Test data without provider_name parameter
        request_params = {
            "url": "https://api.example.com",
            "headers": {"Content-Type": "application/json"},
            "data": {"query": "test query"},
            "timeout": 30,
            "max_retries": 3,
            "message_type": MessageType.CHAT,
            # Note: not providing provider_name parameter
        }
        
        # Execute and verify exception
        with pytest.raises(ProviderCompletionException) as exc_info:
            await get_response_from_mito_server(**request_params) # type: ignore
        
        # Verify default provider name is used
        exception = exc_info.value
        assert exception.provider_name == "Mito Server"
        assert "Mito Server Error" in str(exception)
    
    @pytest.mark.asyncio
    async def test_provider_completion_exception_reraised(self, mock_request_params, mock_http_dependencies):
        """Test that ProviderCompletionException is re-raised correctly during JSON parsing."""
        # Setup - simulate ProviderCompletionException during JSON parsing
        mock_response = MagicMock(spec=HTTPResponse)
        mock_response.body.decode.return_value = "some json content"  # This will trigger json.loads
        
        def mock_json_loads(content, **kwargs):
            raise ProviderCompletionException("Custom parsing error", "Custom Provider")
        
        mock_http_dependencies['mock_http_client'].fetch = AsyncMock(return_value=mock_response)
        
        with patch('mito_ai.utils.mito_server_utils.json.loads', side_effect=mock_json_loads), \
             patch('mito_ai.utils.mito_server_utils.check_mito_server_quota') as mock_check_quota:
            
            # Execute and verify exception
            with pytest.raises(ProviderCompletionException) as exc_info:
                await get_response_from_mito_server(**mock_request_params)
            
            # Verify the original exception is preserved
            exception = exc_info.value
            assert exception.error_message == "Custom parsing error"
            assert exception.provider_name == "Custom Provider"
            
            # Verify quota check was called
            mock_check_quota.assert_called_once_with(mock_request_params["message_type"])
        
        # Verify client was closed
        mock_http_dependencies['mock_http_client'].close.assert_called_once()

    
    @pytest.mark.parametrize("scenario,response_setup,main_exception,quota_exception", [
        ("successful_with_quota_error", {"completion": "Success"}, None, Exception("Quota update failed")),
        ("server_error_with_quota_error", {"error": "Server error"}, ProviderCompletionException, Exception("Quota update failed")),
        ("invalid_format_with_quota_error", {"invalid": "format"}, ProviderCompletionException, RuntimeError("Quota system down")),
        ("success_with_quota_timeout", {"completion": "Success"}, None, TimeoutError("Quota service timeout")),
    ])
    @pytest.mark.asyncio
    async def test_quota_update_exceptions_do_not_interfere(
        self, 
        scenario: str,
        response_setup: dict,
        main_exception,
        quota_exception,
        mock_request_params,
        mock_http_dependencies
    ):
        """Test that quota update exceptions don't interfere with main function logic."""
        # Setup
        mock_response = create_mock_response(response_setup)
        mock_http_dependencies['mock_http_client'].fetch = AsyncMock(return_value=mock_response)
        mock_http_dependencies['mock_update_quota'].side_effect = quota_exception
        
        # Execute
        if main_exception:
            with pytest.raises(main_exception) as exc_info:
                await get_response_from_mito_server(**mock_request_params)
            
            # Verify the original error is preserved, not the quota error
            if "error" in response_setup:
                assert exc_info.value.error_message == response_setup["error"]
        else:
            # Should still succeed despite quota update failure
            result = await get_response_from_mito_server(**mock_request_params)
            assert result == response_setup["completion"]
        
        # Verify quota update was attempted
        mock_http_dependencies['mock_update_quota'].assert_called_once_with(mock_request_params["message_type"])