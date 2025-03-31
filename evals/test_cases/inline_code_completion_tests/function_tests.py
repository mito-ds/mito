# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

from evals.eval_types import CodeGenTestCaseCore, InlineCodeCompletionTestCase
from evals.notebook_states import EMPTY_NOTEBOOK
from evals.test_cases.chat_tests.dataframe_transformation_tests import NUMBER_OF_BMW_FORD_TOYOTA_FIRST_OWNER_FUNCTION


FUNCTION_TESTS = [
    InlineCodeCompletionTestCase(
        name="create_my_sum_function_from_comment",
        test_case_core=CodeGenTestCaseCore(
            notebook_state=EMPTY_NOTEBOOK,
            workflow_tags=["function"],
            expected_code="""
# Return the sum of two numbers
def my_sum(a, b):
    return a + b
    
x = my_sum(1, 2)
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
            workflow_tags=["function"],
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

    InlineCodeCompletionTestCase(
        name="indented_code_location_finder_function_else_block",
        test_case_core=CodeGenTestCaseCore(
            notebook_state=EMPTY_NOTEBOOK,
            workflow_tags=["function"],
            expected_code="""
def location_finder(x):
    if x == 'NY':
        print("You are in NY")
    elif x == 'PA':
        print("You are in PA")
""",
        ),
        prefix="""
def location_finder(x):
    if x == 'NY':
        print("You are in NY")
    elif x == 'PA':
        print("You are""",
        suffix="""""",
        type_tags=["code_completion"],
    ),

        InlineCodeCompletionTestCase(
        name="indented_code_location_finder_function_else_clause",
        test_case_core=CodeGenTestCaseCore(
            notebook_state=EMPTY_NOTEBOOK,
            workflow_tags=["function"],
            expected_code="""
def location_finder(x):
    if x == 'NY':
        print("You are in NY")
    elif x == 'PA':
        print("You are in PA")
""",
        ),
        prefix="""
def location_finder(x):
    # Handle the NY Case
    if x == 'NY':
        print("You are in NY")
    # Handle the PA Case
    elif x""",
        suffix="""""",
        type_tags=["code_completion"],
    ),

    InlineCodeCompletionTestCase(
        name="indented_code_location_finder_function_continue_after_else_clause",
        test_case_core=CodeGenTestCaseCore(
            notebook_state=EMPTY_NOTEBOOK,
            workflow_tags=["function"],
            expected_code="""
def location_finder(x):
    if x == 'NY':
        print("You are in NY")
    elif x == 'PA':
        print("You are in PA")
""",
        ),
        prefix="""
def location_finder(x):
    # Handle the NY Case
    if x == 'NY':
        print("You are in NY")
    # Handle the PA Case
    elif x == 'PA':""",
        suffix="""""",
        type_tags=["code_completion"],
    ),
    
    # NUMBER_OF_BMW_FORD_TOYOTA_FIRST_OWNER_FUNCTION
    InlineCodeCompletionTestCase(
        name="number_first_owner_function_prefix",
        test_case_core=NUMBER_OF_BMW_FORD_TOYOTA_FIRST_OWNER_FUNCTION,
        prefix="""def get_number_of_first_owner_vehicles_by_brand(df, brand):
    df = df[(df['Brand'].str.contains(brand, na=False, regex=False)) & (df['Owner'].str.contains('first', na=False, regex=False))]
    return len(df)

num_bmw = get_number_of_first_owner_vehicles_by_brand(used_cars_df, 'BMW')
num_toyota = get_number_of_first_owner_vehicles_by_brand(used_cars_df, 'Toyota')
num_ford = """,
        suffix="",
        type_tags=['code_completion'],
    ),
    # Call the missing funciton infered from sufix
    InlineCodeCompletionTestCase(
        name="number_first_owner_function_prefixsuffix",
        test_case_core=NUMBER_OF_BMW_FORD_TOYOTA_FIRST_OWNER_FUNCTION,
        prefix="""def get_number_of_first_owner_vehicles_by_brand(df, brand):
    df = df[(df['Brand'].str.contains(brand, na=False, regex=False)) & (df['Owner'].str.contains('first', na=False, regex=False))]
    return len(df)
    
num_bmw = """,
        suffix="""
num_toyota = get_number_of_first_owner_vehicles_by_brand(used_cars_df, 'Toyota')
num_ford = get_number_of_first_owner_vehicles_by_brand(used_cars_df, 'Ford')""",
        type_tags=['code_completion'],
    ),

    InlineCodeCompletionTestCase(
        name="number_first_owner_function_prefix_suffix_finish_variable_declaration",
        test_case_core=NUMBER_OF_BMW_FORD_TOYOTA_FIRST_OWNER_FUNCTION,
        prefix="""def get_number_of_first_owner_vehicles_by_brand(df, brand):
    df = df[(df['Brand'].str.contains(brand, na=False, regex=False)) & (df['Owner'].str.contains('first', na=False, regex=False))]
    return len(df)
    
""",
        suffix="""get_number_of_first_owner_vehicles_by_brand(used_cars_df, 'BMW')
num_toyota = get_number_of_first_owner_vehicles_by_brand(used_cars_df, 'Toyota')
num_ford = get_number_of_first_owner_vehicles_by_brand(used_cars_df, 'Ford')""",
        type_tags=['code_completion'],
    ),
]
