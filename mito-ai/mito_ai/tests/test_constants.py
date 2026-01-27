# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

from typing import Any
import pytest
from mito_ai.constants import (
    ACTIVE_BASE_URL, MITO_PROD_BASE_URL, MITO_DEV_BASE_URL,
    MITO_STREAMLIT_DEV_BASE_URL, MITO_STREAMLIT_TEST_BASE_URL, ACTIVE_STREAMLIT_BASE_URL,
    COGNITO_CONFIG_DEV, ACTIVE_COGNITO_CONFIG,
    parse_comma_separated_models,
)


def test_prod_lambda_url() -> Any:
    """Make sure that the lambda urls are correct"""
    assert MITO_PROD_BASE_URL.startswith("https://7eax4i53f5odkshhlry4gw23by0yvnuv.lambda-url.us-east-1.on.aws/")
    
def test_dev_lambda_url() -> Any:
    """Make sure that the lambda urls are correct"""
    assert MITO_DEV_BASE_URL.startswith("https://g5vwmogjg7gh7aktqezyrvcq6a0hyfnr.lambda-url.us-east-1.on.aws/")
    
def test_active_base_url() -> Any:
    """Make sure that the active base url is correct"""
    assert ACTIVE_BASE_URL == MITO_PROD_BASE_URL

def test_devenv_streamlit_url() -> Any:
    """Make sure that the streamlit urls are correct"""
    assert MITO_STREAMLIT_DEV_BASE_URL == "https://fr12uvtfy5.execute-api.us-east-1.amazonaws.com"

def test_testenv_streamlit_url() -> Any:
    """Make sure that the streamlit urls are correct"""
    assert MITO_STREAMLIT_TEST_BASE_URL == "https://iyual08t6d.execute-api.us-east-1.amazonaws.com"

def test_streamlit_active_base_url() -> Any:
    """Make sure that the active streamlit base url is correct"""
    assert ACTIVE_STREAMLIT_BASE_URL == MITO_STREAMLIT_DEV_BASE_URL

def test_cognito_config() -> Any:
    """Make sure that the Cognito configuration is correct"""
    expected_config = {
        'TOKEN_ENDPOINT': 'https://mito-app-auth.auth.us-east-1.amazoncognito.com/oauth2/token',
        'CLIENT_ID': '2sunerv2m6gp1qk3hib4t8oblh',
        'CLIENT_SECRET': '',
        'REDIRECT_URI': 'http://localhost:8888/lab'
    }

    assert COGNITO_CONFIG_DEV == expected_config
    assert ACTIVE_COGNITO_CONFIG == COGNITO_CONFIG_DEV


class TestParseCommaSeparatedModels:
    """Tests for parse_comma_separated_models helper function."""
    
    def test_parse_models_no_quotes(self) -> None:
        """Test parsing models without quotes."""
        models_str = "litellm/openai/gpt-4o,litellm/anthropic/claude-3-5-sonnet"
        result = parse_comma_separated_models(models_str)
        assert result == ["litellm/openai/gpt-4o", "litellm/anthropic/claude-3-5-sonnet"]
    
    def test_parse_models_double_quotes(self) -> None:
        """Test parsing models with double quotes."""
        # Entire string quoted
        models_str = '"litellm/openai/gpt-4o,litellm/anthropic/claude-3-5-sonnet"'
        result = parse_comma_separated_models(models_str)
        assert result == ["litellm/openai/gpt-4o", "litellm/anthropic/claude-3-5-sonnet"]
        
        # Individual models quoted
        models_str = '"litellm/openai/gpt-4o","litellm/anthropic/claude-3-5-sonnet"'
        result = parse_comma_separated_models(models_str)
        assert result == ["litellm/openai/gpt-4o", "litellm/anthropic/claude-3-5-sonnet"]
    
    def test_parse_models_single_quotes(self) -> None:
        """Test parsing models with single quotes."""
        # Entire string quoted
        models_str = "'litellm/openai/gpt-4o,litellm/anthropic/claude-3-5-sonnet'"
        result = parse_comma_separated_models(models_str)
        assert result == ["litellm/openai/gpt-4o", "litellm/anthropic/claude-3-5-sonnet"]
        
        # Individual models quoted
        models_str = "'litellm/openai/gpt-4o','litellm/anthropic/claude-3-5-sonnet'"
        result = parse_comma_separated_models(models_str)
        assert result == ["litellm/openai/gpt-4o", "litellm/anthropic/claude-3-5-sonnet"]
    
    def test_parse_models_mixed_quotes(self) -> None:
        """Test parsing models where some have single quotes and some have double quotes."""
        # Some models with single quotes, some with double quotes
        models_str = "'litellm/openai/gpt-4o',\"litellm/anthropic/claude-3-5-sonnet\""
        result = parse_comma_separated_models(models_str)
        # Should strip both types of quotes
        assert result == ["litellm/openai/gpt-4o", "litellm/anthropic/claude-3-5-sonnet"]
    
    def test_parse_models_with_whitespace(self) -> None:
        """Test parsing models with whitespace around commas and model names."""
        models_str = " litellm/openai/gpt-4o , litellm/anthropic/claude-3-5-sonnet "
        result = parse_comma_separated_models(models_str)
        assert result == ["litellm/openai/gpt-4o", "litellm/anthropic/claude-3-5-sonnet"]
    
    def test_parse_models_empty_string(self) -> None:
        """Test parsing empty string."""
        result = parse_comma_separated_models("")
        assert result == []
    
    def test_parse_models_single_model(self) -> None:
        """Test parsing single model."""
        models_str = "litellm/openai/gpt-4o"
        result = parse_comma_separated_models(models_str)
        assert result == ["litellm/openai/gpt-4o"]
        
        # With quotes
        models_str = '"litellm/openai/gpt-4o"'
        result = parse_comma_separated_models(models_str)
        assert result == ["litellm/openai/gpt-4o"]
    
    def test_parse_models_abacus_format(self) -> None:
        """Test parsing Abacus model format."""
        models_str = "Abacus/gpt-4.1,Abacus/claude-haiku-4-5-20251001"
        result = parse_comma_separated_models(models_str)
        assert result == ["Abacus/gpt-4.1", "Abacus/claude-haiku-4-5-20251001"]
        
        # With quotes
        models_str = '"Abacus/gpt-4.1","Abacus/claude-haiku-4-5-20251001"'
        result = parse_comma_separated_models(models_str)
        assert result == ["Abacus/gpt-4.1", "Abacus/claude-haiku-4-5-20251001"]
    
    @pytest.mark.parametrize("models_str,description", [
        ('"model1,model2"', 'Double quotes, no space after comma'),
        ("'model1,model2'", 'Single quotes, no space after comma'),
        ("model1,model2", 'No quotes, no space after comma'),
        ('"model1, model2"', 'Double quotes, space after comma'),
        ("'model1, model2'", 'Single quotes, space after comma'),
        ("model1, model2", 'No quotes, space after comma'),
    ])
    def test_parse_models_all_scenarios(self, models_str: str, description: str) -> None:
        """Test all specific scenarios: quotes with and without spaces after commas."""
        expected = ["model1", "model2"]
        result = parse_comma_separated_models(models_str)
        assert result == expected, f"Failed for {description}: {repr(models_str)}"
