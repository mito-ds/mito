# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

from dataclasses import dataclass, field
from typing import Any, Dict, List, Literal, Optional, Union
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
    type_tags: List[Literal['short', 'medium', 'long']]
    

WORKFLOW_TAGS = Literal[
    'variable_declaration', 
    'function',
    'df_transformation',
    'df_creation',
    'pandas',
    'misc',
    'multistep',
    'loops',
]

@dataclass(frozen=True)
class NotebookState:
    """Represents the state of variables in a notebook at test time"""
    global_vars: Dict[str, Any]
    cell_contents: List[str]
    files_str: str = ""
    active_cell_id: str = ""
    active_cell_output: str = ""
    db_schema: Optional[Dict[str, Any]] = None

@dataclass(frozen=True)
class CodeGenTestCaseCore:
    notebook_state: NotebookState
    expected_code: str
    workflow_tags: List[WORKFLOW_TAGS]
    variables_to_compare: Optional[List[str]] = None
    

@dataclass(frozen=True)
class ChatTestCase:
    """A single test case with input state and expected output"""
    name: str
    test_case_core: CodeGenTestCaseCore
    user_input: str
    test_type: Literal['chat'] = 'chat'
    type_tags: List[Literal['']] = field(default_factory=list) # TODO: Add type tags later if we want


@dataclass(frozen=True)
class InlineCodeCompletionTestCase:
    """A single test case with input state and expected output"""
    name: str
    test_case_core: CodeGenTestCaseCore
    type_tags: List[Literal[
	    'code_completion',
	    'comment_following',
        'no_expressed_intent'
    ]]
    test_type: Literal['inline_code_completion'] = 'inline_code_completion'
    prefix: Optional[str] = None
    suffix: Optional[str] = None


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
    workflow_tags: List[Literal[
        'simple', 
        'function', 
        'pandas', 
        'import', 
        'typo', 
        'type_conversion', 
        'logic_correction', 
        'matplotlib',
    ]]
    type_tags: List[Literal[
        'SyntaxError',
        'NameError',
        'TypeError',
        'IndentationError',
        'AttributeError',
        'ValueError',
        'OutOfBoundsDatetime',
        'KeyError'
    ]]
    variables_to_compare: Optional[List[str]] = None


@dataclass(frozen=True)
class TestCaseResult:
    """
    The result of running a test case. Used to display the results.
    """
    test: Union[ChatTestCase, SmartDebugTestCase, AgentFindAndUpdateTestCase]
    passed: bool


"""
Prompt Generators for each type of prompt. 

They each have a prompt_name that is used to identify the prompt and 
a get_prompt method that returns the prompt as a string given the inputs.
"""

class ChatPromptGenerator():

    prompt_name: str

    def get_prompt(self, user_input: str, notebook_state: NotebookState) -> str:
        raise NotImplementedError("Subclasses must implement this method")
    
    def get_default_model(self) -> str:
        return "o3-mini"
    
class InlineCodeCompletionPromptGenerator():

    prompt_name: str

    def get_prompt(self, prefix: str, suffix: str, notebook_state: NotebookState) -> str:
        raise NotImplementedError("Subclasses must implement this method")
 
    def post_process_output(self, output: str, prefix: str, suffix: str) -> str:
        # Default implementation returns the output unchanged
        return output
    
    def get_default_model(self) -> str:
        return "gpt-4o-mini"
    
    
class AgentFindAndUpdatePromptGenerator():

    prompt_name: str

    def get_prompt(self, user_input: str, initial_notebook_state: List[Cell]) -> str:
        raise NotImplementedError("Subclasses must implement this method")
        
    def get_default_model(self) -> str:
        return "gpt-4o-mini"

class DebugPromptGenerator():

    prompt_name: str

    def get_prompt(self, error_message: str, notebook_state: NotebookState) -> str:
        raise NotImplementedError("Subclasses must implement this method")
    
    def get_default_model(self) -> str:
        return "gpt-4o-mini"
    
