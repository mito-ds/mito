
from typing import List, Literal
from evals.types import NotebookState, TestCase


EMPTY_NOTEBOOK_STATE: NotebookState = {
  'global_vars': {},
  'cell_contents': []
}


TESTS: List[TestCase] = [
    {
        'name': "empty_notebook_variable_declaration",
        'notebook_state': EMPTY_NOTEBOOK_STATE,
        'user_input': "create a variable x and set it equal to 1",
        'expected_code': 'x=1',
        'tags': ['variable declaration']
    }
]

for test in TESTS:
	# Generate code using the model
    
  
	# Execute the expected code and get the result of the global variables
	# Execute the LLM generated code and get the result of the global variables
	# Compare the global variables and return 1 if they match exactly. Return 0 if they don't match exactly