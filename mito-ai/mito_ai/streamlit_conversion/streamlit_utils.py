# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

import re
import json
from typing import Dict, List, Optional, Any
from mito_ai.path_utils import AbsoluteAppPath, AbsoluteNotebookPath
from mito_ai.utils.error_classes import StreamlitConversionError


def extract_code_blocks(message_content: str) -> str:
    """
    Extract all code blocks from Claude's response.

    Args:
        message_content (str): The actual content from the agent's response

    Returns:
        str: Removes the ```python``` part to be able to parse the code
    """
    if "```python" not in message_content:
        return message_content

    # Use regex to find all Python code blocks
    pattern = r'```python\n(.*?)```'
    matches = re.findall(pattern, message_content, re.DOTALL)

    # Concatenate with single newlines
    result = '\n'.join(matches)
    return result

def create_app_file(app_path: AbsoluteAppPath, code: str) -> None:
    """
    Create .py file and write code to it with error handling
    """
    try:
        with open(app_path, 'w', encoding='utf-8') as f:
            f.write(code)
    except IOError as e:
        raise StreamlitConversionError(f"Error creating app file: {str(e)}", 500)
    
def get_app_code_from_file(app_path: AbsoluteAppPath) -> Optional[str]:
    with open(app_path, 'r', encoding='utf-8') as f:
        return f.read()

def parse_jupyter_notebook_to_extract_required_content(notebook_path: AbsoluteNotebookPath) -> List[Dict[str, Any]]:
    """
    Read a Jupyter notebook and filter cells to keep only cell_type and source fields.

    Args:
        notebook_path: Absolute path to the .ipynb file

    Returns:
        dict: Filtered notebook dictionary with only cell_type and source in cells

    Raises:
        FileNotFoundError: If the notebook file doesn't exist
        json.JSONDecodeError: If the file is not valid JSON
        KeyError: If the notebook doesn't have the expected structure
    """
    
    try:
        # Read the notebook file
        with open(notebook_path, 'r', encoding='utf-8') as f:
            notebook_data: Dict[str, Any] = json.load(f)

        # Check if 'cells' key exists
        if 'cells' not in notebook_data:
            raise StreamlitConversionError("Notebook does not contain 'cells' key", 400)

        # Filter each cell to keep only cell_type and source
        filtered_cells: List[Dict[str, Any]] = []
        for cell in notebook_data['cells']:
            filtered_cell: Dict[str, Any] = {
                'cell_type': cell.get('cell_type', ''),
                'source': cell.get('source', [])
            }
            filtered_cells.append(filtered_cell)
            
        return filtered_cells

    except FileNotFoundError:
        raise StreamlitConversionError(f"Notebook file not found: {notebook_path}", 404)
    except json.JSONDecodeError as e:
        raise StreamlitConversionError(f"Invalid JSON in notebook file: {str(e)}", 400)