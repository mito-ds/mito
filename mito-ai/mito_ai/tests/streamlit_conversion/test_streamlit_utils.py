# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

import pytest
import json
import tempfile
import os
from unittest.mock import patch, mock_open
from mito_ai.streamlit_conversion.streamlit_utils import (
    extract_code_blocks,
    create_app_file,
    parse_jupyter_notebook_to_extract_required_content
)
from mito_ai.path_utils import AbsoluteAppPath, AbsoluteNotebookDirPath, AbsoluteNotebookPath, get_absolute_notebook_path
from typing import Dict, Any

class TestExtractCodeBlocks:
    """Test cases for extract_code_blocks function"""

    def test_extract_code_blocks_with_python_blocks(self):
        """Test extracting code from message with python code blocks"""
        message = "Here's some code:\n```python\nimport streamlit\nst.title('Hello')\n```\nThat's it!"
        result = extract_code_blocks(message)
        expected = "import streamlit\nst.title('Hello')\n"
        assert result == expected

    def test_extract_code_blocks_without_python_blocks(self):
        """Test when message doesn't contain python code blocks"""
        message = "This is just regular text without code blocks"
        result = extract_code_blocks(message)
        assert result == message

    def test_extract_code_blocks_empty_message(self):
        """Test with empty message"""
        message = ""
        result = extract_code_blocks(message)
        assert result == message

    def test_extract_code_blocks_multiple_blocks(self):
        """Test extracting from first python block when multiple exist"""
        message = "```python\ncode1\n```\n```python\ncode2\n```"
        result = extract_code_blocks(message)
        expected = "code1\n\ncode2\n"
        assert result == expected


class TestCreateAppFile:
    """Test cases for create_app_file function"""

    def test_create_app_file_success(self, tmp_path):
        """Test successful file creation"""
        app_path = os.path.join(str(tmp_path), "app.py")
        code = "import streamlit\nst.title('Test')"
        
        create_app_file(AbsoluteAppPath(app_path), code)
        
        assert app_path is not None
        assert os.path.exists(app_path)
        
        # Verify file was created with correct content
        with open(app_path, 'r') as f:
            content = f.read()
        assert content == code

    def test_create_app_file_io_error(self):
        """Test file creation with IO error"""
        file_path = AbsoluteAppPath("/nonexistent/path/that/should/fail")
        code = "import streamlit"
        
        with pytest.raises(Exception):
            create_app_file(file_path, code)

    @patch('builtins.open', side_effect=Exception("Unexpected error"))
    def test_create_app_file_unexpected_error(self, mock_open):
        """Test file creation with unexpected error"""
        app_path = AbsoluteAppPath("/tmp/test")
        code = "import streamlit"
        
        with pytest.raises(Exception, match="Unexpected error"):
            create_app_file(app_path, code)

    def test_create_app_file_empty_code(self, tmp_path):
        """Test creating file with empty code"""
        app_path = AbsoluteAppPath(os.path.join(str(tmp_path), "app.py"))
        code = ""
        
        create_app_file(app_path, code)
        
        assert app_path is not None
        assert os.path.exists(app_path)
        
        with open(app_path, 'r') as f:
            content = f.read()
        assert content == ""


class TestParseJupyterNotebookToExtractRequiredContent:
    """Test cases for parse_jupyter_notebook_to_extract_required_content function"""

    def test_parse_valid_notebook(self, tmp_path):
        """Test parsing a valid notebook with cells"""
        notebook_data: Dict[str, Any] = {
            "cells": [
                {
                    "cell_type": "code",
                    "source": ["import pandas as pd\n", "df = pd.DataFrame()\n"],
                    "metadata": {"some": "metadata"},
                    "execution_count": 1
                },
                {
                    "cell_type": "markdown",
                    "source": ["# Title\n", "Some text\n"],
                    "metadata": {"another": "metadata"}
                }
            ],
            "metadata": {"notebook_metadata": "value"},
            "nbformat": 4
        }
        
        notebook_path = tmp_path / "test.ipynb"
        with open(notebook_path, 'w') as f:
            json.dump(notebook_data, f)
        
        absolute_path = get_absolute_notebook_path(str(notebook_path))
        result = parse_jupyter_notebook_to_extract_required_content(absolute_path)
        
        # Check that only cell_type and source are preserved
        assert len(result) == 2
        assert result[0]['cell_type'] == 'code'
        assert result[0]['source'] == ["import pandas as pd\n", "df = pd.DataFrame()\n"]
        assert 'metadata' not in result[0]
        assert 'execution_count' not in result[0]
        
        assert result[1]['cell_type'] == 'markdown'
        assert result[1]['source'] == ["# Title\n", "Some text\n"]
        assert 'metadata' not in result[1]

    def test_parse_notebook_file_not_found(self):
        """Test parsing non-existent notebook file"""
        from mito_ai.utils.error_classes import StreamlitConversionError
        with pytest.raises(StreamlitConversionError, match="Notebook file not found"):
            parse_jupyter_notebook_to_extract_required_content(AbsoluteNotebookPath("/nonexistent/path/notebook.ipynb"))

    def test_parse_notebook_with_missing_cell_fields(self, tmp_path):
        """Test parsing notebook where cells are missing cell_type or source"""
        notebook_data: Dict[str, Any] = {
            "cells": [
                {
                    "cell_type": "code"
                    # Missing source field
                },
                {
                    "source": ["some text"]
                    # Missing cell_type field
                },
                {
                    "cell_type": "markdown",
                    "source": ["# Title"]
                }
            ]
        }
        
        notebook_path = tmp_path / "test.ipynb"
        with open(notebook_path, 'w') as f:
            json.dump(notebook_data, f)
        
        absolute_path = get_absolute_notebook_path(str(notebook_path))
        result = parse_jupyter_notebook_to_extract_required_content(absolute_path)
        
        assert len(result) == 3
        assert result[0]['cell_type'] == 'code'
        assert result[0]['source'] == []  # Default empty list
        
        assert result[1]['cell_type'] == ''  # Default empty string
        assert result[1]['source'] == ["some text"]
        
        assert result[2]['cell_type'] == 'markdown'
        assert result[2]['source'] == ["# Title"]

    def test_parse_empty_notebook(self, tmp_path):
        """Test parsing notebook with empty cells list"""
        notebook_data: Dict[str, Any] = {
            "cells": []
        }
        
        notebook_path = tmp_path / "test.ipynb"
        with open(notebook_path, 'w') as f:
            json.dump(notebook_data, f)
        
        absolute_path = get_absolute_notebook_path(str(notebook_path))
        result = parse_jupyter_notebook_to_extract_required_content(absolute_path)
        
        assert result == []
