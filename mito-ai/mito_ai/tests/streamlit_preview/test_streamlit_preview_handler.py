# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

import pytest
import os
import tempfile
from unittest.mock import patch, Mock, AsyncMock, MagicMock
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
            notebook_id = "test_notebook_id"
            # App file name is derived from notebook_id
            app_file_name = f"{notebook_id}.py"
            app_path = os.path.join(temp_dir, app_file_name)
            
            # Create notebook file
            with open(notebook_path, "w") as f:
                f.write('{"cells": []}')
            
            # Create app file if it should exist
            if app_exists:
                with open(app_path, "w") as f:
                    f.write("import streamlit as st\nst.write('Hello World')")
            
            # Create a properly mocked Tornado application with required attributes
            mock_application = MagicMock()
            mock_application.ui_methods = {}
            mock_application.ui_modules = {}
            mock_application.settings = {}
            
            # Create a mock request with necessary tornado setup
            mock_request = MagicMock()
            mock_request.connection = MagicMock()
            mock_request.connection.context = MagicMock()
            
            # Create handler instance  
            handler = StreamlitPreviewHandler(
                application=mock_application,
                request=mock_request,
            )
            handler.initialize()
            
            # Mock authentication - set current_user to bypass @tornado.web.authenticated
            handler.current_user = "test_user"  # type: ignore
            
            # Mock the finish method and other handler methods
            finish_called = []
            def mock_finish_func(response):
                finish_called.append(response)
            
            # Mock streamlit_handler and preview manager
            with patch.object(handler, 'get_json_body', return_value={
                "notebook_path": notebook_path,
                "notebook_id": notebook_id,
                "force_recreate": force_recreate,
                "edit_prompt": ""
            }), \
                 patch.object(handler, 'finish', side_effect=mock_finish_func), \
                 patch.object(handler, 'set_status'), \
                 patch('mito_ai.streamlit_preview.handlers.streamlit_handler', new_callable=AsyncMock) as mock_streamlit_handler, \
                 patch.object(handler.preview_manager, 'start_streamlit_preview', return_value=8501) as mock_start_preview, \
                 patch('mito_ai.streamlit_preview.handlers.log_streamlit_app_preview_success'):
                
                # Call the handler
                await handler.post()  # type: ignore[misc]
                
                # Verify streamlit_handler was called or not called as expected
                if streamlit_handler_called:
                    assert mock_streamlit_handler.called
                    # Verify it was called with the correct arguments
                    call_args = mock_streamlit_handler.call_args
                    assert call_args[0][0] == os.path.abspath(notebook_path)  # First argument should be the absolute notebook path
                    assert call_args[0][1] == app_file_name  # Second argument should be the app file name
                    assert call_args[0][2] == ""  # Third argument should be the edit_prompt
                else:
                    mock_streamlit_handler.assert_not_called()
                
                # Verify preview was started
                mock_start_preview.assert_called_once()
                
                # Verify response was sent
                assert len(finish_called) == 1
                response = finish_called[0]
                assert response["type"] == "success"
                assert "port" in response
                assert "id" in response

    