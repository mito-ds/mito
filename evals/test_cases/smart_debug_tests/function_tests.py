from evals.eval_types import SmartDebugTestCase
from evals.notebook_states import EMPTY_NOTEBOOK


FUNCTION_TESTS = [
    SmartDebugTestCase(
        name="missing_colon_in_function_definition_simple",
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
        tags=['simple', 'function', 'SyntaxError']
    ),
    SmartDebugTestCase(
        name='function_indentation_error_simple',
        notebook_state=EMPTY_NOTEBOOK,
        invalid_code="""
def my_sum(x, y):
return x + y

sum_one = my_sum(1, 2)
sum_two = my_sum(3, 4)
""",
        correct_code="""
def my_sum(x, y):
    return x + y

sum_one = my_sum(1, 2)
sum_two = my_sum(3, 4)
""",
        tags=['simple', 'function', 'IndentationError']
    ),
    SmartDebugTestCase(
        name='function_call_missing_parens_simple',
        notebook_state=EMPTY_NOTEBOOK,
        invalid_code="""
def my_sum(x, y):
    return x + y

x = my_sum 1, 2
""",
        correct_code="""
def my_sum(x, y):
    return x + y

x = my_sum(1, 2)
""",
        tags=['simple', 'function', 'SyntaxError']
    ),
    SmartDebugTestCase(
        name='function_call_with_missing_arguments_simple',
        notebook_state=EMPTY_NOTEBOOK,
        invalid_code="""
def my_sum(x, y):
    return x + y

x = my_sum(1)
""",
        correct_code="""
def my_sum(x, y):
    return x + y

x = my_sum(1, 2)
""",
        tags=['simple', 'function', 'TypeError']
    ),
    SmartDebugTestCase(
        name='function_call_with_extra_arguments_simple',
        notebook_state=EMPTY_NOTEBOOK,
        invalid_code="""
# Sum two numbers and return the result
def sum_two_numbers(x, y):
    return x + y

x = sum_two_numbers(1, 2, 3)
""",
        correct_code="""
def sum_two_numbers(x, y):
    return x + y

x = sum_two_numbers(1, 2)
""",
        tags=['simple', 'function', 'TypeError']
    ),
    SmartDebugTestCase(
        name='function_call_with_missing_return_simple',
        notebook_state=EMPTY_NOTEBOOK,
        invalid_code="""
def my_sum(x, y):
    result = x + y

def is_even(x):
    if x % 2 == 0:
        return True
    else:
        return False

x = my_sum(1, 2)
is_even(x)

""",
        correct_code="""
def my_sum(x, y):
    result = x + y
    return result

def is_even(x):
    if x % 2 == 0:
        return True
    else:
        return False

x = my_sum(1, 2)
is_even(x)
""",
        tags=['simple', 'function', 'TypeError'],
        variables_to_compare=['x']
    ),
    SmartDebugTestCase(
        name='function_call_with_wrong_name_simple',
        notebook_state=EMPTY_NOTEBOOK,
        invalid_code="""
def sum_two_numbers(x, y):
    return x + y

x = sum_two_number(1, 2)
""",
        correct_code="""
def sum_two_numbers(x, y):
    return x + y

x = sum_two_numbers(1, 2)
""",
        tags=['simple', 'function', 'NameError'],
        variables_to_compare=['x']
    )

]
