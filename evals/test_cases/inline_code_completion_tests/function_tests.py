


from evals.eval_types import CodeGenTestCaseCore, InlineCodeCompletionTestCase
from evals.notebook_states import EMPTY_NOTEBOOK


FUNCTION_TESTS = [
    InlineCodeCompletionTestCase(
        name="create_my_sum_function_from_comment",
        test_case_core=CodeGenTestCaseCore(
            notebook_state=EMPTY_NOTEBOOK,
            workflow_tags=["function_declaration"],
            expected_code="""
# Return the sum of two numbers
def my_sum(a, b):
    return a + b
""",
        ),
        prefix="""# Return the sum of two numbers""",
        suffix="""
x = my_sum(1, 2)
""",
        type_tags=["comment_following"],
    ),
    InlineCodeCompletionTestCase(
        name='finish_my_sum_function_implementation',
        test_case_core=CodeGenTestCaseCore(
            notebook_state=EMPTY_NOTEBOOK,
            workflow_tags=["function_declaration"],
            expected_code="""
def my_sum(a, b):
    return a + b

x = my_sum(1, 2)
""",
        ),
        prefix="""def my_sum(a, b):""",
        suffix="""
x = my_sum(1, 2)
""",
        type_tags=["code_completion"],
    ),
]