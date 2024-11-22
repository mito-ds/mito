from typing import List
from evals.ai_api_calls.get_open_ai_completion import get_open_ai_completion
from evals.prompts.simple_prompt import get_simple_prompt
from evals.eval_types import NotebookState, TestCase
from evals.utils import get_script_from_cells


EMPTY_NOTEBOOK_STATE: NotebookState = NotebookState(
  global_vars={},
  cell_contents=[]
)


TESTS: List[TestCase] = [
    TestCase(
        name="empty_notebook_variable_declaration",
        notebook_state=EMPTY_NOTEBOOK_STATE,
        user_input="create a variable x and set it equal to 1",
        expected_code='x=1',
        tags=['variable declaration']
    )
]

for test in TESTS:
    
    # Get the script from the cells
    current_cell_contents_script = get_script_from_cells(test.notebook_state.cell_contents)

    expected_code = current_cell_contents_script + "\n" + test.expected_code

    prompt = get_simple_prompt(test.user_input, test.notebook_state)
    ai_generated_code = get_open_ai_completion(prompt)
    actual_code = current_cell_contents_script + "\n" + ai_generated_code

    expected_globals = {}
    actual_globals = {}

    exec(expected_code, expected_globals)
    exec(actual_code, actual_globals)

    # Remove the __builtins__ from the globals
    expected_globals = {k: v for k, v in expected_globals.items() if k != "__builtins__"}
    actual_globals = {k: v for k, v in actual_globals.items() if k != "__builtins__"}

    print(expected_globals)
    print(actual_globals)

    if expected_globals == actual_globals:
        print(f"Test {test.name} passed")
    else:
        print(f"Test {test.name} failed")
    
  
	# Execute the expected code and get the result of the global variables
	# Execute the LLM generated code and get the result of the global variables
	# Compare the global variables and return 1 if they match exactly. Return 0 if they don't match exactly
    