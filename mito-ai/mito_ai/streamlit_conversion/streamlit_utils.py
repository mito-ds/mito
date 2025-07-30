# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

from dataclasses import dataclass
import re
import json
import os
import difflib
import shutil
from typing import Dict, List, Optional, Tuple, Any

MITO_APP_CONFIG_FOLDER_NAME = "mito_app_config"
NOTEBOOK_CHECKPOINT_FILE_NAME = "notebook_checkpoint.ipynb"

@dataclass
class NotebookCellContent:
    id: str
    cell_type: str
    source: List[str]
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            'id': self.id,
            'cell_type': self.cell_type,
            'source': self.source
        }

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


def create_app_file(app_directory: str, code: str) -> Tuple[bool, Optional[str], str]:
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
        with open(app_path, 'w') as f:
            f.write(code)
        return True, app_path, f"Successfully created {app_directory}"
    except IOError as e:
        return False, None, f"Error creating file: {str(e)}"
    except Exception as e:
        return False, None, f"Unexpected error: {str(e)}"


def parse_jupyter_notebook_to_extract_required_content(notebook_path: str) -> List[NotebookCellContent]:
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
            notebook_data: Dict[str, Any] = json.load(f)

        # Check if 'cells' key exists
        if 'cells' not in notebook_data:
            raise KeyError("Notebook does not contain 'cells' key")

        # Filter each cell to keep only cell_type and source
        notebook_cells: List[NotebookCellContent] = []
        for cell in notebook_data['cells']:
            notebook_cell = NotebookCellContent(
                id=cell.get('id', ''),
                cell_type=cell.get('cell_type', ''),
                source=cell.get('source', [])
            )
            notebook_cells.append(notebook_cell)

        return notebook_cells

    except FileNotFoundError:
        raise FileNotFoundError(f"Notebook file not found: {notebook_path}")
    except json.JSONDecodeError as e:
        # JSONDecodeError requires msg, doc, pos
        raise json.JSONDecodeError(f"Invalid JSON in notebook file: {str(e)}", e.doc if hasattr(e, 'doc') else '', e.pos if hasattr(e, 'pos') else 0)
    except Exception as e:
        raise Exception(f"Error processing notebook: {str(e)}")

def get_existing_streamlit_app_code(app_config_path: str) -> Optional[str]:
    """
    Get the existing streamlit app code from the app.py file
    """
    app_path = os.path.join(app_config_path, "app.py")
    if not os.path.exists(app_path):
        return None
    with open(app_path, 'r') as f:
        return f.read()
    
def get_previous_notebook_version(app_config_path: str) -> Optional[List[NotebookCellContent]]:
    """
    Get the previous notebook version from the app_config.json file
    """
    app_config_path = os.path.join(app_config_path, NOTEBOOK_CHECKPOINT_FILE_NAME)
    
    try:
        # If there is no checkpoint file, just return None. This is non-critical.
        notebook_data = parse_jupyter_notebook_to_extract_required_content(app_config_path)
        return notebook_data
    except Exception as e:
        return None
    
def save_notebook_as_checkpoint(notebook_path: str, app_config_path: str) -> None:
    """
    Save the notebook as the checkpoint
    """
    # Copy the notebook to the app_config_path
    try:    
        checkpoint_path = os.path.join(app_config_path, NOTEBOOK_CHECKPOINT_FILE_NAME)
        shutil.copy2(notebook_path, checkpoint_path)
    except Exception as e:
        print(f"Error saving notebook as checkpoint: {str(e)}")

def generate_notebook_diffs(old_cells: List[NotebookCellContent], new_cells: List[NotebookCellContent]) -> str:
    
    # Convert cell dictionaries to comparable formats
    old_cells_id_dict: Dict[str, NotebookCellContent] = {}
    new_cells_id_dict: Dict[str, NotebookCellContent] = {}
    
    for cell in old_cells:
        old_cells_id_dict[cell.id] = cell
    
    for cell in new_cells:
        new_cells_id_dict[cell.id] = cell
        
    diffs = []
    # Handle all of the cells in the new notebook
    for cell in new_cells:
        if cell.id not in old_cells_id_dict:
            diffs.append(generate_cell_diffs(None, cell))
        else:
            diffs.append(generate_cell_diffs(old_cells_id_dict[cell.id], cell))
            
    # Handle the cells that are only in the old notebook (they've been deleted)
    old_cells_id_keys = set(old_cells_id_dict.keys())
    new_cells_id_keys = set(new_cells_id_dict.keys())
    deleted_cells = old_cells_id_keys - new_cells_id_keys
    for cell_id in deleted_cells:
        diffs.append(generate_cell_diffs(old_cells_id_dict[cell_id], None))
    
    # Filter out None values before joining
    diffs = [diff for diff in diffs if diff is not None]
    
    if len(diffs) == 0:
        return "No changes to the notebook. Return the existing streamlit app."
    
    return '\n'.join(diffs)

def generate_cell_diffs(old_cell: Optional[NotebookCellContent], new_cell: Optional[NotebookCellContent]) -> Optional[str]:
    """
    Generate the diffs between two cells
    """    
    diffs = list(difflib.unified_diff(
        old_cell.source if old_cell else [],
        new_cell.source if new_cell else [],
        fromfile=f'Cell {old_cell.id if old_cell else "None"} (old)',
        tofile=f'Cell {new_cell.id if new_cell else "None"} (new)',
        lineterm=''
    ))
    
    if len(diffs) == 0:
        return None
    
    return '\n'.join(diffs)

def get_notebook_content_string(notebook_content: List[NotebookCellContent]) -> str:
    """
    Get the content of the notebook as a string
    """    
    notebook_content_string = ""
    for cell in notebook_content:
        notebook_content_string += f"## Cell ID: {cell.id} Cell Type: {cell.cell_type}\n"
        
        source = ''.join(cell.source)
        notebook_content_string += source + "\n\n"
    
    return notebook_content_string