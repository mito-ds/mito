
from dataclasses import dataclass
from typing import List, Literal    
from pydantic import BaseModel
    
@dataclass()
class Cell:
    cell_type: Literal['code', 'markdown']
    id: str
    code: str
  
class CellUpdate(BaseModel):
    id: str
    code: str

@dataclass()
class AgentFindAndUpdateTestCase:
    """A single test case with input state and expected output"""
    name: str
    initial_notebook_state: List[Cell]
    user_input: str
    cell_update: CellUpdate
    workflow_tags: List[str]
    type_tags: List[str]
    

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
]
    