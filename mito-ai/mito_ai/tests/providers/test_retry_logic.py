import pytest
import asyncio
from unittest.mock import AsyncMock, MagicMock, patch
from mito_ai.completions.providers import OpenAIProvider
from mito_ai.completions.models import MessageType, CompletionError
from mito_ai.utils.mito_server_utils import ProviderCompletionException
from mito_ai.tests.providers.utils import mock_openai_client, patch_server_limits
from traitlets.config import Config

FAKE_API_KEY = "sk-1234567890"

@pytest.fixture
def provider_config() -> Config:
    """Create a proper Config object for the OpenAIProvider."""
    config = Config()
    config.OpenAIProvider = Config()
    config.OpenAIClient = Config()
    return config

@pytest.fixture
def mock_messages():
    """Sample messages for testing."""
    return [{"role": "user", "content": "Test message"}]

@pytest.fixture
def mock_sleep():
    """Mock asyncio.sleep to avoid delays in tests."""
    with patch("asyncio.sleep", new_callable=AsyncMock) as mock:
        yield mock

class TestRetryLogic:
    """Test retry logic in OpenAIProvider.request_completions."""

    @pytest.mark.parametrize("attempts_before_success,max_retries,expected_call_count", [
        (0, 3, 1),  # Success on first try
        (1, 3, 2),  # Success after 1 retry
        (2, 3, 3),  # Success after 2 retries
        (3, 3, 4),  # Success on final try
    ])
    @pytest.mark.asyncio
    async def test_success_after_retries(
        self, 
        attempts_before_success: int, 
        max_retries: int, 
        expected_call_count: int,
        provider_config: Config,
        mock_messages,
        mock_sleep,
        monkeypatch: pytest.MonkeyPatch
    ):
        """Test that request_completions succeeds after a certain number of retries."""
        monkeypatch.setenv("OPENAI_API_KEY", FAKE_API_KEY)
        monkeypatch.setattr("mito_ai.constants.OPENAI_API_KEY", FAKE_API_KEY)
        
        # Create side effect: fail N times, then succeed
        side_effects = [Exception("Test error")] * attempts_before_success + ["Success!"]
        
        with (
            patch_server_limits(),
            mock_openai_client() as mock_client
        ):
            mock_client.return_value.request_completions = AsyncMock(side_effect=side_effects)
            
            provider = OpenAIProvider(config=provider_config)
            
            # Test successful completion
            result = await provider.request_completions(
                message_type=MessageType.CHAT,
                messages=mock_messages,
                model="gpt-4o-mini",
                max_retries=max_retries
            )
            
            assert result == "Success!"
            assert mock_client.return_value.request_completions.call_count == expected_call_count
            assert provider.last_error is None  # Should be reset on success
            
            # Verify sleep was called for retries
            assert mock_sleep.call_count == attempts_before_success

    @pytest.mark.parametrize("exception_type,max_retries,expected_call_count", [
        (ProviderCompletionException, 3, 4),  # Retry ProviderCompletionException
        (Exception, 3, 4),  # Retry generic Exception
        (RuntimeError, 3, 4),  # Retry RuntimeError
        (ValueError, 2, 3),  # Retry ValueError with different max_retries
    ])
    @pytest.mark.asyncio
    async def test_failure_after_all_retries(
        self, 
        exception_type, 
        max_retries: int, 
        expected_call_count: int,
        provider_config: Config,
        mock_messages,
        mock_sleep,
        monkeypatch: pytest.MonkeyPatch
    ):
        """Test that request_completions fails after exhausting all retries."""
        monkeypatch.setenv("OPENAI_API_KEY", FAKE_API_KEY)
        monkeypatch.setattr("mito_ai.constants.OPENAI_API_KEY", FAKE_API_KEY)
        
        # Create exception instance
        if exception_type == ProviderCompletionException:
            test_exception = ProviderCompletionException("Test provider error")
        else:
            test_exception = exception_type("Test error")
        
        with (
            patch_server_limits(),
            mock_openai_client() as mock_client
        ):
            mock_client.return_value.request_completions = AsyncMock(side_effect=test_exception)
            
            provider = OpenAIProvider(config=provider_config)
            
            # Test failure after all retries
            with pytest.raises(exception_type):
                await provider.request_completions(
                    message_type=MessageType.CHAT,
                    messages=mock_messages,
                    model="gpt-4o-mini",
                    max_retries=max_retries
                )
            
            assert mock_client.return_value.request_completions.call_count == expected_call_count
            assert provider.last_error is not None  # Should be set on final failure
            assert isinstance(provider.last_error, CompletionError)
            
            # Verify sleep was called for retries (max_retries times)
            assert mock_sleep.call_count == max_retries

    @pytest.mark.asyncio
    async def test_mixed_exception_types(
        self, 
        provider_config: Config,
        mock_messages,
        mock_sleep,
        monkeypatch: pytest.MonkeyPatch
    ):
        """Test handling of different exception types across retry attempts."""
        monkeypatch.setenv("OPENAI_API_KEY", FAKE_API_KEY)
        monkeypatch.setattr("mito_ai.constants.OPENAI_API_KEY", FAKE_API_KEY)
        
        # Different exceptions on different attempts
        side_effects = [
            Exception("Generic error"),
            ProviderCompletionException("Provider error"),
            RuntimeError("Runtime error"),
            "Success!"
        ]
        
        with (
            patch_server_limits(),
            mock_openai_client() as mock_client
        ):
            mock_client.return_value.request_completions = AsyncMock(side_effect=side_effects)
            
            provider = OpenAIProvider(config=provider_config)
            
            # Should succeed after 3 retries with mixed exceptions
            result = await provider.request_completions(
                message_type=MessageType.CHAT,
                messages=mock_messages,
                model="gpt-4o-mini",
                max_retries=3
            )
            
            assert result == "Success!"
            assert mock_client.return_value.request_completions.call_count == 4
            assert provider.last_error is None  # Should be reset on success
            assert mock_sleep.call_count == 3  # Called for each retry

    @pytest.mark.asyncio
    async def test_last_error_reset_on_success(
        self, 
        provider_config: Config,
        mock_messages,
        mock_sleep,
        monkeypatch: pytest.MonkeyPatch
    ):
        """Test that last_error is reset when request succeeds after previous failure."""
        monkeypatch.setenv("OPENAI_API_KEY", FAKE_API_KEY)
        monkeypatch.setattr("mito_ai.constants.OPENAI_API_KEY", FAKE_API_KEY)
        
        with (
            patch_server_limits(),
            mock_openai_client() as mock_client
        ):
            provider = OpenAIProvider(config=provider_config)
            
            # First request fails to set an error
            mock_client.return_value.request_completions = AsyncMock(side_effect=Exception("First error"))
            
            with pytest.raises(Exception):
                await provider.request_completions(
                    message_type=MessageType.CHAT,
                    messages=mock_messages,
                    model="gpt-4o-mini",
                    max_retries=0  # No retries to fail quickly
                )
            
            # Verify error was set
            assert provider.last_error is not None
            
            # Second request succeeds
            mock_client.return_value.request_completions = AsyncMock(return_value="Success!")
            
            result = await provider.request_completions(
                message_type=MessageType.CHAT,
                messages=mock_messages,
                model="gpt-4o-mini",
                max_retries=3
            )
            
            assert result == "Success!"
            assert provider.last_error is None  # Should be reset

    @pytest.mark.asyncio
    async def test_no_retries_when_max_retries_zero(
        self, 
        provider_config: Config,
        mock_messages,
        mock_sleep,
        monkeypatch: pytest.MonkeyPatch
    ):
        """Test that no retries happen when max_retries=0."""
        monkeypatch.setenv("OPENAI_API_KEY", FAKE_API_KEY)
        monkeypatch.setattr("mito_ai.constants.OPENAI_API_KEY", FAKE_API_KEY)
        
        with (
            patch_server_limits(),
            mock_openai_client() as mock_client
        ):
            mock_client.return_value.request_completions = AsyncMock(side_effect=Exception("Test error"))
            
            provider = OpenAIProvider(config=provider_config)
            
            # Should fail immediately with no retries
            with pytest.raises(Exception):
                await provider.request_completions(
                    message_type=MessageType.CHAT,
                    messages=mock_messages,
                    model="gpt-4o-mini",
                    max_retries=0
                )
            
            assert mock_client.return_value.request_completions.call_count == 1
            assert mock_sleep.call_count == 0  # No retries, no sleep calls
            assert provider.last_error is not None

    @pytest.mark.asyncio
    async def test_provider_completion_exception_details(
        self, 
        provider_config: Config,
        mock_messages,
        mock_sleep,
        monkeypatch: pytest.MonkeyPatch
    ):
        """Test that ProviderCompletionException details are preserved in last_error."""
        monkeypatch.setenv("OPENAI_API_KEY", FAKE_API_KEY)
        monkeypatch.setattr("mito_ai.constants.OPENAI_API_KEY", FAKE_API_KEY)
        
        error_message = "Server returned an error: Rate limit exceeded"
        provider_exception = ProviderCompletionException(error_message)
        
        with (
            patch_server_limits(),
            mock_openai_client() as mock_client
        ):
            mock_client.return_value.request_completions = AsyncMock(side_effect=provider_exception)
            
            provider = OpenAIProvider(config=provider_config)
            
            # Should fail after retries
            with pytest.raises(ProviderCompletionException):
                await provider.request_completions(
                    message_type=MessageType.CHAT,
                    messages=mock_messages,
                    model="gpt-4o-mini",
                    max_retries=2
                )
            
            assert provider.last_error is not None
            assert isinstance(provider.last_error, CompletionError)
            assert error_message in provider.last_error.title
