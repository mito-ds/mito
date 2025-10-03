import os
import pytest
import sys
from unittest.mock import patch
from mito_ai.streamlit_conversion.streamlit_agent_handler import get_app_directory


class TestGetAppDirectory:
    """Test cases for get_app_directory function to ensure proper handling of Mac and Windows paths."""

    @pytest.mark.parametrize("notebook_path,expected_directory", [
        # Absolute paths (Unix/Mac)
        ("/Users/john/Documents/notebook.ipynb", "/Users/john/Documents"),
        ("/home/user/projects/data_analysis.ipynb", "/home/user/projects"),
        ("/var/tmp/test.ipynb", "/var/tmp"),
        ("/notebook.ipynb", "/"),
    ])
    @pytest.mark.skipif(sys.platform == "win32", reason="Unix-specific absolute path tests")
    def test_unix_absolute_paths(self, notebook_path, expected_directory):
        """Test that Unix absolute paths are handled correctly."""
        result = get_app_directory(notebook_path)
        assert result == expected_directory

    @pytest.mark.parametrize("notebook_path,expected_directory", [
        # Absolute paths (Windows)
        ("C:\\Users\\john\\Documents\\notebook.ipynb", "C:\\Users\\john\\Documents"),
        ("D:\\Projects\\data_analysis.ipynb", "D:\\Projects"),
        ("C:\\temp\\test.ipynb", "C:\\temp"),
        ("C:\\notebook.ipynb", "C:\\"),
    ])
    @pytest.mark.skipif(sys.platform != "win32", reason="Windows-specific absolute path tests")
    def test_windows_absolute_paths(self, notebook_path, expected_directory):
        """Test that Windows absolute paths are handled correctly."""
        result = get_app_directory(notebook_path)
        assert result == expected_directory

    @pytest.mark.parametrize("notebook_path,current_dir,expected_directory", [
        # Relative paths (Unix/Mac style)
        ("notebook.ipynb", "/Users/john/Documents", "/Users/john/Documents"),
        ("data/analysis.ipynb", "/home/user", "/home/user/data"),
        ("../notebook.ipynb", "/Users/john/Documents", "/Users/john"),
        ("./test.ipynb", "/var/tmp", "/var/tmp"),
        ("subfolder/deep/notebook.ipynb", "/Users/john", "/Users/john/subfolder/deep"),
    ])
    @pytest.mark.skipif(sys.platform == "win32", reason="Unix-specific relative path tests")
    def test_unix_relative_paths(self, notebook_path, current_dir, expected_directory):
        """Test that Unix relative paths are correctly resolved using current working directory."""
        with patch('os.getcwd', return_value=current_dir):
            result = get_app_directory(notebook_path)
            assert result == expected_directory

    @pytest.mark.parametrize("notebook_path,current_dir,expected_directory", [
        # Relative paths (Windows style)
        ("notebook.ipynb", "C:\\Users\\john\\Documents", "C:\\Users\\john\\Documents"),
        ("data\\analysis.ipynb", "C:\\Users\\john", "C:\\Users\\john\\data"),
        ("..\\notebook.ipynb", "C:\\Users\\john\\Documents", "C:\\Users\\john"),
        (".\\test.ipynb", "C:\\temp", "C:\\temp"),
        ("subfolder\\deep\\notebook.ipynb", "C:\\Users\\john", "C:\\Users\\john\\subfolder\\deep"),
    ])
    @pytest.mark.skipif(sys.platform != "win32", reason="Windows-specific relative path tests")
    def test_windows_relative_paths(self, notebook_path, current_dir, expected_directory):
        """Test that Windows relative paths are correctly resolved using current working directory."""
        with patch('os.getcwd', return_value=current_dir):
            result = get_app_directory(notebook_path)
            assert result == expected_directory

