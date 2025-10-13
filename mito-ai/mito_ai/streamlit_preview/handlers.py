# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

import os
import uuid
from mito_ai.streamlit_preview.utils import ensure_app_exists, validate_request_body
import tornado
from jupyter_server.base.handlers import APIHandler
from mito_ai.streamlit_preview.manager import get_preview_manager
from typing import Tuple, Optional
from mito_ai.path_utils import  AbsoluteNotebookPath, get_absolute_notebook_path



class StreamlitPreviewHandler(APIHandler):
    """REST handler for streamlit preview operations."""

    def initialize(self) -> None:
        """Initialize the handler."""
        self.preview_manager = get_preview_manager()

    @tornado.web.authenticated
    async def post(self) -> None:
        """Start a new streamlit preview."""
        try:
            # Parse and validate request
            body = self.get_json_body()
            is_valid, error_msg, notebook_path, force_recreate, edit_prompt = validate_request_body(body)
            if not is_valid or not notebook_path:
                self.set_status(400)
                self.finish({"error": error_msg})
                return

            # Ensure app exists
            absolute_notebook_path = get_absolute_notebook_path(notebook_path)
            success, error_msg = await ensure_app_exists(absolute_notebook_path, force_recreate, edit_prompt)

            if not success:
                self.set_status(500)
                self.finish({"error": error_msg})
                return

            # Start preview
            # TODO: There's a bug here where when the user rebuilds and already running app. Instead of 
            # creating a new process, we should update the existing process. The app displayed to the user 
            # does update, but that's just because of hot reloading when we overwrite the app.py file. 
            preview_id = str(uuid.uuid4())
            resolved_app_directory = os.path.dirname(absolute_notebook_path)
            success, message, port = self.preview_manager.start_streamlit_preview(resolved_app_directory, preview_id)

            if not success:
                self.set_status(500)
                self.finish({"error": f"Failed to start preview: {message}"})
                return

            # Return success response
            self.finish({"id": preview_id, "port": port, "url": f"http://localhost:{port}"})

        except Exception as e:
            print(f"Error in streamlit preview handler: {e}")
            self.set_status(500)
            self.finish({"error": str(e)})

    @tornado.web.authenticated
    def delete(self, preview_id: str) -> None:
        """Stop a streamlit preview."""
        try:
            if not preview_id:
                self.set_status(400)
                self.finish({"error": "Missing preview_id parameter"})
                return

            # Stop the preview
            stopped = self.preview_manager.stop_preview(preview_id)

            if stopped:
                self.set_status(204)  # No content
            else:
                self.set_status(404)
                self.finish({"error": f"Preview {preview_id} not found"})

        except Exception as e:
            self.set_status(500)
            self.finish({"error": f"Internal server error: {str(e)}"})
