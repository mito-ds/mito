# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

import re
import json
import os
from typing import Dict, Optional, Tuple, Any
from pathlib import Path

def extract_code_blocks(message_content: str) -> str:
    """
    Extract all code blocks from Claude's response.

    Args:
        message_content (str): The actual content from the agent's response

    Returns:
        str: Removes the ```python``` part to be able to parse the code
    """
    if "```python" not in message_content:
        # If no python code blocks found, return empty string instead of the entire message
        print(f"DEBUG: No python code blocks found in response. Response length: {len(message_content)}")
        print(f"DEBUG: Response preview: {message_content[:200]}...")
        return message_content

    # Use regex to find all Python code blocks
    pattern = r'```python\n(.*?)```'
    matches = re.findall(pattern, message_content, re.DOTALL)

    # Concatenate with single newlines
    result = '\n'.join(matches)
    print(f"DEBUG: Extracted {len(matches)} code blocks, total length: {len(result)}")
    return result

def extract_unified_diff_blocks(message_content: str) -> str:
    """
    Extract all unified_diff blocks from Claude's response.
    """
    if "```unified_diff" not in message_content:
        return message_content
    
    pattern = r'```unified_diff\n(.*?)```'
    matches = re.findall(pattern, message_content, re.DOTALL)
    return '\n'.join(matches)


def create_app_file(app_directory: str, code: str) -> Tuple[bool, str, str]:
    """
    Create app.py file and write code to it with error handling

    Args:
        file_path (str): The actual content from the agent's response
        code (str): The actual content from the agent's response

    Returns:
        str: Removes the ```python``` part to be able to parse the code

    """
    try:
        app_path = os.path.join(app_directory, "app.py")
        
        # Debug: Print what we're about to write
        print(f"DEBUG: Creating app.py at {app_path}")
        print(f"DEBUG: Code to write length: {len(code)}")
        print(f"DEBUG: Code to write preview: {code[:200]}...")
        
        with open(app_path, 'w', encoding='utf-8') as f:
            f.write(code)
            
        # Debug: Verify what was written
        with open(app_path, 'r', encoding='utf-8') as f:
            written_content = f.read()
        print(f"DEBUG: Written content length: {len(written_content)}")
        print(f"DEBUG: Written content preview: {written_content[:200]}...")
        
        return True, app_path, f"Successfully created {app_directory}"
    except IOError as e:
        return False, '', f"Error creating file: {str(e)}"
    except Exception as e:
        return False, '', f"Unexpected error: {str(e)}"
    

def get_app_path(app_directory: str) -> Optional[str]:
    """
    Check if the app.py file exists in the given directory.
    """
    app_path = os.path.join(app_directory, "app.py")
    if not os.path.exists(app_path):
        return None
    return app_path
    

def parse_jupyter_notebook_to_extract_required_content(notebook_path: str) -> Dict[str, Any]:
    """
    Read a Jupyter notebook and filter cells to keep only cell_type and source fields.

    Args:
        notebook_path (str): Path to the .ipynb file (can be relative or absolute)

    Returns:
        dict: Filtered notebook dictionary with only cell_type and source in cells

    Raises:
        FileNotFoundError: If the notebook file doesn't exist
        json.JSONDecodeError: If the file is not valid JSON
        KeyError: If the notebook doesn't have the expected structure
    """
    # Convert to absolute path if it's not already absolute
    # Handle both Unix-style absolute paths (starting with /) and Windows-style absolute paths
    if not (notebook_path.startswith('/') or (len(notebook_path) > 1 and notebook_path[1] == ':')):
        notebook_path = os.path.join(os.getcwd(), notebook_path)
    
    try:
        # Read the notebook file
        with open(notebook_path, 'r', encoding='utf-8') as f:
            notebook_data: Dict[str, Any] = json.load(f)

        # Check if 'cells' key exists
        if 'cells' not in notebook_data:
            raise KeyError("Notebook does not contain 'cells' key")

        # Filter each cell to keep only cell_type and source
        filtered_cells = []
        for cell in notebook_data['cells']:
            filtered_cell = {
                'cell_type': cell.get('cell_type', ''),
                'source': cell.get('source', [])
            }
            filtered_cells.append(filtered_cell)

        # Update the notebook data with filtered cells
        notebook_data['cells'] = filtered_cells

        # Debug: Check for unicode characters in the notebook
        notebook_str = str(notebook_data)
        unicode_chars = [char for char in notebook_str if ord(char) > 127]
        if unicode_chars:
            print(f"DEBUG: Found {len(unicode_chars)} unicode characters in notebook")
            print(f"DEBUG: Unicode chars: {unicode_chars[:10]}...")  # Show first 10 unicode chars

        return notebook_data

    except FileNotFoundError:
        raise FileNotFoundError(f"Notebook file not found: {notebook_path}")
    except json.JSONDecodeError as e:
        # JSONDecodeError requires msg, doc, pos
        raise json.JSONDecodeError(f"Invalid JSON in notebook file: {str(e)}", e.doc if hasattr(e, 'doc') else '', e.pos if hasattr(e, 'pos') else 0)
    except Exception as e:
        raise Exception(f"Error processing notebook: {str(e)}")


def resolve_notebook_path(notebook_path:str) -> str:
    # Convert to absolute path if it's not already absolute
    # Handle both Unix-style absolute paths (starting with /) and Windows-style absolute paths
    if not (notebook_path.startswith('/') or (len(notebook_path) > 1 and notebook_path[1] == ':')):
        notebook_path = os.path.join(os.getcwd(), notebook_path)
    return notebook_path

def clean_directory_check(notebook_path: str) -> None:
    notebook_path = resolve_notebook_path(notebook_path)
    # pathlib handles the cross OS path conversion automatically
    path = Path(notebook_path).resolve()
    dir_path = path.parent

    if not dir_path.exists():
        raise ValueError(f"Directory does not exist: {dir_path}")

    file_count = len([f for f in dir_path.iterdir() if f.is_file()])
    if file_count > 10:
        raise ValueError(
            f"Too many files in directory: 10 allowed but {file_count} present. Create a new directory and retry")
