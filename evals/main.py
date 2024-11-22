from typing import List
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
	  # Generate code using the model
    prompt = get_simple_prompt(test.user_input, test.notebook_state)

    # Get the script from the cells
    script = get_script_from_cells(test.notebook_state.cell_contents)

    expected_globals = {}
    generated_globals = {}
    exec(script, {})
    exec(test.expected_code, {})

    if expected_globals == generated_globals:
        print(f"Test {test.name} passed")
    else:
        print(f"Test {test.name} failed")

    
    
  
	# Execute the expected code and get the result of the global variables
	# Execute the LLM generated code and get the result of the global variables
	# Compare the global variables and return 1 if they match exactly. Return 0 if they don't match exactly
    