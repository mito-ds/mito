# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

import pytest
from unittest.mock import patch, AsyncMock, MagicMock
from mito_ai.streamlit_conversion.streamlit_agent_handler import (
    StreamlitCodeGeneration,
    streamlit_handler
)
from mito_ai.streamlit_conversion.streamlit_utils import clean_directory_check

# Add this line to enable async support
pytest_plugins = ('pytest_asyncio',)


class TestStreamlitCodeGeneration:
    """Test cases for StreamlitCodeGeneration class"""

    @pytest.mark.asyncio
    @patch('mito_ai.streamlit_conversion.streamlit_agent_handler.stream_anthropic_completion_from_mito_server')
    async def test_init(self, mock_stream):
        """Test StreamlitCodeGeneration initialization"""
        # Mock the async generator
        async def mock_async_gen():
            yield "Here's your code:\n```python\nimport streamlit\nst.title('Test')\n```"

        mock_stream.return_value = mock_async_gen()
        
        notebook_data: dict = {"cells": [{"cell_type": "code", "source": ["import pandas"]}]}
        streamlit_code_handler = StreamlitCodeGeneration()
        
        streamlit_code = await streamlit_code_handler.generate_streamlit_code(notebook_data)
        
        assert streamlit_code is not None
        assert len(streamlit_code) > 0
        assert "import streamlit" in streamlit_code

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
        streamlit_code_handler = StreamlitCodeGeneration()
        
        result = await streamlit_code_handler.generate_streamlit_code(notebook_data)
        
        assert result == expected_result
        mock_stream.assert_called_once()
        

    @pytest.mark.asyncio
    @patch('mito_ai.streamlit_conversion.streamlit_agent_handler.stream_anthropic_completion_from_mito_server')
    async def test_get_response_from_agent_exception(self, mock_stream):
        """Test exception handling in get_response_from_agent"""
        mock_stream.side_effect = Exception("API Error")
        
        notebook_data: dict = {"cells": []}
        streamlit_code_handler = StreamlitCodeGeneration()
        
        with pytest.raises(Exception, match="API Error"):
            await streamlit_code_handler.generate_streamlit_code(notebook_data)

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
        streamlit_code_handler = StreamlitCodeGeneration()
        
        result = await streamlit_code_handler.generate_streamlit_code(notebook_data)
        
        expected_code = "import streamlit\nst.title('Hello')\n"
        assert result == expected_code

    @pytest.mark.asyncio
    @patch('mito_ai.streamlit_conversion.streamlit_agent_handler.stream_anthropic_completion_from_mito_server')
    async def test_correct_error_in_generation_success(self, mock_stream):
        """Test successful error correction"""
        mock_response = """```unified_diff
--- a/app.py
+++ b/app.py
@@ -1,1 +1,1 @@
-import streamlit
-st.title('Test')
+import streamlit
+st.title('Fixed')
```"""
        async def mock_async_gen():
            for item in [mock_response]:
                yield item

        mock_stream.return_value = mock_async_gen()

        notebook_data: dict = {"cells": []}
        streamlit_code_handler = StreamlitCodeGeneration()

        result = await streamlit_code_handler.correct_error_in_generation("ImportError: No module named 'pandas'", "import streamlit\nst.title('Test')")

        expected_code = "import streamlit\nst.title('Fixed')\n"
        assert result == expected_code

    @pytest.mark.asyncio
    @patch('mito_ai.streamlit_conversion.streamlit_agent_handler.stream_anthropic_completion_from_mito_server')
    async def test_correct_error_in_generation_exception(self, mock_stream):
        """Test exception handling in error correction"""
        mock_stream.side_effect = Exception("API Error")
        
        streamlit_code_handler = StreamlitCodeGeneration()
        
        with pytest.raises(Exception, match="API Error"):
            await streamlit_code_handler.correct_error_in_generation("Some error", "import streamlit\nst.title('Test')")


class TestStreamlitHandler:
    """Test cases for streamlit_handler function"""

    @pytest.mark.asyncio
    @patch('mito_ai.streamlit_conversion.streamlit_agent_handler.parse_jupyter_notebook_to_extract_required_content')
    @patch('mito_ai.streamlit_conversion.streamlit_agent_handler.StreamlitCodeGeneration')
    @patch('mito_ai.streamlit_conversion.streamlit_agent_handler.validate_app')
    @patch('mito_ai.streamlit_conversion.streamlit_agent_handler.create_app_file')
    @patch('mito_ai.streamlit_conversion.streamlit_agent_handler.clean_directory_check')
    async def test_streamlit_handler_success(self, mock_clean_directory, mock_create_file, mock_validator, mock_generator_class, mock_parse):
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
        mock_create_file.return_value = (True, "/path/to/app.py", "File created successfully")
        
        # Mock clean directory check (no-op)
        mock_clean_directory.return_value = None
        
        result = await streamlit_handler("/path/to/notebook.ipynb")
        
        assert result[0] is True
        assert "File created successfully" in result[2]
        
        # Verify calls
        mock_parse.assert_called_once_with("/path/to/notebook.ipynb")
        mock_generator_class.assert_called_once_with()
        mock_generator.generate_streamlit_code.assert_called_once()
        mock_validator.assert_called_once_with("import streamlit\nst.title('Test')", "/path/to/notebook.ipynb")
        mock_create_file.assert_called_once_with("/path/to", "import streamlit\nst.title('Test')")

    @pytest.mark.asyncio
    @patch('mito_ai.streamlit_conversion.streamlit_agent_handler.parse_jupyter_notebook_to_extract_required_content')
    @patch('mito_ai.streamlit_conversion.streamlit_agent_handler.StreamlitCodeGeneration')
    @patch('mito_ai.streamlit_conversion.streamlit_agent_handler.validate_app')
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
    
        # Mock validation (always errors) - Return list of errors as expected by validate_app
        mock_validator.return_value = (True, ["Persistent error"])
    
        result = await streamlit_handler("/notebook.ipynb")
        
        # Verify the result indicates failure
        assert result[0] is False
        assert "Error generating streamlit code by agent" in result[2]
        
        # Verify that error correction was called 5 times (max retries)
        assert mock_generator.correct_error_in_generation.call_count == 5

    @pytest.mark.asyncio
    @patch('mito_ai.streamlit_conversion.streamlit_agent_handler.parse_jupyter_notebook_to_extract_required_content')
    @patch('mito_ai.streamlit_conversion.streamlit_agent_handler.StreamlitCodeGeneration')
    @patch('mito_ai.streamlit_conversion.streamlit_agent_handler.validate_app')
    @patch('mito_ai.streamlit_conversion.streamlit_agent_handler.create_app_file')
    @patch('mito_ai.streamlit_conversion.streamlit_agent_handler.clean_directory_check')
    async def test_streamlit_handler_file_creation_failure(self, mock_clean_directory, mock_create_file, mock_validator, mock_generator_class, mock_parse):
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
        
        # Mock clean directory check (no-op)
        mock_clean_directory.return_value = None
        
        result = await streamlit_handler("/path/to/notebook.ipynb")
        
        assert result[0] is False
        assert "Permission denied" in result[2]

    @pytest.mark.asyncio
    @patch('mito_ai.streamlit_conversion.streamlit_agent_handler.parse_jupyter_notebook_to_extract_required_content')
    @patch('mito_ai.streamlit_conversion.streamlit_agent_handler.clean_directory_check')
    async def test_streamlit_handler_parse_notebook_exception(self, mock_clean_directory, mock_parse):
        """Test streamlit handler when notebook parsing fails"""
        # Mock clean directory check (no-op)
        mock_clean_directory.return_value = None
        
        mock_parse.side_effect = FileNotFoundError("Notebook not found")
        
        with pytest.raises(FileNotFoundError, match="Notebook not found"):
            await streamlit_handler("/path/to/notebook.ipynb")

    @pytest.mark.asyncio
    @patch('mito_ai.streamlit_conversion.streamlit_agent_handler.parse_jupyter_notebook_to_extract_required_content')
    @patch('mito_ai.streamlit_conversion.streamlit_agent_handler.StreamlitCodeGeneration')
    @patch('mito_ai.streamlit_conversion.streamlit_agent_handler.clean_directory_check')
    async def test_streamlit_handler_generation_exception(self, mock_clean_directory, mock_generator_class, mock_parse):
        """Test streamlit handler when code generation fails"""
        # Mock notebook parsing
        mock_notebook_data: dict = {"cells": []}
        mock_parse.return_value = mock_notebook_data
        
        # Mock code generation failure
        mock_generator = AsyncMock()
        mock_generator.generate_streamlit_code.side_effect = Exception("Generation failed")
        mock_generator_class.return_value = mock_generator
        
        # Mock clean directory check (no-op)
        mock_clean_directory.return_value = None
        
        with pytest.raises(Exception, match="Generation failed"):
            await streamlit_handler("/path/to/notebook.ipynb")

    @pytest.mark.asyncio
    @patch('mito_ai.streamlit_conversion.streamlit_agent_handler.parse_jupyter_notebook_to_extract_required_content')
    @patch('mito_ai.streamlit_conversion.streamlit_agent_handler.StreamlitCodeGeneration')
    @patch('mito_ai.streamlit_conversion.streamlit_agent_handler.validate_app')
    @patch('mito_ai.streamlit_conversion.streamlit_agent_handler.create_app_file')
    @patch('mito_ai.streamlit_conversion.streamlit_agent_handler.clean_directory_check')
    async def test_streamlit_handler_too_many_files_in_directory(self, mock_clean_directory, mock_create_file, mock_validator, mock_generator_class, mock_parse):
        """Test streamlit handler when there are too many files in the directory"""
        # Mock clean directory check to raise ValueError (simulating >10 files)
        mock_clean_directory.side_effect = ValueError("Too many files in directory: 10 allowed but 15 present. Create a new directory and retry")
        
        # The function should raise the ValueError before any other processing
        with pytest.raises(ValueError, match="Too many files in directory: 10 allowed but 15 present. Create a new directory and retry"):
            await streamlit_handler("/path/to/notebook.ipynb")
        
        # Verify that clean_directory_check was called
        mock_clean_directory.assert_called_once_with("/path/to/notebook.ipynb")
        
        # Verify that no other functions were called since the error occurred early
        mock_parse.assert_not_called()
        mock_generator_class.assert_not_called()
        mock_validator.assert_not_called()
        mock_create_file.assert_not_called()


class TestCleanDirectoryCheck:
    """Test cases for clean_directory_check function"""

    @patch('mito_ai.streamlit_conversion.streamlit_utils.Path')
    def test_clean_directory_check_under_limit(self, mock_path):
        """Test clean_directory_check when directory has 10 or fewer files"""
        # Mock the Path class and its methods
        mock_path_instance = mock_path.return_value
        mock_path_instance.resolve.return_value = mock_path_instance
        mock_path_instance.parent = mock_path_instance
        
        # Mock directory existence check
        mock_path_instance.exists.return_value = True
        
        # Mock directory contents with 8 files
        mock_files = []
        for i in range(8):
            mock_file = MagicMock()
            mock_file.is_file.return_value = True
            mock_files.append(mock_file)
        
        mock_path_instance.iterdir.return_value = mock_files
        
        # Should not raise any exception
        clean_directory_check('/path/to/notebook.ipynb')
        
        # Verify calls
        mock_path.assert_called_once_with('/path/to/notebook.ipynb')
        mock_path_instance.resolve.assert_called_once()
        mock_path_instance.exists.assert_called_once()
        mock_path_instance.iterdir.assert_called_once()

    @patch('mito_ai.streamlit_conversion.streamlit_utils.Path')
    def test_clean_directory_check_over_limit(self, mock_path):
        """Test clean_directory_check when directory has more than 10 files"""
        # Mock the Path class and its methods
        mock_path_instance = mock_path.return_value
        mock_path_instance.resolve.return_value = mock_path_instance
        mock_path_instance.parent = mock_path_instance
        
        # Mock directory existence check
        mock_path_instance.exists.return_value = True
        
        # Mock directory contents with 15 files
        mock_files = []
        for i in range(15):
            mock_file = MagicMock()
            mock_file.is_file.return_value = True
            mock_files.append(mock_file)
        
        mock_path_instance.iterdir.return_value = mock_files
        
        # Should raise ValueError
        with pytest.raises(ValueError, match="Too many files in directory: 10 allowed but 15 present. Create a new directory and retry"):
            clean_directory_check('/path/to/notebook.ipynb')
        
        # Verify calls
        mock_path.assert_called_once_with('/path/to/notebook.ipynb')
        mock_path_instance.resolve.assert_called_once()
        mock_path_instance.exists.assert_called_once()
        mock_path_instance.iterdir.assert_called_once()
