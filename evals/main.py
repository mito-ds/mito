from typing import List
from evals.ai_api_calls.get_open_ai_completion import get_open_ai_completion
from evals.prompts import PROMPT_GENERATORS
from evals.eval_types import NotebookState, TestCase, TestCaseResult
from evals.utils import print_test_case_result_table, get_globals_to_compare, get_script_from_cells, print_green, print_red


EMPTY_NOTEBOOK_STATE: NotebookState = NotebookState(
  global_vars={},
  cell_contents=[]
)

INITIALIZED_VARIABLES_NOTEBOOK_STATE: NotebookState = NotebookState(
  global_vars={'x': 1, 'y': 2, 'z': 3},
  cell_contents=['x = 1', 'y = 2', 'z = 3', '']
)


TESTS: List[TestCase] = [
    TestCase(
        name="empty_notebook_variable_declaration",
        notebook_state=EMPTY_NOTEBOOK_STATE,
        user_input="create a variable x and set it equal to 1",
        expected_code='x=1',
        tags=['variable declaration']
    ),
    TestCase(
        name="empty_notebook_function_declaration",
        notebook_state=EMPTY_NOTEBOOK_STATE,
        user_input="create a function my_sum that takes two arguments and returns their sum",
        expected_code="""def my_sum(a, b):
    return a + b""",
        tags=['function declaration']
    ),
    TestCase(
        name="initialized_variables_variable_declaration",
        notebook_state=INITIALIZED_VARIABLES_NOTEBOOK_STATE,
        user_input="create a new variable w that is the product of x, y, and z",
        expected_code="w = x * y * z",
        tags=['variable declaration']
    )
]

for prompt_generator in PROMPT_GENERATORS:

    test_case_results: List[TestCaseResult] = []

    for test in TESTS:
            
        # Get the script from the cells
        current_cell_contents_script = get_script_from_cells(test.notebook_state.cell_contents)

        # Get the expected code script 
        expected_code = current_cell_contents_script + "\n" + test.expected_code

        # Create the actual code script produced by the LLM
        prompt = prompt_generator.get_prompt(test.user_input, test.notebook_state)
        ai_generated_code = get_open_ai_completion(prompt)
        actual_code = current_cell_contents_script + "\n" + ai_generated_code

        # So that we can compare the results of the two scripts, create global context for 
        # each script. When calling exec, the globals are updated in place.
        expected_globals = {}
        actual_globals = {}

        exec(expected_code, expected_globals)
        exec(actual_code, actual_globals)

        expected_globals = get_globals_to_compare(expected_globals)
        actual_globals = get_globals_to_compare(actual_globals)

        # TODO: Add statistics on how many tests pass/fail

        test_case_result = TestCaseResult(test=test, passed=expected_globals == actual_globals)
        test_case_results.append(test_case_result)

    print_test_case_result_table(prompt_generator.prompt_name, test_case_results)
    