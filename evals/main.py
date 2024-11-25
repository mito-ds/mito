import argparse
from typing import Dict, List
from evals.ai_api_calls.get_open_ai_completion import get_open_ai_completion
from evals.prompts import PROMPT_GENERATORS
from evals.eval_types import TestCase, TestCaseResult
from evals.utils import are_globals_equal, get_globals_to_compare, get_script_from_cells, print_test_case_result_tables
import pandas as pd
from evals.notebook_states import *

TESTS: List[TestCase] = [
    # Create variables tests
    TestCase(
        name="empty_notebook_variable_declaration",
        notebook_state=EMPTY_NOTEBOOK,
        user_input="create a variable x and set it equal to 1",
        expected_code='x=1',
        tags=['variable_declaration']
    ),
    TestCase(
        name="initialized_variables_variable_declaration",
        notebook_state=INITIALIZED_VARIABLES_NOTEBOOK,
        user_input="create a new variable w that is the product of x, y, and z",
        expected_code="w = x * y * z",
        tags=['variable_declaration']
    ),
    TestCase(
        name='find_largest_number_of_intialized_variables',
        notebook_state=INITIALIZED_VARIABLES_NOTEBOOK,
        user_input="find the largest number of initialized variables and save it in largest_number",
        expected_code="largest_number = max([x, y, z])",
        tags=['variable_declaration']
    ),

    # Create dataframe tests
    TestCase(
        name="import_csv",
        notebook_state=EMPTY_NOTEBOOK_WITH_PANDAS,
        user_input="Create a datafame called loans_df by importing the csv using the path 'evals/data/loans.csv'",
        expected_code="loans_df = pd.read_csv('evals/data/loans.csv')",
        tags=['df_creation', 'pandas']
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
})""",
        tags=['df_creation', 'pandas']
    ),
    TestCase(
        name='dataframe_creation_from_for_loop',
        notebook_state=EMPTY_NOTEBOOK_WITH_PANDAS,
        user_input="Create a new dataframe with a column called 'numbers' that contains the numbers 1 through 1000",
        expected_code="df = pd.DataFrame({'numbers': range(1, 1001)})",
        tags=['df_creation', 'pandas']
    ),
    TestCase(
        name='dataframe_creation_from_url',
        notebook_state=EMPTY_NOTEBOOK_WITH_PANDAS,
        user_input="Create a `df` from this url https://raw.githubusercontent.com/plotly/datasets/master/tesla-stock-price.csv",
        expected_code="df = pd.read_csv('https://raw.githubusercontent.com/plotly/datasets/master/tesla-stock-price.csv')",
        tags=['df_creation', 'pandas']
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
        tags=['function_declaration']
    ),

    # Edit Dataframe Tests
    TestCase(
        name="single_column_numeric_filter",
        notebook_state=LOANS_DF_NOTEBOOK,
        user_input="Filter the annual income column to > 100k",
        expected_code="loans_df = loans_df[loans_df['annual_income'] > 100000]",
        tags=['df_transformation', 'pandas']
    ),
    TestCase(
        name="two_column_filter",
        notebook_state=LOANS_DF_NOTEBOOK,
        user_input="Filter the annual income column to > 100k and the loan condition to only include 'Bad Loan'",
        expected_code="loans_df = loans_df[(loans_df['annual_income'] > 100000) & (loans_df['loan_condition'] == 'Bad Loan')]",
        tags=['df_transformation', 'pandas']
    ),
    TestCase(
        name="explicit_datetime_conversion",
        notebook_state=LOANS_DF_NOTEBOOK,
        user_input="Convert the issue_date column to datetime format",
        expected_code="loans_df['issue_date'] = pd.to_datetime(loans_df['issue_date'], format='%Y-%m-%d', errors='coerce')",
        tags=['df_transformation', 'pandas']
    ),
    TestCase(
        name="implicit_datetime_conversion",
        notebook_state=LOANS_DF_NOTEBOOK,
        user_input="Create a new column called year that is the year of the issue_date column",
        expected_code="""loans_df['issue_date'] = pd.to_datetime(loans_df['issue_date'], format='%Y-%m-%d', errors='coerce')
loans_df['year'] = loans_df['issue_date'].dt.year""",
        tags=['df_transformation', 'pandas']
    ),
    TestCase(
        name='datetime_conversion_non_conventional_format',
        notebook_state=USED_CARS_DF_NOTEBOOK,
        user_input="Convert the posted date column to an actual datetime column",
        expected_code="""used_cars_df['PostedDate'] = pd.to_datetime(used_cars_df['PostedDate'], format='%b-%y')""",
        tags=['df_transformation', 'pandas']
    ),
    TestCase(
        name="explicit_float_conversion",
        notebook_state=LOANS_DF_NOTEBOOK,
        user_input="Convert the annual income column to a float",
        expected_code="loans_df['annual_income'] = loans_df['annual_income'].astype(float)",
        tags=['df_transformation', 'pandas']
    ),
    TestCase(
        name="explicit_int_conversion",
        notebook_state=LOANS_DF_NOTEBOOK,
        user_input="Convert the interest rate column to an int",
        expected_code="loans_df['interest_rate'] = loans_df['interest_rate'].astype(int)",
        tags=['df_transformation', 'pandas']
    ),
    TestCase(
        name='convert_currency_string_to_float',
        notebook_state=MESSY_DATA_NOTEBOOK,
        user_input="Convert the Transaction_Price column to a float",
        expected_code="""df['Transaction_Price'] = df['Transaction_Price'].str[1:]
df['Transaction_Price'] = df['Transaction_Price'].astype(float)
""",
        tags=['df_transformation', 'pandas']
    ),
    TestCase(
        name='convert_string_to_float_tricky',
        notebook_state=USED_CARS_DF_NOTEBOOK,
        user_input="Convert the kilometers driven column to a number series",
        expected_code="""used_cars_df["kmDriven"] = used_cars_df["kmDriven"].str[:-3]
used_cars_df["kmDriven"] = used_cars_df["kmDriven"].replace({',': ''}, regex=True)
used_cars_df["kmDriven"] = used_cars_df["kmDriven"].astype(float)""",
        tags=['df_transformation', 'pandas']
    ),
    TestCase(
        name='calculate_num_of_prev_days',
        notebook_state=MESSY_DATA_NOTEBOOK,
        user_input="Calculate a new column called 'Days Ago' that is the number of days between now and the transaction date",
        expected_code="""df['Date'] = pd.to_datetime(df['Date'], format='mixed', errors='coerce')
df['Days Ago'] = df['Date'] - pd.to_datetime("now")
""",
        tags=['df_transformation', 'pandas']
    ),
    TestCase(
        name="single_column_renaming_specifc",
        notebook_state=LOANS_DF_NOTEBOOK,
        user_input="Rename issue_date to Issue Date",
        expected_code="loans_df.rename(columns={'issue_date': 'Issue Date'}, inplace=True)",
        tags=['df_transformation', 'pandas']
    ),
    TestCase(
        name="single_column_renaming_less_specifc",
        notebook_state=LOANS_DF_NOTEBOOK,
        user_input="Rename the date column to date",
        expected_code="loans_df.rename(columns={'issue_date': 'date'}, inplace=True)",
        tags=['df_transformation', 'pandas']
    ),
    TestCase(
        name="bulk_column_renaming",
        notebook_state=LOANS_DF_NOTEBOOK,
        user_input="Replace the _ with a space in all column names",
        expected_code="loans_df.columns = [col.replace('_', ' ') if isinstance(col, str) else col for col in loans_df.columns]",
        tags=['df_transformation', 'pandas']
    ),
    TestCase(
        name="column_multiplication_scalar",
        notebook_state=LOANS_DF_NOTEBOOK,
        user_input="Multiply the interest rate by 100",
        expected_code="loans_df['interest_rate'] = loans_df['interest_rate'] * 100",
        tags=['df_transformation', 'pandas']
    ),
    TestCase(
        name="calculate_monthly_payment_provided_formula",
        notebook_state=LOANS_DF_NOTEBOOK,
        user_input="Calculate the monthly_payment by multiplying the loan amount by the interest rate / 12",
        expected_code="loans_df['monthly_payment'] = loans_df['loan_amount'] * (loans_df['interest_rate'] / 12)",
        tags=['df_transformation', 'pandas']
    ),
    TestCase(
        name="calculate_monthly_payment_no_formula",
        notebook_state=LOANS_DF_NOTEBOOK,
        user_input="Calculate the monthly_payment",
        expected_code="loans_df['monthly_payment'] = loans_df['loan_amount'] * (loans_df['interest_rate'] / 12)",
        tags=['df_transformation', 'pandas']
    ),
    TestCase(
        name="column_division_scalar",
        notebook_state=LOANS_DF_NOTEBOOK,
        user_input="Divide the total payment by 1000",
        expected_code="loans_df['total_pymnt'] = loans_df['total_pymnt']/1000",
        tags=['df_transformation', 'pandas']
    ),
    TestCase(
        name='calculate_remaining_balance_provided_formula',
        notebook_state=LOANS_DF_NOTEBOOK,
        user_input="Calculate the remaining_balance",
        expected_code="loans_df['remaining_principal'] = loans_df['loan_amount']-loans_df['total_rec_prncp']",
        tags=['df_transformation', 'pandas']
    ),
    TestCase(
        name='calculate_remaining_balance_no_formula',
        notebook_state=LOANS_DF_NOTEBOOK,
        user_input="Calculate the remaining_balance by subtracting the total_rec_prncp from the loan amount",
        expected_code="loans_df['remaining_principal'] = loans_df['loan_amount']-loans_df['total_rec_prncp']",
        tags=['df_transformation', 'pandas']
    ),
    TestCase(
        name='sum_last_three_columns',
        notebook_state=LOANS_DF_NOTEBOOK,
        user_input="Calculate a new column called sum_last_three that is the sum of the last three columns",
        expected_code="loans_df['sum_last_three'] = loans_df['interest_rate']+loans_df['total_pymnt']+loans_df['total_rec_prncp']",
        tags=['df_transformation', 'pandas']
    ),
    TestCase(
        name='sum_int_columns',
        notebook_state=LOANS_DF_NOTEBOOK,
        user_input="Calculate a new column called sum_int_columns that is the sum of all the integer columns",
        expected_code="loans_df['sum_int_columns'] = loans_df['annual_income']+loans_df['loan_amount']",
        tags=['df_transformation', 'pandas']
    ),
    TestCase(
        name='delete_column',
        notebook_state=LOANS_DF_NOTEBOOK,
        user_input="Delete the annual_income column",
        expected_code="loans_df.drop(columns=['annual_income'], inplace=True)",
        tags=['df_transformation', 'pandas']
    ),
    TestCase(
        name='find_and_replace_string',
        notebook_state=LOANS_DF_NOTEBOOK,
        user_input="Replace the word 'Low' with 'Bottom Bucket' in the entire dataframe",
        expected_code='loans_df = loans_df.astype(str).replace("(?i)Low", "Bottom Bucket", regex=True).astype(loans_df.dtypes.to_dict())',
        tags=['df_transformation', 'pandas']
    ),
    TestCase(
        name='find_and_replace_with_regex',
        notebook_state=LOANS_DF_NOTEBOOK,
        user_input="Replace the phrase 'car' with 'automobile'",
        expected_code='loans_df = loans_df.astype(str).replace("car", "automobile", regex=True).astype(loans_df.dtypes.to_dict())',
        tags=['df_transformation', 'pandas']
    ),
    TestCase(
        name='find_and_replace_with_no_regex',
        notebook_state=LOANS_DF_NOTEBOOK,
        user_input="Replace the word 'car' with 'automobile'. Do not replace the substring 'car' if it is part of a bigger word.",
        expected_code='loans_df = loans_df.astype(str).replace("car", "automobile").astype(loans_df.dtypes.to_dict())',
        tags=['df_transformation', 'pandas']
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
        tags=['df_transformation', 'pandas']
    ),
    TestCase(
        name='separate_data_by_column_value',
        notebook_state=LOANS_DF_NOTEBOOK,
        user_input="Separate the dataframe into one dataframe for each value in the income_category column. Name the dataframe <value>_df for each value. Use all lowercase letters for the df name.",
        expected_code="""low_df = loans_df[loans_df['income_category'] == 'Low']
medium_df = loans_df[loans_df['income_category'] == 'Medium']
high_df = loans_df[loans_df['income_category'] == 'High']""",
        tags=['df_transformation', 'pandas']
    ),
    TestCase(
        name='weighted_average_interest_rate',
        notebook_state=LOANS_DF_NOTEBOOK,
        user_input="Calculate a new variable called `weighted_average_interest_rate` that is the weighted average of the interest rate and loan amount.",
        expected_code="""loans_df['weighted interest rate'] = loans_df['loan_amount']*loans_df['interest_rate']
total_weighted_interest_rates = loans_df['weighted interest rate'].sum()
total_loan_balances = loans_df['loan_amount'].sum()
weighted_average_interest_rate = total_weighted_interest_rates / total_loan_balances""",
        tags=['df_transformation', 'pandas'],
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
        tags=['df_transformation', 'pandas']
    ),
    TestCase(
        name='filter_requires_data_understanding_more_vague',
        notebook_state=USED_CARS_DF_NOTEBOOK,
        user_input="""Filter the dataset to only include cars that have been purchased by one person in its lifetime""",
        expected_code="used_cars_df = used_cars_df[used_cars_df['Owner'] == 'first']",
        tags=['df_transformation', 'pandas']
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
        tags=['function_declaration']
    ),

    # Mutli-step workflow tests
    TestCase(
        name='clean_messy_data_multi_step',
        notebook_state=MESSY_DATA_NOTEBOOK,
        user_input="""Clean the data by:
- Convert the dates that are strings to timetime format
- Remove the substring -Stock from the Stock column
- Delete columns that only have one unqiue value
- Change the name of the Description column to Description""",
        expected_code="""
df['Date'] = pd.to_datetime(df['Date'], format='mixed', errors='coerce')
df['Stock '] = df['Stock '].str[:-6]
df.drop(['Type_of_Investment'], axis=1, inplace=True)
df.rename(columns={'Description of each transaction': 'Description'}, inplace=True)
""",
        tags=['df_transformation', 'pandas', 'multistep']
    ),
    TestCase(
        name='simple_recon',
        notebook_state=SIMPLE_RECON_NOTEBOOK,
        user_input="""
- Import transaction records from two different data sources: Eagle and an Excel file that is manually tracked.
- Merge them together on a column called Transaction ID
- Create a new column called "Check" and set it to the following:
    - If the either dataset does not have a value in the Share Quantity column, set the value of the Check column to "Action Required. Missing Data.".
    - If the Quantity numbers are the same, set the value of the Check column to "Matching. No action required."
    - If the numbers are not matching, set the value of the Check column to "Action Required. Quantity does not match."
- Finally, separate the data in 3 different sheets, one for each condition: `missing_data_df`, `matching_df`, `not_matching_df`""",
        expected_code="""
temp_df = excel_transactions.drop_duplicates(subset=['Transaction ID']) # Remove duplicates so lookup merge only returns first match
df_merge = eagle_transactions.merge(temp_df, left_on=['Transaction ID'], right_on=['Transaction ID'], how='left', suffixes=['_eagle_transactions', '_excel_transactions'])

def check_row(row):
    if pd.isnull(row['Share Quantity_eagle_transactions']) or pd.isnull(row['Share Quantity_excel_transactions']):
        row['Check'] = "Action Required. Missing Data."
    elif row['Share Quantity_eagle_transactions'] == row['Share Quantity_excel_transactions']:
        row['Check'] = "Matching. No action required."
    else: 
        row['Check'] = "Action Required. Quantity does not match."

    return row

df_merge = df_merge.apply(lambda row: check_row(row), axis = 1)

missing_data_df = df_merge[df_merge['Check'] == "Action Required. Missing Data."]
matching_df = df_merge[df_merge['Check'] == "Matching. No action required."]
not_matching_df = df_merge[df_merge['Check'] == "Action Required. Quantity does not match."]""",
        tags=['df_transformation', 'pandas', 'multistep'],
        variables_to_compare=['missing_data_df', 'matching_df', 'not_matching_df']
    ),

    TestCase(
        name='monthly_equity',
        notebook_state=MONTHLY_EQUITY_NOTEBOOK,
        user_input="""Calculate the Total Equity for each month for each entity by subtracting the Management Fee from the Ending Capital.

Create two dataframes, `july_equity` and `august_equity` that the final columns: entity_id, ending_capital, fees, and total_equity.
""",
        expected_code="""
def calculate_total_equity(balances_df, fees_df):

    # Merged data8_july_balances and data8_july_fees into df_merge
    temp_df = fees_df.drop_duplicates(subset=['entity_id']) # Remove duplicates so lookup merge only returns first match
    df_merge = balances_df.merge(temp_df, left_on=['entity_id'], right_on=['entity_id'], how='left')
    
    # Added column 'Total Equity'
    df_merge['total_equity'] = df_merge['ending_capital']-df_merge['fees']

    return df_merge


july_equity = calculate_total_equity(july_balances, july_fees)
august_equity = calculate_total_equity(august_balances, august_fees)""",
        tags=['df_transformation', 'pandas', 'multistep'],
        variables_to_compare=['july_equity', 'august_equity']
    ),

    TestCase(
        name='top_five_funds',
        notebook_state=MONTHLY_EQUITY_NOTEBOOK,
        user_input="""Calculate the five funds with the highest total equity for each month. Where the total equity is the ending capital minus the management fee.

Create two dataframes, `top_five_funds_july` and `top_five_funds_august` that are a dataframe that contain the top 5 funds for each month. It should have the final columns: entity_id, ending_capital, fees, and total_equity, and the indexes should be 0 to 4.
""",
        expected_code="""
def calculate_total_equity(balances_df, fees_df):

    # Merged data8_july_balances and data8_july_fees into df_merge
    temp_df = fees_df.drop_duplicates(subset=['entity_id']) # Remove duplicates so lookup merge only returns first match
    df_merge = balances_df.merge(temp_df, left_on=['entity_id'], right_on=['entity_id'], how='left')
    
    # Added column 'Total Equity'
    df_merge['total_equity'] = df_merge['ending_capital']-df_merge['fees']

    return df_merge

def get_top_five_funds(fund_total_equity_df):
    fund_total_equity_df = fund_total_equity_df.sort_values(by='total_equity', ascending=False, na_position='last')
    fund_total_equity_df = fund_total_equity_df.reset_index(drop=True)
    return fund_total_equity_df.head(5)


july_equity = calculate_total_equity(july_balances, july_fees)
august_equity = calculate_total_equity(august_balances, august_fees)

top_five_funds_july = get_top_five_funds(july_equity)
top_five_funds_august = get_top_five_funds(august_equity)
""",
        tags=['df_transformation', 'pandas', 'multistep'],
        variables_to_compare=['top_five_funds_july', 'top_five_funds_august']
    ),

    TestCase(
        name='highest_monthly_ending_capital',
        notebook_state=MONTHLY_EQUITY_NOTEBOOK,
        user_input="""Find the month with the highest ending capital for each entity.

Create a dataframe called `highest_monthly_ending_capital` that has the final columns: entity_id, ending_capital, and month.
""",
        expected_code="""
july_balances['month'] = 'July'
aug_balances['month'] = 'August'
highest_monthly_ending_capital = pd.concat([july_balances, aug_balances], join='inner', ignore_index=True)
highest_monthly_ending_capital = highest_monthly_ending_capital.sort_values(by='ending_capital', ascending=False, na_position='last')
highest_monthly_ending_capital = highest_monthly_ending_capital.drop_duplicates(subset=['entity_id'], keep='first')
highest_monthly_ending_capital = highest_monthly_ending_capital.sort_values(by='entity_id', ascending=True, na_position='first')
highest_monthly_ending_capital = highest_monthly_ending_capital.reset_index(drop=True)
""",
        tags=['df_transformation', 'pandas', 'multistep'],
        variables_to_compare=['highest_monthly_ending_capital']
    ),

]


if __name__ == "__main__":

    parser = argparse.ArgumentParser(description='Run evaluation tests')
    parser.add_argument('--test-name', type=str, help='Name of specific test to run')
    parser.add_argument('--prompt-name', type=str, help='Name of specific prompt to run')
    parser.add_argument('--tags', type=str, help='Comma separated list of tags to filter tests by')
    args = parser.parse_args()

    # Filter tests if test name provided
    print("Collecting tests...")

    tests_to_run = TESTS
    if args.test_name:
        tests_to_run = [test for test in TESTS if test.name == args.test_name]
        if not tests_to_run:
            print(f"No test found with name: {args.test_name}")
            exit(1)

    if args.tags:
        tests_to_run = [test for test in tests_to_run if any(tag in args.tags for tag in test.tags)]
        if not tests_to_run:
            print(f"No tests found with tags: {args.tags}")
            exit(1)

    print(f"Collected {len(tests_to_run)} tests")

    # Filter prompts if prompt name provided
    print("Collecting prompts...")
    prompt_generators_to_test = PROMPT_GENERATORS
    if args.prompt_name:
        prompt_generators_to_test = [prompt for prompt in PROMPT_GENERATORS if prompt.prompt_name == args.prompt_name]
        if not prompt_generators_to_test:
            print(f"No prompt found with name: {args.prompt_name}")
            exit(1)
    print(f"Collected {len(prompt_generators_to_test)} prompts")


    # Mapping from prompt name to test results for each prompt we test
    test_case_results: Dict[str, List[TestCaseResult]] = {}
    for prompt_generator in prompt_generators_to_test:
        test_case_results[prompt_generator.prompt_name] = []
        for test in tests_to_run:

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

            try:
                exec(expected_code, expected_globals)
                exec(actual_code, actual_globals)
            except Exception as e:
                # Fail early if we can't execute the code
                test_case_result = TestCaseResult(test=test, passed=False)
                test_case_results[prompt_generator.prompt_name].append(test_case_result)
                print("Test Failed: ")
                print(f"Expected code:\n{expected_code}")
                print(f"\nActual code:\n{actual_code}")
                print(f"Error: {e}")
                continue

            expected_globals = get_globals_to_compare(expected_globals, test.variables_to_compare)
            actual_globals = get_globals_to_compare(actual_globals, test.variables_to_compare)

            test_case_result = TestCaseResult(test=test, passed=are_globals_equal(expected_globals, actual_globals))
            test_case_results[prompt_generator.prompt_name].append(test_case_result)

    print_test_case_result_tables(test_case_results)
    