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

USED_CARS_DF_NOTEBOOK: NotebookState = NotebookState(
    global_vars={'used_cars_df': pd.DataFrame({
        'Brand': ['Honda', 'Toyota', 'Volkswagen', 'Maruti Suzuki', 'Maruti Suzuki'],
        'model': ['City', 'Innova', 'VentoTest', 'Swift', 'Baleno'],
        'Year': [2001, 2009, 2010, 2017, 2019],
        'Age': [23, 15, 14, 7, 5],
        'kmDriven': [98000.0, 190000.0, 77246.0, 83500.0, 45000.0],
        'Transmission': ['Manual', 'Manual', 'Manual', 'Manual', 'Automatic'],
        'Owner': ['second', 'second', 'first', 'second', 'first'],
        'FuelType': ['Petrol', 'Diesel', 'Diesel', 'Diesel', 'Petrol'],
        'PostedDate': ['Nov-24', 'Jul-24', 'Nov-24', 'Nov-24', 'Nov-24'],
        'AdditionInfo': [
            'Honda City v teck in mint condition, valid genuine car,',
            'Toyota Innova 2.5 G (Diesel) 7 Seater, 2009, Diesel',
            'Volkswagen Vento 2010-2013 Diesel Breeze, 2010, Diesel',
            'Maruti Suzuki Swift 2017 Diesel Good Condition',
            'Maruti Suzuki Baleno Alpha CVT, 2019, Petrol'
        ],
        'AskPrice': ['₹ 1,95,000', '₹ 3,75,000', '₹ 1,84,999', '₹ 5,65,000', '₹ 6,85,000']
    })},
    cell_contents=["""import pandas as pd
used_cars_df = pd.read_csv('evals/data/used_cars.csv')""", '']
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
    TestCase(
        name='dataframe_creation_from_dict',
        notebook_state=EMPTY_NOTEBOOK_WITH_PANDAS,
        user_input="""Create a dataframe called used_cars_df that contains this data:
        
[{'Brand': 'Honda',
  'model': 'City',
  'Year': 2001,
  'Age': 23,
  'kmDriven': 98000.0,
  'Transmission': 'Manual',
  'Owner': 'second',
  'FuelType': 'Petrol',
  'PostedDate': 'Nov-24',
  'AdditionInfo': 'Honda City v teck in mint condition, valid genuine car,',
  'AskPrice': '₹ 1,95,000'},
 {'Brand': 'Toyota',
  'model': 'Innova',
  'Year': 2009,
  'Age': 15,
  'kmDriven': 190000.0,
  'Transmission': 'Manual',
  'Owner': 'second',
  'FuelType': 'Diesel',
  'PostedDate': 'Jul-24',
  'AdditionInfo': 'Toyota Innova 2.5 G (Diesel) 7 Seater, 2009, Diesel',
  'AskPrice': '₹ 3,75,000'}]
        """,
        expected_code="""used_cars_df = pd.DataFrame({
    'Brand': ['Honda', 'Toyota'],
    'model': ['City', 'Innova'],
    'Year': [2001, 2009],
    'Age': [23, 15],
    'kmDriven': [98000.0, 190000.0],
    'Transmission': ['Manual', 'Manual'],
    'Owner': ['second', 'second'],
    'FuelType': ['Petrol', 'Diesel'],
    'PostedDate': ['Nov-24', 'Jul-24'],
    'AdditionInfo': [
        'Honda City v teck in mint condition, valid genuine car,',
        'Toyota Innova 2.5 G (Diesel) 7 Seater, 2009, Diesel',
    ],
    'AskPrice': ['₹ 1,95,000', '₹ 3,75,000']
})}""",
        tags=['df creation', 'pandas']
    ),
    TestCase(
        name='dataframe_creation_from_for_loop',
        notebook_state=EMPTY_NOTEBOOK_WITH_PANDAS,
        user_input="Create a new dataframe with a column called 'numbers' that contains the numbers 1 through 1000",
        expected_code="df = pd.DataFrame({'numbers': range(1, 1001)})",
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
        name="implicit_datetime_conversion",
        notebook_state=LOANS_DF_NOTEBOOK,
        user_input="Create a new column called year that is the year of the issue_date column",
        expected_code="""loans_df['issue_date'] = pd.to_datetime(loans_df['issue_date'], format='%Y-%m-%d', errors='coerce')
loans_df['year'] = loans_df['issue_date'].dt.year""",
        tags=['dataframe transformation', 'pandas']
    ),
    TestCase(
        name='datetime_conversion_non_conventional_format',
        notebook_state=USED_CARS_DF_NOTEBOOK,
        user_input="Convert the posted date column to an actual datetime column",
        expected_code="""used_cars_df['PostedDate'] = pd.to_datetime(used_cars_df['PostedDate'], format='%b-%y')""",
        tags=['dataframe transformation', 'pandas']
    ),
    TestCase(
        name="explicit_float_conversion",
        notebook_state=LOANS_DF_NOTEBOOK,
        user_input="Convert the annual income column to a float",
        expected_code="loans_df['annual_income'] = loans_df['annual_income'].astype(float)",
        tags=['dataframe transformation', 'pandas']
    ),
    TestCase(
        name="explicit_int_conversion",
        notebook_state=LOANS_DF_NOTEBOOK,
        user_input="Convert the interest rate column to an int",
        expected_code="loans_df['interest_rate'] = loans_df['interest_rate'].astype(int)",
        tags=['dataframe transformation', 'pandas']
    ),
    TestCase(
        name='convert_string_to_float_tricky',
        notebook_state=USED_CARS_DF_NOTEBOOK,
        user_input="Convert the kilometers driven column to a number series",
        expected_code="""used_cars_df["kmDriven"] = used_cars_df["kmDriven"].str[:-3]
used_cars_df["kmDriven"] = used_cars_df["kmDriven"].replace({',': ''}, regex=True)
used_cars_df["kmDriven"] = used_cars_df["kmDriven"].astype(float)""",
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
    TestCase(
        name="column_multiplication_scalar",
        notebook_state=LOANS_DF_NOTEBOOK,
        user_input="Multiply the interest rate by 100",
        expected_code="loans_df['interest_rate'] = loans_df['interest_rate'] * 100",
        tags=['dataframe transformation', 'pandas']
    ),
    TestCase(
        name="calculate_monthly_payment_provided_formula",
        notebook_state=LOANS_DF_NOTEBOOK,
        user_input="Calculate the monthly_payment by multiplying the loan amount by the interest rate / 12",
        expected_code="loans_df['monthly_payment'] = loans_df['loan_amount'] * (loans_df['interest_rate'] / 12)",
        tags=['dataframe transformation', 'pandas']
    ),
    TestCase(
        name="calculate_monthly_payment_no_formula",
        notebook_state=LOANS_DF_NOTEBOOK,
        user_input="Calculate the monthly_payment",
        expected_code="loans_df['monthly_payment'] = loans_df['loan_amount'] * (loans_df['interest_rate'] / 12)",
        tags=['dataframe transformation', 'pandas']
    ),
    TestCase(
        name="column_division_scalar",
        notebook_state=LOANS_DF_NOTEBOOK,
        user_input="Divide the total payment by 1000",
        expected_code="loans_df['total_pymnt'] = loans_df['total_pymnt']/1000",
        tags=['dataframe transformation', 'pandas']
    ),
    TestCase(
        name='calculate_remaining_balance_provided_formula',
        notebook_state=LOANS_DF_NOTEBOOK,
        user_input="Calculate the remaining_balance",
        expected_code="loans_df['remaining_principal'] = loans_df['loan_amount']-loans_df['total_rec_prncp']",
        tags=['dataframe transformation', 'pandas']
    ),
    TestCase(
        name='calculate_remaining_balance_no_formula',
        notebook_state=LOANS_DF_NOTEBOOK,
        user_input="Calculate the remaining_balance by subtracting the total_rec_prncp from the loan amount",
        expected_code="loans_df['remaining_principal'] = loans_df['loan_amount']-loans_df['total_rec_prncp']",
        tags=['dataframe transformation', 'pandas']
    ),
    TestCase(
        name='sum_last_three_columns',
        notebook_state=LOANS_DF_NOTEBOOK,
        user_input="Calculate a new column called sum_last_three that is the sum of the last three columns",
        expected_code="loans_df['sum_last_three'] = loans_df['interest_rate']+loans_df['total_pymnt']+loans_df['total_rec_prncp']",
        tags=['dataframe transformation', 'pandas']
    ),
    TestCase(
        name='sum_int_columns',
        notebook_state=LOANS_DF_NOTEBOOK,
        user_input="Calculate a new column called sum_int_columns that is the sum of all the integer columns",
        expected_code="loans_df['sum_int_columns'] = loans_df['annual_income']+loans_df['loan_amount']",
        tags=['dataframe transformation', 'pandas']
    ),
    TestCase(
        name='delete_column',
        notebook_state=LOANS_DF_NOTEBOOK,
        user_input="Delete the annual_income column",
        expected_code="loans_df.drop(columns=['annual_income'], inplace=True)",
        tags=['dataframe transformation', 'pandas']
    ),
    TestCase(
        name='find_and_replace_string',
        notebook_state=LOANS_DF_NOTEBOOK,
        user_input="Replace the word 'Low' with 'Bottom Bucket' in the entire dataframe",
        expected_code='loans_df = loans_df.astype(str).replace("(?i)Low", "Bottom Bucket", regex=True).astype(loans_df.dtypes.to_dict())',
        tags=['dataframe transformation', 'pandas']
    ),
    TestCase(
        name='find_and_replace_with_regex',
        notebook_state=LOANS_DF_NOTEBOOK,
        user_input="Replace the phrase 'car' with 'automobile'",
        expected_code='loans_df = loans_df.astype(str).replace("car", "automobile", regex=True).astype(loans_df.dtypes.to_dict())',
        tags=['dataframe transformation', 'pandas']
    ),
    TestCase(
        name='find_and_replace_with_no_regex',
        notebook_state=LOANS_DF_NOTEBOOK,
        user_input="Replace the word 'car' with 'automobile'. Do not replace the substring 'car' if it is part of a bigger word.",
        expected_code='loans_df = loans_df.astype(str).replace("car", "automobile").astype(loans_df.dtypes.to_dict())',
        tags=['dataframe transformation', 'pandas']
    ),
    TestCase(
        name='pivot_table_simple',
        notebook_state=LOANS_DF_NOTEBOOK,
        user_input="Create a pivot table called loans_df_pivot that shows the average loan amount for each loan purpose. Reset the index of the pivot table so the purpose column is a column in the dataframe. Do not edit the original dataframe. Instead, if you need to edit the original dataframe, make a copy of it called tmp_df and edit that one.",
        expected_code="""tmp_df = loans_df[['loan_amount', 'purpose']].copy()
pivot_table = tmp_df.pivot_table(
    index=['purpose'],
    values=['loan_amount'],
    aggfunc={'loan_amount': ['mean']}
)
loans_df_pivot = pivot_table.reset_index()""",
        tags=['dataframe transformation', 'pandas']
    ),
    TestCase(
        name='separate_data_by_column_value',
        notebook_state=LOANS_DF_NOTEBOOK,
        user_input="Separate the dataframe into one dataframe for each value in the income_category column. Name the dataframe <value>_df for each value. Use all lowercase letters for the df name.",
        expected_code="""low_df = loans_df[loans_df['income_category'] == 'Low']
medium_df = loans_df[loans_df['income_category'] == 'Medium']
high_df = loans_df[loans_df['income_category'] == 'High']""",
        tags=['dataframe transformation', 'pandas']
    ),
    TestCase(
        name='weighted_average_interest_rate',
        notebook_state=LOANS_DF_NOTEBOOK,
        user_input="Calculate a new variable called `weighted_average_interest_rate` that is the weighted average of the interest rate and loan amount.",
        expected_code="""loans_df['weighted interest rate'] = loans_df['loan_amount']*loans_df['interest_rate']
total_weighted_interest_rates = loans_df['weighted interest rate'].sum()
total_loan_balances = loans_df['loan_amount'].sum()
weighted_average_interest_rate = total_weighted_interest_rates / total_loan_balances""",
        tags=['dataframe transformation', 'pandas'],
        variables_to_compare=['weighted_average_interest_rate']
    ),
    TestCase(
        name='recreate_provided_code',
        notebook_state=USED_CARS_DF_NOTEBOOK,
        user_input="""Use this code to convert the kmDriven column to a float:
used_cars_df["kmDriven"] = used_cars_df["kmDriven"].str[:-3]
used_cars_df["kmDriven"] = used_cars_df["kmDriven"].replace({',': ''}, regex=True)
used_cars_df["kmDriven"] = used_cars_df["kmDriven"].astype(float)""",
        expected_code="""used_cars_df["kmDriven"] = used_cars_df["kmDriven"].str[:-3]
used_cars_df["kmDriven"] = used_cars_df["kmDriven"].replace({',': ''}, regex=True)
used_cars_df["kmDriven"] = used_cars_df["kmDriven"].astype(float)""",
        tags=['misc']
    ),
    TestCase(
        name='convert_km_to_miles',
        notebook_state=USED_CARS_DF_NOTEBOOK,
        user_input="""Use this code to convert the kmDriven column to a float:
used_cars_df["kmDriven"] = used_cars_df["kmDriven"].str[:-3]
used_cars_df["kmDriven"] = used_cars_df["kmDriven"].replace({',': ''}, regex=True)
used_cars_df["kmDriven"] = used_cars_df["kmDriven"].astype(float)

And then convert then create a new column called milesDrive.
""",
        expected_code="""used_cars_df["kmDriven"] = used_cars_df["kmDriven"].str[:-3]
used_cars_df["kmDriven"] = used_cars_df["kmDriven"].replace({',': ''}, regex=True)
used_cars_df["kmDriven"] = used_cars_df["kmDriven"].astype(float)
used_cars_df["milesDriven"] = used_cars_df["kmDriven"] * 0.621371
""",
        tags=['misc']
    ),
    TestCase(
        name='filter_requires_data_understanding',
        notebook_state=USED_CARS_DF_NOTEBOOK,
        user_input="""Filter the dataset to only include cars that have only been owned by one person""",
        expected_code="used_cars_df = used_cars_df[used_cars_df['Owner'] == 'first']",
        tags=['dataframe transformation', 'pandas']
    ),
    TestCase(
        name='filter_requires_data_understanding_more_vague',
        notebook_state=USED_CARS_DF_NOTEBOOK,
        user_input="""Filter the dataset to only include cars that have been purchased by one person in its lifetime""",
        expected_code="used_cars_df = used_cars_df[used_cars_df['Owner'] == 'first']",
        tags=['dataframe transformation', 'pandas']
    ),
    TestCase(
        name='convert_code_to_function',
        notebook_state=USED_CARS_DF_NOTEBOOK,
        user_input="""Convert this code to a function and then use it to get the number of first owners for BMW, Toyota, and Ford. 

Save the results in a variable called num_bmw, num_toyota, and num_ford.
         
used_cars_df = used_cars_df[(used_cars_df['Brand'].str.contains('BMW', na=False, regex=False)) & (used_cars_df['Owner'].str.contains('first', na=False, regex=False))]""",
        expected_code="""def get_number_of_first_owner_vehicles_by_brand(df, brand):
    df = df[(df['Brand'].str.contains(brand, na=False, regex=False)) & (df['Owner'].str.contains('first', na=False, regex=False))]
    return len(df)

num_bmw = get_number_of_first_owner_vehicles_by_brand(used_cars_df, 'BMW')
num_toyota = get_number_of_first_owner_vehicles_by_brand(used_cars_df, 'Toyota')
num_ford = get_number_of_first_owner_vehicles_by_brand(used_cars_df, 'Ford')
""",
        tags=['function declaration']
    )
]


for prompt_generator in PROMPT_GENERATORS:

    test_case_results: List[TestCaseResult] = []

    for test in TESTS:

        print(f"Running test: {test.name}")
            
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

        #print(f"\nExpected code: \n{expected_code}")
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

        expected_globals = get_globals_to_compare(expected_globals, test.variables_to_compare)
        actual_globals = get_globals_to_compare(actual_globals, test.variables_to_compare)

        # print(f"\nExpected globals: \n{expected_globals}")
        # print(f"\nActual globals: \n{actual_globals}")

        test_case_result = TestCaseResult(test=test, passed=are_globals_equal(expected_globals, actual_globals))
        test_case_results.append(test_case_result)

    print_test_case_result_table(prompt_generator.prompt_name, test_case_results)
    