from dataclasses import dataclass
from typing import Any, Dict, List, Literal, Optional, Union

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
        'function',
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
class SmartDebugTestCase:
    """
    A single test case for smart debugging. No user input is needed since its triggered by 
    the debug button. Instead, all of the instructions are made by the prompt. 
    """
    name: str
    notebook_state: NotebookState
    invalid_code: str
    correct_code: str
    tags: List[Literal[
        'simple', 
        'function', 
        'pandas', 
        'import', 
        'typo', 
        'type_error', 
        'value_error',
        'argument_error',
        'logic_correction', 
        'matplotlib'
    ]] 
    variables_to_compare: Optional[List[str]] = None


@dataclass(frozen=True)
class TestCaseResult:
    """
    The result of running a test case. Used to display the results.
    """
    test: Union[CodeGenTestCase, SmartDebugTestCase]
    passed: bool

class ChatPromptGenerator():

    prompt_name: str

    def get_prompt(self, user_input: str, notebook_state: NotebookState) -> str:
        raise NotImplementedError("Subclasses must implement this method")

class DebugPromptGenerator():

    prompt_name: str

    def get_prompt(self, error_message: str, notebook_state: NotebookState) -> str:
        raise NotImplementedError("Subclasses must implement this method")
