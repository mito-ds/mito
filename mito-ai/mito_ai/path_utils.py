# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

from typing import NewType
import os
from mito_ai.utils.error_classes import StreamlitPreviewError

# Type definitions for better type safety
AbsoluteNotebookPath = NewType('AbsoluteNotebookPath', str)
AbsoluteNotebookDirPath = NewType('AbsoluteNotebookDirPath', str)
AbsoluteAppPath = NewType('AbsoluteAppPath', str)
AppFileName = NewType("AppFileName", str)

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
    Get the absolute directory containing the notebook.
    """
    return AbsoluteNotebookDirPath(os.path.dirname(notebook_path))

def get_absolute_app_path(app_directory: AbsoluteNotebookDirPath, app_file_name: AppFileName) -> AbsoluteAppPath:
    """
    Get the absolute path to the app
    """
    return AbsoluteAppPath(os.path.join(app_directory, app_file_name))

def get_app_file_name(notebook_id: str) -> AppFileName:
    """
    Converts the notebook id into the corresponding app id
    """
    mito_app_name = notebook_id.replace('mito-notebook-', 'mito-app-')
    return AppFileName(f'{mito_app_name}.py')

def does_app_path_exist(app_path: AbsoluteAppPath) -> bool:
    """
    Check if the app file exists
    """
    return os.path.exists(app_path)

def does_notebook_id_have_corresponding_app(notebook_id: str, notebook_path: str) -> bool:
    """
    Given a notebook_id and raw notebook_path checks if the notebook has a corresponding
    app by converting the notebook_path into an absolute path and converting the notebook_id
    into an app name
    """

    app_file_name = get_app_file_name(notebook_id)
    notebook_path = get_absolute_notebook_path(notebook_path)
    app_directory = get_absolute_notebook_dir_path(notebook_path)
    app_path = get_absolute_app_path(app_directory, app_file_name)
    return does_app_path_exist(app_path)