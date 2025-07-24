# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

import unittest
from unittest.mock import patch, MagicMock
from .manager import StreamlitPreviewManager, get_preview_manager


class TestStreamlitPreviewManager(unittest.TestCase):
    """Test cases for StreamlitPreviewManager."""
    
    def setUp(self):
        """Set up test fixtures."""
        self.manager = StreamlitPreviewManager()
    
    def test_get_free_port(self):
        """Test that get_free_port returns a valid port."""
        port = self.manager.get_free_port()
        self.assertIsInstance(port, int)
        self.assertGreater(port, 0)
        self.assertLess(port, 65536)
    
    @patch('subprocess.Popen')
    @patch('requests.get')
    def test_start_streamlit_preview_success(self, mock_get, mock_popen):
        """Test successful streamlit preview start."""
        # Mock successful HTTP response
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_get.return_value = mock_response
        
        # Mock subprocess
        mock_process = MagicMock()
        mock_popen.return_value = mock_process
        
        # Test
        success, message, port = self.manager.start_streamlit_preview(
            "import streamlit as st\nst.write('Hello')", "test-id"
        )
        
        self.assertTrue(success)
        self.assertIsInstance(port, int)
        self.assertIn("successfully", message.lower())
    
    @patch('subprocess.Popen')
    @patch('requests.get')
    def test_start_streamlit_preview_failure(self, mock_get, mock_popen):
        """Test streamlit preview start failure."""
        # Mock failed HTTP response
        mock_get.side_effect = Exception("Connection failed")
        
        # Mock subprocess
        mock_process = MagicMock()
        mock_popen.return_value = mock_process
        
        # Test
        success, message, port = self.manager.start_streamlit_preview(
            "import streamlit as st\nst.write('Hello')", "test-id"
        )
        
        self.assertFalse(success)
        self.assertIsNone(port)
        self.assertIn("failed", message.lower())
    
    def test_stop_preview_not_found(self):
        """Test stopping a non-existent preview."""
        result = self.manager.stop_preview("non-existent-id")
        self.assertFalse(result)
    
    def test_get_preview_not_found(self):
        """Test getting a non-existent preview."""
        result = self.manager.get_preview("non-existent-id")
        self.assertIsNone(result)


if __name__ == '__main__':
    unittest.main() 