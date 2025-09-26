# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

import os
import tempfile
import uuid
from mito_ai.streamlit_conversion.streamlit_utils import get_app_path
from mito_ai.streamlit_preview.utils import ensure_app_exists, validate_request_body
import tornado
from jupyter_server.base.handlers import APIHandler
from mito_ai.streamlit_conversion.streamlit_agent_handler import streamlit_handler
from mito_ai.streamlit_preview.manager import get_preview_manager
from mito_ai.utils.create import initialize_user
from typing import Tuple, Optional



class StreamlitPreviewHandler(APIHandler):
    """REST handler for streamlit preview operations."""

    def initialize(self) -> None:
        """Initialize the handler."""
        self.preview_manager = get_preview_manager()

    def _resolve_notebook_path(self, notebook_path: str) -> str:
        """
        Resolve the notebook path to an absolute path that can be found by the backend.

        This method handles path resolution issues that can occur in different environments:

        1. **Test Environment**: Playwright tests create temporary directories with complex
           paths like 'mitoai_ui_tests-app_builde-ab3a5-n-Test-Preview-as-Streamlit-chromium/'
           that the backend can't directly access.

        2. **JupyterHub/Cloud Deployments**: In cloud environments, users may have notebooks
           in subdirectories that aren't immediately accessible from the server root.

        3. **Docker Containers**: When running in containers, the working directory and
           file paths may not align with what the frontend reports.

        4. **Multi-user Environments**: In enterprise deployments, users may have notebooks
           in user-specific directories that require path resolution.

        The method tries multiple strategies:
        1. If the path is already absolute, return it as-is
        2. Try to resolve relative to the Jupyter server's root directory
        3. Search recursively through subdirectories for a file with the same name
        4. Return the original path if not found (will cause a clear error message)

        Args:
            notebook_path (str): The notebook path from the frontend (may be relative or absolute)

        Returns:
            str: The resolved absolute path to the notebook file
        """
        # If the path is already absolute, return it
        if os.path.isabs(notebook_path):
            return notebook_path

        # Get the Jupyter server's root directory
        server_root = self.settings.get("server_root_dir", os.getcwd())

        # Try to find the notebook file in the server root
        resolved_path = os.path.join(server_root, notebook_path)
        if os.path.exists(resolved_path):
            return resolved_path

        # If not found, try to find it in subdirectories
        # This handles cases where the notebook is in a subdirectory that the frontend
        # doesn't know about, or where the path structure differs between frontend and backend
        for root, dirs, files in os.walk(server_root):
            if os.path.basename(notebook_path) in files:
                return os.path.join(root, os.path.basename(notebook_path))

        # If still not found, return the original path (will cause a clear error)
        # This ensures we get a meaningful error message rather than a generic "file not found"
        return os.path.join(os.getcwd(), notebook_path)

    @tornado.web.authenticated
    async def post(self) -> None:
        """Start a new streamlit preview."""
        try:
            # Parse and validate request
            body = self.get_json_body()
            is_valid, error_msg, notebook_path, force_recreate = validate_request_body(body)
            if not is_valid or notebook_path is None:
                self.set_status(400)
                self.finish({"error": error_msg})
                return


            # Ensure app exists
            resolved_notebook_path = self._resolve_notebook_path(notebook_path)

            success, error_msg = await ensure_app_exists(resolved_notebook_path, force_recreate)

            if not success:
                self.set_status(500)
                self.finish({"error": error_msg})
                return

            # Start preview
            # TODO: There's a bug here where when the user rebuilds and already running app. Instead of 
            # creating a new process, we should update the existing process. The app displayed to the user 
            # does update, but that's just because of hot reloading when we overwrite the app.py file. 
            preview_id = str(uuid.uuid4())
            resolved_app_directory = os.path.dirname(resolved_notebook_path)
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
