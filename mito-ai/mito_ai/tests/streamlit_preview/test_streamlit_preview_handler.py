# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

import pytest
import os
import tempfile
from unittest.mock import patch
from mito_ai.streamlit_preview.utils import ensure_app_exists
from mito_ai.path_utils import AbsoluteNotebookPath, get_absolute_notebook_path


class TestEnsureAppExists:
    """Test cases for the ensure_app_exists function."""

    @pytest.mark.asyncio
    @pytest.mark.parametrize(
        "app_exists,streamlit_handler_success,streamlit_handler_called,streamlit_handler_return",
        [
            # Test case 1: App exists, should use existing file
            (
                True,  # app_exists
                True,  # streamlit_handler_success (not relevant)
                False, # streamlit_handler_called
                None,  # streamlit_handler_return (not used)
            ),
            # Test case 2: App doesn't exist, streamlit_handler succeeds
            (
                False,  # app_exists
                True,   # streamlit_handler_success
                True,   # streamlit_handler_called
                "/path/to/app.py",  # streamlit_handler_return
            )
        ],
        ids=[
            "app_exists_uses_existing_file",
            "app_does_not_exist_generates_new_one_success",
        ]
    )
    async def test_ensure_app_exists(
        self,
        app_exists,
        streamlit_handler_success,
        streamlit_handler_called,
        streamlit_handler_return,
    ):
        """Test ensure_app_exists function with various scenarios."""
        with tempfile.TemporaryDirectory() as temp_dir:
            notebook_path = os.path.join(temp_dir, "test_notebook.ipynb")
            
            # Set up app_path based on whether app exists
            app_path = os.path.join(temp_dir, "app.py") if app_exists else None
            
            # Create app.py file if it should exist
            if app_exists:
                assert app_path is not None  # Type assertion for mypy
                with open(app_path, "w") as f:
                    f.write("import streamlit as st\nst.write('Hello World')")
            
            # Mock get_app_path to return the appropriate value
            with patch('mito_ai.streamlit_preview.utils.get_absolute_notebook_dir_path') as mock_get_dir_path, \
                patch('mito_ai.streamlit_preview.utils.get_absolute_app_path') as mock_get_app_path, \
                patch('mito_ai.streamlit_preview.utils.does_app_path_exists') as mock_app_exists:
            
                # Set up mocks
                mock_get_dir_path.return_value = temp_dir
                mock_get_app_path.return_value = app_path
                mock_app_exists.return_value = app_exists
                
                # Mock streamlit_handler
                with patch('mito_ai.streamlit_preview.utils.streamlit_handler') as mock_streamlit_handler:
                    if streamlit_handler_return is not None:
                        mock_streamlit_handler.return_value = streamlit_handler_return
                    
                    await ensure_app_exists(AbsoluteNotebookPath(notebook_path), False, "")
                    
                    # Verify get_app_path was called with the correct directory
                    mock_get_app_path.assert_called_once_with(temp_dir)
                    
                    # Verify streamlit_handler was called or not called as expected
                    if streamlit_handler_called:
                        mock_streamlit_handler.assert_called_once_with(notebook_path, "")
                    else:
                        mock_streamlit_handler.assert_not_called()

    