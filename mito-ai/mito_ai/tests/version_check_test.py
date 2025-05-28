# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

import json
import time
import unittest
from unittest.mock import patch, MagicMock, PropertyMock
from typing import Any, Optional, Tuple, List, Dict, Callable, Union, cast

import sys
import os

# Add the project root to path
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
if project_root not in sys.path:
    sys.path.insert(0, project_root)

from mito_ai.version_check import VersionCheckHandler

class TestVersionCheckHandler(unittest.TestCase):
    
    def setUp(self) -> None:
        # Clear cache before each test
        if hasattr(VersionCheckHandler, '_get_latest_version'):
            VersionCheckHandler._get_latest_version.cache_clear()
    
    @patch("mito_ai.version_check.requests.get")
    def test_get_latest_version_method(self, mock_requests_get: MagicMock) -> None:
        # Mock successful response
        mock_response = MagicMock()
        mock_response.json.return_value = {
            "info": {"version": "1.2.3"}
        }
        mock_requests_get.return_value = mock_response
        
        # Call the method
        version, cache_time = VersionCheckHandler._get_latest_version()
        
        # Verify results
        self.assertEqual(version, "1.2.3")
        self.assertIsInstance(cache_time, float)
        
        # Call it again to use cache
        version2, cache_time2 = VersionCheckHandler._get_latest_version()
        
        # Should return same results without calling requests.get again
        self.assertEqual(version2, "1.2.3")
        self.assertEqual(cache_time, cache_time2)
        mock_requests_get.assert_called_once()
    
    @patch("mito_ai.version_check.requests.get")
    def test_get_latest_version_error(self, mock_requests_get: MagicMock) -> None:
        # Mock error response
        mock_requests_get.side_effect = Exception("Connection error")
        
        try:
            # The actual implementation lets the exception propagate when called directly
            # So we need to catch it in our test
            version, cache_time = VersionCheckHandler._get_latest_version()
            self.fail("Expected an exception but none was raised")
        except Exception as e:
            # Just verify the exception was raised
            self.assertEqual(str(e), "Connection error")
    
    @patch("mito_ai.version_check.__version__", "1.0.0")
    @patch("mito_ai.version_check.requests.get")
    def test_successful_version_fetch(self, mock_requests_get: MagicMock) -> None:
        # Mock the responses
        mock_response = MagicMock()
        mock_response.json.return_value = {
            "info": {"version": "1.1.0"}
        }
        mock_requests_get.return_value = mock_response
        
        # Create handler instance
        handler = self._create_mocked_handler()
        
        # Call the get method directly
        handler.get()
        
        # Get the response body and verify
        response_body = json.loads(handler._write_buffer[0])
        self.assertEqual(response_body["current_version"], "1.0.0")
        self.assertEqual(response_body["latest_version"], "1.1.0")
        self.assertIn("cache_age_seconds", response_body)
        
        # Verify the requests were made correctly
        mock_requests_get.assert_called_once_with(
            "https://pypi.org/pypi/mito-ai/json", timeout=3
        )
    
    @patch("mito_ai.version_check.__version__", "1.0.0")
    @patch("mito_ai.version_check.requests.get")
    def test_cache_behavior(self, mock_requests_get: MagicMock) -> None:
        # Mock the responses
        mock_response = MagicMock()
        mock_response.json.return_value = {
            "info": {"version": "1.1.0"}
        }
        mock_requests_get.return_value = mock_response
        
        # First request should make an external API call
        handler1 = self._create_mocked_handler()
        handler1.get()
        
        # Second request should use the cache
        handler2 = self._create_mocked_handler()
        handler2.get()
        
        # Verify requests.get was called only once
        mock_requests_get.assert_called_once()
    
    @patch("mito_ai.version_check.__version__", "1.0.0")
    @patch("mito_ai.version_check.requests.get")
    def test_pypi_request_failure(self, mock_requests_get: MagicMock) -> None:
        # Mock the response
        mock_requests_get.side_effect = Exception("Connection error")
        
        # Create handler instance
        handler = self._create_mocked_handler()
        
        # Call the get method directly
        handler.get()
        
        # Get the response body and verify
        response_body = json.loads(handler._write_buffer[0])
        # When the request fails, the handler returns an error response
        self.assertIn("error", response_body)
        self.assertEqual(handler._status_code, 500)
    
    @patch("mito_ai.version_check.__version__", "1.0.0")
    def test_general_exception_handling(self) -> None:
        # Create handler instance with a mock that will cause an exception
        handler = self._create_mocked_handler()
        
        with patch.object(VersionCheckHandler, '_get_latest_version', side_effect=Exception("Test error")):
            # Call the get method directly
            handler.get()
            
            # Get the response body and verify
            response_body = json.loads(handler._write_buffer[0])
            self.assertIn("error", response_body)
            self.assertEqual(handler._status_code, 500)
    
    def _create_mocked_handler(self) -> VersionCheckHandler:
        """Create a mocked RequestHandler instance for testing."""
        handler = VersionCheckHandler(MagicMock(), MagicMock())
        handler._status_code = 200
        handler._write_buffer = []
        
        # We need to assign the mock methods to new variables first to avoid
        # the mypy "Cannot assign to a method" error
        def mock_write(chunk: str) -> None:
            # Convert string to bytes to match expected type
            encoded_chunk = chunk.encode('utf-8') if isinstance(chunk, str) else chunk
            handler._write_buffer.append(encoded_chunk)
        
        def mock_set_status(status_code: int) -> None:
            handler._status_code = status_code
        
        def mock_set_header(name: str, value: str) -> None:
            pass
        
        # Use setattr instead of direct assignment to avoid mypy errors
        setattr(handler, 'write', mock_write)
        setattr(handler, 'set_status', mock_set_status)
        setattr(handler, 'set_header', mock_set_header)
        
        return handler 