# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

from evals.eval_types import CodeGenTestCaseCore, ChatTestCase
from evals.notebook_states import *

SCHEMA_TESTS = [
    ChatTestCase(
        name="schema_test_case",
        test_case_core=CodeGenTestCaseCore(
            notebook_state=EMPTY_NOTEBOOK_WITH_SCHEMA,
            expected_code="x=1",
            workflow_tags=["variable_declaration"],
        ),
        user_input="can you get me a list of all the cars that are less than 20k",
        # user_input="can you get me a list of all the cars that have less than 10k miles",
    ),
]
