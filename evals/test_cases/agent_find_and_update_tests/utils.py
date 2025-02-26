from typing import List
import json 
import os
from evals.test_cases.agent_find_and_update_tests.simple import Cell


RELATIVE_PATH_TO_NOTEBOOK_FOLDER = 'notebooks'

dirname = os.path.dirname(__file__)

def get_cells_from_ipynb_in_notebook_folder(path_relative_to_notebook_folder) -> List[Cell]:
    
    path = os.path.join(dirname, RELATIVE_PATH_TO_NOTEBOOK_FOLDER, path_relative_to_notebook_folder)
    
    cells: List[Cell] = []

    with open(path, mode= "r", encoding= "utf-8") as f:

        ipynb_json = json.loads(f.read())
        
        for ipynb_cell in ipynb_json['cells']:
        
            # Convert the ipynb source from a list of code lines to 
            # a single multiline string
            code = ('').join(ipynb_cell['source'])
            cell = Cell(
                ipynb_cell['cell_type'],
                ipynb_cell['id'],
                code
            )
            cells.append(cell)
        
    return cells
        

