# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

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

    @pytest.mark.parametrize("scenario,side_effects,max_retries,expected_retry_logs,expected_error_logs,expected_success_logs", [
        # Scenario 1: Success on first try
        ("immediate_success", ["Success!"], 3, 0, 0, 1),
        
        # Scenario 2: Fail once, then succeed
        ("retry_then_success", [Exception("Test error"), "Success!"], 3, 1, 0, 1),
        
        # Scenario 3: Fail twice, then succeed
        ("retry_twice_then_success", [Exception("Test error"), Exception("Test error"), "Success!"], 3, 2, 0, 1),
        
        # Scenario 4: Fail and never succeed (1 retry)
        ("fail_after_one_retry", [Exception("Test error"), Exception("Test error")], 1, 1, 1, 0),
        
        # Scenario 5: Fail and never succeed (2 retries)
        ("fail_after_two_retries", [Exception("Test error"), Exception("Test error"), Exception("Test error")], 2, 2, 1, 0),
        
        # Scenario 6: Fail and never succeed (3 retries)
        ("fail_after_three_retries", [Exception("Test error"), Exception("Test error"), Exception("Test error"), Exception("Test error")], 3, 3, 1, 0),
    ])
    @pytest.mark.asyncio
    async def test_logging_functions_comprehensive(
        self, 
        scenario: str,
        side_effects: list,
        max_retries: int,
        expected_retry_logs: int,
        expected_error_logs: int,
        expected_success_logs: int,
        provider_config: Config,
        mock_messages,
        mock_sleep,
        monkeypatch: pytest.MonkeyPatch,
        capsys
    ):
        """Test comprehensive logging behavior for all retry scenarios."""
        monkeypatch.setenv("OPENAI_API_KEY", FAKE_API_KEY)
        monkeypatch.setattr("mito_ai.constants.OPENAI_API_KEY", FAKE_API_KEY)
        
        # Clear other API keys to ensure OpenAI path is used
        monkeypatch.delenv("CLAUDE_API_KEY", raising=False)
        monkeypatch.delenv("GEMINI_API_KEY", raising=False)
        monkeypatch.setattr("mito_ai.constants.CLAUDE_API_KEY", None)
        monkeypatch.setattr("mito_ai.constants.GEMINI_API_KEY", None)
        
        # Enable print logs to capture telemetry output
        monkeypatch.setattr("mito_ai.utils.telemetry_utils.PRINT_LOGS", True)
        
        with patch_server_limits():
            # Create a mock OpenAI client that will be used by the provider
            mock_client = MagicMock()
            mock_client.request_completions = AsyncMock(side_effect=side_effects)
            mock_client.key_type = "user"
            
            # Create the provider and set the mock client
            provider = OpenAIProvider(config=provider_config)
            provider._openai_client = mock_client
            
            # Determine if we expect success or failure
            will_succeed = any(isinstance(effect, str) for effect in side_effects)
            
            if will_succeed:
                # Test successful completion
                result = await provider.request_completions(
                    message_type=MessageType.CHAT,
                    messages=mock_messages,
                    model="gpt-4o-mini",
                    max_retries=max_retries
                )
                
                # Verify we got the expected success result
                assert result == "Success!"
                assert provider.last_error is None
            else:
                # Test failure after all retries
                with pytest.raises(Exception):
                    await provider.request_completions(
                        message_type=MessageType.CHAT,
                        messages=mock_messages,
                        model="gpt-4o-mini",
                        max_retries=max_retries
                    )
                
                # Verify error state was set
                assert provider.last_error is not None
                assert isinstance(provider.last_error, CompletionError)
            
            # Capture the printed logs
            captured = capsys.readouterr()
            log_output = captured.out
            
            # Count the different types of logs
            retry_log_count = log_output.count("mito_ai_retry")
            error_log_count = log_output.count("mito_ai_error")
            success_log_count = log_output.count("mito_ai_chat_success")
            
            # Verify logging function calls
            assert retry_log_count == expected_retry_logs, f"Expected {expected_retry_logs} retry logs for scenario '{scenario}', got {retry_log_count}"
            assert error_log_count == expected_error_logs, f"Expected {expected_error_logs} error logs for scenario '{scenario}', got {error_log_count}"
            assert success_log_count == expected_success_logs, f"Expected {expected_success_logs} success logs for scenario '{scenario}', got {success_log_count}"

