from evals.eval_types import TestCase
from evals.notebook_states import *

FUNCTION_TESTS = [
    TestCase(
        name="empty_notebook_function_declaration",
        notebook_state=EMPTY_NOTEBOOK,
        user_input="create a function my_sum that takes two arguments and returns their sum. Then use it to create a variable called sum_result that is the sum of 1 and 2",
        expected_code="""def my_sum(a, b):
    return a + b
    
sum_result = my_sum(1, 2)
""",
        tags=["function_declaration"],
    ),
    TestCase(
        name="palindrome_function",
        notebook_state=EMPTY_NOTEBOOK,
        user_input="""Create a function is_palindrome that takes a string and returns True if it is a palindrome and False otherwise. 
Then use it to create a variable called is_palindrome_result that is True if 'racecar' is a palindrome and False otherwise.
""",
        expected_code="""def is_palindrome(s):
    return s == s[::-1]

is_palindrome_result = is_palindrome('racecar')
""",
        tags=["function_declaration"],
    ),
]
