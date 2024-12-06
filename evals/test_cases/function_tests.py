from evals.eval_types import CodeGenTestCaseCore, TestCase
from evals.notebook_states import *

NUMBER_OF_BMW_FORD_TOYOTA_FIRST_OWNER_FUNCTION = CodeGenTestCaseCore(
    notebook_state=USED_CARS_DF_NOTEBOOK,
    expected_code="""def get_number_of_first_owner_vehicles_by_brand(df, brand):
    df = df[(df['Brand'].str.contains(brand, na=False, regex=False)) & (df['Owner'].str.contains('first', na=False, regex=False))]
    return len(df)

num_bmw = get_number_of_first_owner_vehicles_by_brand(used_cars_df, 'BMW')
num_toyota = get_number_of_first_owner_vehicles_by_brand(used_cars_df, 'Toyota')
num_ford = get_number_of_first_owner_vehicles_by_brand(used_cars_df, 'Ford')""",
    tags=["function_declaration"],
)



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
    TestCase(
        name="fibonacci_function",
        notebook_state=EMPTY_NOTEBOOK,
        user_input="""Create a function fibonacci that takes an integer n and returns an array of the first n Fibonacci numbers where the first two numbers are 1 and 3.

Then create a variable called x that is an array of the first 10 Fibonacci numbers.

Finally, create a variable called y that is the sum of x.
""",
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
        variables_to_compare=["x", "y"],
        tags=["function_declaration"],
    ),
]
