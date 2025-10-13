# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

from typing import NewType, Optional
import os
from pathlib import Path

# Type definitions for better type safety
AbsoluteNotebookPath = NewType('AbsoluteNotebookPath', str)
AbsoluteNotebookDirPath = NewType('AbsoluteNotebookDirPath', str)
AbsoluteAppPath = NewType('AbsoluteAppPath', str)

def get_absolute_notebook_path(notebook_path: str) -> AbsoluteNotebookPath:
    """
    Convert any notebook path to an absolute path.
    
    Args:
        notebook_path: Path to the notebook (can be relative or absolute)
        
    Returns:
        AbsoluteNotebookPath: The absolute path to the notebook
        
    Raises:
        ValueError: If the path is invalid or empty
    """
    if not notebook_path or not notebook_path.strip():
        raise ValueError("Notebook path cannot be empty")
    
    # Handle Unix-style (/) and Windows-style (C:) absolute paths
    if not (notebook_path.startswith('/') or (len(notebook_path) > 1 and notebook_path[1] == ':')):
        notebook_path = os.path.join(os.getcwd(), notebook_path)
    
    return AbsoluteNotebookPath(notebook_path)

def get_absolute_notebook_dir_path(notebook_path: AbsoluteNotebookPath) -> AbsoluteNotebookDirPath:
    """
    Get the directory containing the notebook.
    
    Args:
        notebook_path: Absolute path to the notebook
        
    Returns:
        AbsoluteNotebookDirPath: The directory containing the notebook
    """
    return AbsoluteNotebookDirPath(os.path.dirname(notebook_path))

def get_absolute_app_path(app_directory: AbsoluteNotebookDirPath) -> AbsoluteAppPath:
    """
    Check if the app.py file exists in the given directory.
    """
    app_path = os.path.join(app_directory, "app.py")
    if not os.path.exists(app_path):
        return None
    return app_path

def check_if_app_path_exists(app_path: AbsoluteAppPath) -> bool:
    """
    Check if the app.py file exists in the given directory.
    """
    return os.path.exists(app_path)

def validate_notebook_path(notebook_path: str) -> tuple[bool, str]:
    """
    Validate that a notebook path exists and is accessible.
    
    Args:
        notebook_path: Path to validate
        
    Returns:
        tuple[bool, str]: (is_valid, error_message)
    """
    try:
        abs_path = get_absolute_notebook_path(notebook_path)
        
        # Check if file exists
        if not os.path.exists(abs_path):
            return False, f"Notebook file not found: {abs_path}"
        
        # Check if it's a file (not a directory)
        if not os.path.isfile(abs_path):
            return False, f"Path is not a file: {abs_path}"
        
        # Check if directory is accessible
        dir_path = get_absolute_notebook_dir_path(abs_path)
        if not os.path.exists(dir_path):
            return False, f"Directory does not exist: {dir_path}"
        
        return True, ""
        
    except ValueError as e:
        return False, str(e)
    except Exception as e:
        return False, f"Error validating path: {str(e)}"
