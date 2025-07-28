# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

import pytest
from unittest.mock import patch, AsyncMock
from mito_ai.streamlit_conversion.streamlit_agent_handler import (
    StreamlitCodeGeneration,
    streamlit_handler
)
from typing import cast

# Add this line to enable async support
pytest_plugins = ('pytest_asyncio',)


class TestStreamlitCodeGeneration:
    """Test cases for StreamlitCodeGeneration class"""

    def test_init(self):
        """Test StreamlitCodeGeneration initialization"""
        notebook_data: dict = {"cells": [{"cell_type": "code", "source": ["import pandas"]}]}
        generator = StreamlitCodeGeneration(notebook_data)
        
        assert len(generator.messages) == 1
        assert generator.messages[0]["role"] == "user"
        # Access content properly as a list and cast to expected type
        content_list = cast(list, generator.messages[0]["content"])
        assert isinstance(content_list, list)
        assert len(content_list) > 0
        content_item = cast(dict, content_list[0])
        assert content_item["type"] == "text"
        assert "jupyter notebook content" in content_item["text"]

    @pytest.mark.asyncio
    @patch('mito_ai.streamlit_conversion.streamlit_agent_handler.stream_anthropic_completion_from_mito_server')
    @pytest.mark.parametrize("mock_items,expected_result", [
        (["Hello", " World", "!"], "Hello World!"),
        ([], ""),
        (["Here's your code: import streamlit"], "Here's your code: import streamlit")
    ])
    async def test_get_response_from_agent(self, mock_stream, mock_items, expected_result):
        """Test response from agent with different scenarios"""
        # Mock the async generator
        async def mock_async_gen():
            for item in mock_items:
                yield item

        mock_stream.return_value = mock_async_gen()
        
        notebook_data: dict = {"cells": []}
        generator = StreamlitCodeGeneration(notebook_data)
        
        result = await generator.get_response_from_agent(generator.messages)
        
        assert result == expected_result
        mock_stream.assert_called_once()
        

    @pytest.mark.asyncio
    @patch('mito_ai.streamlit_conversion.streamlit_agent_handler.stream_anthropic_completion_from_mito_server')
    async def test_get_response_from_agent_exception(self, mock_stream):
        """Test exception handling in get_response_from_agent"""
        mock_stream.side_effect = Exception("API Error")
        
        notebook_data: dict = {"cells": []}
        generator = StreamlitCodeGeneration(notebook_data)
        
        with pytest.raises(Exception, match="API Error"):
            await generator.get_response_from_agent(generator.messages)

    def test_add_agent_response_to_context(self):
        """Test adding agent response to message history"""
        notebook_data: dict = {"cells": []}
        generator = StreamlitCodeGeneration(notebook_data)
        
        initial_count = len(generator.messages)
        generator.add_agent_response_to_context("Test response")
        
        assert len(generator.messages) == initial_count + 1
        assert generator.messages[-1]["role"] == "assistant"
        # Access content properly as a list and cast to expected type
        content_list = cast(list, generator.messages[-1]["content"])
        assert isinstance(content_list, list)
        assert len(content_list) > 0
        content_item = cast(dict, content_list[0])
        assert content_item["type"] == "text"
        assert content_item["text"] == "Test response"

    @pytest.mark.asyncio
    @patch('mito_ai.streamlit_conversion.streamlit_agent_handler.stream_anthropic_completion_from_mito_server')
    async def test_generate_streamlit_code_success(self, mock_stream):
        """Test successful streamlit code generation"""
        mock_response = "Here's your code:\n```python\nimport streamlit\nst.title('Hello')\n```"

        async def mock_async_gen():
            for item in [mock_response]:
                yield item

        mock_stream.return_value = mock_async_gen()
        
        notebook_data: dict = {"cells": []}
        generator = StreamlitCodeGeneration(notebook_data)
        
        result = await generator.generate_streamlit_code()
        
        expected_code = "import streamlit\nst.title('Hello')\n"
        assert result == expected_code
        
        # Check that response was added to context
        assert len(generator.messages) == 2
        assert generator.messages[-1]["role"] == "assistant"

    @pytest.mark.asyncio
    @patch('mito_ai.streamlit_conversion.streamlit_agent_handler.stream_anthropic_completion_from_mito_server')
    async def test_correct_error_in_generation_success(self, mock_stream):
        """Test successful error correction"""
        mock_response = "Here's the corrected code:\n```python\nimport streamlit\nst.title('Fixed')\n```"
        async def mock_async_gen():
            for item in [mock_response]:
                yield item

        mock_stream.return_value = mock_async_gen()

        notebook_data: dict = {"cells": []}
        generator = StreamlitCodeGeneration(notebook_data)

        result = await generator.correct_error_in_generation("ImportError: No module named 'pandas'")

        expected_code = "import streamlit\nst.title('Fixed')\n"
        assert result == expected_code

        # Check that error message and response were added to context
        assert len(generator.messages) == 3
        assert generator.messages[-2]["role"] == "user"
        assert generator.messages[-1]["role"] == "assistant"

    @pytest.mark.asyncio
    @patch('mito_ai.streamlit_conversion.streamlit_agent_handler.stream_anthropic_completion_from_mito_server')
    async def test_correct_error_in_generation_exception(self, mock_stream):
        """Test exception handling in error correction"""
        mock_stream.side_effect = Exception("API Error")
        
        notebook_data: dict = {"cells": []}
        generator = StreamlitCodeGeneration(notebook_data)
        
        with pytest.raises(Exception, match="API Error"):
            await generator.correct_error_in_generation("Some error")


class TestStreamlitHandler:
    """Test cases for streamlit_handler function"""

    @pytest.mark.asyncio
    @patch('mito_ai.streamlit_conversion.streamlit_agent_handler.parse_jupyter_notebook_to_extract_required_content')
    @patch('mito_ai.streamlit_conversion.streamlit_agent_handler.StreamlitCodeGeneration')
    @patch('mito_ai.streamlit_conversion.streamlit_agent_handler.streamlit_code_validator')
    @patch('mito_ai.streamlit_conversion.streamlit_agent_handler.create_app_file')
    async def test_streamlit_handler_success(self, mock_create_file, mock_validator, mock_generator_class, mock_parse):
        """Test successful streamlit handler execution"""
        # Mock notebook parsing
        mock_notebook_data: dict = {"cells": [{"cell_type": "code", "source": ["import pandas"]}]}
        mock_parse.return_value = mock_notebook_data
        
        # Mock code generation
        mock_generator = AsyncMock()
        mock_generator.generate_streamlit_code.return_value = "import streamlit\nst.title('Test')"
        mock_generator_class.return_value = mock_generator
        
        # Mock validation (no errors)
        mock_validator.return_value = (False, "")
        
        # Mock file creation
        mock_create_file.return_value = (True, "/path/to/app", "File created successfully")
        
        result = await streamlit_handler("/path/to/notebook.ipynb")
        
        assert result[0] is True
        assert "File created successfully" in result[2]
        
        # Verify calls
        mock_parse.assert_called_once_with("/path/to/notebook.ipynb")
        mock_generator_class.assert_called_once_with(mock_notebook_data)
        mock_generator.generate_streamlit_code.assert_called_once()
        mock_validator.assert_called_once_with("import streamlit\nst.title('Test')")
        mock_create_file.assert_called_once_with("/path/to/app", "import streamlit\nst.title('Test')")

    @pytest.mark.asyncio
    @patch('mito_ai.streamlit_conversion.streamlit_agent_handler.parse_jupyter_notebook_to_extract_required_content')
    @patch('mito_ai.streamlit_conversion.streamlit_agent_handler.StreamlitCodeGeneration')
    @patch('mito_ai.streamlit_conversion.streamlit_agent_handler.streamlit_code_validator')
    async def test_streamlit_handler_max_retries_exceeded(self, mock_validator, mock_generator_class, mock_parse):
        """Test streamlit handler when max retries are exceeded"""
        # Mock notebook parsing
        mock_notebook_data: dict = {"cells": []}
        mock_parse.return_value = mock_notebook_data
        
        # Mock code generation
        mock_generator = AsyncMock()
        mock_generator.generate_streamlit_code.return_value = "import streamlit\nst.title('Test')"
        mock_generator.correct_error_in_generation.return_value = "import streamlit\nst.title('Fixed')"
        mock_generator_class.return_value = mock_generator
        
        # Mock validation (always errors)
        mock_validator.return_value = (True, None, "Persistent error")
        
        result = await streamlit_handler("/path/to/notebook.ipynb")
        
        assert result[0] is False
        assert "Error generating streamlit code by agent" in result[2]
        
        # Verify that error correction was called 5 times (max retries)
        assert mock_generator.correct_error_in_generation.call_count == 5

    @pytest.mark.asyncio
    @patch('mito_ai.streamlit_conversion.streamlit_agent_handler.parse_jupyter_notebook_to_extract_required_content')
    @patch('mito_ai.streamlit_conversion.streamlit_agent_handler.StreamlitCodeGeneration')
    @patch('mito_ai.streamlit_conversion.streamlit_agent_handler.streamlit_code_validator')
    @patch('mito_ai.streamlit_conversion.streamlit_agent_handler.create_app_file')
    async def test_streamlit_handler_file_creation_failure(self, mock_create_file, mock_validator, mock_generator_class, mock_parse):
        """Test streamlit handler when file creation fails"""
        # Mock notebook parsing
        mock_notebook_data: dict = {"cells": []}
        mock_parse.return_value = mock_notebook_data
        
        # Mock code generation
        mock_generator = AsyncMock()
        mock_generator.generate_streamlit_code.return_value = "import streamlit\nst.title('Test')"
        mock_generator_class.return_value = mock_generator
        
        # Mock validation (no errors)
        mock_validator.return_value = (False, "")
        
        # Mock file creation failure
        mock_create_file.return_value = (False, None, "Permission denied")
        
        result = await streamlit_handler("/path/to/notebook.ipynb")
        
        assert result[0] is False
        assert "Permission denied" in result[2]

    @pytest.mark.asyncio
    @patch('mito_ai.streamlit_conversion.streamlit_agent_handler.parse_jupyter_notebook_to_extract_required_content')
    async def test_streamlit_handler_parse_notebook_exception(self, mock_parse):
        """Test streamlit handler when notebook parsing fails"""
        mock_parse.side_effect = FileNotFoundError("Notebook not found")
        
        with pytest.raises(FileNotFoundError, match="Notebook not found"):
            await streamlit_handler("/path/to/notebook.ipynb")

    @pytest.mark.asyncio
    @patch('mito_ai.streamlit_conversion.streamlit_agent_handler.parse_jupyter_notebook_to_extract_required_content')
    @patch('mito_ai.streamlit_conversion.streamlit_agent_handler.StreamlitCodeGeneration')
    async def test_streamlit_handler_generation_exception(self, mock_generator_class, mock_parse):
        """Test streamlit handler when code generation fails"""
        # Mock notebook parsing
        mock_notebook_data: dict = {"cells": []}
        mock_parse.return_value = mock_notebook_data
        
        # Mock code generation failure
        mock_generator = AsyncMock()
        mock_generator.generate_streamlit_code.side_effect = Exception("Generation failed")
        mock_generator_class.return_value = mock_generator
        
        with pytest.raises(Exception, match="Generation failed"):
            await streamlit_handler("/path/to/notebook.ipynb")
