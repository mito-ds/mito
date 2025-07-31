# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

import pytest
import time
import tempfile
import os
import shutil
import subprocess
import threading
import requests
from unittest.mock import Mock, patch, MagicMock
from typing import Any

from mito_ai.streamlit_preview.manager import (
    StreamlitPreviewManager, 
    PreviewProcess, 
    get_preview_manager
)


class TestStreamlitPreviewManager:
    """Test cases for StreamlitPreviewManager."""
    
    @pytest.fixture
    def manager(self):
        """Create a fresh manager instance for each test."""
        return StreamlitPreviewManager()
    
    @pytest.fixture
    def sample_app_code(self):
        """Sample streamlit app code for testing."""
        return """
import streamlit as st

st.title("Test App")
st.write("Hello, World!")
"""
    
    def test_init(self, manager):
        """Test manager initialization."""
        assert manager._previews == {}
        assert isinstance(manager._lock, type(threading.Lock()))
        assert manager.log is not None
    
    def test_get_free_port(self, manager):
        """Test getting a free port."""
        port = manager.get_free_port()
        assert isinstance(port, int)
        assert port > 0
        assert port < 65536
        
        # Test that we get different ports
        port2 = manager.get_free_port()
        assert port != port2
    
    @pytest.mark.parametrize("app_code,preview_id,expected_success", [
        ("import streamlit as st\nst.write('Hello')", "test_preview", True),
        ("", "empty_preview", True),
        ("import streamlit as st\n" * 1000 + "st.write('Large app')", "large_preview", True),
    ])
    def test_start_streamlit_preview_success_cases(self, manager, app_code, preview_id, expected_success):
        """Test successful streamlit preview start with different app codes."""
        with patch('subprocess.Popen') as mock_popen, \
             patch('requests.get') as mock_requests_get, \
             patch('tempfile.mkdtemp') as mock_mkdtemp:
            
            # Setup mocks
            app_directory = "/tmp/test_dir"
            mock_mkdtemp.return_value = app_directory
            mock_proc = Mock()
            mock_proc.terminate.return_value = None
            mock_proc.wait.return_value = None
            mock_popen.return_value = mock_proc
            
            mock_response = Mock()
            mock_response.status_code = 200
            mock_requests_get.return_value = mock_response
            
            # Test
            success, message, port = manager.start_streamlit_preview(app_directory, preview_id)
            
            # Assertions
            assert success == expected_success
            if expected_success:
                assert "successfully" in message.lower()
                assert isinstance(port, int)
                assert port > 0
                
                # Verify subprocess was called correctly
                mock_popen.assert_called_once()
                call_args = mock_popen.call_args
                assert "streamlit" in call_args[0][0]
                assert "run" in call_args[0][0]
                assert "--server.headless" in call_args[0][0]
                assert "--server.address" in call_args[0][0]
                
                # Cleanup
                manager.stop_preview(preview_id)
    
    @pytest.mark.parametrize("exception_type,expected_message", [
        (Exception("Temp dir creation failed"), "failed to start preview"),
        (OSError("Permission denied"), "failed to start preview"),
        (ValueError("Invalid argument"), "failed to start preview"),
    ])
    def test_start_streamlit_preview_exceptions(self, manager, sample_app_code, exception_type, expected_message):
        """Test streamlit preview start with different exceptions."""
        with patch('tempfile.mkdtemp', side_effect=exception_type):
            app_directory = "/tmp/test_dir"
            success, message, port = manager.start_streamlit_preview(app_directory, "test_preview")
            
            assert success is False
            assert expected_message in message.lower()
            assert port is None
    
    @pytest.mark.parametrize("preview_id,expected_result", [
        ("existing_preview", True),
        ("non_existent", False),
    ])
    def test_stop_preview_scenarios(self, manager, sample_app_code, preview_id, expected_result):
        """Test stopping previews with different scenarios."""
        if expected_result:
            # Start a preview first
            with patch('subprocess.Popen') as mock_popen, \
                 patch('requests.get') as mock_requests_get, \
                 patch('tempfile.mkdtemp') as mock_mkdtemp, \
                 patch('builtins.open', create=True) as mock_open, \
                 patch('os.path.exists') as mock_exists:
                
                app_directory = "/tmp/test_dir"
                mock_mkdtemp.return_value = app_directory
                mock_proc = Mock()
                mock_proc.terminate.return_value = None
                mock_proc.wait.return_value = None
                mock_popen.return_value = mock_proc
                
                mock_response = Mock()
                mock_response.status_code = 200
                mock_requests_get.return_value = mock_response
                
                # Mock file operations
                mock_file = Mock()
                mock_open.return_value.__enter__.return_value = mock_file
                mock_exists.return_value = True
                
                manager.start_streamlit_preview(app_directory, preview_id)
    
    @pytest.mark.parametrize("process_behavior,expected_kill_called", [
        (subprocess.TimeoutExpired("cmd", 5), True),
        (None, False),  # Normal termination
    ])
    def test_stop_preview_process_behaviors(self, manager, sample_app_code, process_behavior, expected_kill_called):
        """Test stopping preview with different process behaviors."""
        with patch('subprocess.Popen') as mock_popen, \
             patch('requests.get') as mock_requests_get, \
             patch('tempfile.mkdtemp') as mock_mkdtemp, \
             patch('builtins.open', create=True) as mock_open, \
             patch('os.path.exists') as mock_exists:
            
            # Setup mocks for start
            app_directory = "/tmp/test_dir"
            mock_mkdtemp.return_value = app_directory
            
            mock_proc = Mock()
            mock_proc.terminate.return_value = None
            mock_proc.wait.return_value = None
            mock_popen.return_value = mock_proc
            
            mock_response = Mock()
            mock_response.status_code = 200
            mock_requests_get.return_value = mock_response
            
            # Mock file operations
            mock_file = Mock()
            mock_open.return_value.__enter__.return_value = mock_file
            mock_exists.return_value = True
            
            # Start a preview
            manager.start_streamlit_preview(app_directory, "test_preview")
            
            # Setup process behavior for stop
            if process_behavior:
                # Configure the mock to raise the exception when called with timeout
                def wait_with_timeout(*args, **kwargs):
                    if 'timeout' in kwargs:
                        raise process_behavior
                    return None
                mock_proc.wait.side_effect = wait_with_timeout
    
    @pytest.mark.parametrize("preview_id,expected_found", [
        ("existing_preview", True),
        ("non_existent", False),
    ])
    def test_get_preview_scenarios(self, manager, sample_app_code, preview_id, expected_found):
        """Test getting previews with different scenarios."""
        if expected_found:
            # Start a preview first
            with patch('subprocess.Popen') as mock_popen, \
                 patch('requests.get') as mock_requests_get, \
                 patch('tempfile.mkdtemp') as mock_mkdtemp, \
                 patch('builtins.open', create=True) as mock_open, \
                 patch('os.path.exists') as mock_exists:
                
                mock_mkdtemp.return_value = "/tmp/test_dir"
                mock_proc = Mock()
                mock_proc.terminate.return_value = None
                mock_proc.wait.return_value = None
                mock_popen.return_value = mock_proc
                
                mock_response = Mock()
                mock_response.status_code = 200
                mock_requests_get.return_value = mock_response
                
                # Mock file operations
                mock_file = Mock()
                mock_open.return_value.__enter__.return_value = mock_file
                mock_exists.return_value = True
                
                manager.start_streamlit_preview("/tmp/test_dir", preview_id)
        
        preview = manager.get_preview(preview_id)
        
        if expected_found:
            assert preview is not None
            assert isinstance(preview, PreviewProcess)
            assert preview.port > 0
            
            # Cleanup
            manager.stop_preview(preview_id)
        else:
            assert preview is None
    
    def test_preview_process_dataclass(self):
        """Test PreviewProcess dataclass."""
        proc = Mock()
        port = 8080
        
        preview = PreviewProcess(
            proc=proc,
            port=port
        )
        
        assert preview.proc == proc
        assert preview.port == port
    
    def test_get_preview_manager_singleton(self):
        """Test that get_preview_manager returns the same instance."""
        manager1 = get_preview_manager()
        manager2 = get_preview_manager()
        
        assert manager1 is manager2
        assert isinstance(manager1, StreamlitPreviewManager)
    
    @pytest.mark.parametrize("num_previews", [1, 2, 3])
    def test_concurrent_previews(self, manager, sample_app_code, num_previews):
        """Test managing multiple concurrent previews."""
        preview_ids = [f"preview_{i}" for i in range(num_previews)]
        ports = []
        
        with patch('subprocess.Popen') as mock_popen, \
             patch('requests.get') as mock_requests_get, \
             patch('tempfile.mkdtemp') as mock_mkdtemp, \
             patch('builtins.open', create=True) as mock_open, \
             patch('os.path.exists') as mock_exists:
            
            # Setup mocks
            mock_mkdtemp.return_value = "/tmp/test_dir"
            mock_proc = Mock()
            mock_proc.terminate.return_value = None
            mock_proc.wait.return_value = None
            mock_popen.return_value = mock_proc
            
            mock_response = Mock()
            mock_response.status_code = 200
            mock_requests_get.return_value = mock_response
            
            # Mock file operations
            mock_file = Mock()
            mock_open.return_value.__enter__.return_value = mock_file
            mock_exists.return_value = True
            
            # Start multiple previews
            for preview_id in preview_ids:
                success, _, port = manager.start_streamlit_preview("/tmp/test_dir", preview_id)
                assert success is True
                ports.append(port)
            
            # Assertions
            assert len(set(ports)) == num_previews  # All ports should be different
            
            # Check all previews exist
            for preview_id in preview_ids:
                assert manager.get_preview(preview_id) is not None
            
            # Stop all previews
            for preview_id in preview_ids:
                assert manager.stop_preview(preview_id)
            
            # Verify they're gone
            for preview_id in preview_ids:
                assert manager.get_preview(preview_id) is None
    
