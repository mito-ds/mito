# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

import pytest
from unittest.mock import patch, MagicMock
from mito_ai.utils.model_utils import (
    get_available_models,
    get_fast_model_for_selected_model,
    STANDARD_MODELS,
    ANTHROPIC_MODEL_ORDER,
    OPENAI_MODEL_ORDER,
    GEMINI_MODEL_ORDER,
)


class TestGetAvailableModels:
    """Tests for get_available_models() function."""
    
    @patch('mito_ai.utils.model_utils.is_enterprise')
    @patch('mito_ai.utils.model_utils.constants')
    def test_returns_litellm_models_when_enterprise_and_configured(self, mock_constants, mock_is_enterprise):
        """Test that LiteLLM models are returned when enterprise mode is enabled and LiteLLM is configured."""
        mock_is_enterprise.return_value = True
        mock_constants.LITELLM_BASE_URL = "https://litellm-server.com"
        mock_constants.LITELLM_MODELS = ["openai/gpt-4o", "anthropic/claude-3-5-sonnet"]
        
        result = get_available_models()
        
        assert result == ["openai/gpt-4o", "anthropic/claude-3-5-sonnet"]
    
    @patch('mito_ai.utils.model_utils.is_enterprise')
    @patch('mito_ai.utils.model_utils.constants')
    def test_returns_standard_models_when_not_enterprise(self, mock_constants, mock_is_enterprise):
        """Test that standard models are returned when enterprise mode is not enabled."""
        mock_is_enterprise.return_value = False
        
        result = get_available_models()
        
        assert result == STANDARD_MODELS
    
    @patch('mito_ai.utils.model_utils.is_enterprise')
    @patch('mito_ai.utils.model_utils.constants')
    def test_returns_standard_models_when_enterprise_but_no_litellm(self, mock_constants, mock_is_enterprise):
        """Test that standard models are returned when enterprise mode is enabled but LiteLLM is not configured."""
        mock_is_enterprise.return_value = True
        mock_constants.LITELLM_BASE_URL = None
        mock_constants.LITELLM_MODELS = []
        
        result = get_available_models()
        
        assert result == STANDARD_MODELS
    
    @patch('mito_ai.utils.model_utils.is_enterprise')
    @patch('mito_ai.utils.model_utils.constants')
    def test_returns_standard_models_when_enterprise_but_no_base_url(self, mock_constants, mock_is_enterprise):
        """Test that standard models are returned when enterprise mode is enabled but LITELLM_BASE_URL is not set."""
        mock_is_enterprise.return_value = True
        mock_constants.LITELLM_BASE_URL = None
        mock_constants.LITELLM_MODELS = ["openai/gpt-4o"]
        
        result = get_available_models()
        
        assert result == STANDARD_MODELS
    
    @patch('mito_ai.utils.model_utils.is_enterprise')
    @patch('mito_ai.utils.model_utils.constants')
    def test_returns_standard_models_when_enterprise_but_no_models(self, mock_constants, mock_is_enterprise):
        """Test that standard models are returned when enterprise mode is enabled but LITELLM_MODELS is empty."""
        mock_is_enterprise.return_value = True
        mock_constants.LITELLM_BASE_URL = "https://litellm-server.com"
        mock_constants.LITELLM_MODELS = []
        
        result = get_available_models()
        
        assert result == STANDARD_MODELS


class TestGetFastModelForSelectedModel:
    """Tests for get_fast_model_for_selected_model() function."""
    
    def test_anthropic_sonnet_returns_haiku(self):
        """Test that Claude Sonnet returns Claude Haiku (fastest Anthropic model)."""
        result = get_fast_model_for_selected_model("claude-sonnet-4-5-20250929")
        assert result == "claude-haiku-4-5-20251001"
    
    def test_anthropic_haiku_returns_haiku(self):
        """Test that Claude Haiku returns itself (already fastest)."""
        result = get_fast_model_for_selected_model("claude-haiku-4-5-20251001")
        assert result == "claude-haiku-4-5-20251001"
    
    def test_openai_gpt_4_1_returns_gpt_4_1(self):
        """Test that GPT 4.1 returns itself (already fastest)."""
        result = get_fast_model_for_selected_model("gpt-4.1")
        assert result == "gpt-4.1"
    
    def test_openai_gpt_5_2_returns_gpt_4_1(self):
        """Test that GPT 5.2 returns GPT 4.1 (fastest OpenAI model)."""
        result = get_fast_model_for_selected_model("gpt-5.2")
        assert result == "gpt-4.1"
    
    def test_gemini_pro_returns_flash(self):
        """Test that Gemini Pro returns Gemini Flash (fastest Gemini model)."""
        result = get_fast_model_for_selected_model("gemini-3-pro-preview")
        assert result == "gemini-3-flash-preview"
    
    def test_gemini_flash_returns_flash(self):
        """Test that Gemini Flash returns itself (already fastest)."""
        result = get_fast_model_for_selected_model("gemini-3-flash-preview")
        assert result == "gemini-3-flash-preview"
    
    @patch('mito_ai.utils.model_utils.get_available_models')
    def test_litellm_openai_model_returns_fastest_overall(self, mock_get_available_models):
        """Test that LiteLLM OpenAI model returns fastest model from all available models (across providers)."""
        mock_get_available_models.return_value = ["openai/gpt-4.1", "openai/gpt-5.2", "anthropic/claude-sonnet-4-5-20250929"]
        
        result = get_fast_model_for_selected_model("openai/gpt-5.2")
        
        # Should return openai/gpt-4.1 (fastest model overall - index 0 in OPENAI_MODEL_ORDER)
        assert result == "openai/gpt-4.1"
    
    @patch('mito_ai.utils.model_utils.get_available_models')
    def test_litellm_anthropic_model_returns_fastest_overall(self, mock_get_available_models):
        """Test that LiteLLM Anthropic model returns fastest model from all available models (across providers)."""
        mock_get_available_models.return_value = ["openai/gpt-4.1", "anthropic/claude-sonnet-4-5-20250929", "anthropic/claude-haiku-4-5-20251001"]
        
        result = get_fast_model_for_selected_model("anthropic/claude-sonnet-4-5-20250929")
        
        # Should return anthropic/claude-haiku-4-5-20251001 (fastest model overall - index 0 in ANTHROPIC_MODEL_ORDER)
        assert result == "anthropic/claude-haiku-4-5-20251001"
    
    @patch('mito_ai.utils.model_utils.get_available_models')
    def test_litellm_google_model_returns_fastest_overall(self, mock_get_available_models):
        """Test that LiteLLM Google model returns fastest model from all available models (across providers)."""
        mock_get_available_models.return_value = ["google/gemini-3-pro-preview", "google/gemini-3-flash-preview"]
        
        result = get_fast_model_for_selected_model("google/gemini-3-pro-preview")
        
        # Should return google/gemini-3-flash-preview (fastest model overall - index 0 in GEMINI_MODEL_ORDER)
        assert result == "google/gemini-3-flash-preview"
    
    @patch('mito_ai.utils.model_utils.get_available_models')
    def test_litellm_unknown_model_returns_fastest_known(self, mock_get_available_models):
        """Test that unknown LiteLLM model returns fastest known model from available models."""
        mock_get_available_models.return_value = ["openai/gpt-4.1", "unknown/provider/model"]
        
        result = get_fast_model_for_selected_model("unknown/provider/model")
        
        # Should return openai/gpt-4.1 (fastest known model - unknown models have index inf)
        assert result == "openai/gpt-4.1"
    
    def test_unknown_standard_model_returns_itself(self):
        """Test that unknown standard model returns itself."""
        result = get_fast_model_for_selected_model("unknown-model")
        assert result == "unknown-model"
    
    @patch('mito_ai.utils.model_utils.get_available_models')
    def test_litellm_single_model_returns_itself(self, mock_get_available_models):
        """Test that when only one LiteLLM model is available, it returns itself."""
        mock_get_available_models.return_value = ["openai/gpt-4o"]
        
        result = get_fast_model_for_selected_model("openai/gpt-4o")
        
        assert result == "openai/gpt-4o"
    
    @patch('mito_ai.utils.model_utils.get_available_models')
    def test_litellm_cross_provider_comparison(self, mock_get_available_models):
        """Test that LiteLLM fast model selection compares across providers correctly."""
        # When multiple providers are available, should return fastest from all available models
        mock_get_available_models.return_value = [
            "openai/gpt-4.1",  # Index 0 in OPENAI_MODEL_ORDER
            "anthropic/claude-sonnet-4-5-20250929",  # Index 1 in ANTHROPIC_MODEL_ORDER
        ]
        
        # Should return openai/gpt-4.1 (fastest overall - index 0 < index 1)
        result = get_fast_model_for_selected_model("anthropic/claude-sonnet-4-5-20250929")
        
        assert result == "openai/gpt-4.1"
    
    @patch('mito_ai.utils.model_utils.get_available_models')
    def test_litellm_returns_fastest_when_anthropic_is_faster(self, mock_get_available_models):
        """Test that LiteLLM returns fastest model when Anthropic is faster than OpenAI."""
        mock_get_available_models.return_value = [
            "openai/gpt-5.2",  # Index 1 in OPENAI_MODEL_ORDER
            "anthropic/claude-haiku-4-5-20251001",  # Index 0 in ANTHROPIC_MODEL_ORDER
        ]
        
        # Should return anthropic/claude-haiku-4-5-20251001 (fastest overall - index 0 < index 1)
        result = get_fast_model_for_selected_model("openai/gpt-5.2")
        
        assert result == "anthropic/claude-haiku-4-5-20251001"