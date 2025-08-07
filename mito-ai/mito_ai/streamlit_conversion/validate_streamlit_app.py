# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

import sys
import os
import time
import requests
import tempfile
import shutil
import traceback
import ast
import importlib.util
import warnings
from typing import List, Tuple, Optional, Dict, Any, Generator
from streamlit.testing.v1 import AppTest
from contextlib import contextmanager
from mito_ai.streamlit_conversion.streamlit_utils import resolve_notebook_path


# warnings.filterwarnings("ignore", message=r".*missing ScriptRunContext.*")
# warnings.filterwarnings("ignore", category=UserWarning)

warnings.filterwarnings("ignore", message=".*bare mode.*")


class StreamlitValidator:
    def __init__(self, port: int = 8501) -> None:
        self.temp_dir: Optional[str] = None

    def get_syntax_error(self, app_code: str) -> Optional[str]:
        """Check if the Python code has valid syntax"""
        try:
            ast.parse(app_code)
            return None
        except SyntaxError as e:
            error_msg = ''.join(traceback.format_exception(type(e), e, e.__traceback__))
            return error_msg

    def get_runtime_errors(self, app_code: str, app_path: str) -> Optional[List[Dict[str, Any]]]:
        """Start the Streamlit app in a subprocess"""  
        
        directory = os.path.dirname(app_path)
        
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
            app_test = AppTest.from_string(app_code, default_timeout=30)
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

    def cleanup(self) -> None:
        """Clean up the temporary files"""
        if self.temp_dir and os.path.exists(self.temp_dir):
            shutil.rmtree(self.temp_dir)
            self.temp_dir = None

    def _validate_app(self, app_code: str, app_path: str) -> List[Dict[str, Any]]:
        """Complete validation pipeline"""
        errors: List[Dict[str, Any]] = []

        try:
            # Step 1: Check syntax
            syntax_error = self.get_syntax_error(app_code)
            if syntax_error:
                errors.append({'type': 'syntax', 'details': syntax_error})

            runtime_errors = self.get_runtime_errors(app_code, app_path)
            
            print('Found Runtime Errors', runtime_errors)
            
            if runtime_errors:
                errors.extend(runtime_errors)
            
        except Exception as e:
            errors.append({'type': 'validation', 'details': str(e)})

        finally:
            self.cleanup()

        return errors

def validate_app(app_code: str, notebook_path: str) -> Tuple[bool, List[str]]:
    """Convenience function to validate Streamlit code"""
    notebook_path = resolve_notebook_path(notebook_path)
    
    validator = StreamlitValidator()
    errors = validator._validate_app(app_code, notebook_path)
    
    has_validation_error = len(errors) > 0
    stringified_errors = [str(error) for error in errors]
    return has_validation_error, stringified_errors
