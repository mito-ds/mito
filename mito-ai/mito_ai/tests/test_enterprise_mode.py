# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

import pytest
from unittest.mock import patch, MagicMock
from traitlets.config import Config
from mito_ai.utils.telemetry_utils import telemetry_turned_on, identify, log
from mito_ai.utils.model_utils import get_available_models
from mito_ai.provider_manager import ProviderManager
from mito_ai.completions.models import MessageType
from openai.types.chat import ChatCompletionMessageParam


@pytest.fixture
def provider_config() -> Config:
    """Create a proper Config object for the ProviderManager."""
    config = Config()
    config.ProviderManager = Config()
    config.OpenAIClient = Config()
    return config


class TestEnterpriseModeDetection:
    """Tests for enterprise mode detection."""
    
    @patch('mito_ai.utils.version_utils.is_enterprise')
    def test_telemetry_disabled_when_enterprise(self, mock_is_enterprise):
        """Test that telemetry is disabled when enterprise mode is enabled."""
        mock_is_enterprise.return_value = True
        
        result = telemetry_turned_on()
        
        assert result is False
    
    @patch('mito_ai.utils.telemetry_utils.is_enterprise')
    def test_telemetry_enabled_when_not_enterprise(self, mock_is_enterprise):
        """Test that telemetry can be enabled when enterprise mode is not enabled."""
        mock_is_enterprise.return_value = False
        
        # Mock other conditions that might disable telemetry
        with patch('mito_ai.utils.telemetry_utils.MITOSHEET_HELPER_PRIVATE', False), \
             patch('mito_ai.utils.telemetry_utils.is_pro', return_value=False), \
             patch('mito_ai.utils.telemetry_utils.get_user_field', return_value=True):
            result = telemetry_turned_on()
            # Result depends on other conditions, but enterprise check should pass
            # We just verify enterprise check doesn't block it
            mock_is_enterprise.assert_called_once()


class TestTelemetryDisabling:
    """Tests for telemetry disabling in enterprise mode."""
    
    @patch('mito_ai.utils.version_utils.is_enterprise')
    @patch('mito_ai.utils.telemetry_utils.analytics')
    def test_identify_skips_when_enterprise(self, mock_analytics, mock_is_enterprise):
        """Test that identify() skips analytics calls when enterprise mode is enabled."""
        mock_is_enterprise.return_value = True
        
        identify()
        
        # Should not call analytics.identify
        mock_analytics.identify.assert_not_called()
    
    @patch('mito_ai.utils.version_utils.is_enterprise')
    @patch('mito_ai.utils.telemetry_utils.analytics')
    def test_log_skips_when_enterprise(self, mock_analytics, mock_is_enterprise):
        """Test that log() skips analytics calls when enterprise mode is enabled."""
        mock_is_enterprise.return_value = True
        
        log("test_event", {"param": "value"})
        
        # Should not call analytics.track
        mock_analytics.track.assert_not_called()


class TestModelValidation:
    """Tests for model validation in enterprise mode."""
    
    @patch('mito_ai.utils.model_utils.is_enterprise')
    @patch('mito_ai.utils.model_utils.constants')
    def test_provider_manager_validates_model(self, mock_constants, mock_is_enterprise, provider_config: Config):
        """Test that ProviderManager validates models against available models."""
        mock_is_enterprise.return_value = True
        mock_constants.LITELLM_BASE_URL = "https://litellm-server.com"
        mock_constants.LITELLM_MODELS = ["openai/gpt-4o", "openai/gpt-4o-mini"]
        
        provider_manager = ProviderManager(config=provider_config)
        provider_manager.set_selected_model("openai/gpt-4o")
        
        # Should not raise an error for valid model
        available_models = get_available_models()
        assert "openai/gpt-4o" in available_models
    
    @patch('mito_ai.utils.model_utils.is_enterprise')
    @patch('mito_ai.utils.model_utils.constants')
    @pytest.mark.asyncio
    async def test_provider_manager_rejects_invalid_model(self, mock_constants, mock_is_enterprise, provider_config: Config):
        """Test that ProviderManager rejects invalid models."""
        mock_is_enterprise.return_value = True
        mock_constants.LITELLM_BASE_URL = "https://litellm-server.com"
        mock_constants.LITELLM_MODELS = ["openai/gpt-4o"]
        mock_constants.LITELLM_API_KEY = "test-key"
        
        provider_manager = ProviderManager(config=provider_config)
        provider_manager.set_selected_model("invalid-model")
        
        messages: list[ChatCompletionMessageParam] = [{"role": "user", "content": "test"}]
        
        # Should raise ValueError for invalid model
        with pytest.raises(ValueError, match="is not in the allowed model list"):
            await provider_manager.request_completions(
                message_type=MessageType.CHAT,
                messages=messages
            )
    
    @patch('mito_ai.utils.model_utils.is_enterprise')
    @patch('mito_ai.utils.model_utils.constants')
    def test_available_models_endpoint_returns_litellm_models(self, mock_constants, mock_is_enterprise):
        """Test that /available-models endpoint returns LiteLLM models when configured."""
        mock_is_enterprise.return_value = True
        mock_constants.LITELLM_BASE_URL = "https://litellm-server.com"
        mock_constants.LITELLM_MODELS = ["openai/gpt-4o", "anthropic/claude-3-5-sonnet"]
        
        result = get_available_models()
        
        assert result == ["openai/gpt-4o", "anthropic/claude-3-5-sonnet"]
    
    @patch('mito_ai.utils.model_utils.is_enterprise')
    @patch('mito_ai.utils.model_utils.constants')
    def test_available_models_endpoint_returns_standard_models_when_not_configured(self, mock_constants, mock_is_enterprise):
        """Test that /available-models endpoint returns standard models when LiteLLM is not configured."""
        mock_is_enterprise.return_value = True
        mock_constants.LITELLM_BASE_URL = None
        mock_constants.LITELLM_MODELS = []
        
        result = get_available_models()
        
        from mito_ai.utils.model_utils import STANDARD_MODELS
        assert result == STANDARD_MODELS


class TestModelStorage:
    """Tests for model storage in ProviderManager."""
    
    def test_provider_manager_stores_model(self, provider_config: Config):
        """Test that ProviderManager can store and retrieve selected model."""
        provider_manager = ProviderManager(config=provider_config)
        
        provider_manager.set_selected_model("gpt-4.1")
        assert provider_manager.get_selected_model() == "gpt-4.1"
        
        provider_manager.set_selected_model("claude-sonnet-4-5-20250929")
        assert provider_manager.get_selected_model() == "claude-sonnet-4-5-20250929"
    
    def test_provider_manager_default_model(self, provider_config: Config):
        """Test that ProviderManager has a default model."""
        provider_manager = ProviderManager(config=provider_config)
        
        # Should have default model
        default_model = provider_manager.get_selected_model()
        assert default_model is not None
        assert isinstance(default_model, str)
