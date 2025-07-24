# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

import os
import socket
import subprocess
import tempfile
import time
import threading
import logging
import requests
from typing import Dict, Optional, Tuple, Any
from dataclasses import dataclass
from mito_ai.logger import get_logger


@dataclass
class PreviewProcess:
    """Data class to track a streamlit preview process."""
    proc: subprocess.Popen
    tmpdir: str
    port: int
    last_used: float


class StreamlitPreviewManager:
    """Manages streamlit preview processes and their lifecycle."""
    
    def __init__(self):
        self._previews: Dict[str, PreviewProcess] = {}
        self._lock = threading.Lock()
        self.log = get_logger()
        
        # Start cleanup thread
        self._cleanup_thread = threading.Thread(target=self._cleanup_loop, daemon=True)
        self._cleanup_thread.start()
    
    def get_free_port(self) -> int:
        """Get a free port for streamlit to use."""
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            s.bind(('', 0))
            s.listen(1)
            port = s.getsockname()[1]
        return port
    
    def start_streamlit_preview(self, app_code: str, preview_id: str) -> Tuple[bool, str, Optional[int]]:
        """Start a streamlit preview process.
        
        Args:
            app_code: The streamlit app code to run
            preview_id: Unique identifier for this preview
            
        Returns:
            Tuple of (success, message, port)
        """
        try:
            # Create temporary directory
            tmpdir = tempfile.mkdtemp()
            app_path = os.path.join(tmpdir, "app.py")
            
            # Write app code to file
            with open(app_path, 'w') as f:
                f.write(app_code)
            
            # Get free port
            port = self.get_free_port()
            
            # Start streamlit process
            cmd = [
                "streamlit", "run", app_path,
                "--server.port", str(port),
                "--server.headless", "true",
                "--server.address", "localhost",
                "--server.enableXsrfProtection", "false",
                "--logger.level", "error"
            ]
            
            # TODO: Security considerations for production:
            # - Consider enabling XSRF protection if needed
            # - Add authentication headers to streamlit
            # - Limit number of concurrent previews
            # - Add rate limiting
            
            proc = subprocess.Popen(
                cmd,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True,
                cwd=tmpdir
            )
            
            # Wait for app to be ready
            ready = self._wait_for_app_ready(port)
            if not ready:
                proc.terminate()
                proc.wait()
                os.remove(tmpdir)
                return False, "Streamlit app failed to start", None
            
            # Register the process
            with self._lock:
                self._previews[preview_id] = PreviewProcess(
                    proc=proc,
                    tmpdir=tmpdir,
                    port=port,
                    last_used=time.time()
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
            except requests.exceptions.RequestException:
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
            
            # Clean up temp directory
            try:
                import shutil
                shutil.rmtree(preview.tmpdir)
            except Exception as e:
                self.log.error(f"Error cleaning up temp dir for {preview_id}: {e}")
            
            # Remove from registry
            del self._previews[preview_id]
            
            self.log.info(f"Stopped streamlit preview {preview_id}")
            return True
    
    def get_preview(self, preview_id: str) -> Optional[PreviewProcess]:
        """Get a preview process by ID."""
        with self._lock:
            preview = self._previews.get(preview_id)
            if preview:
                preview.last_used = time.time()
            return preview
    
    def _cleanup_loop(self):
        """Background thread to clean up stale previews."""
        while True:
            try:
                time.sleep(300)  # Check every 5 minutes
                self._cleanup_stale_previews()
            except Exception as e:
                self.log.error(f"Error in cleanup loop: {e}")
    
    def _cleanup_stale_previews(self, max_age: int = 3600):
        """Clean up previews older than max_age seconds."""
        current_time = time.time()
        to_remove = []
        
        with self._lock:
            for preview_id, preview in self._previews.items():
                if current_time - preview.last_used > max_age:
                    to_remove.append(preview_id)
            
            for preview_id in to_remove:
                self.stop_preview(preview_id)
    
    def shutdown(self):
        """Shutdown all previews (called on server shutdown)."""
        with self._lock:
            preview_ids = list(self._previews.keys())
        
        for preview_id in preview_ids:
            self.stop_preview(preview_id)


# Global instance
_preview_manager = StreamlitPreviewManager()


def get_preview_manager() -> StreamlitPreviewManager:
    """Get the global preview manager instance."""
    return _preview_manager 