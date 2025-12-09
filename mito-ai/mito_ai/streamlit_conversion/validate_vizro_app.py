# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

import os
import sys
import tempfile
import traceback
import ast
import subprocess
from typing import List, Optional, Dict, Any
from mito_ai.path_utils import AbsoluteNotebookPath, get_absolute_notebook_dir_path


def get_syntax_error(app_code: str) -> Optional[str]:
    """Check if the Python code has valid syntax"""
    try:
        ast.parse(app_code)
        return None
    except SyntaxError as e:
        error_msg = ''.join(traceback.format_exception(type(e), e, e.__traceback__))
        return error_msg


def get_import_and_build_errors(app_code: str, app_path: AbsoluteNotebookPath) -> Optional[List[Dict[str, Any]]]:
    """
    Validate Vizro app by attempting to import and build it.

    This creates a temporary file with the app code (modified to not run the server),
    then executes it in a subprocess to catch import and build errors.
    """
    directory = get_absolute_notebook_dir_path(app_path)

    # Modify the code to only build the dashboard without running the server
    # Replace .run() with a simple validation that the dashboard builds successfully
    validation_code = app_code

    # Remove or comment out the .run() call so we just validate the build
    # We need to handle various patterns like:
    # - Vizro().build(dashboard).run()
    # - Vizro().build(dashboard).run(port=8050)
    # - app = Vizro().build(dashboard) ... app.run()
    import re

    # Pattern 1: Remove .run(...) from chained calls
    validation_code = re.sub(r'\.run\([^)]*\)\s*$', '', validation_code, flags=re.MULTILINE)

    # Pattern 2: Remove standalone app.run() or similar variable.run() calls
    validation_code = re.sub(r'^[a-zA-Z_][a-zA-Z0-9_]*\.run\([^)]*\)\s*$', '', validation_code, flags=re.MULTILINE)

    # Add validation print at the end to confirm success
    validation_code += "\nprint('VIZRO_VALIDATION_SUCCESS')\n"

    # Create temporary file and run in subprocess
    with tempfile.NamedTemporaryFile(mode="w", suffix=".py", delete=False, encoding="utf-8") as f:
        f.write(validation_code)
        temp_path = f.name

    try:
        # Run the validation in a subprocess
        result = subprocess.run(
            [sys.executable, temp_path],
            cwd=directory,
            capture_output=True,
            text=True,
            timeout=60  # 60 second timeout for validation
        )

        # Check if validation was successful
        if result.returncode != 0 or 'VIZRO_VALIDATION_SUCCESS' not in result.stdout:
            errors = []

            # Parse stderr for error information
            stderr = result.stderr.strip()
            if stderr:
                errors.append({
                    'type': 'runtime',
                    'details': stderr,
                    'message': extract_error_message(stderr)
                })

            # Also include stdout if it contains error info
            stdout = result.stdout.strip()
            if stdout and 'VIZRO_VALIDATION_SUCCESS' not in stdout:
                # Only include if it looks like an error
                if 'Error' in stdout or 'Exception' in stdout or 'Traceback' in stdout:
                    errors.append({
                        'type': 'output',
                        'details': stdout,
                        'message': extract_error_message(stdout)
                    })

            return errors if errors else [{'type': 'unknown', 'details': 'Validation failed without specific error'}]

        return None

    except subprocess.TimeoutExpired:
        return [{'type': 'timeout', 'details': 'Vizro app validation timed out after 60 seconds'}]
    except Exception as e:
        return [{'type': 'validation', 'details': str(e)}]
    finally:
        # Clean up the temporary file
        try:
            os.unlink(temp_path)
        except OSError:
            pass


def extract_error_message(error_text: str) -> str:
    """Extract a concise error message from a full traceback"""
    lines = error_text.strip().split('\n')

    # Look for common error patterns
    for line in reversed(lines):
        line = line.strip()
        # Look for exception lines
        if any(err in line for err in ['Error:', 'Exception:', 'ValidationError']):
            return line
        # Look for lines that start with error type
        if line.startswith(('ValueError', 'TypeError', 'KeyError', 'AttributeError',
                           'ImportError', 'ModuleNotFoundError', 'NameError',
                           'ValidationError', 'pydantic')):
            return line

    # If no specific error found, return last non-empty line
    for line in reversed(lines):
        if line.strip():
            return line.strip()[:200]  # Truncate to 200 chars

    return "Unknown error"


def check_for_errors(app_code: str, app_path: AbsoluteNotebookPath) -> List[Dict[str, Any]]:
    """Complete validation pipeline for Vizro apps"""
    errors: List[Dict[str, Any]] = []

    try:
        # Step 1: Check syntax
        syntax_error = get_syntax_error(app_code)
        if syntax_error:
            errors.append({'type': 'syntax', 'details': syntax_error})
            # Don't continue with runtime check if syntax is broken
            return errors

        # Step 2: Check imports and dashboard build
        runtime_errors = get_import_and_build_errors(app_code, app_path)
        if runtime_errors:
            errors.extend(runtime_errors)

    except Exception as e:
        errors.append({'type': 'validation', 'details': str(e)})

    return errors


def validate_vizro_app(app_code: str, notebook_path: AbsoluteNotebookPath) -> List[str]:
    """Convenience function to validate Vizro code"""
    errors = check_for_errors(app_code, notebook_path)
    stringified_errors = [str(error) for error in errors]
    return stringified_errors
