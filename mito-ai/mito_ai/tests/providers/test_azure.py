# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

from __future__ import annotations
from typing import Any, List
from unittest.mock import patch, MagicMock, AsyncMock

import pytest
from traitlets.config import Config
from openai.types.chat import ChatCompletionMessageParam

from mito_ai.completions.providers import OpenAIProvider
from mito_ai.completions.models import (
    MessageType,
    AICapabilities,
    CompletionReply,
    CompletionItem,
    ResponseFormatInfo,
    AgentResponse
)
from mito_ai.openai_client import OpenAIClient


FAKE_API_KEY = "sk-1234567890"
FAKE_AZURE_ENDPOINT = "https://test-azure-openai.openai.azure.com"
FAKE_AZURE_MODEL = "gpt-4o-azure"
FAKE_AZURE_API_VERSION = "2024-12-01-preview"


@pytest.fixture
def provider_config() -> Config:
    """Create a proper Config object for the OpenAIProvider."""
    config = Config()
    config.OpenAIProvider = Config()
    config.OpenAIClient = Config()
    return config


@pytest.fixture(autouse=True)
def reset_env_vars(monkeypatch: pytest.MonkeyPatch) -> None:
    """Reset all environment variables before each test."""
    for var in [
        "OPENAI_API_KEY", "CLAUDE_API_KEY", "GEMINI_API_KEY", "OLLAMA_MODEL",
        "AZURE_OPENAI_API_KEY", "AZURE_OPENAI_ENDPOINT", "AZURE_OPENAI_MODEL", 
        "AZURE_OPENAI_API_VERSION"
    ]:
        monkeypatch.delenv(var, raising=False)


@pytest.fixture
def mock_azure_openai_environment(monkeypatch: pytest.MonkeyPatch) -> None:
    """Set up Azure OpenAI environment variables and mocks."""
    # Set environment variables
    monkeypatch.setenv("AZURE_OPENAI_API_KEY", FAKE_API_KEY)
    monkeypatch.setenv("AZURE_OPENAI_ENDPOINT", FAKE_AZURE_ENDPOINT)
    monkeypatch.setenv("AZURE_OPENAI_MODEL", FAKE_AZURE_MODEL)
    monkeypatch.setenv("AZURE_OPENAI_API_VERSION", FAKE_AZURE_API_VERSION)
    
    # Set constants
    monkeypatch.setattr("mito_ai.constants.AZURE_OPENAI_API_KEY", FAKE_API_KEY)
    monkeypatch.setattr("mito_ai.constants.AZURE_OPENAI_ENDPOINT", FAKE_AZURE_ENDPOINT)
    monkeypatch.setattr("mito_ai.constants.AZURE_OPENAI_MODEL", FAKE_AZURE_MODEL)
    monkeypatch.setattr("mito_ai.constants.AZURE_OPENAI_API_VERSION", FAKE_AZURE_API_VERSION)
    
    # Mock enterprise/private functions and directly mock is_azure_openai_configured
    monkeypatch.setattr("mito_ai.enterprise.utils.is_enterprise", lambda: True)
    monkeypatch.setattr("mito_ai.enterprise.utils.is_mitosheet_private", lambda: False)
    monkeypatch.setattr("mito_ai.enterprise.utils.is_azure_openai_configured", lambda: True)
    # Also patch where it's imported in the OpenAI client
    monkeypatch.setattr("mito_ai.openai_client.is_azure_openai_configured", lambda: True)
    
    # Ensure no other OpenAI key is set
    monkeypatch.setattr("mito_ai.constants.OPENAI_API_KEY", None)


@pytest.fixture
def mock_azure_openai_client() -> Any:
    """Mock Azure OpenAI client for testing."""
    mock_client = MagicMock()
    mock_client.chat.completions.create = AsyncMock()
    mock_client.is_closed.return_value = False
    return mock_client


# Test message types that should use Azure OpenAI
COMPLETION_MESSAGE_TYPES = [
    MessageType.CHAT,
    MessageType.SMART_DEBUG,
    MessageType.CODE_EXPLAIN,
    MessageType.AGENT_EXECUTION,
    MessageType.AGENT_AUTO_ERROR_FIXUP,
    MessageType.INLINE_COMPLETION,
    MessageType.CHAT_NAME_GENERATION,
]

# Common test data
TEST_MESSAGES: List[ChatCompletionMessageParam] = [
    {"role": "user", "content": "Test message"}
]

# Helper functions for common test patterns
def create_mock_azure_client_with_response(response_content: str = "Test Azure completion") -> tuple[MagicMock, MagicMock]:
    """Create a mock Azure OpenAI client with a standard response."""
    mock_response = MagicMock()
    mock_response.choices = [MagicMock()]
    mock_response.choices[0].message.content = response_content
    
    mock_azure_client = MagicMock()
    mock_azure_client.chat.completions.create = AsyncMock(return_value=mock_response)
    mock_azure_client.is_closed.return_value = False
    
    return mock_azure_client, mock_response

def create_mock_streaming_response(chunks: List[str]) -> Any:
    """Create a mock streaming response with the given chunks."""
    async def mock_stream():
        for i, content in enumerate(chunks):
            mock_chunk = MagicMock()
            mock_chunk.choices = [MagicMock()]
            mock_chunk.choices[0].delta.content = content
            mock_chunk.choices[0].finish_reason = "stop" if i == len(chunks) - 1 else None
            yield mock_chunk
    return mock_stream

def assert_azure_client_called_correctly(mock_azure_client_class: MagicMock, mock_azure_client: MagicMock, expected_model: str = FAKE_AZURE_MODEL, should_stream: bool = False) -> None:
    """Assert that Azure client was called correctly."""
    # Verify Azure client was created
    mock_azure_client_class.assert_called_once()
    
    # Verify request was made through Azure client
    mock_azure_client.chat.completions.create.assert_called_once()
    
    # Verify the model used was the Azure model
    call_args = mock_azure_client.chat.completions.create.call_args
    assert call_args[1]["model"] == expected_model
    
    if should_stream:
        assert call_args[1]["stream"] == True


class TestAzureOpenAIClientCreation:
    """Test that Azure OpenAI client is properly created when configured."""
    
    def test_azure_openai_client_capabilities(self, mock_azure_openai_environment: None, provider_config: Config) -> None:
        """Test that Azure OpenAI capabilities are properly returned."""
        with patch("openai.AsyncAzureOpenAI") as mock_azure_client:
            openai_client = OpenAIClient(config=provider_config)
            capabilities = openai_client.capabilities
            
            assert capabilities.provider == "Azure OpenAI"
            assert capabilities.configuration["model"] == FAKE_AZURE_MODEL
            
            # Access the client to trigger creation
            # This let's us test that building the client works
            _ = openai_client._active_async_client
            mock_azure_client.assert_called_once()
    
    def test_azure_openai_client_creation_parameters(self, mock_azure_openai_environment: None, provider_config: Config) -> None:
        """Test that Azure OpenAI client is created with correct parameters."""
        with patch("openai.AsyncAzureOpenAI") as mock_azure_client:
            openai_client = OpenAIClient(config=provider_config)
            # Access the client to trigger creation
            _ = openai_client._active_async_client
            
            mock_azure_client.assert_called_once_with(
                api_key=FAKE_API_KEY,
                api_version=FAKE_AZURE_API_VERSION,
                azure_endpoint=FAKE_AZURE_ENDPOINT,
                max_retries=1,
                timeout=30,
            )
    
    def test_azure_openai_model_resolution(self, mock_azure_openai_environment: None, provider_config: Config) -> None:
        """Test that Azure OpenAI model is used regardless of requested model."""
        with patch("openai.AsyncAzureOpenAI"):
            openai_client = OpenAIClient(config=provider_config)
            
            # Test with gpt-4.1 model
            resolved_model = openai_client._adjust_model_for_azure_or_ollama("gpt-4.1")
            assert resolved_model == FAKE_AZURE_MODEL
            
            # Test with any other model
            resolved_model = openai_client._adjust_model_for_azure_or_ollama("gpt-3.5-turbo")
            assert resolved_model == FAKE_AZURE_MODEL


class TestAzureOpenAICompletions:
    """Test Azure OpenAI request_completions method."""
    
    @pytest.mark.asyncio
    @pytest.mark.parametrize("message_type", COMPLETION_MESSAGE_TYPES)
    async def test_request_completions_uses_azure_client(
        self, 
        mock_azure_openai_environment: None, 
        provider_config: Config,
        message_type: MessageType
    ) -> None:
        """Test that request_completions uses Azure OpenAI client for all message types."""
        
        with patch("openai.AsyncAzureOpenAI") as mock_azure_client_class:
            mock_azure_client, mock_response = create_mock_azure_client_with_response()
            mock_azure_client_class.return_value = mock_azure_client
            
            openai_client = OpenAIClient(config=provider_config)
            
            completion = await openai_client.request_completions(
                message_type=message_type,
                messages=TEST_MESSAGES,
                model="gpt-4.1"
            )
            
            # Verify the completion was returned
            assert completion == "Test Azure completion"
            
            # Verify Azure client was called correctly
            assert_azure_client_called_correctly(mock_azure_client_class, mock_azure_client)
    
    @pytest.mark.asyncio
    async def test_request_completions_with_response_format(
        self, 
        mock_azure_openai_environment: None, 
        provider_config: Config
    ) -> None:
        """Test that request_completions works with response format (agent mode)."""
        
        # Mock the response
        mock_response = MagicMock()
        mock_response.choices = [MagicMock()]
        mock_response.choices[0].message.content = '{"type": "finished_task", "message": "Task completed"}'
        
        with patch("openai.AsyncAzureOpenAI") as mock_azure_client_class:
            mock_azure_client = MagicMock()
            mock_azure_client.chat.completions.create = AsyncMock(return_value=mock_response)
            mock_azure_client.is_closed.return_value = False
            mock_azure_client_class.return_value = mock_azure_client
            
            openai_client = OpenAIClient(config=provider_config)
            
            messages: List[ChatCompletionMessageParam] = [
                {"role": "user", "content": "Test message"}
            ]
            
            response_format_info = ResponseFormatInfo(
                name="agent_response",
                format=AgentResponse
            )
            
            completion = await openai_client.request_completions(
                message_type=MessageType.AGENT_EXECUTION,
                messages=messages,
                model="gpt-4.1",
                response_format_info=response_format_info
            )
            
            # Verify the completion was returned
            assert completion == '{"type": "finished_task", "message": "Task completed"}'
            
            # Verify Azure client was used
            mock_azure_client.chat.completions.create.assert_called_once()
            
            # Verify the model used was the Azure model
            call_args = mock_azure_client.chat.completions.create.call_args
            assert call_args[1]["model"] == FAKE_AZURE_MODEL
    
    @pytest.mark.asyncio
    @pytest.mark.parametrize("requested_model", ["gpt-4.1", "gpt-3.5-turbo", "gpt-4-turbo", "gpt-4o"])
    async def test_request_completions_uses_azure_model_not_requested_model(
        self, 
        mock_azure_openai_environment: None, 
        provider_config: Config,
        requested_model: str
    ) -> None:
        """Test that Azure model is used regardless of requested model when Azure is configured."""
        
        with patch("openai.AsyncAzureOpenAI") as mock_azure_client_class:
            mock_azure_client, mock_response = create_mock_azure_client_with_response()
            mock_azure_client_class.return_value = mock_azure_client
            
            openai_client = OpenAIClient(config=provider_config)
            
            completion = await openai_client.request_completions(
                message_type=MessageType.CHAT,
                messages=TEST_MESSAGES,
                model=requested_model
            )
            
            assert completion == "Test Azure completion"
            
            # Verify Azure client was called correctly and used Azure model, not requested model
            assert_azure_client_called_correctly(mock_azure_client_class, mock_azure_client)
            call_args = mock_azure_client.chat.completions.create.call_args
            assert call_args[1]["model"] != requested_model  # Explicitly check it's not the requested model


class TestAzureOpenAIStreamCompletions:
    """Test Azure OpenAI stream_completions method."""
    
    @pytest.mark.asyncio
    @pytest.mark.parametrize("message_type", COMPLETION_MESSAGE_TYPES)
    async def test_stream_completions_uses_azure_client(
        self, 
        mock_azure_openai_environment: None, 
        provider_config: Config,
        message_type: MessageType
    ) -> None:
        """Test that stream_completions uses Azure OpenAI client for all message types."""
        
        stream_chunks = ["Hello", " World"]
        expected_completion = "".join(stream_chunks)
        
        with patch("openai.AsyncAzureOpenAI") as mock_azure_client_class:
            mock_azure_client = MagicMock()
            mock_azure_client.chat.completions.create = AsyncMock(return_value=create_mock_streaming_response(stream_chunks)())
            mock_azure_client.is_closed.return_value = False
            mock_azure_client_class.return_value = mock_azure_client
            
            openai_client = OpenAIClient(config=provider_config)
            
            reply_chunks = []
            def mock_reply(chunk):
                reply_chunks.append(chunk)
            
            completion = await openai_client.stream_completions(
                message_type=message_type,
                messages=TEST_MESSAGES,
                model="gpt-4.1",
                message_id="test-id",
                thread_id="test-thread",
                reply_fn=mock_reply
            )
            
            # Verify the full completion was returned
            assert completion == expected_completion
            
            # Verify Azure client was called correctly for streaming
            assert_azure_client_called_correctly(mock_azure_client_class, mock_azure_client, should_stream=True)
            
            # Verify reply function was called with chunks
            assert len(reply_chunks) >= 2  # Initial reply + chunks
            assert isinstance(reply_chunks[0], CompletionReply)
    
    @pytest.mark.asyncio
    async def test_stream_completions_with_response_format(
        self, 
        mock_azure_openai_environment: None, 
        provider_config: Config
    ) -> None:
        """Test that stream_completions works with response format (agent mode)."""
        
        # Mock the streaming response
        mock_chunk1 = MagicMock()
        mock_chunk1.choices = [MagicMock()]
        mock_chunk1.choices[0].delta.content = '{"type": "finished_task",'
        mock_chunk1.choices[0].finish_reason = None
        
        mock_chunk2 = MagicMock()
        mock_chunk2.choices = [MagicMock()]
        mock_chunk2.choices[0].delta.content = ' "message": "Task completed"}'
        mock_chunk2.choices[0].finish_reason = "stop"
        
        async def mock_stream():
            yield mock_chunk1
            yield mock_chunk2
        
        with patch("openai.AsyncAzureOpenAI") as mock_azure_client_class:
            mock_azure_client = MagicMock()
            mock_azure_client.chat.completions.create = AsyncMock(return_value=mock_stream())
            mock_azure_client.is_closed.return_value = False
            mock_azure_client_class.return_value = mock_azure_client
            
            openai_client = OpenAIClient(config=provider_config)
            
            messages: List[ChatCompletionMessageParam] = [
                {"role": "user", "content": "Test message"}
            ]
            
            response_format_info = ResponseFormatInfo(
                name="agent_response",
                format=AgentResponse
            )
            
            reply_chunks = []
            def mock_reply(chunk):
                reply_chunks.append(chunk)
            
            completion = await openai_client.stream_completions(
                message_type=MessageType.AGENT_EXECUTION,
                messages=messages,
                model="gpt-4.1",
                message_id="test-id",
                thread_id="test-thread",
                reply_fn=mock_reply,
                response_format_info=response_format_info
            )
            
            # Verify the full completion was returned
            assert completion == '{"type": "finished_task", "message": "Task completed"}'
            
            # Verify Azure client was used
            mock_azure_client.chat.completions.create.assert_called_once()
            
            # Verify the model used was the Azure model
            call_args = mock_azure_client.chat.completions.create.call_args
            assert call_args[1]["model"] == FAKE_AZURE_MODEL


class TestAzureOpenAIProviderIntegration:
    """Test Azure OpenAI integration through the OpenAIProvider."""
    
    @pytest.mark.asyncio
    @pytest.mark.parametrize("message_type", COMPLETION_MESSAGE_TYPES)
    async def test_provider_uses_azure_for_gpt_4_1(
        self, 
        mock_azure_openai_environment: None, 
        provider_config: Config,
        message_type: MessageType
    ) -> None:
        """Test that OpenAIProvider uses Azure OpenAI when gpt-4.1 is requested and Azure is configured."""
        
        # Mock the response
        mock_response = MagicMock()
        mock_response.choices = [MagicMock()]
        mock_response.choices[0].message.content = "Test Azure completion"
        
        with patch("openai.AsyncAzureOpenAI") as mock_azure_client_class:
            mock_azure_client = MagicMock()
            mock_azure_client.chat.completions.create = AsyncMock(return_value=mock_response)
            mock_azure_client.is_closed.return_value = False
            mock_azure_client_class.return_value = mock_azure_client
            
            provider = OpenAIProvider(config=provider_config)
            
            messages: List[ChatCompletionMessageParam] = [
                {"role": "user", "content": "Test message"}
            ]
            
            completion = await provider.request_completions(
                message_type=message_type,
                messages=messages,
                model="gpt-4.1"
            )
            
            # Verify the completion was returned
            assert completion == "Test Azure completion"
            
            # Verify Azure client was created
            mock_azure_client_class.assert_called_once()
            
            # Verify request was made through Azure client
            mock_azure_client.chat.completions.create.assert_called_once()
            
            # Verify the model used was the Azure model, not the requested model
            call_args = mock_azure_client.chat.completions.create.call_args
            assert call_args[1]["model"] == FAKE_AZURE_MODEL
    
    @pytest.mark.asyncio
    @pytest.mark.parametrize("message_type", COMPLETION_MESSAGE_TYPES)
    async def test_provider_stream_uses_azure_for_gpt_4_1(
        self, 
        mock_azure_openai_environment: None, 
        provider_config: Config,
        message_type: MessageType
    ) -> None:
        """Test that OpenAIProvider stream_completions uses Azure OpenAI when gpt-4.1 is requested and Azure is configured."""
        
        # Mock the streaming response
        mock_chunk1 = MagicMock()
        mock_chunk1.choices = [MagicMock()]
        mock_chunk1.choices[0].delta.content = "Hello"
        mock_chunk1.choices[0].finish_reason = None
        
        mock_chunk2 = MagicMock()
        mock_chunk2.choices = [MagicMock()]
        mock_chunk2.choices[0].delta.content = " Azure"
        mock_chunk2.choices[0].finish_reason = "stop"
        
        async def mock_stream():
            yield mock_chunk1
            yield mock_chunk2
        
        with patch("openai.AsyncAzureOpenAI") as mock_azure_client_class:
            mock_azure_client = MagicMock()
            mock_azure_client.chat.completions.create = AsyncMock(return_value=mock_stream())
            mock_azure_client.is_closed.return_value = False
            mock_azure_client_class.return_value = mock_azure_client
            
            provider = OpenAIProvider(config=provider_config)
            
            messages: List[ChatCompletionMessageParam] = [
                {"role": "user", "content": "Test message"}
            ]
            
            reply_chunks = []
            def mock_reply(chunk):
                reply_chunks.append(chunk)
            
            completion = await provider.stream_completions(
                message_type=message_type,
                messages=messages,
                model="gpt-4.1",
                message_id="test-id",
                thread_id="test-thread",
                reply_fn=mock_reply
            )
            
            # Verify the full completion was returned
            assert completion == "Hello Azure"
            
            # Verify Azure client was created
            mock_azure_client_class.assert_called_once()
            
            # Verify request was made through Azure client
            mock_azure_client.chat.completions.create.assert_called_once()
            
            # Verify the model used was the Azure model, not the requested model
            call_args = mock_azure_client.chat.completions.create.call_args
            assert call_args[1]["model"] == FAKE_AZURE_MODEL
            assert call_args[1]["stream"] == True


class TestAzureOpenAIConfigurationPriority:
    """Test that Azure OpenAI is used when configured, regardless of other providers."""
    
    def test_azure_openai_priority_over_regular_openai(
        self, 
        mock_azure_openai_environment: None, 
        provider_config: Config,
        monkeypatch: pytest.MonkeyPatch
    ) -> None:
        """Test that Azure OpenAI is used even when regular OpenAI key is available."""
        
        # Set regular OpenAI key (this should be overridden by Azure OpenAI)
        monkeypatch.setenv("OPENAI_API_KEY", "sk-regular-openai-key")
        monkeypatch.setattr("mito_ai.constants.OPENAI_API_KEY", "sk-regular-openai-key")
        
        with patch("openai.AsyncAzureOpenAI") as mock_azure_client:
            openai_client = OpenAIClient(config=provider_config)
            capabilities = openai_client.capabilities
            
            # Should still use Azure OpenAI, not regular OpenAI
            assert capabilities.provider == "Azure OpenAI"
            assert capabilities.configuration["model"] == FAKE_AZURE_MODEL
            
            # Access the client to trigger creation
            _ = openai_client._active_async_client
            mock_azure_client.assert_called_once()
    
    def test_azure_openai_priority_over_claude(
        self, 
        mock_azure_openai_environment: None, 
        provider_config: Config,
        monkeypatch: pytest.MonkeyPatch
    ) -> None:
        """Test that Azure OpenAI is used even when Claude key is available."""
        
        # Set Claude key (this should be overridden by Azure OpenAI)
        monkeypatch.setenv("CLAUDE_API_KEY", "claude-key")
        monkeypatch.setattr("mito_ai.constants.CLAUDE_API_KEY", "claude-key")
        
        with patch("openai.AsyncAzureOpenAI") as mock_azure_client:
            openai_client = OpenAIClient(config=provider_config)
            capabilities = openai_client.capabilities
            
            # Should still use Azure OpenAI, not Claude
            assert capabilities.provider == "Azure OpenAI"
            assert capabilities.configuration["model"] == FAKE_AZURE_MODEL
            
            # Access the client to trigger creation
            _ = openai_client._active_async_client
            mock_azure_client.assert_called_once()


class TestAzureOpenAINotConfigured:
    """Test behavior when Azure OpenAI is not properly configured."""
    
    def test_missing_azure_api_key(self, provider_config: Config, monkeypatch: pytest.MonkeyPatch) -> None:
        """Test that Azure OpenAI is not used when API key is missing."""
        
        # Set some but not all Azure OpenAI env vars
        monkeypatch.setenv("AZURE_OPENAI_ENDPOINT", FAKE_AZURE_ENDPOINT)
        monkeypatch.setenv("AZURE_OPENAI_MODEL", FAKE_AZURE_MODEL)
        monkeypatch.setenv("AZURE_OPENAI_API_VERSION", FAKE_AZURE_API_VERSION)
        # Missing AZURE_OPENAI_API_KEY
        
        monkeypatch.setattr("mito_ai.constants.AZURE_OPENAI_ENDPOINT", FAKE_AZURE_ENDPOINT)
        monkeypatch.setattr("mito_ai.constants.AZURE_OPENAI_MODEL", FAKE_AZURE_MODEL)
        monkeypatch.setattr("mito_ai.constants.AZURE_OPENAI_API_VERSION", FAKE_AZURE_API_VERSION)
        monkeypatch.setattr("mito_ai.constants.AZURE_OPENAI_API_KEY", None)
        
        monkeypatch.setattr("mito_ai.enterprise.utils.is_enterprise", lambda: True)
        monkeypatch.setattr("mito_ai.enterprise.utils.is_mitosheet_private", lambda: False)
        # This should return False due to missing API key
        monkeypatch.setattr("mito_ai.enterprise.utils.is_azure_openai_configured", lambda: False)
        monkeypatch.setattr("mito_ai.openai_client.is_azure_openai_configured", lambda: False)
        
        with patch("openai.AsyncAzureOpenAI") as mock_azure_client:
            openai_client = OpenAIClient(config=provider_config)
            capabilities = openai_client.capabilities
            
            # Should not use Azure OpenAI
            assert capabilities.provider != "Azure OpenAI"
            mock_azure_client.assert_not_called()
    
    def test_not_enterprise_user(self, provider_config: Config, monkeypatch: pytest.MonkeyPatch) -> None:
        """Test that Azure OpenAI is not used when user is not enterprise."""
        
        # Set all Azure OpenAI env vars
        monkeypatch.setenv("AZURE_OPENAI_API_KEY", FAKE_API_KEY)
        monkeypatch.setenv("AZURE_OPENAI_ENDPOINT", FAKE_AZURE_ENDPOINT)
        monkeypatch.setenv("AZURE_OPENAI_MODEL", FAKE_AZURE_MODEL)
        monkeypatch.setenv("AZURE_OPENAI_API_VERSION", FAKE_AZURE_API_VERSION)
        
        monkeypatch.setattr("mito_ai.constants.AZURE_OPENAI_API_KEY", FAKE_API_KEY)
        monkeypatch.setattr("mito_ai.constants.AZURE_OPENAI_ENDPOINT", FAKE_AZURE_ENDPOINT)
        monkeypatch.setattr("mito_ai.constants.AZURE_OPENAI_MODEL", FAKE_AZURE_MODEL)
        monkeypatch.setattr("mito_ai.constants.AZURE_OPENAI_API_VERSION", FAKE_AZURE_API_VERSION)
        
        # Not enterprise user
        monkeypatch.setattr("mito_ai.enterprise.utils.is_enterprise", lambda: False)
        monkeypatch.setattr("mito_ai.enterprise.utils.is_mitosheet_private", lambda: False)
        # This should return False due to not being enterprise
        monkeypatch.setattr("mito_ai.enterprise.utils.is_azure_openai_configured", lambda: False)
        monkeypatch.setattr("mito_ai.openai_client.is_azure_openai_configured", lambda: False)
        
        with patch("openai.AsyncAzureOpenAI") as mock_azure_client:
            openai_client = OpenAIClient(config=provider_config)
            capabilities = openai_client.capabilities
            
            # Should not use Azure OpenAI
            assert capabilities.provider != "Azure OpenAI"
            mock_azure_client.assert_not_called()
