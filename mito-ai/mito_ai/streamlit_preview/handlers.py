# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

import json
import logging
import tempfile
import uuid
from typing import Any, Dict
from tornado.web import RequestHandler
from mito_ai.logger import get_logger
from mito_ai.streamlit_conversion.streamlit_agent_handler import streamlit_handler
from mito_ai.streamlit_preview.manager import get_preview_manager
from mito_ai.utils.create import initialize_user


class StreamlitPreviewHandler(RequestHandler):
    """REST handler for streamlit preview operations."""
    
    def initialize(self) -> None:
        """Initialize the handler."""
        self.log = get_logger()
        self.preview_manager = get_preview_manager()
    
    def set_default_headers(self) -> None:
        """Set CORS headers."""
        self.set_header("Access-Control-Allow-Origin", "*")
        self.set_header("Access-Control-Allow-Headers", "Content-Type")
        self.set_header("Access-Control-Allow-Methods", "POST, DELETE, OPTIONS")
    
    def options(self, preview_id: str = "") -> None:
        """Handle CORS preflight requests."""
        self.set_status(204)
        self.finish()
    
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
        try:
            # Initialize user
            initialize_user()
            
            # Parse request body
            body = json.loads(self.request.body.decode('utf-8'))
            notebook_path = body.get('notebook_path')
            
            if not notebook_path:
                self.set_status(400)
                self.write({
                    'error': 'Missing notebook_path parameter'
                })
                return
            
            # Generate preview ID
            preview_id = str(uuid.uuid4())
            
            # Create temporary directory for the app
            with tempfile.TemporaryDirectory() as tmp_dir:
                # Generate streamlit code using existing handler
                success, message = await streamlit_handler(notebook_path, tmp_dir)
                
                if not success:
                    self.set_status(500)
                    self.write({
                        'error': f'Failed to generate streamlit code: {message}'
                    })
                    return
                
                # Read the generated app.py
                app_path = f"{tmp_dir}/app.py"
                try:
                    with open(app_path, 'r') as f:
                        app_code = f.read()
                except FileNotFoundError:
                    self.set_status(500)
                    self.write({
                        'error': 'Generated app.py file not found'
                    })
                    return
                
                # Start streamlit preview
                success, message, port = self.preview_manager.start_streamlit_preview(
                    app_code, preview_id
                )
                
                if not success:
                    self.set_status(500)
                    self.write({
                        'error': f'Failed to start preview: {message}'
                    })
                    return
                
                # Return success response
                self.set_status(200)
                self.write({
                    'id': preview_id,
                    'port': port,
                    'url': f'http://localhost:{port}'
                })
                
                # TODO: If cross-origin issues arise, we may need to proxy through Jupyter
                # by returning a URL like base_url + 'proxy/<port>/' instead of raw localhost
                
        except json.JSONDecodeError:
            self.set_status(400)
            self.write({
                'error': 'Invalid JSON in request body'
            })
        except Exception as e:
            self.log.error(f"Error in streamlit preview handler: {e}")
            self.set_status(500)
            self.write({
                'error': f'Internal server error: {str(e)}'
            })
    
    def delete(self, preview_id: str) -> None:
        """Stop a streamlit preview.
        
        Args:
            preview_id: The preview ID to stop
        """
        try:
            if not preview_id:
                self.set_status(400)
                self.write({
                    'error': 'Missing preview_id parameter'
                })
                return
            
            # Stop the preview
            stopped = self.preview_manager.stop_preview(preview_id)
            
            if stopped:
                self.set_status(204)  # No content
            else:
                self.set_status(404)
                self.write({
                    'error': f'Preview {preview_id} not found'
                })
                
        except Exception as e:
            self.log.error(f"Error stopping preview {preview_id}: {e}")
            self.set_status(500)
            self.write({
                'error': f'Internal server error: {str(e)}'
            }) 