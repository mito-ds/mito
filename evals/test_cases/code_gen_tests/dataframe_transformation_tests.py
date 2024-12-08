from evals.eval_types import CodeGenTestCaseCore, CodeGenTestCase
from evals.notebook_states import *

FILTER_ANNUAL_INCOME_GREATER_THAN_100K = CodeGenTestCaseCore(
    notebook_state=LOANS_DF_NOTEBOOK,
    expected_code="loans_df = loans_df[loans_df['annual_income'] > 100000]",
    tags=["df_transformation", "pandas"],
)

FILTER_ANNUAL_INCOME_AND_LOAN_CONDITION = CodeGenTestCaseCore(
    notebook_state=LOANS_DF_NOTEBOOK,
    expected_code="loans_df = loans_df[(loans_df['annual_income'] > 100000) & (loans_df['loan_condition'] == 'Bad Loan')]",
    tags=["df_transformation", "pandas"],
)

DATETIME_CONVERSION = CodeGenTestCaseCore(
    notebook_state=LOANS_DF_NOTEBOOK,
    expected_code="loans_df['issue_date'] = pd.to_datetime(loans_df['issue_date'], format='%Y-%m-%d', errors='coerce')",
    tags=["df_transformation", "pandas"],
)

EXTRACT_YEAR_FROM_STRING_DATE = CodeGenTestCaseCore(
    notebook_state=LOANS_DF_NOTEBOOK,
    expected_code="""loans_df['issue_date'] = pd.to_datetime(loans_df['issue_date'], format='%Y-%m-%d', errors='coerce')
loans_df['year'] = loans_df['issue_date'].dt.year""",
    tags=["df_transformation", "pandas"],
)

DATETIME_CONVERSION_NON_CONVENTIONAL_FORMAT = CodeGenTestCaseCore(
    notebook_state=USED_CARS_DF_NOTEBOOK,
    expected_code="used_cars_df['PostedDate'] = pd.to_datetime(used_cars_df['PostedDate'], format='%b-%y')",
    tags=["df_transformation", "pandas"],
)

CONVERT_ANNUAL_INCOME_TO_FLOAT = CodeGenTestCaseCore(
    notebook_state=LOANS_DF_NOTEBOOK,
    expected_code="loans_df['annual_income'] = loans_df['annual_income'].astype(float)",
    tags=["df_transformation", "pandas"],
)

CONVERT_INTEREST_RATE_TO_INT = CodeGenTestCaseCore(
    notebook_state=LOANS_DF_NOTEBOOK,
    expected_code="loans_df['interest_rate'] = loans_df['interest_rate'].astype(int)",
    tags=["df_transformation", "pandas"],
)

CONVERT_CURRENCY_STRING_TO_FLOAT = CodeGenTestCaseCore(
    notebook_state=MESSY_DATA_NOTEBOOK,
    expected_code="""df['Transaction_Price'] = df['Transaction_Price'].str[1:]
df['Transaction_Price'] = df['Transaction_Price'].astype(float)""",
    tags=["df_transformation", "pandas"],
)

CONVERT_KILOMETERS_DRIVEN_TO_FLOAT = CodeGenTestCaseCore(
    notebook_state=USED_CARS_DF_NOTEBOOK,
    expected_code="""used_cars_df["kmDriven"] = used_cars_df["kmDriven"].str[:-3]
used_cars_df["kmDriven"] = used_cars_df["kmDriven"].replace({',': ''}, regex=True)
used_cars_df["kmDriven"] = used_cars_df["kmDriven"].astype(float)""",
    tags=["df_transformation", "pandas"],
)

CALCULATE_NUM_OF_PREV_DAYS = CodeGenTestCaseCore(
    notebook_state=MESSY_DATA_NOTEBOOK,
    expected_code="""df['Date'] = pd.to_datetime(df['Date'], format='mixed', errors='coerce')
df['Days Ago'] = df['Date'] - pd.to_datetime("now")""",
    tags=["df_transformation", "pandas"],
)

RENAME_ISSUE_DATE_TO_DATE = CodeGenTestCaseCore(
    notebook_state=LOANS_DF_NOTEBOOK,
    expected_code="loans_df.rename(columns={'issue_date': 'Date'}, inplace=True)",
    tags=["df_transformation", "pandas"],
)

REPLACE_UNDERSCORE_WITH_SPACE_IN_COLUMN_NAMES = CodeGenTestCaseCore(
    notebook_state=LOANS_DF_NOTEBOOK,
    expected_code="loans_df.columns = [col.replace('_', ' ') if isinstance(col, str) else col for col in loans_df.columns]",
    tags=["df_transformation", "pandas"],
)

MULTIPLY_INTEREST_RATE_BY_100 = CodeGenTestCaseCore(
    notebook_state=LOANS_DF_NOTEBOOK,
    expected_code="loans_df['interest_rate'] = loans_df['interest_rate'] * 100",
    tags=["df_transformation", "pandas"],
)

CALCULATE_MONTHLY_LOAN_PAYMENT_PROVIDED_FORMULA = CodeGenTestCaseCore(
    notebook_state=LOANS_DF_NOTEBOOK,
    expected_code="loans_df['monthly_payment'] = loans_df['loan_amount'] * (loans_df['interest_rate'] / 12)",
    tags=["df_transformation", "pandas"],
)

DIVIDE_TOTAL_PAYMENT_BY_1000 = CodeGenTestCaseCore(
    notebook_state=LOANS_DF_NOTEBOOK,
    expected_code="loans_df['total_pymnt'] = loans_df['total_pymnt']/1000",
    tags=["df_transformation", "pandas"],
)

CALCULATE_REMAINING_BALANCE = CodeGenTestCaseCore(
    notebook_state=LOANS_DF_NOTEBOOK,
    expected_code="loans_df['remaining_principal'] = loans_df['loan_amount']-loans_df['total_rec_prncp']",
    tags=["df_transformation", "pandas"],
)

SUM_LAST_THREE_COLUMNS = CodeGenTestCaseCore(
    notebook_state=LOANS_DF_NOTEBOOK,
    expected_code="loans_df['sum_last_three'] = loans_df['interest_rate']+loans_df['total_pymnt']+loans_df['total_rec_prncp']",
    tags=["df_transformation", "pandas"],
)

SUM_INT_COLUMNS = CodeGenTestCaseCore(
    notebook_state=LOANS_DF_NOTEBOOK,
    expected_code="loans_df['sum_int_columns'] = loans_df['annual_income']+loans_df['loan_amount']",
    tags=["df_transformation", "pandas"],
)

DELETE_ANNUAL_INCOME_COLUMN = CodeGenTestCaseCore(
    notebook_state=LOANS_DF_NOTEBOOK,
    expected_code="loans_df.drop(columns=['annual_income'], inplace=True)",
    tags=["df_transformation", "pandas"],
)

REPLACE_LOW_WITH_BOTTOM_BUCKET = CodeGenTestCaseCore(
    notebook_state=LOANS_DF_NOTEBOOK,
    expected_code='loans_df = loans_df.astype(str).replace("(?i)Low", "Bottom Bucket", regex=True).astype(loans_df.dtypes.to_dict())',
    tags=["df_transformation", "pandas"],
)

REPLACE_CAR_WITH_AUTOMOBILE_REGEX = CodeGenTestCaseCore(
    notebook_state=LOANS_DF_NOTEBOOK,
    expected_code='loans_df = loans_df.astype(str).replace("(?i)car", "automobile", regex=True).astype(loans_df.dtypes.to_dict())',
    tags=["df_transformation", "pandas"],
)

REPLACE_CAR_WITH_AUTOMOBILE_NO_REGEX = CodeGenTestCaseCore(
    notebook_state=LOANS_DF_NOTEBOOK,
    expected_code='loans_df = loans_df.astype(str).replace("car", "automobile").astype(loans_df.dtypes.to_dict())',
    tags=["df_transformation", "pandas"],
)

PIVOT_TABLE_AVG_LOAN_AMOUNT_BY_PURPOSE = CodeGenTestCaseCore(
    notebook_state=LOANS_DF_NOTEBOOK,
    expected_code="""tmp_df = loans_df[['loan_amount', 'purpose']].copy()
pivot_table = tmp_df.pivot_table(
    index=['purpose'],
    values=['loan_amount'],
    aggfunc={'loan_amount': ['mean']}
)
loans_df_pivot = pivot_table.reset_index()""",
    tags=["df_transformation", "pandas"],
)

SEPARATE_DATA_BY_COLUMN_VALUE = CodeGenTestCaseCore(
    notebook_state=LOANS_DF_NOTEBOOK,
    expected_code="""low_df = loans_df[loans_df['income_category'] == 'Low']
medium_df = loans_df[loans_df['income_category'] == 'Medium']
high_df = loans_df[loans_df['income_category'] == 'High']""",
    tags=["df_transformation", "pandas"],
)

WEIGHTED_AVERAGE_INTEREST_RATE = CodeGenTestCaseCore(
    notebook_state=LOANS_DF_NOTEBOOK,
    expected_code="""loans_df['weighted interest rate'] = loans_df['loan_amount']*loans_df['interest_rate']
total_weighted_interest_rates = loans_df['weighted interest rate'].sum()
total_loan_balances = loans_df['loan_amount'].sum()
weighted_average_interest_rate = total_weighted_interest_rates / total_loan_balances""",
    tags=["df_transformation", "pandas"],
    variables_to_compare=["weighted_average_interest_rate"]
)

RECREATE_PROVIDED_CODE = CodeGenTestCaseCore(
    notebook_state=USED_CARS_DF_NOTEBOOK,
    expected_code="""used_cars_df["kmDriven"] = used_cars_df["kmDriven"].str[:-3]
used_cars_df["kmDriven"] = used_cars_df["kmDriven"].replace({',': ''}, regex=True)
used_cars_df["kmDriven"] = used_cars_df["kmDriven"].astype(float)""",
    tags=["df_transformation", "pandas"],
)

CONVERT_KM_TO_MILES = CodeGenTestCaseCore(
    notebook_state=USED_CARS_DF_NOTEBOOK,
    expected_code="""used_cars_df["kmDriven"] = used_cars_df["kmDriven"].str[:-3]
used_cars_df["kmDriven"] = used_cars_df["kmDriven"].replace({',': ''}, regex=True)
used_cars_df["kmDriven"] = used_cars_df["kmDriven"].astype(float)
used_cars_df["milesDriven"] = used_cars_df["kmDriven"] * 0.621371""",
    tags=["df_transformation", "pandas"],
)

FILTER_USED_CARS_TO_FIRST_OWNER = CodeGenTestCaseCore(
    notebook_state=USED_CARS_DF_NOTEBOOK,
    expected_code="used_cars_df = used_cars_df[used_cars_df['Owner'] == 'first']",
    tags=["df_transformation", "pandas"],
)

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

ACTIVE_MONTHS_COLUMNS_3_TO_9 = CodeGenTestCaseCore(
    notebook_state=COMPANIES_ACTIVE_MONTHS_NOTEBOOK,
    expected_code="df['active_months'] = df.iloc[:, 3:10].sum(axis=1)",
    tags=["df_transformation", "pandas"],
)

DATAFRAME_TRANSFORMATION_TESTS = [
    CodeGenTestCase(
        name="single_column_numeric_filter",
        test_case_core=FILTER_ANNUAL_INCOME_GREATER_THAN_100K,
        user_input="Filter the annual income column to > 100k",
    ),
    CodeGenTestCase(
        name="two_column_filter",
        test_case_core=FILTER_ANNUAL_INCOME_AND_LOAN_CONDITION,
        user_input="Filter the annual income column to > 100k and the loan condition to only include 'Bad Loan'",
    ),
    CodeGenTestCase(
        name="explicit_datetime_conversion",
        test_case_core=DATETIME_CONVERSION,
        user_input="Convert the issue_date column to datetime format",
    ),
    CodeGenTestCase(
        name="implicit_datetime_conversion",
        test_case_core=EXTRACT_YEAR_FROM_STRING_DATE,
        user_input="Create a new column called year that is the year of the issue_date column",
    ),
    CodeGenTestCase(
        name="datetime_conversion_non_conventional_format",
        test_case_core=DATETIME_CONVERSION_NON_CONVENTIONAL_FORMAT,
        user_input="Convert the posted date column to an actual datetime column",
    ),
    CodeGenTestCase(
        name="explicit_float_conversion",
        test_case_core=CONVERT_ANNUAL_INCOME_TO_FLOAT,
        user_input="Convert the annual income column to a float",
    ),
    CodeGenTestCase(
        name="explicit_int_conversion",
        test_case_core=CONVERT_INTEREST_RATE_TO_INT,
        user_input="Convert the interest rate column to an int",
    ),
    CodeGenTestCase(
        name="convert_currency_string_to_float",
        test_case_core=CONVERT_CURRENCY_STRING_TO_FLOAT,
        user_input="Convert the Transaction_Price column to a float",
    ),
    CodeGenTestCase(
        name="convert_string_to_float_tricky",
        test_case_core=CONVERT_KILOMETERS_DRIVEN_TO_FLOAT,
        user_input="Convert the kilometers driven column to a number series",
    ),
    CodeGenTestCase(
        name="calculate_num_of_prev_days",
        test_case_core=CALCULATE_NUM_OF_PREV_DAYS,
        user_input="Calculate a new column called 'Days Ago' that is the number of days between now and the transaction date",
    ),
    CodeGenTestCase(
        name="single_column_renaming_specifc",
        test_case_core=RENAME_ISSUE_DATE_TO_DATE,
        user_input="Rename issue_date to Date",
    ),
    CodeGenTestCase(
        name="single_column_renaming_less_specifc",
        test_case_core=RENAME_ISSUE_DATE_TO_DATE,
        user_input="Rename the date column to Date",
    ),
    CodeGenTestCase(
        name="bulk_column_renaming",
        test_case_core=REPLACE_UNDERSCORE_WITH_SPACE_IN_COLUMN_NAMES,
        user_input="Replace the _ with a space in all column names",
    ),
    CodeGenTestCase(
        name="column_multiplication_scalar",
        test_case_core=MULTIPLY_INTEREST_RATE_BY_100,
        user_input="Multiply the interest rate by 100",
    ),
    CodeGenTestCase(
        name="calculate_monthly_payment_provided_formula",
        test_case_core=CALCULATE_MONTHLY_LOAN_PAYMENT_PROVIDED_FORMULA,
        user_input="Calculate the monthly_payment by multiplying the loan amount by the interest rate / 12",
    ),
    CodeGenTestCase(
        name="calculate_monthly_payment_no_formula",
        test_case_core=CALCULATE_MONTHLY_LOAN_PAYMENT_PROVIDED_FORMULA,
        user_input="Calculate the monthly_payment",
    ),
    CodeGenTestCase(
        name="column_division_scalar",
        test_case_core=DIVIDE_TOTAL_PAYMENT_BY_1000,
        user_input="Divide the total payment by 1000",
    ),
    CodeGenTestCase(
        name="calculate_remaining_balance_provided_formula",
        test_case_core=CALCULATE_REMAINING_BALANCE,
        user_input="Calculate the remaining_balance by subtracting the total_rec_prncp from the loan amount",
    ),
    CodeGenTestCase(
        name="calculate_remaining_balance_no_formula",
        test_case_core=CALCULATE_REMAINING_BALANCE,
        user_input="Calculate the remaining_balance",
    ),
    CodeGenTestCase(
        name="sum_last_three_columns",
        test_case_core=SUM_LAST_THREE_COLUMNS,
        user_input="Calculate a new column called sum_last_three that is the sum of the last three columns",
    ),
    CodeGenTestCase(
        name="sum_int_columns",
        test_case_core=SUM_INT_COLUMNS,
        user_input="Calculate a new column called sum_int_columns that is the sum of all the integer columns",
    ),
    CodeGenTestCase(
        name="delete_column",
        test_case_core=DELETE_ANNUAL_INCOME_COLUMN,
        user_input="Delete the annual_income column",
    ),
    CodeGenTestCase(
        name="find_and_replace_string",
        test_case_core=REPLACE_LOW_WITH_BOTTOM_BUCKET,
        user_input="Replace the word 'Low' with 'Bottom Bucket' in the entire dataframe",
    ),
    CodeGenTestCase(
        name="find_and_replace_with_regex",
        test_case_core=REPLACE_CAR_WITH_AUTOMOBILE_REGEX,
        user_input="Replace the phrase 'car' with 'automobile'",
    ),
    CodeGenTestCase(
        name="find_and_replace_with_no_regex",
        test_case_core=REPLACE_CAR_WITH_AUTOMOBILE_NO_REGEX,
        user_input="Replace the word 'car' with 'automobile'. Do not replace the substring 'car' if it is part of a bigger word.",
    ),
    CodeGenTestCase(
        name="pivot_table_simple",
        test_case_core=PIVOT_TABLE_AVG_LOAN_AMOUNT_BY_PURPOSE,
        user_input="Create a pivot table called loans_df_pivot that shows the average loan amount for each loan purpose. Reset the index of the pivot table so the purpose column is a column in the dataframe. Do not edit the original dataframe. Instead, if you need to edit the original dataframe, make a copy of it called tmp_df and edit that one.",
    ),
    CodeGenTestCase(
        name="separate_data_by_column_value",
        test_case_core=SEPARATE_DATA_BY_COLUMN_VALUE,
        user_input="Separate the dataframe into one dataframe for each value in the income_category column. Name the dataframe <value>_df for each value. Use all lowercase letters for the df name.",
    ),
    CodeGenTestCase(
        name="weighted_average_interest_rate",
        test_case_core=WEIGHTED_AVERAGE_INTEREST_RATE,
        user_input="Calculate a new variable called `weighted_average_interest_rate` that is the weighted average of the interest rate and loan amount.",
    ),
    CodeGenTestCase(
        name="recreate_provided_code",
        test_case_core=CONVERT_KILOMETERS_DRIVEN_TO_FLOAT,
        user_input="""Use this code to convert the kmDriven column to a float:
used_cars_df["kmDriven"] = used_cars_df["kmDriven"].str[:-3]
used_cars_df["kmDriven"] = used_cars_df["kmDriven"].replace({',': ''}, regex=True)
used_cars_df["kmDriven"] = used_cars_df["kmDriven"].astype(float)""",
    ),
    CodeGenTestCase(
        name="convert_km_to_miles",
        test_case_core=CONVERT_KM_TO_MILES,
        user_input="""Use this code to convert the kmDriven column to a float:
used_cars_df["kmDriven"] = used_cars_df["kmDriven"].str[:-3]
used_cars_df["kmDriven"] = used_cars_df["kmDriven"].replace({',': ''}, regex=True)
used_cars_df["kmDriven"] = used_cars_df["kmDriven"].astype(float)

And then convert then create a new column called milesDrive.
"""
    ),
    CodeGenTestCase(
        name="filter_requires_data_understanding",
        test_case_core=FILTER_USED_CARS_TO_FIRST_OWNER,
        user_input="""Filter the dataset to only include cars that have only been owned by one person""",
    ),
    CodeGenTestCase(
        name="filter_requires_data_understanding_more_vague",
        test_case_core=FILTER_USED_CARS_TO_FIRST_OWNER,
        user_input="""Filter the dataset to only include cars that have been purchased by one person in its lifetime""",
    ),
    CodeGenTestCase(
        name="convert_code_to_function",
        test_case_core=NUMBER_OF_BMW_FORD_TOYOTA_FIRST_OWNER_FUNCTION,
        user_input="""Convert this code to a function and then use it to get the number of first owners for BMW, Toyota, and Ford. 

Save the results in a variable called num_bmw, num_toyota, and num_ford.
         
used_cars_df = used_cars_df[(used_cars_df['Brand'].str.contains('BMW', na=False, regex=False)) & (used_cars_df['Owner'].str.contains('first', na=False, regex=False))]""",
    ),
    CodeGenTestCase(
        name="0_index_column_numbers",
        test_case_core=ACTIVE_MONTHS_COLUMNS_3_TO_9,
        user_input="Create a new column called active_months that is total number of times the company is True for columns 3 through 9",
    ),
]
