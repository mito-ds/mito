# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

import os
import tempfile
from unittest.mock import patch, MagicMock
from mito_ai.streamlit_conversion.validate_streamlit_app import (
    get_syntax_error,
    get_runtime_errors,
    validate_app
)
import pytest
from mito_ai.path_utils import AbsoluteNotebookPath


class TestGetSyntaxError:
    """Test cases for get_syntax_error function"""

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
    def test_get_syntax_error(self, code, expected_error, test_description):
        """Test syntax validation with various code inputs"""
        error = get_syntax_error(code)

        if expected_error is None:
            assert error is None, f"Expected no error for {test_description}"
        else:
            assert error is not None, f"Expected error for {test_description}"
            assert expected_error in error, f"Expected '{expected_error}' in error for {test_description}"

class TestGetRuntimeErrors:
    """Test cases for get_runtime_errors function"""

    @pytest.mark.parametrize("app_code,expected_error", [
        ("x = 5", None),
        ("1/0", "division by zero"),
        ("", None)
    ])
    def test_get_runtime_errors(self, app_code, expected_error):
        """Test getting runtime errors"""
        
        absolute_path = AbsoluteNotebookPath('/notebook.ipynb')
        errors = get_runtime_errors(app_code, absolute_path)
        
        if expected_error is None:
            assert errors is None
        else:
            errors_str = str(errors)
            assert expected_error in errors_str
                
    def test_get_runtime_errors_with_relative_path(self):
        """Test getting runtime errors"""
        
        app_code ="""
import streamlit as st
import pandas as pd

df=pd.read_csv('data.csv')
"""
        # Create a temporary csv file in the directory temp/data.csv
        with tempfile.TemporaryDirectory() as temp_dir:
            directory = 'app_directory'
            csv_path = os.path.join(temp_dir, directory, "data.csv")
            
            os.makedirs(os.path.join(temp_dir, directory), exist_ok=True)
            app_path = os.path.join(temp_dir, directory, "app.py")
            
            # Create the file if it doesn't exist
            with open(csv_path, "w") as f:
                f.write("name,age\nJohn,25\nJane,30")
               
            errors = get_runtime_errors(app_code, AbsoluteNotebookPath(app_path))
            assert errors is None

class TestValidateApp:
    """Test cases for validate_app function"""

    @pytest.mark.parametrize("app_code,expected_has_errors,expected_error_message", [
        ("x=5", False, ""),
        ("1/0", True, "division by zero"),
        # Syntax errors are caught during runtime
        ("", False, ""),
    ])
    def test_validate_app(self, app_code, expected_has_errors, expected_error_message):
        """Test the validate_app function"""
        errors = validate_app(app_code, AbsoluteNotebookPath('/notebook.ipynb'))
        
        has_errors = len(errors) > 0
        assert has_errors == expected_has_errors
        if expected_error_message:
            errors_str = str(errors)
            assert expected_error_message in errors_str
        
    