# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

from typing import NewType
import os
from mito_ai.utils.error_classes import StreamlitPreviewError

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
        raise StreamlitPreviewError("Notebook path cannot be empty", 400)
    
    absolute_path = os.path.abspath(notebook_path)
    return AbsoluteNotebookPath(absolute_path)
    

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
    return AbsoluteAppPath(os.path.join(app_directory, "app.py"))

def does_app_path_exists(app_path: AbsoluteAppPath) -> bool:
    """
    Check if the app.py file exists in the given directory.
    """
    return os.path.exists(app_path)

