from evals.eval_types import CodeGenTestCaseCore, ChatTestCase
from evals.notebook_states import *

MY_SUM_FUNCTION = CodeGenTestCaseCore(
    notebook_state=EMPTY_NOTEBOOK,
    expected_code="""def my_sum(a, b):
    return a + b
    
sum_result = my_sum(1, 2)
""",
    workflow_tags=["function"],
)


PALINDROME_FUNCTION = CodeGenTestCaseCore(
    notebook_state=EMPTY_NOTEBOOK,
    expected_code="""def is_palindrome(s):
    return s == s[::-1]

is_palindrome_result = is_palindrome('racecar')
""",
    workflow_tags=["function"],
)

FIBONACCI_FUNCTION = CodeGenTestCaseCore(
    notebook_state=EMPTY_NOTEBOOK,
    expected_code="""def fibonacci(n):
    if n <= 0:
        return []
    if n == 1:
        return [1]
    if n == 2:
        return [1, 3]

    fib_array = [1, 3]
    for i in range(2, n):
        fib_array.append(fib_array[-1] + fib_array[-2])
    return fib_array

x = fibonacci(10)
y = sum(x)
""",
    workflow_tags=["function"],
)

FUNCTION_TESTS = [
    ChatTestCase(
        name="empty_notebook_function_declaration",
        test_case_core=MY_SUM_FUNCTION,
        user_input="create a function my_sum that takes two arguments and returns their sum. Then use it to create a variable called sum_result that is the sum of 1 and 2",
    ),
    ChatTestCase(
        name="palindrome_function",
        test_case_core=PALINDROME_FUNCTION,
        user_input="""Create a function is_palindrome that takes a string and returns True if it is a palindrome and False otherwise. 

Then use it to create a variable called is_palindrome_result that is True if 'racecar' is a palindrome and False otherwise.
""",
    ),
    ChatTestCase(
        name="fibonacci_function",
        test_case_core=FIBONACCI_FUNCTION,
        user_input="""Create a function fibonacci that takes an integer n and returns an array of the first n Fibonacci numbers where the first two numbers are 1 and 3.

Then create a variable called x that is an array of the first 10 Fibonacci numbers.

Finally, create a variable called y that is the sum of x.
""",
    ),
]
