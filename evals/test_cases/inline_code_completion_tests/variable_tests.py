from evals.eval_types import CodeGenTestCaseCore, InlineCodeCompletionTestCase
from evals.notebook_states import *

VARIABLE_TESTS = [
    InlineCodeCompletionTestCase(
        name="empty_notebook_variable_declaration",
        test_case_core=CodeGenTestCaseCore(
            notebook_state=EMPTY_NOTEBOOK,
            expected_code="x=1",
            tags=["variable_declaration"],
        ),
        prefix="""
# Create a variable x and set it equal to 1
x = """,
        suffix="",
        inline_code_completion_tags=["prefix_completion"],
    ),
    InlineCodeCompletionTestCase(
        name="empty_notebook_variable_declaration_with_suffix",
        test_case_core=CodeGenTestCaseCore(
            notebook_state=EMPTY_NOTEBOOK,
            expected_code="""
x=1
y=2""",
            tags=["variable_declaration"],
        ),
        prefix="""
# Set x equal to 1
x = """,
        suffix="y=2",
        inline_code_completion_tags=["prefix_completion"],
    )
]