# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

import socket
import subprocess
import time
import threading
import requests
from typing import Dict, Optional, Tuple
from dataclasses import dataclass
from mito_ai.logger import get_logger
from mito_ai.path_utils import AbsoluteNotebookDirPath, AppFileName
from mito_ai.utils.error_classes import StreamlitPreviewError


@dataclass
class PreviewProcess:
    """Data class to track a streamlit preview process."""
    proc: subprocess.Popen
    port: int


class StreamlitPreviewManager:
    """Manages streamlit preview processes and their lifecycle."""
    
    def __init__(self) -> None:
        self._previews: Dict[str, PreviewProcess] = {}
        self._lock = threading.Lock()
        self.log = get_logger()
        
    def get_free_port(self) -> int:
        """Get a free port for streamlit to use."""
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            s.bind(('', 0))
            s.listen(1)
            port = int(s.getsockname()[1])
        
        return port
    
    def start_streamlit_preview(self, app_directory: AbsoluteNotebookDirPath, app_file_name: AppFileName, preview_id: str) -> int:
        """Start a vizro preview process.

        Args:
            app_code: The vizro app code to run
            preview_id: Unique identifier for this preview

        Returns:
            Tuple of (success, message, port)
        """

        try:

            # Get free port
            port = self.get_free_port()

            # For Vizro, we need to modify the app.py to use the port we allocated
            # Read the app file and inject the port configuration
            import os
            app_path = os.path.join(app_directory, app_file_name)
            with open(app_path, 'r') as f:
                app_code = f.read()

            # Replace the run() call with run(port=X)
            # Handle both .run() and .run(...)
            import re
            if re.search(r'\.run\(\s*\)', app_code):
                # Simple case: .run() with no arguments
                app_code = re.sub(r'\.run\(\s*\)', f'.run(port={port})', app_code)
            elif re.search(r'\.run\(', app_code):
                # Has arguments - insert port as first argument
                app_code = re.sub(r'\.run\(', f'.run(port={port}, ', app_code)

            # Write back the modified code
            with open(app_path, 'w') as f:
                f.write(app_code)

            # Start python process to run the Vizro app
            cmd = [
                "python", app_file_name
            ]

            proc = subprocess.Popen(
                cmd,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True,
                cwd=app_directory
            )
            
            # Wait for app to be ready
            ready = self._wait_for_app_ready(port)
            if not ready:
                proc.terminate()
                proc.wait()
                raise StreamlitPreviewError("Vizro app failed to start as app is not ready", 500)
            
            # Register the process
            with self._lock:
                self._previews[preview_id] = PreviewProcess(
                    proc=proc,
                    port=port,
                )
            
            self.log.info(f"Started vizro preview {preview_id} on port {port}")
            return port

        except Exception as e:
            self.log.error(f"Error starting vizro preview: {e}")
            raise StreamlitPreviewError(f"Failed to start preview: {str(e)}", 500)
    
    def _wait_for_app_ready(self, port: int, timeout: int = 30) -> bool:
        """Wait for streamlit app to be ready on the given port."""
        start_time = time.time()
        
        while time.time() - start_time < timeout:
            try:
                response = requests.get(f"http://localhost:{port}", timeout=5)
                if response.status_code == 200:
                    return True
            except requests.exceptions.RequestException as e:
                self.log.info(f"Waiting for app to be ready...")
                pass
            
            time.sleep(1)
        
        return False
    
    def stop_preview(self, preview_id: str) -> bool:
        """Stop a streamlit preview process.
        
        Args:
            preview_id: The preview ID to stop
            
        Returns:
            True if stopped successfully, False if not found
        """
        self.log.info(f"Stopping preview {preview_id}")
        with self._lock:
            if preview_id not in self._previews:
                return False
            
            preview = self._previews[preview_id]
            
            # Terminate process
            try:
                preview.proc.terminate()
                preview.proc.wait(timeout=5)
            except subprocess.TimeoutExpired:
                preview.proc.kill()
                preview.proc.wait()
            except Exception as e:
                self.log.error(f"Error terminating process {preview_id}: {e}")
            
            # Remove from registry
            del self._previews[preview_id]
            
            self.log.info(f"Stopped streamlit preview {preview_id}")
            return True
    
    def get_preview(self, preview_id: str) -> Optional[PreviewProcess]:
        """Get a preview process by ID."""
        with self._lock:
            return self._previews.get(preview_id)
