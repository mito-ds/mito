from evals.eval_types import TestCase
from evals.notebook_states import *

MULTISTEP_TESTS = [
    TestCase(
        name="clean_messy_data_multi_step",
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
        tags=["df_transformation", "pandas", "multistep"],
    ),
    TestCase(
        name="simple_recon",
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
        tags=["df_transformation", "pandas", "multistep"],
        variables_to_compare=["missing_data_df", "matching_df", "not_matching_df"],
    ),
    TestCase(
        name="monthly_equity",
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
        tags=["df_transformation", "pandas", "multistep"],
        variables_to_compare=["july_equity", "august_equity"],
    ),
    TestCase(
        name="top_five_funds",
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
        tags=["df_transformation", "pandas", "multistep"],
        variables_to_compare=["top_five_funds_july", "top_five_funds_august"],
    ),
    TestCase(
        name="highest_monthly_ending_capital",
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
        tags=["df_transformation", "pandas", "multistep"],
        variables_to_compare=["highest_monthly_ending_capital"],
    ),
    TestCase(
        name="convert_to_float_and_calc_quartiles",
        notebook_state=USED_CARS_DF_NOTEBOOK,
        user_input="""For the column `kmDriven`, remove the comma and the word "km" and convert it to a float.

Next, create two new columns: `AgeQuartile` and `kmDrivenQuartile` that are the quartiles of the `Age` and `kmDriven` columns respectively. 
Each quartile should have a label: "Q1", "Q2", "Q3", "Q4".

Create a new column called `beater` that is `True` if the `kmDrivenQuartile` and `AgeQuartile` are both in the fourth quartile.
""",
        expected_code="""
used_cars_df["kmDriven"] = used_cars_df["kmDriven"].str.replace(",", "").str.replace(" km", "").astype(float)
used_cars_df["AgeQuartile"] = pd.qcut(used_cars_df["Age"], q=4, labels=["Q1", "Q2", "Q3", "Q4"])
used_cars_df["kmDrivenQuartile"] = pd.qcut(used_cars_df["kmDriven"], q=4, labels=["Q1", "Q2", "Q3", "Q4"])
used_cars_df["beater"] = (used_cars_df["kmDrivenQuartile"] == "Q4") & (used_cars_df["AgeQuartile"] == "Q4")
""",
        tags=["misc"],
    ),
]
