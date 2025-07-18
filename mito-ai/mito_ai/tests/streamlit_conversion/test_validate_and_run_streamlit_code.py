# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

import pytest
import tempfile
import os
import subprocess
import time
import ast
import importlib.util
from unittest.mock import patch, MagicMock, mock_open
from mito_ai.streamlit_conversion.validate_and_run_streamlit_code import (
    StreamlitValidator,
    streamlit_code_validator
)


class TestStreamlitValidator:
    """Test cases for StreamlitValidator class"""

    def test_validate_syntax_valid_code(self):
        """Test syntax validation with valid Python code"""
        validator = StreamlitValidator()
        code = "import streamlit\nst.title('Hello World')"
        
        is_valid, message = validator.validate_syntax(code)
        
        assert is_valid is True
        assert "Syntax is valid" in message

    def test_validate_syntax_invalid_code(self):
        """Test syntax validation with invalid Python code"""
        validator = StreamlitValidator()
        code = "import streamlit\nst.title('Hello World'  # Missing closing parenthesis"
        
        is_valid, message = validator.validate_syntax(code)
        
        assert is_valid is False
        assert "Syntax error" in message

    def test_validate_syntax_empty_code(self):
        """Test syntax validation with empty code"""
        validator = StreamlitValidator()
        code = ""
        
        is_valid, message = validator.validate_syntax(code)
        
        assert is_valid is True
        assert "Syntax is valid" in message

    def test_create_temp_app(self):
        """Test creating temporary app file"""
        validator = StreamlitValidator()
        code = "import streamlit\nst.title('Test')"
        
        app_path = validator.create_temp_app(code)
        
        assert validator.temp_dir is not None
        assert os.path.exists(validator.temp_dir)
        assert app_path.endswith("app.py")
        assert os.path.exists(app_path)
        
        # Check file content
        with open(app_path, 'r') as f:
            content = f.read()
        assert content == code
        
        # Cleanup
        validator.cleanup()

    def test_create_temp_app_empty_code(self):
        """Test creating temporary app file with empty code"""
        validator = StreamlitValidator()
        code = ""
        
        app_path = validator.create_temp_app(code)
        
        assert os.path.exists(app_path)
        
        with open(app_path, 'r') as f:
            content = f.read()
        assert content == ""
        
        # Cleanup
        validator.cleanup()

    @patch('subprocess.Popen')
    def test_start_streamlit_app_success(self, mock_popen):
        """Test successful Streamlit app startup"""
        validator = StreamlitValidator(port=8502)
        app_path = "/tmp/test/app.py"
        
        # Mock successful subprocess
        mock_process = MagicMock()
        mock_popen.return_value = mock_process
        
        success, message = validator.start_streamlit_app(app_path)
        
        assert success is True
        assert "Streamlit app started" in message
        assert validator.process == mock_process
        
        # Verify subprocess was called with correct arguments
        mock_popen.assert_called_once()
        call_args = mock_popen.call_args[0][0]
        assert "streamlit" in call_args
        assert "run" in call_args
        assert app_path in call_args
        assert "8502" in call_args

    @patch('subprocess.Popen')
    def test_start_streamlit_app_failure(self, mock_popen):
        """Test Streamlit app startup failure"""
        validator = StreamlitValidator()
        app_path = "/tmp/test/app.py"
        
        # Mock subprocess failure
        mock_popen.side_effect = Exception("Failed to start process")
        
        success, message = validator.start_streamlit_app(app_path)
        
        assert success is False
        assert "Failed to start Streamlit" in message
        assert validator.process is None

    @patch('requests.get')
    def test_wait_for_app_success(self, mock_get):
        """Test waiting for app to be ready successfully"""
        validator = StreamlitValidator(port=8502, timeout=5)
        
        # Mock successful HTTP response
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_get.return_value = mock_response
        
        success, message = validator.wait_for_app()
        
        assert success is True
        assert "App is running successfully" in message
        mock_get.assert_called_with("http://localhost:8502", timeout=5)

    @patch('requests.get')
    def test_wait_for_app_http_error(self, mock_get):
        """Test waiting for app with HTTP error"""
        validator = StreamlitValidator(port=8501, timeout=5)
        
        # Mock HTTP error response
        mock_response = MagicMock()
        mock_response.status_code = 500
        mock_get.return_value = mock_response
        
        success, message = validator.wait_for_app()
        
        assert success is False
        assert "App failed to start within timeout" in message

    @patch('subprocess.Popen')
    def test_check_for_errors_process_running(self, mock_popen):
        """Test error checking when process is running"""
        validator = StreamlitValidator()
        
        # Mock running process
        mock_process = MagicMock()
        mock_process.poll.return_value = None  # Process is running
        validator.process = mock_process
        
        success, message = validator.check_for_errors()
        
        assert success is True
        assert "App is running without errors" in message

    @patch('subprocess.Popen')
    def test_check_for_errors_process_crashed(self, mock_popen):
        """Test error checking when process has crashed"""
        validator = StreamlitValidator()
        
        # Mock crashed process
        mock_process = MagicMock()
        mock_process.poll.return_value = 1  # Process has exited
        mock_process.communicate.return_value = ("stdout", "stderr error message")
        validator.process = mock_process
        
        success, message = validator.check_for_errors()
        
        assert success is False
        assert "App crashed" in message
        assert "stderr error message" in message

    @patch('subprocess.Popen')
    def test_check_for_errors_process_crashed_with_warnings(self, mock_popen):
        """Test error checking when process crashed but only has warnings"""
        validator = StreamlitValidator()
        
        # Mock crashed process with only warnings
        mock_process = MagicMock()
        mock_process.poll.return_value = 1
        mock_process.communicate.return_value = ("stdout", "missing ScriptRunContext warning")
        validator.process = mock_process
        
        success, message = validator.check_for_errors()
        
        assert success is True
        assert "App is running without errors" in message

    def test_check_for_errors_no_process(self):
        """Test error checking when no process exists"""
        validator = StreamlitValidator()
        
        success, message = validator.check_for_errors()
        
        assert success is False
        assert "No process found" in message

    @patch('subprocess.Popen')
    def test_cleanup_with_process(self, mock_popen):
        """Test cleanup with running process"""
        validator = StreamlitValidator()
        
        # Mock process
        mock_process = MagicMock()
        validator.process = mock_process
        validator.temp_dir = "/tmp/test_dir"
        
        # Mock directory exists
        with patch('os.path.exists', return_value=True):
            with patch('shutil.rmtree') as mock_rmtree:
                validator.cleanup()
                
                mock_process.terminate.assert_called_once()
                mock_process.wait.assert_called_once()
                mock_rmtree.assert_called_once_with("/tmp/test_dir")
                
                assert validator.process is None
                assert validator.temp_dir is None

    def test_cleanup_without_process(self):
        """Test cleanup without process"""
        validator = StreamlitValidator()
        
        # Should not raise any exceptions
        validator.cleanup()
        
        assert validator.process is None
        assert validator.temp_dir is None

    @patch('subprocess.Popen')
    @patch('requests.get')
    def test_validate_app_success(self, mock_get, mock_popen):
        """Test complete validation pipeline success"""
        validator = StreamlitValidator(port=8501, timeout=5)
        code = "import streamlit\nst.title('Hello World')"
        
        # Mock successful subprocess
        mock_process = MagicMock()
        mock_process.poll.return_value = None
        mock_popen.return_value = mock_process
        
        # Mock successful HTTP response
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_get.return_value = mock_response
        
        results = validator.validate_app(code)
        
        assert results['syntax_valid'] is True
        assert results['app_starts'] is True
        assert results['app_responsive'] is True
        assert len(results['errors']) == 0

    def test_validate_app_syntax_error(self):
        """Test validation pipeline with syntax error"""
        validator = StreamlitValidator()
        code = "import streamlit\nst.title('Hello World'  # Missing parenthesis"
        
        results = validator.validate_app(code)
        
        assert results['syntax_valid'] is False
        assert results['app_starts'] is False
        assert results['app_responsive'] is False
        assert len(results['errors']) == 1
        assert "Syntax error" in results['errors'][0]

    @patch('subprocess.Popen')
    def test_validate_app_startup_failure(self, mock_popen):
        """Test validation pipeline with startup failure"""
        validator = StreamlitValidator()
        code = "import streamlit\nst.title('Hello World')"
        
        # Mock startup failure
        mock_popen.side_effect = Exception("Failed to start")
        
        results = validator.validate_app(code)
        
        assert results['syntax_valid'] is True
        assert results['app_starts'] is False
        assert results['app_responsive'] is False
        assert len(results['errors']) == 1
        assert "Failed to start Streamlit" in results['errors'][0]

    @patch('subprocess.Popen')
    @patch('requests.get')
    def test_validate_app_runtime_error(self, mock_get, mock_popen):
        """Test validation pipeline with runtime error"""
        validator = StreamlitValidator(port=8501, timeout=5)
        code = "import streamlit\nst.title('Hello World')"
        
        # Mock successful startup
        mock_process = MagicMock()
        mock_process.poll.return_value = 1  # Process crashed
        mock_process.communicate.return_value = ("stdout", "Runtime error occurred")
        mock_popen.return_value = mock_process
        
        # Mock successful HTTP response
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_get.return_value = mock_response
        
        results = validator.validate_app(code)
        
        assert results['syntax_valid'] is True
        assert results['app_starts'] is True
        assert results['app_responsive'] is True
        assert len(results['errors']) == 1
        assert "App crashed" in results['errors'][0]

    def test_validate_app_exception_handling(self):
        """Test validation pipeline exception handling"""
        validator = StreamlitValidator()
        code = "import streamlit\nst.title('Hello World')"
        
        # Mock an exception during validation
        with patch.object(validator, 'validate_syntax', side_effect=Exception("Unexpected error")):
            results = validator.validate_app(code)
            
            assert results['syntax_valid'] is False
            assert results['app_starts'] is False
            assert results['app_responsive'] is False
            assert len(results['errors']) == 1
            assert "Validation error" in results['errors'][0]


class TestStreamlitCodeValidator:
    """Test cases for streamlit_code_validator function"""

    def test_streamlit_code_validator_success(self):
        """Test successful code validation"""
        code = "import streamlit\nst.title('Hello World')"
        
        with patch('mito_ai.streamlit_conversion.validate_and_run_streamlit_code.StreamlitValidator') as mock_validator_class:
            mock_validator = MagicMock()
            mock_validator_class.return_value = mock_validator
            
            mock_validator.validate_app.return_value = {
                'syntax_valid': True,
                'app_starts': True,
                'app_responsive': True,
                'errors': []
            }
            
            has_error, message = streamlit_code_validator(code)
            
            assert has_error is False
            assert "Errors found" not in message
            mock_validator.validate_app.assert_called_once_with(code)

    def test_streamlit_code_validator_error_in_code(self):
        """Test code validation when code contains 'error'"""
        code = "error in the code"
        
        has_error, message = streamlit_code_validator(code)
        
        assert has_error is True
        assert "Errors found" in message

    def test_streamlit_code_validator_empty_code(self):
        """Test code validation with empty code"""
        code = ""
        
        with patch('mito_ai.streamlit_conversion.validate_and_run_streamlit_code.StreamlitValidator') as mock_validator_class:
            mock_validator = MagicMock()
            mock_validator_class.return_value = mock_validator
            
            mock_validator.validate_app.return_value = {
                'syntax_valid': True,
                'app_starts': True,
                'app_responsive': True,
                'errors': []
            }
            
            has_error, message = streamlit_code_validator(code)
            
            assert has_error is False
            assert "Errors found" not in message

    def test_streamlit_code_validator_multiple_errors(self):
        """Test code validation with multiple errors"""
        code = "import streamlit\nst.title('Hello World')"
        
        with patch('mito_ai.streamlit_conversion.validate_and_run_streamlit_code.StreamlitValidator') as mock_validator_class:
            mock_validator = MagicMock()
            mock_validator_class.return_value = mock_validator
            
            mock_validator.validate_app.return_value = {
                'syntax_valid': False,
                'app_starts': False,
                'app_responsive': False,
                'errors': [
                    'Syntax error: invalid syntax',
                    'App failed to start'
                ]
            }
            
            has_error, message = streamlit_code_validator(code)
            
            assert has_error is True
            assert "Errors found" in message
            assert "Syntax error" in message
            assert "App failed to start" in message