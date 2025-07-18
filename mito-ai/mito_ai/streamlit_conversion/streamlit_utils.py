# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

import re
import json
from typing import Dict

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

    # return message_content.split('```python\n')[1].split('\n```')[0]
    # Use regex to find all Python code blocks
    pattern = r'```python\n(.*?)```'
    matches = re.findall(pattern, message_content, re.DOTALL)

    # Concatenate with single newlines
    return '\n'.join(matches)


def create_app_file(file_path: str, code: str) -> (bool, str):
    """
    Create app.py file and write code to it with error handling

    Args:
        file_path (str): The actual content from the agent's response
        code (str): The actual content from the agent's response

    Returns:
        str: Removes the ```python``` part to be able to parse the code

    """
    try:
        with open(file_path+"/app.py", 'w') as f:
            f.write(code)
        return True, f"Successfully created {file_path}"
    except IOError as e:
        return False, f"Error creating file: {str(e)}"
    except Exception as e:
        return False, f"Unexpected error: {str(e)}"


def parse_jupyter_notebook_to_extract_required_content(notebook_path: str) -> Dict:
    """
    Read a Jupyter notebook and filter cells to keep only cell_type and source fields.

    Args:
        notebook_path (str): Absolute path to the .ipynb file

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
            notebook_data = json.load(f)

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

        return notebook_data

    except FileNotFoundError:
        raise FileNotFoundError(f"Notebook file not found: {notebook_path}")
    except json.JSONDecodeError as e:
        raise json.JSONDecodeError(f"Invalid JSON in notebook file: {str(e)}")
    except Exception as e:
        raise Exception(f"Error processing notebook: {str(e)}")
