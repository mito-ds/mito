# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

import os
import tempfile
from unittest.mock import patch, MagicMock
from mito_ai.streamlit_conversion.validate_streamlit_app import (
    StreamlitValidator,
    streamlit_code_validator
)
import pytest


class TestStreamlitValidator:
    """Test cases for StreamlitValidator class"""
    
    @pytest.mark.parametrize("code", [
        ("import streamlit\nst.title('Hello World')"),
        ("")
    ])
    def test_create_temp_app(self, code):
        """Test creating temporary app file"""
        validator = StreamlitValidator()
        
        app_path = validator.create_temp_app(code)
        
        assert validator.temp_dir is not None
        assert os.path.exists(validator.temp_dir)
        assert app_path.endswith("app.py")
        assert os.path.exists(app_path)
        
        # Check file content
        with open(app_path, 'r') as f:
            content = f.read()
        assert content == code
        
        # Cleanup
        validator.cleanup()

    @pytest.mark.parametrize("code,expected_error,test_description", [
        # Valid Python code should return no error
        (
            "import streamlit\nst.title('Hello World')",
            None,
            "valid Python code"
        ),
        # Invalid Python syntax should be caught
        (
            "import streamlit\nst.title('Hello World'",
            "SyntaxError",
            "invalid Python code"
        ),
        # Empty streamlit app is valid
        (
            "",
            None,
            "empty code"
        ),
    ])
    def test_validate_syntax(self, code, expected_error, test_description):
        """Test syntax validation with various code inputs"""
        validator = StreamlitValidator()
        
        error = validator.get_syntax_error(code)
        
        if expected_error is None:
            assert error is None, f"Expected no error for {test_description}"
        else:
            assert error is not None, f"Expected error for {test_description}"
            assert expected_error in error, f"Expected '{expected_error}' in error for {test_description}"
        
    @pytest.mark.parametrize("app_code,expected_error", [
        ("x = 5", None),
        ("1/0", "division by zero"),
        ("", None)
    ])
    def test_get_runtime_errors(self, app_code, expected_error):
        """Test getting runtime errors"""
        validator = StreamlitValidator()
        
        # Create a temporary app file
        with tempfile.TemporaryDirectory() as temp_dir:
            app_path = os.path.join(temp_dir, "app.py")
            with open(app_path, "w") as f:
                f.write(app_code)
                
            errors = validator.get_runtime_errors(app_path)
            
            if expected_error is None:
                assert errors is None
            else:
                errors_str = str(errors)
                assert expected_error in errors_str

    @patch('subprocess.Popen')
    def test_cleanup_with_process(self, mock_popen):
        """Test cleanup with running process"""
        validator = StreamlitValidator()
        validator.temp_dir = "/tmp/test_dir"
        
        # Mock directory exists
        with patch('os.path.exists', return_value=True):
            with patch('shutil.rmtree') as mock_rmtree:
                validator.cleanup()
                
                mock_rmtree.assert_called_once()


    @pytest.mark.parametrize("app_code,expected_has_validation_error,expected_error_message", [
        ("x=5", False, ""),
        ("1/0", True, "division by zero"),
        ("print('Hello World'", True, "SyntaxError"),
        ("", False, ""),
    ])
    def test_streamlit_code_validator(self, app_code, expected_has_validation_error, expected_error_message):

        has_validation_error, error_message = streamlit_code_validator(app_code)
        
        assert has_validation_error == expected_has_validation_error
        assert expected_error_message in error_message
        
    