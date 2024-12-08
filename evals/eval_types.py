from dataclasses import dataclass
from typing import Any, Dict, List, Literal, Optional

@dataclass(frozen=True)
class NotebookState:
    """Represents the state of variables in a notebook at test time"""
    global_vars: Dict[str, Any]
    cell_contents: List[str]
    

@dataclass(frozen=True)
class CodeGenTestCaseCore:
    notebook_state: NotebookState
    expected_code: str
    tags: List[Literal[
        'variable_declaration', 
        'function_declaration',
        'df_transformation',
        'df_creation',
        'pandas',
        'misc',
        'multistep'
    ]]
    variables_to_compare: Optional[List[str]] = None
    

@dataclass(frozen=True)
class CodeGenTestCase:
    """A single test case with input state and expected output"""
    name: str
    test_case_core: CodeGenTestCaseCore
    user_input: str

@dataclass(frozen=True)
class TestCaseResult:
    test: CodeGenTestCase
    passed: bool



class PromptGenerator():

    prompt_name: str

    def get_prompt(self, user_input: str, notebook_state: NotebookState) -> str:
        raise NotImplementedError("Subclasses must implement this method")

