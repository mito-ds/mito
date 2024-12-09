from evals.eval_types import CodeGenTestCase, CodeGenTestCaseCore, SmartDebugTestCase
from evals.notebook_states import EMPTY_NOTEBOOK


SMART_DEBUG_TESTS = [
    SmartDebugTestCase(
        name="error_missing_quote",
        notebook_state=EMPTY_NOTEBOOK,
        invalid_code="x='aaron",
        correct_code="x='aaron'",
        tags=['simple']
    ),
    SmartDebugTestCase(
        name="missing_colon_in_function_definition",
        notebook_state=EMPTY_NOTEBOOK,
        invalid_code=""""
def my_sum(x, y)
    return x + y

sum_one = my_sum(1, 2)
sum_two = my_sum(3, 4)""",
        correct_code="""
def my_sum(x, y):
    return x + y

sum_one = my_sum(1, 2)
sum_two = my_sum(3, 4)""",
        tags=['simple']
    ),
    SmartDebugTestCase(
        name="single_equals_sign_in_if_statement",
        notebook_state=EMPTY_NOTEBOOK,
        invalid_code="""
x = 1
if x = 1:
    print("x is 1")
else:
    print("x is not 1")
""",
        correct_code="""
x = 1
if x == 1:
    print("x is 1")
else:
    print("x is not 1")
""",
        tags=['simple']
    ),
    SmartDebugTestCase(
        name="output_comparison",
        notebook_state=EMPTY_NOTEBOOK,
        invalid_code="print('hello world)",
        correct_code="print('hello world')",
        tags=['simple']
    ),
    SmartDebugTestCase(
        name="missing_datetime_import",
        notebook_state=EMPTY_NOTEBOOK,
        invalid_code="""
today = datetime.today().strftime('%Y-%m-%d')
""",
        correct_code="""
from datetime import datetime
today = datetime.today().strftime('%Y-%m-%d')
""",
        tags=['simple']
    )
]
