from evals.eval_types import TestCase
from evals.notebook_states import *

DATAFRAME_TRANSFORMATION_TESTS = [
    TestCase(
        name="single_column_numeric_filter",
        notebook_state=LOANS_DF_NOTEBOOK,
        user_input="Filter the annual income column to > 100k",
        expected_code="loans_df = loans_df[loans_df['annual_income'] > 100000]",
        tags=["df_transformation", "pandas"],
    ),
    TestCase(
        name="two_column_filter",
        notebook_state=LOANS_DF_NOTEBOOK,
        user_input="Filter the annual income column to > 100k and the loan condition to only include 'Bad Loan'",
        expected_code="loans_df = loans_df[(loans_df['annual_income'] > 100000) & (loans_df['loan_condition'] == 'Bad Loan')]",
        tags=["df_transformation", "pandas"],
    ),
    TestCase(
        name="explicit_datetime_conversion",
        notebook_state=LOANS_DF_NOTEBOOK,
        user_input="Convert the issue_date column to datetime format",
        expected_code="loans_df['issue_date'] = pd.to_datetime(loans_df['issue_date'], format='%Y-%m-%d', errors='coerce')",
        tags=["df_transformation", "pandas"],
    ),
    TestCase(
        name="implicit_datetime_conversion",
        notebook_state=LOANS_DF_NOTEBOOK,
        user_input="Create a new column called year that is the year of the issue_date column",
        expected_code="""loans_df['issue_date'] = pd.to_datetime(loans_df['issue_date'], format='%Y-%m-%d', errors='coerce')
loans_df['year'] = loans_df['issue_date'].dt.year""",
        tags=["df_transformation", "pandas"],
    ),
    TestCase(
        name="datetime_conversion_non_conventional_format",
        notebook_state=USED_CARS_DF_NOTEBOOK,
        user_input="Convert the posted date column to an actual datetime column",
        expected_code="""used_cars_df['PostedDate'] = pd.to_datetime(used_cars_df['PostedDate'], format='%b-%y')""",
        tags=["df_transformation", "pandas"],
    ),
    TestCase(
        name="explicit_float_conversion",
        notebook_state=LOANS_DF_NOTEBOOK,
        user_input="Convert the annual income column to a float",
        expected_code="loans_df['annual_income'] = loans_df['annual_income'].astype(float)",
        tags=["df_transformation", "pandas"],
    ),
    TestCase(
        name="explicit_int_conversion",
        notebook_state=LOANS_DF_NOTEBOOK,
        user_input="Convert the interest rate column to an int",
        expected_code="loans_df['interest_rate'] = loans_df['interest_rate'].astype(int)",
        tags=["df_transformation", "pandas"],
    ),
    TestCase(
        name="convert_currency_string_to_float",
        notebook_state=MESSY_DATA_NOTEBOOK,
        user_input="Convert the Transaction_Price column to a float",
        expected_code="""df['Transaction_Price'] = df['Transaction_Price'].str[1:]
df['Transaction_Price'] = df['Transaction_Price'].astype(float)
""",
        tags=["df_transformation", "pandas"],
    ),
    TestCase(
        name="convert_string_to_float_tricky",
        notebook_state=USED_CARS_DF_NOTEBOOK,
        user_input="Convert the kilometers driven column to a number series",
        expected_code="""used_cars_df["kmDriven"] = used_cars_df["kmDriven"].str[:-3]
used_cars_df["kmDriven"] = used_cars_df["kmDriven"].replace({',': ''}, regex=True)
used_cars_df["kmDriven"] = used_cars_df["kmDriven"].astype(float)""",
        tags=["df_transformation", "pandas"],
    ),
    TestCase(
        name="calculate_num_of_prev_days",
        notebook_state=MESSY_DATA_NOTEBOOK,
        user_input="Calculate a new column called 'Days Ago' that is the number of days between now and the transaction date",
        expected_code="""df['Date'] = pd.to_datetime(df['Date'], format='mixed', errors='coerce')
df['Days Ago'] = df['Date'] - pd.to_datetime("now")
""",
        tags=["df_transformation", "pandas"],
    ),
    TestCase(
        name="single_column_renaming_specifc",
        notebook_state=LOANS_DF_NOTEBOOK,
        user_input="Rename issue_date to Issue Date",
        expected_code="loans_df.rename(columns={'issue_date': 'Issue Date'}, inplace=True)",
        tags=["df_transformation", "pandas"],
    ),
    TestCase(
        name="single_column_renaming_less_specifc",
        notebook_state=LOANS_DF_NOTEBOOK,
        user_input="Rename the date column to date",
        expected_code="loans_df.rename(columns={'issue_date': 'date'}, inplace=True)",
        tags=["df_transformation", "pandas"],
    ),
    TestCase(
        name="bulk_column_renaming",
        notebook_state=LOANS_DF_NOTEBOOK,
        user_input="Replace the _ with a space in all column names",
        expected_code="loans_df.columns = [col.replace('_', ' ') if isinstance(col, str) else col for col in loans_df.columns]",
        tags=["df_transformation", "pandas"],
    ),
    TestCase(
        name="column_multiplication_scalar",
        notebook_state=LOANS_DF_NOTEBOOK,
        user_input="Multiply the interest rate by 100",
        expected_code="loans_df['interest_rate'] = loans_df['interest_rate'] * 100",
        tags=["df_transformation", "pandas"],
    ),
    TestCase(
        name="calculate_monthly_payment_provided_formula",
        notebook_state=LOANS_DF_NOTEBOOK,
        user_input="Calculate the monthly_payment by multiplying the loan amount by the interest rate / 12",
        expected_code="loans_df['monthly_payment'] = loans_df['loan_amount'] * (loans_df['interest_rate'] / 12)",
        tags=["df_transformation", "pandas"],
    ),
    TestCase(
        name="calculate_monthly_payment_no_formula",
        notebook_state=LOANS_DF_NOTEBOOK,
        user_input="Calculate the monthly_payment",
        expected_code="loans_df['monthly_payment'] = loans_df['loan_amount'] * (loans_df['interest_rate'] / 12)",
        tags=["df_transformation", "pandas"],
    ),
    TestCase(
        name="column_division_scalar",
        notebook_state=LOANS_DF_NOTEBOOK,
        user_input="Divide the total payment by 1000",
        expected_code="loans_df['total_pymnt'] = loans_df['total_pymnt']/1000",
        tags=["df_transformation", "pandas"],
    ),
    TestCase(
        name="calculate_remaining_balance_provided_formula",
        notebook_state=LOANS_DF_NOTEBOOK,
        user_input="Calculate the remaining_balance",
        expected_code="loans_df['remaining_principal'] = loans_df['loan_amount']-loans_df['total_rec_prncp']",
        tags=["df_transformation", "pandas"],
    ),
    TestCase(
        name="calculate_remaining_balance_no_formula",
        notebook_state=LOANS_DF_NOTEBOOK,
        user_input="Calculate the remaining_balance by subtracting the total_rec_prncp from the loan amount",
        expected_code="loans_df['remaining_principal'] = loans_df['loan_amount']-loans_df['total_rec_prncp']",
        tags=["df_transformation", "pandas"],
    ),
    TestCase(
        name="sum_last_three_columns",
        notebook_state=LOANS_DF_NOTEBOOK,
        user_input="Calculate a new column called sum_last_three that is the sum of the last three columns",
        expected_code="loans_df['sum_last_three'] = loans_df['interest_rate']+loans_df['total_pymnt']+loans_df['total_rec_prncp']",
        tags=["df_transformation", "pandas"],
    ),
    TestCase(
        name="sum_int_columns",
        notebook_state=LOANS_DF_NOTEBOOK,
        user_input="Calculate a new column called sum_int_columns that is the sum of all the integer columns",
        expected_code="loans_df['sum_int_columns'] = loans_df['annual_income']+loans_df['loan_amount']",
        tags=["df_transformation", "pandas"],
    ),
    TestCase(
        name="delete_column",
        notebook_state=LOANS_DF_NOTEBOOK,
        user_input="Delete the annual_income column",
        expected_code="loans_df.drop(columns=['annual_income'], inplace=True)",
        tags=["df_transformation", "pandas"],
    ),
    TestCase(
        name="find_and_replace_string",
        notebook_state=LOANS_DF_NOTEBOOK,
        user_input="Replace the word 'Low' with 'Bottom Bucket' in the entire dataframe",
        expected_code='loans_df = loans_df.astype(str).replace("(?i)Low", "Bottom Bucket", regex=True).astype(loans_df.dtypes.to_dict())',
        tags=["df_transformation", "pandas"],
    ),
    TestCase(
        name="find_and_replace_with_regex",
        notebook_state=LOANS_DF_NOTEBOOK,
        user_input="Replace the phrase 'car' with 'automobile'",
        expected_code='loans_df = loans_df.astype(str).replace("car", "automobile", regex=True).astype(loans_df.dtypes.to_dict())',
        tags=["df_transformation", "pandas"],
    ),
    TestCase(
        name="find_and_replace_with_no_regex",
        notebook_state=LOANS_DF_NOTEBOOK,
        user_input="Replace the word 'car' with 'automobile'. Do not replace the substring 'car' if it is part of a bigger word.",
        expected_code='loans_df = loans_df.astype(str).replace("car", "automobile").astype(loans_df.dtypes.to_dict())',
        tags=["df_transformation", "pandas"],
    ),
    TestCase(
        name="pivot_table_simple",
        notebook_state=LOANS_DF_NOTEBOOK,
        user_input="Create a pivot table called loans_df_pivot that shows the average loan amount for each loan purpose. Reset the index of the pivot table so the purpose column is a column in the dataframe. Do not edit the original dataframe. Instead, if you need to edit the original dataframe, make a copy of it called tmp_df and edit that one.",
        expected_code="""tmp_df = loans_df[['loan_amount', 'purpose']].copy()
pivot_table = tmp_df.pivot_table(
    index=['purpose'],
    values=['loan_amount'],
    aggfunc={'loan_amount': ['mean']}
)
loans_df_pivot = pivot_table.reset_index()""",
        tags=["df_transformation", "pandas"],
    ),
    TestCase(
        name="separate_data_by_column_value",
        notebook_state=LOANS_DF_NOTEBOOK,
        user_input="Separate the dataframe into one dataframe for each value in the income_category column. Name the dataframe <value>_df for each value. Use all lowercase letters for the df name.",
        expected_code="""low_df = loans_df[loans_df['income_category'] == 'Low']
medium_df = loans_df[loans_df['income_category'] == 'Medium']
high_df = loans_df[loans_df['income_category'] == 'High']""",
        tags=["df_transformation", "pandas"],
    ),
    TestCase(
        name="weighted_average_interest_rate",
        notebook_state=LOANS_DF_NOTEBOOK,
        user_input="Calculate a new variable called `weighted_average_interest_rate` that is the weighted average of the interest rate and loan amount.",
        expected_code="""loans_df['weighted interest rate'] = loans_df['loan_amount']*loans_df['interest_rate']
total_weighted_interest_rates = loans_df['weighted interest rate'].sum()
total_loan_balances = loans_df['loan_amount'].sum()
weighted_average_interest_rate = total_weighted_interest_rates / total_loan_balances""",
        tags=["df_transformation", "pandas"],
        variables_to_compare=["weighted_average_interest_rate"],
    ),
    TestCase(
        name="recreate_provided_code",
        notebook_state=USED_CARS_DF_NOTEBOOK,
        user_input="""Use this code to convert the kmDriven column to a float:
used_cars_df["kmDriven"] = used_cars_df["kmDriven"].str[:-3]
used_cars_df["kmDriven"] = used_cars_df["kmDriven"].replace({',': ''}, regex=True)
used_cars_df["kmDriven"] = used_cars_df["kmDriven"].astype(float)""",
        expected_code="""used_cars_df["kmDriven"] = used_cars_df["kmDriven"].str[:-3]
used_cars_df["kmDriven"] = used_cars_df["kmDriven"].replace({',': ''}, regex=True)
used_cars_df["kmDriven"] = used_cars_df["kmDriven"].astype(float)""",
        tags=["misc"],
    ),
    TestCase(
        name="convert_km_to_miles",
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
        tags=["misc"],
    ),
    TestCase(
        name="filter_requires_data_understanding",
        notebook_state=USED_CARS_DF_NOTEBOOK,
        user_input="""Filter the dataset to only include cars that have only been owned by one person""",
        expected_code="used_cars_df = used_cars_df[used_cars_df['Owner'] == 'first']",
        tags=["df_transformation", "pandas"],
    ),
    TestCase(
        name="filter_requires_data_understanding_more_vague",
        notebook_state=USED_CARS_DF_NOTEBOOK,
        user_input="""Filter the dataset to only include cars that have been purchased by one person in its lifetime""",
        expected_code="used_cars_df = used_cars_df[used_cars_df['Owner'] == 'first']",
        tags=["df_transformation", "pandas"],
    ),
    TestCase(
        name="convert_code_to_function",
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
        tags=["function_declaration"],
    ),
]
