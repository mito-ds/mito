from evals.eval_types import TestCase
from evals.notebook_states import *

VARIABLE_TESTS = [
    TestCase(
        name="empty_notebook_variable_declaration",
        notebook_state=EMPTY_NOTEBOOK,
        user_input="create a variable x and set it equal to 1",
        expected_code="x=1",
        tags=["variable_declaration"],
    ),
    TestCase(
        name="initialized_variables_variable_declaration",
        notebook_state=INITIALIZED_VARIABLES_NOTEBOOK,
        user_input="create a new variable w that is the product of x, y, and z",
        expected_code="w = x * y * z",
        tags=["variable_declaration"],
    ),
    TestCase(
        name="find_largest_number_of_intialized_variables",
        notebook_state=INITIALIZED_VARIABLES_NOTEBOOK,
        user_input="find the largest number of initialized variables and save it in largest_number",
        expected_code="largest_number = max([x, y, z])",
        tags=["variable_declaration"],
    ),
]
