
from dataclasses import dataclass
from typing import List, Literal    
from evals.eval_types import AgentFindAndUpdateTestCase, Cell, CellUpdate
from evals.test_cases.agent_find_and_update_tests.utils import get_cells_from_ipynb_in_notebook_folder

SIMPLE_TESTS = [
    AgentFindAndUpdateTestCase(
        name='first test',
        initial_notebook_state=[
            Cell(
                cell_type='code',
                id="9e38c62b-38f8-457d-bb8d-28bfc52edf2c",
                code="""x=10
y=30
z = x + y""" 
            )
        ],
        user_input="Update x to 50",
        cell_update=CellUpdate(
            id="9e38c62b-38f8-457d-bb8d-28bfc52edf2c",
            code="""x=50
y=30
z = x + y"""
        ),
        workflow_tags = ['agent'],
        type_tags = ['simple']
    ),
    
    
        AgentFindAndUpdateTestCase(
        name='first test',
        initial_notebook_state=get_cells_from_ipynb_in_notebook_folder('WarrenBuffet-Short.ipynb'),
        user_input="Update x to 50",
        cell_update=CellUpdate(
            id="9e38c62b-38f8-457d-bb8d-28bfc52edf2c",
            code="""x=50
y=30
z = x + y"""
        ),
        workflow_tags = ['agent'],
        type_tags = ['simple']
    ),
]