# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

import pytest
import os
import tempfile
from unittest.mock import patch, Mock, AsyncMock
from mito_ai.streamlit_preview.handlers import StreamlitPreviewHandler
from mito_ai.path_utils import AbsoluteNotebookPath


class TestStreamlitPreviewHandler:
    """Test cases for the StreamlitPreviewHandler."""

    @pytest.mark.asyncio
    @pytest.mark.parametrize(
        "app_exists,force_recreate,streamlit_handler_called",
        [
            # Test case 1: App exists, not forcing recreate - should not call streamlit_handler
            (True, False, False),
            # Test case 2: App doesn't exist - should call streamlit_handler
            (False, False, True),
            # Test case 3: App exists but forcing recreate - should call streamlit_handler
            (True, True, True),
        ],
        ids=[
            "app_exists_no_force_recreate",
            "app_does_not_exist_generates_new_one",
            "app_exists_force_recreate",
        ]
    )
    async def test_post_handler_app_generation(
        self,
        app_exists,
        force_recreate,
        streamlit_handler_called,
    ):
        """Test StreamlitPreviewHandler POST method with various scenarios."""
        with tempfile.TemporaryDirectory() as temp_dir:
            notebook_path = os.path.join(temp_dir, "test_notebook.ipynb")
            app_path = os.path.join(temp_dir, "app.py")
            
            # Create notebook file
            with open(notebook_path, "w") as f:
                f.write('{"cells": []}')
            
            # Create app.py file if it should exist
            if app_exists:
                with open(app_path, "w") as f:
                    f.write("import streamlit as st\nst.write('Hello World')")
            
            # Create handler instance
            handler = StreamlitPreviewHandler(
                application=Mock(),
                request=Mock(),
            )
            handler.initialize()
            
            # Mock methods
            handler.get_json_body = Mock(return_value={
                "notebook_path": notebook_path,
                "force_recreate": force_recreate,
                "edit_prompt": ""
            })
            handler.finish = Mock()
            
            # Mock streamlit_handler and preview manager
            with patch('mito_ai.streamlit_preview.handlers.streamlit_handler') as mock_streamlit_handler, \
                 patch.object(handler.preview_manager, 'start_streamlit_preview') as mock_start_preview, \
                 patch('mito_ai.streamlit_preview.handlers.log_streamlit_app_preview_success'):
                
                mock_streamlit_handler.return_value = AsyncMock()
                mock_start_preview.return_value = 8501
                
                # Call the handler
                await handler.post()
                
                # Verify streamlit_handler was called or not called as expected
                if streamlit_handler_called:
                    assert mock_streamlit_handler.called
                    # Verify it was called with the absolute notebook path
                    call_args = mock_streamlit_handler.call_args
                    assert call_args[0][0] == notebook_path  # First argument should be the notebook path
                    assert call_args[0][1] == ""  # Second argument should be the edit_prompt
                else:
                    mock_streamlit_handler.assert_not_called()
                
                # Verify preview was started
                mock_start_preview.assert_called_once()
                
                # Verify response was sent
                handler.finish.assert_called_once()
                response = handler.finish.call_args[0][0]
                assert response["type"] == "success"
                assert "port" in response
                assert "id" in response

    