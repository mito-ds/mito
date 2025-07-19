# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

import subprocess
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
from typing import Tuple, Optional, Dict, Any
from subprocess import Popen

# warnings.filterwarnings("ignore", message=r".*missing ScriptRunContext.*")
# warnings.filterwarnings("ignore", category=UserWarning)

warnings.filterwarnings("ignore", message=".*bare mode.*")


class StreamlitValidator:
    def __init__(self, port: int = 8501, timeout: int = 30) -> None:
        self.port = port
        self.timeout = timeout
        self.process: Optional[Popen[str]] = None
        self.temp_dir: Optional[str] = None

    def validate_syntax(self, app_code: str) -> Tuple[bool, str]:
        """Check if the Python code has valid syntax"""
        try:
            ast.parse(app_code)
            return True, "Syntax is valid"
        except SyntaxError as e:
            error_msg = ''.join(traceback.format_exception(type(e), e, e.__traceback__))
            return False, f"Syntax error: {error_msg}"

    def create_temp_app(self, app_code: str) -> str:
        """Create a temporary Streamlit app file"""
        self.temp_dir = tempfile.mkdtemp()
        if self.temp_dir is None:
            raise RuntimeError("Failed to create temporary directory")
        app_path = os.path.join(self.temp_dir, "app.py")

        with open(app_path, 'w') as f:
            f.write(app_code)

        return app_path

    def start_streamlit_app(self, app_path: str) -> Tuple[bool, str]:
        """Start the Streamlit app in a subprocess"""
        try:
            cmd = [
                sys.executable, "-m", "streamlit", "run", app_path,
                "--server.port", str(self.port),
                "--server.headless", "true",
                "--server.address", "localhost",
                "--logger.level", "error"
            ]

            self.process = subprocess.Popen(
                cmd,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True
            )

            return True, "Streamlit app started"
        except Exception as e:
            return False, f"Failed to start Streamlit: {str(e)}"

    def wait_for_app(self) -> Tuple[bool, str]:
        """Wait for the Streamlit app to be ready"""
        start_time = time.time()

        exception_error = "Error"
        while time.time() - start_time < self.timeout:
            try:
                response = requests.get(f"http://localhost:{self.port}", timeout=5)
                if response.status_code == 200:
                    return True, "App is running successfully"
            except requests.exceptions.RequestException as e:
                exception_error = str(e)

            time.sleep(1)

        return False, f"App failed to start within timeout - {exception_error}"

    def filter_streamlit_warnings(self, text: str) -> str:
        """Filter out known Streamlit warnings that can be safely ignored"""
        if not text:
            return text

        filtered_lines = []
        for line in text.split('\n'):
            # Skip lines containing ScriptRunContext warnings
            if any(phrase in line for phrase in [
                'missing ScriptRunContext',
                'bare mode',
                'ScriptRunContext!',
                'Thread \'MainThread\':'
            ]):
                continue
            filtered_lines.append(line)

        return '\n'.join(filtered_lines)

    def check_for_errors(self) -> Tuple[bool, str]:
        """Check if the Streamlit process has any errors"""
        if self.process:
            # Check if process is still running
            if self.process.poll() is not None:
                stdout, stderr = self.process.communicate()
                # Filter out known warnings
                filtered_stderr = self.filter_streamlit_warnings(stderr)
                if filtered_stderr.strip():
                    return False, f"App crashed: {filtered_stderr}"

            return True, "App is running without errors"

        return False, "No process found"

    def cleanup(self) -> None:
        """Clean up the temporary files and stop the process"""
        if self.process:
            self.process.terminate()
            self.process.wait()
            self.process = None

        if self.temp_dir and os.path.exists(self.temp_dir):
            shutil.rmtree(self.temp_dir)
            self.temp_dir = None

    def validate_app(self, app_code: str) -> Dict[str, Any]:
        """Complete validation pipeline"""
        results: Dict[str, Any] = {
            'syntax_valid': False,
            'app_starts': False,
            'app_responsive': False,
            'errors': []
        }

        try:
            # Step 1: Check syntax
            syntax_valid, syntax_msg = self.validate_syntax(app_code)
            results['syntax_valid'] = syntax_valid
            if not syntax_valid:
                results['errors'].append(syntax_msg)
                return results

            # Step 2: Create and start app
            app_path = self.create_temp_app(app_code)
            app_started, start_msg = self.start_streamlit_app(app_path)
            results['app_starts'] = app_started

            if not app_started:
                results['errors'].append(start_msg)
                return results

            # Step 3: Wait for app to be ready
            app_ready, ready_msg = self.wait_for_app()
            results['app_responsive'] = app_ready

            if not app_ready:
                results['errors'].append(ready_msg)

            # Step 4: Check for runtime errors
            no_errors, error_msg = self.check_for_errors()
            if not no_errors:
                results['errors'].append(error_msg)

        except Exception as e:
            results['errors'].append(f"Validation error: {str(e)}")

        finally:
            self.cleanup()

        return results


def streamlit_code_validator(app_code: str) -> Tuple[bool, str]:
    """Convenience function to validate Streamlit code"""
    has_validation_error: bool = False
    error_message: str = ""


    validator = StreamlitValidator()
    results = validator.validate_app(app_code)

    print("Validation Results:")
    print(f"✓ Syntax valid: {results['syntax_valid']}")
    print(f"✓ App starts: {results['app_starts']}")
    print(f"✓ App responsive: {results['app_responsive']}")

    if results['errors']:
        error_message = "Errors found: "
        print("Error detected in agent code")
        has_validation_error = True
        print("\nErrors found:")
        for error in results['errors']:
            print(f"  - {error}")
            error_message += error + "\n"
    if not has_validation_error:
        print("\nAll validations passed!")
    return has_validation_error, error_message
