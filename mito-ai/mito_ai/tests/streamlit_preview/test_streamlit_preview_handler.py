# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

import pytest
import os
import tempfile
from unittest.mock import patch, AsyncMock, MagicMock
from mito_ai.streamlit_preview.utils import ensure_app_exists


class TestEnsureAppExists:
    """Test cases for the ensure_app_exists function."""

    @pytest.mark.asyncio
    @pytest.mark.parametrize(
        "app_exists,streamlit_handler_success,expected_success,expected_error,streamlit_handler_called,streamlit_handler_return",
        [
            # Test case 1: App exists, should use existing file
            (
                True,  # app_exists
                True,  # streamlit_handler_success (not relevant)
                True,  # expected_success
                "",    # expected_error
                False, # streamlit_handler_called
                None,  # streamlit_handler_return (not used)
            ),
            # Test case 2: App doesn't exist, streamlit_handler succeeds
            (
                False,  # app_exists
                True,   # streamlit_handler_success
                True,   # expected_success
                "",     # expected_error
                True,   # streamlit_handler_called
                (True, "/path/to/app.py", "Success"),  # streamlit_handler_return
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
        expected_success,
        expected_error,
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
            with patch('mito_ai.streamlit_preview.utils.get_app_path') as mock_get_app_path:
                mock_get_app_path.return_value = app_path
                
                # Mock streamlit_handler
                with patch('mito_ai.streamlit_preview.utils.streamlit_handler') as mock_streamlit_handler:
                    if streamlit_handler_return is not None:
                        mock_streamlit_handler.return_value = streamlit_handler_return
                    
                    success, error_msg = await ensure_app_exists(notebook_path)
                    
                    # Assertions
                    assert success == expected_success
                    assert error_msg == expected_error
                    
                    # Verify get_app_path was called with the correct directory
                    mock_get_app_path.assert_called_once_with(temp_dir)
                    
                    # Verify streamlit_handler was called or not called as expected
                    if streamlit_handler_called:
                        mock_streamlit_handler.assert_called_once_with(notebook_path)
                    else:
                        mock_streamlit_handler.assert_not_called()

    