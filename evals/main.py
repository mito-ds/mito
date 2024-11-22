from typing import List
from evals.ai_api_calls.get_open_ai_completion import get_open_ai_completion
from evals.prompts import PROMPT_GENERATORS
from evals.eval_types import NotebookState, TestCase, TestCaseResult
from evals.utils import are_globals_equal, print_test_case_result_table, get_globals_to_compare, get_script_from_cells
import pandas as pd


EMPTY_NOTEBOOK: NotebookState = NotebookState(
  global_vars={},
  cell_contents=[]
)

EMPTY_NOTEBOOK_WITH_PANDAS: NotebookState = NotebookState(
    global_vars={},
    cell_contents=['import pandas as pd', '']
)

INITIALIZED_VARIABLES_NOTEBOOK: NotebookState = NotebookState(
  global_vars={'x': 1, 'y': 2, 'z': 3},
  cell_contents=['x = 1', 'y = 2', 'z = 3', '']
)

LOANS_DF_NOTEBOOK: NotebookState = NotebookState(
  global_vars={'loans_df': pd.DataFrame({
    'issue_date': ['2011-01-12', '2011-01-12'],
    'income_category': ['Low', 'Low'],
    'annual_income': [24000, 30000],
    'loan_amount': [5000, 2500],
    'term': ['36 months', '60 months'],
    'purpose': ['credit_card', 'car'],
    'interest_payments': ['Low', 'High'],
    'loan_condition': ['Good Loan', 'Bad Loan'],
    'interest_rate': [10.65, 15.27],
    'total_pymnt': [5861.071414, 1008.710000],
    'total_rec_prncp': [5000.00, 456.46]
  })},
  cell_contents=["""import pandas as pd
loans_df = pd.read_csv('evals/data/loans.csv')""", '']
)

"""
Tests to add:
- [ ] Import Excel file
- [ ] Import file from url 
"""


TESTS: List[TestCase] = [
    # Create variables tests
    TestCase(
        name="empty_notebook_variable_declaration",
        notebook_state=EMPTY_NOTEBOOK,
        user_input="create a variable x and set it equal to 1",
        expected_code='x=1',
        tags=['variable declaration']
    ),
    TestCase(
        name="initialized_variables_variable_declaration",
        notebook_state=INITIALIZED_VARIABLES_NOTEBOOK,
        user_input="create a new variable w that is the product of x, y, and z",
        expected_code="w = x * y * z",
        tags=['variable declaration']
    ),

    # Create dataframe tests
    TestCase(
        name="import_csv",
        notebook_state=EMPTY_NOTEBOOK_WITH_PANDAS,
        user_input="Create a datafame called loans_df by importing the csv using the path 'evals/data/loans.csv'",
        expected_code="loans_df = pd.read_csv('evals/data/loans.csv')",
        tags=['df creation', 'pandas']
    ),

    # Create functions tests
    TestCase(
        name="empty_notebook_function_declaration",
        notebook_state=EMPTY_NOTEBOOK,
        user_input="create a function my_sum that takes two arguments and returns their sum. Then use it to create a variable called sum_result that is the sum of 1 and 2",
        expected_code="""def my_sum(a, b):
    return a + b
    
sum_result = my_sum(1, 2)
""",
        tags=['function declaration']
    ),

    # Edit Dataframe Tests
    TestCase(
        name="single_column_numeric_filter",
        notebook_state=LOANS_DF_NOTEBOOK,
        user_input="Filter the annual income column to > 100k",
        expected_code="loans_df = loans_df[loans_df['annual_income'] > 100000]",
        tags=['dataframe transformation', 'pandas']
    ),
    TestCase(
        name="two_column_filter",
        notebook_state=LOANS_DF_NOTEBOOK,
        user_input="Filter the annual income column to > 100k and the loan condition to only include 'Bad Loan'",
        expected_code="loans_df = loans_df[(loans_df['annual_income'] > 100000) & (loans_df['loan_condition'] == 'Bad Loan')]",
        tags=['dataframe transformation', 'pandas']
    ),
    TestCase(
        name="explicit_datetime_conversion",
        notebook_state=LOANS_DF_NOTEBOOK,
        user_input="Convert the issue_date column to datetime format",
        expected_code="loans_df['issue_date'] = pd.to_datetime(loans_df['issue_date'], format='%Y-%m-%d', errors='coerce')",
        tags=['dataframe transformation', 'pandas']
    ),
    TestCase(
        name="implicit_type_conversion",
        notebook_state=LOANS_DF_NOTEBOOK,
        user_input="Create a new column called year that is the year of the issue_date column",
        expected_code="""loans_df['issue_date'] = pd.to_datetime(loans_df['issue_date'], format='%Y-%m-%d', errors='coerce')
loans_df['year'] = loans_df['issue_date'].dt.year""",
        tags=['dataframe transformation', 'pandas']
    ),
    TestCase(
        name="single_column_renaming_specifc",
        notebook_state=LOANS_DF_NOTEBOOK,
        user_input="Rename issue_date to Issue Date",
        expected_code="loans_df.rename(columns={'issue_date': 'Issue Date'}, inplace=True)",
        tags=['dataframe transformation', 'pandas']
    ),
    TestCase(
        name="single_column_renaming_less_specifc",
        notebook_state=LOANS_DF_NOTEBOOK,
        user_input="Rename the date column to date",
        expected_code="loans_df.rename(columns={'issue_date': 'date'}, inplace=True)",
        tags=['dataframe transformation', 'pandas']
    ),
    TestCase(
        name="bulk_column_renaming",
        notebook_state=LOANS_DF_NOTEBOOK,
        user_input="Replace the _ with a space in all column names",
        expected_code="loans_df.columns = [col.replace('_', ' ') if isinstance(col, str) else col for col in loans_df.columns]",
        tags=['dataframe transformation', 'pandas']
    ),



    
]

for prompt_generator in PROMPT_GENERATORS:

    test_case_results: List[TestCaseResult] = []

    for test in TESTS:

        print(f"\n\nRunning test: {test.name}")
            
        # Get the script from the cells
        current_cell_contents_script = get_script_from_cells(test.notebook_state.cell_contents)

        # Get the expected code script 
        expected_code = current_cell_contents_script + "\n" + test.expected_code

        # Create the actual code script produced by the LLM
        prompt = prompt_generator.get_prompt(test.user_input, test.notebook_state)
        ai_generated_code = get_open_ai_completion(prompt)
        actual_code = current_cell_contents_script + "\n" + ai_generated_code

        # So that we can compare the results of the two scripts, create global context for 
        # each script. When calling exec, the globals are updated in place.
        expected_globals = {}
        actual_globals = {}

        print(f"\nExpected code: \n{expected_code}")
        print(f"\nActual code: \n{actual_code}")

        try:
            exec(expected_code, expected_globals)
            exec(actual_code, actual_globals)
        except Exception as e:
            # Fail early if we can't execute the code
            test_case_result = TestCaseResult(test=test, passed=False)
            test_case_results.append(test_case_result)
            print(f"Error: {e}")
            continue

        expected_globals = get_globals_to_compare(expected_globals)
        actual_globals = get_globals_to_compare(actual_globals)

        # TODO: Add statistics on how many tests pass/fail

        # print(f"\nExpected globals:")
        # print(expected_globals)

        # print(f"\nActual globals:")
        # print(actual_globals)

        test_case_result = TestCaseResult(test=test, passed=are_globals_equal(expected_globals, actual_globals))
        test_case_results.append(test_case_result)

    print_test_case_result_table(prompt_generator.prompt_name, test_case_results)
    