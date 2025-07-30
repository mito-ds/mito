# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

import os
import socket
import subprocess
import tempfile
import time
import threading
import requests
from typing import Dict, Optional, Tuple
from dataclasses import dataclass
from mito_ai.logger import get_logger


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
    
    def start_streamlit_preview(self, app_directory: str, preview_id: str) -> Tuple[bool, str, Optional[int]]:
        """Start a streamlit preview process.
        
        Args:
            app_code: The streamlit app code to run
            preview_id: Unique identifier for this preview
            
        Returns:
            Tuple of (success, message, port)
        """
        try:
            
            # Get free port
            port = self.get_free_port()
            
            # Start streamlit process
            cmd = [
                "streamlit", "run", 'app.py', # Since we run this command from the app_directory, we always just run app.py 
                "--server.port", str(port),
                "--server.headless", "true",
                "--server.address", "localhost",
                "--server.enableXsrfProtection", "false",
                "--server.runOnSave", "true",  # auto-reload when app.py is saved
                "--logger.level", "error"
            ]
            
            # TODO: Security considerations for production:
            # - Consider enabling XSRF protection if needed, but we might already get this with the APIHandler?
            # - Add authentication headers to streamlit
            
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
                return False, "Streamlit app failed to start", None
            
            # Register the process
            with self._lock:
                self._previews[preview_id] = PreviewProcess(
                    proc=proc,
                    port=port,
                )
            
            self.log.info(f"Started streamlit preview {preview_id} on port {port}")
            return True, "Preview started successfully", port
            
        except Exception as e:
            self.log.error(f"Error starting streamlit preview: {e}")
            return False, f"Failed to start preview: {str(e)}", None
    
    def _wait_for_app_ready(self, port: int, timeout: int = 30) -> bool:
        """Wait for streamlit app to be ready on the given port."""
        start_time = time.time()
        
        while time.time() - start_time < timeout:
            try:
                response = requests.get(f"http://localhost:{port}", timeout=5)
                if response.status_code == 200:
                    return True
            except requests.exceptions.RequestException as e:
                print(f"Error waiting for app to be ready: {e}")
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
        print(f"Stopping preview {preview_id}")
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

# Global instance
_preview_manager = StreamlitPreviewManager()


def get_preview_manager() -> StreamlitPreviewManager:
    """Get the global preview manager instance."""
    return _preview_manager 