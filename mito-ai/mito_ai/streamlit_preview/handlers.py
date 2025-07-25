# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

import tempfile
import uuid
import tornado
from jupyter_server.base.handlers import APIHandler
from mito_ai.streamlit_conversion.streamlit_agent_handler import streamlit_handler
from mito_ai.streamlit_preview.manager import get_preview_manager
from mito_ai.utils.create import initialize_user


class StreamlitPreviewHandler(APIHandler):
    """REST handler for streamlit preview operations."""
    
    def initialize(self) -> None:
        """Initialize the handler."""
        self.preview_manager = get_preview_manager()
    
    # Remove set_default_headers and options methods - APIHandler handles CORS automatically
    
    @tornado.web.authenticated
    async def post(self) -> None:
        """Start a new streamlit preview.
        
        Expected JSON body:
        {
            "notebook_path": "path/to/notebook.ipynb"
        }
        
        Returns:
        {
            "id": "preview_id",
            "port": 8501,
            "url": "http://localhost:8501"
        }
        """
        print("POST request received")
        try:
            # Initialize user
            initialize_user()
            
            # Parse request body - APIHandler provides self.get_json_body()
            body = self.get_json_body()
            if body is None:
                self.set_status(400)
                self.finish({"error": 'Invalid or missing JSON body'})
                return

            notebook_path = body.get('notebook_path')
            
            if not notebook_path:
                self.set_status(400)
                self.finish({"error": 'Missing notebook_path parameter'})
                return
            
            # Generate preview ID
            preview_id = str(uuid.uuid4())
            
            # Create temporary directory for the app
            with tempfile.TemporaryDirectory() as tmp_dir:
                # Generate streamlit code using existing handler
                success, message = await streamlit_handler(notebook_path, tmp_dir)
                
                if not success:
                    self.set_status(500)
                    self.finish({"error": f'Failed to generate streamlit code: {message}'})
                    return
                
                # Read the generated app.py
                app_path = f"{tmp_dir}/app.py"
                try:
                    with open(app_path, 'r') as f:
                        app_code = f.read()
                except FileNotFoundError:
                    self.set_status(500)
                    self.finish({"error": 'Generated app.py file not found'})
                    return
                
                # Start streamlit preview
                success, message, port = self.preview_manager.start_streamlit_preview(
                    app_code, preview_id
                )
                
                if not success:
                    self.set_status(500)
                    self.finish({"error": f'Failed to start preview: {message}'})
                    return
                
                # Return success response - APIHandler automatically handles JSON serialization
                self.finish({
                    'id': preview_id,
                    'port': port,
                    'url': f'http://localhost:{port}'
                })
                
                # TODO: If cross-origin issues arise, we may need to proxy through Jupyter
                # by returning a URL like base_url + 'proxy/<port>/' instead of raw localhost
                
        except Exception as e:
            print(f"Error in streamlit preview handler: {e}")
            self.set_status(500)
            self.finish({"error": f'Internal server error: {str(e)}'})
    
    @tornado.web.authenticated
    def delete(self, preview_id: str) -> None:
        """Stop a streamlit preview.
        
        Args:
            preview_id: The preview ID to stop
        """
        print(f"Stopping preview {preview_id}")
        try:
            if not preview_id:
                self.set_status(400)
                self.finish({"error": 'Missing preview_id parameter'})
                return
            
            # Stop the preview
            stopped = self.preview_manager.stop_preview(preview_id)
            
            if stopped:
                self.set_status(204)  # No content
            else:
                self.set_status(404)
                self.finish({"error": f'Preview {preview_id} not found'})
                
        except Exception as e:
            self.set_status(500)
            self.finish({"error": f'Internal server error: {str(e)}'})