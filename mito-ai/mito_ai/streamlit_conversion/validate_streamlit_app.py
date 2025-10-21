# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

import os
import tempfile
import traceback
import ast
import warnings
from typing import List, Tuple, Optional, Dict, Any, Generator
from streamlit.testing.v1 import AppTest
from contextlib import contextmanager
from mito_ai.path_utils import AbsoluteNotebookPath, get_absolute_notebook_dir_path

warnings.filterwarnings("ignore", message=".*bare mode.*")

def get_syntax_error(app_code: str) -> Optional[str]:
    """Check if the Python code has valid syntax"""
    try:
        ast.parse(app_code)
        return None
    except SyntaxError as e:
        error_msg = ''.join(traceback.format_exception(type(e), e, e.__traceback__))
        return error_msg

def get_runtime_errors(app_code: str, app_path: AbsoluteNotebookPath) -> Optional[List[Dict[str, Any]]]:
    """Start the Streamlit app in a subprocess"""  
    
    directory = get_absolute_notebook_dir_path(app_path)
    
    @contextmanager
    def change_working_directory(path: str) -> Generator[None, Any, None]:
        """
        Context manager to temporarily change working directory
        so that relative paths are still valid when we run the app
        """
        if path == '':
            yield
        
        original_cwd = os.getcwd()
        try:
            os.chdir(path)
            yield
        finally:
            os.chdir(original_cwd)
    
    with change_working_directory(directory):
        # Create a temporary file that uses UTF-8 encoding so 
        # we don't run into issues with non-ASCII characters on Windows.
        # We use utf-8 encoding when writing the app.py file so this validation
        # code mirrors the actual file. 

        # Note: Since the AppTest.from_file tries to open the file, we need to first close the file
        # by exiting the context manager and using the delete=False flag so that the file still exists.
        # Windows can't open the same file twice at the same time. We cleanup at the end.
        with tempfile.NamedTemporaryFile(mode="w", suffix=".py", delete=False, encoding="utf-8") as f:
            f.write(app_code)
            temp_path = f.name

        try:
            # Run Streamlit test from file with UTF-8 encoding
            app_test = AppTest.from_file(temp_path, default_timeout=30)
            app_test.run()
            
            # Check for exceptions
            if app_test.exception:
                errors = [{'type': 'exception', 'details': exc.value, 'message': exc.message, 'stack_trace': exc.stack_trace} for exc in app_test.exception]
                return errors
                    
            # Check for error messages
            if app_test.error:
                errors = [{'type': 'error', 'details': err.value} for err in app_test.error]
                return errors
            
            return None
        finally:
            # Clean up the temporary file
            try:
                os.unlink(temp_path)
            except OSError:
                pass  # File might already be deleted

def check_for_errors(app_code: str, app_path: AbsoluteNotebookPath) -> List[Dict[str, Any]]:
    """Complete validation pipeline"""
    errors: List[Dict[str, Any]] = []

    try:
        # Step 1: Check syntax
        syntax_error = get_syntax_error(app_code)
        if syntax_error:
            errors.append({'type': 'syntax', 'details': syntax_error})

        runtime_errors = get_runtime_errors(app_code, app_path)
        if runtime_errors:
            errors.extend(runtime_errors)
        
    except Exception as e:
        errors.append({'type': 'validation', 'details': str(e)})

    return errors

def validate_app(app_code: str, notebook_path: AbsoluteNotebookPath) -> List[str]:
    """Convenience function to validate Streamlit code"""
    errors = check_for_errors(app_code, notebook_path)
    stringified_errors = [str(error) for error in errors]
    return stringified_errors
