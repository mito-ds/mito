# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

from evals.eval_types import CodeGenTestCaseCore, ChatTestCase
from evals.notebook_states import *

SCHEMA_TESTS = [
    ChatTestCase(
        name="schema_test_case",
        test_case_core=CodeGenTestCaseCore(
            notebook_state=EMPTY_NOTEBOOK,
            expected_code="x=1",
            workflow_tags=["variable_declaration"],
        ),
        user_input="create a variable x and set it equal to 1",
    ),
]
