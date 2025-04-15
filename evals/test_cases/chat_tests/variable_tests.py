# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

from evals.eval_types import CodeGenTestCaseCore, ChatTestCase
from evals.notebook_states import *

VARIABLE_TESTS = [
    ChatTestCase(
        name="empty_notebook_variable_declaration",
        test_case_core=CodeGenTestCaseCore(
            notebook_state=EMPTY_NOTEBOOK,
            expected_code="x=1",
            workflow_tags=["variable_declaration"],
        ),
        user_input="create a variable x and set it equal to 1",
    ),
    ChatTestCase(
        name="initialized_variables_variable_declaration",
        test_case_core=CodeGenTestCaseCore(
            notebook_state=INITIALIZED_VARIABLES_NOTEBOOK,
            expected_code="w = x * y * z",
            workflow_tags=["variable_declaration"],
        ),
        user_input="create a new variable w that is the product of x, y, and z",
    ),
    ChatTestCase(
        name="find_largest_number_of_intialized_variables",
        test_case_core=CodeGenTestCaseCore(
            notebook_state=INITIALIZED_VARIABLES_NOTEBOOK,
            expected_code="largest_number = max([x, y, z])",
            workflow_tags=["variable_declaration"],
        ),
        user_input="find the largest number of initialized variables and save it in largest_number",
    ),
]
