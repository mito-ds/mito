from dataclasses import dataclass
from typing import Any, Dict, List, Literal

@dataclass
class NotebookState:
    """Represents the state of variables in a notebook at test time"""
    global_vars: Dict[str, Any]
    cell_contents: List[str]
    
    
@dataclass
class TestCase:
    """A single test case with input state and expected output"""
    name: str
    notebook_state: NotebookState
    user_input: str
    expected_code: str
    tags: List[Literal[
        'variable declaration', 
        'function declaration',
        'dataframe transformation'
    ]]

