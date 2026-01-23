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
    @pytest.mark.parametrize(
        "selected_model,available_models,expected_result",
        [
            # Test case 1: LiteLLM OpenAI model returns fastest overall
            (
                "openai/gpt-5.2",
                ["openai/gpt-4.1", "openai/gpt-5.2", "anthropic/claude-sonnet-4-5-20250929"],
                "openai/gpt-4.1",
            ),
            # Test case 2: LiteLLM Anthropic model returns fastest overall
            (
                "anthropic/claude-sonnet-4-5-20250929",
                ["openai/gpt-4.1", "anthropic/claude-sonnet-4-5-20250929", "anthropic/claude-haiku-4-5-20251001"],
                "openai/gpt-4.1",
            ),
            # Test case 3: LiteLLM Google model returns fastest overall
            (
                "google/gemini-3-pro-preview",
                ["google/gemini-3-pro-preview", "google/gemini-3-flash-preview"],
                "google/gemini-3-flash-preview",
            ),
            # Test case 4: Unknown LiteLLM model returns fastest known
            (
                "unknown/provider/model",
                ["openai/gpt-4.1", "unknown/provider/model"],
                "openai/gpt-4.1",
            ),
            # Test case 5: Single LiteLLM model returns itself
            (
                "openai/gpt-4o",
                ["openai/gpt-4o"],
                "openai/gpt-4o",
            ),
            # Test case 6: Cross-provider comparison - OpenAI is faster
            (
                "anthropic/claude-sonnet-4-5-20250929",
                [
                    "openai/gpt-4.1",  # Index 0 in OPENAI_MODEL_ORDER
                    "anthropic/claude-sonnet-4-5-20250929",  # Index 1 in ANTHROPIC_MODEL_ORDER
                ],
                "openai/gpt-4.1",
            ),
            # Test case 7: Cross-provider comparison - Anthropic is faster
            (
                "openai/gpt-5.2",
                [
                    "openai/gpt-5.2",  # Index 1 in OPENAI_MODEL_ORDER
                    "anthropic/claude-haiku-4-5-20251001",  # Index 0 in ANTHROPIC_MODEL_ORDER
                ],
                "anthropic/claude-haiku-4-5-20251001",
            ),
        ],
        ids=[
            "litellm_openai_model_returns_fastest_overall",
            "litellm_anthropic_model_returns_fastest_overall",
            "litellm_google_model_returns_fastest_overall",
            "litellm_unknown_model_returns_fastest_known",
            "litellm_single_model_returns_itself",
            "litellm_cross_provider_comparison_openai_faster",
            "litellm_returns_fastest_when_anthropic_is_faster",
        ]
    )
    def test_litellm_model_returns_fastest(
        self,
        mock_get_available_models,
        selected_model,
        available_models,
        expected_result,
    ):
        """Test that LiteLLM models return fastest model from all available models."""
        mock_get_available_models.return_value = available_models
        
        result = get_fast_model_for_selected_model(selected_model)
        
        assert result == expected_result
    
    def test_unknown_standard_model_returns_itself(self):
        """Test that unknown standard model returns itself."""
        result = get_fast_model_for_selected_model("unknown-model")
        assert result == "unknown-model"
    
    def test_claude_model_not_in_order_returns_fastest_anthropic(self):
        """Test that a Claude model not in ANTHROPIC_MODEL_ORDER still returns fastest Anthropic model."""
        # Test with a Claude model that isn't in the order list
        result = get_fast_model_for_selected_model("claude-3-opus-20240229")
        # Should return fastest Anthropic model (claude-haiku-4-5-20251001)
        assert result == "claude-haiku-4-5-20251001"
        assert result.startswith("claude")
    
    def test_gpt_model_not_in_order_returns_fastest_openai(self):
        """Test that a GPT model not in OPENAI_MODEL_ORDER still returns fastest OpenAI model."""
        # Test with a GPT model that isn't in the order list
        result = get_fast_model_for_selected_model("gpt-4o-mini")
        # Should return fastest OpenAI model (gpt-4.1)
        assert result == "gpt-4.1"
        assert result.startswith("gpt")
    
    def test_gemini_model_not_in_order_returns_fastest_gemini(self):
        """Test that a Gemini model not in GEMINI_MODEL_ORDER still returns fastest Gemini model."""
        # Test with a Gemini model that isn't in the order list
        result = get_fast_model_for_selected_model("gemini-1.5-pro")
        # Should return fastest Gemini model (gemini-3-flash-preview)
        assert result == "gemini-3-flash-preview"
        assert result.startswith("gemini")
    
    def test_claude_model_variations_return_same_provider(self):
        """Test that various Claude model name variations return Anthropic models."""
        test_cases = [
            "claude-3-5-sonnet",
            "claude-3-opus",
            "claude-instant",
            "claude-v2",
        ]
        for model in test_cases:
            result = get_fast_model_for_selected_model(model)
            # Should always return an Anthropic model (starts with "claude")
            assert result.startswith("claude"), f"Model {model} should return Anthropic model, got {result}"
            # Should return the fastest Anthropic model
            assert result == "claude-haiku-4-5-20251001", f"Model {model} should return fastest Anthropic model"
    
    def test_gpt_model_variations_return_same_provider(self):
        """Test that various GPT model name variations return OpenAI models."""
        test_cases = [
            "gpt-4o",
            "gpt-4-turbo",
            "gpt-3.5-turbo",
            "gpt-4o-mini",
        ]
        for model in test_cases:
            result = get_fast_model_for_selected_model(model)
            # Should always return an OpenAI model (starts with "gpt")
            assert result.startswith("gpt"), f"Model {model} should return OpenAI model, got {result}"
            # Should return the fastest OpenAI model
            assert result == "gpt-4.1", f"Model {model} should return fastest OpenAI model"
    
    def test_gemini_model_variations_return_same_provider(self):
        """Test that various Gemini model name variations return Gemini models."""
        test_cases = [
            "gemini-1.5-pro",
            "gemini-1.5-flash",
            "gemini-pro",
            "gemini-ultra",
        ]
        for model in test_cases:
            result = get_fast_model_for_selected_model(model)
            # Should always return a Gemini model (starts with "gemini")
            assert result.startswith("gemini"), f"Model {model} should return Gemini model, got {result}"
            # Should return the fastest Gemini model
            assert result == "gemini-3-flash-preview", f"Model {model} should return fastest Gemini model"
    
    def test_case_insensitive_provider_matching(self):
        """Test that provider matching is case-insensitive."""
        test_cases = [
            ("CLAUDE-sonnet-4-5-20250929", "claude-haiku-4-5-20251001"),
            ("GPT-4.1", "gpt-4.1"),
            ("GEMINI-3-flash-preview", "gemini-3-flash-preview"),
        ]
        for model, expected in test_cases:
            result = get_fast_model_for_selected_model(model)
            assert result == expected, f"Case-insensitive matching failed for {model}"
