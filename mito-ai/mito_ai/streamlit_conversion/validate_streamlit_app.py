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
from typing import List, Tuple, Optional, Dict, Any
from streamlit.testing.v1 import AppTest


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

    def create_temp_app(self, app_code: str) -> str:
        """Create a temporary Streamlit app file"""
        self.temp_dir = tempfile.mkdtemp()
        if self.temp_dir is None:
            raise RuntimeError("Failed to create temporary directory")
        
        app_path = os.path.join(self.temp_dir, "app.py")

        with open(app_path, 'w') as f:
            f.write(app_code)

        return app_path

    def get_runtime_errors(self, app_path: str) -> Optional[List[Dict[str, Any]]]:
        """Start the Streamlit app in a subprocess"""  
        app_test = AppTest.from_file(app_path, default_timeout=30)
        app_test.run()
        
        # Check for exceptions
        if app_test.exception:
            errors = [{'type': 'exception', 'details': exc.value, 'message': exc.message, 'stack_trace': exc.stack_trace} for exc in app_test.exception]
            return errors
                    
        # Check for error messages
        if app_test.error:
            errors = [{'type': 'error', 'details': err.value} for err in app_test.error]
            return  errors
            
        return None

    def cleanup(self) -> None:
        """Clean up the temporary files"""
        if self.temp_dir and os.path.exists(self.temp_dir):
            shutil.rmtree(self.temp_dir)
            self.temp_dir = None

    def _validate_app(self, app_code: str) -> List[Dict[str, Any]]:
        """Complete validation pipeline"""
        errors: List[Dict[str, Any]] = []

        try:
            # Step 1: Check syntax
            syntax_error = self.get_syntax_error(app_code)
            if syntax_error:
                errors.append({'type': 'syntax', 'details': syntax_error})

            # Step 2: Create and start app
            app_path = self.create_temp_app(app_code)
            runtime_errors = self.get_runtime_errors(app_path)
            
            print('Found Runtime Errors', runtime_errors)
            
            if runtime_errors:
                errors.extend(runtime_errors)
            
        except Exception as e:
            errors.append({'type': 'validation', 'details': str(e)})

        finally:
            self.cleanup()

        return errors

def validate_app(app_code: str) -> Tuple[bool, str]:
    """Convenience function to validate Streamlit code"""
    has_validation_error: bool = False
    error_message: str = ""

    validator = StreamlitValidator()
    errors = validator._validate_app(app_code)

    if errors:
        has_validation_error = True
        error_message = "Errors found: "
        for error in errors:
            error_message += str(error) + "\n"
            
        print(f"App Validation Failed with errors: {error_message}")
    else:
        print("✓ App validatino passed")
    
    return has_validation_error, error_message
