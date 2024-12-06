from evals.eval_types import CodeGenTestCaseCore, TestCase
from evals.notebook_states import *

CLEAN_MESSY_DATA_MULTISTEP = CodeGenTestCaseCore(
    notebook_state=MESSY_DATA_NOTEBOOK,
    expected_code="""
df['Date'] = pd.to_datetime(df['Date'], format='mixed', errors='coerce')
df['Stock '] = df['Stock '].str[:-6]
df.drop(['Type_of_Investment'], axis=1, inplace=True)
df.rename(columns={'Description of each transaction': 'Description'}, inplace=True)
""",
    tags=["df_transformation", "pandas", "multistep"],
)

EAGLE_EXCEL_RECON_MULTISTEP = CodeGenTestCaseCore(
    notebook_state=SIMPLE_RECON_NOTEBOOK,
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
)

MONTHLY_EQUITY_MULTISTEP = CodeGenTestCaseCore(
    notebook_state=MONTHLY_EQUITY_NOTEBOOK,
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
)

TOP_FIVE_FUNDS_MULTISTEP = CodeGenTestCaseCore(
    notebook_state=MONTHLY_EQUITY_NOTEBOOK,
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
)

HIGHEST_MONTHLY_ENDING_CAPITAL_MULTISTEP = CodeGenTestCaseCore(
    notebook_state=MONTHLY_EQUITY_NOTEBOOK,
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
)

LABEL_BEATER_CARS_MULTISTEP = CodeGenTestCaseCore(
    notebook_state=USED_CARS_DF_NOTEBOOK,
        expected_code="""
used_cars_df["kmDriven"] = used_cars_df["kmDriven"].str.replace(",", "").str.replace(" km", "").astype(float)
used_cars_df["AgeQuartile"] = pd.qcut(used_cars_df["Age"], q=4, labels=["Q1", "Q2", "Q3", "Q4"])
used_cars_df["kmDrivenQuartile"] = pd.qcut(used_cars_df["kmDriven"], q=4, labels=["Q1", "Q2", "Q3", "Q4"])
used_cars_df["beater"] = (used_cars_df["kmDrivenQuartile"] == "Q4") & (used_cars_df["AgeQuartile"] == "Q4")
""",
    tags=["df_transformation", "pandas", "multistep"],
    variables_to_compare=["used_cars_df"],
)

MOST_POPULAR_CAR_MODEL_MULTISTEP = CodeGenTestCaseCore(
    notebook_state=USED_CARS_DF_NOTEBOOK,
    expected_code="""
used_cars_df['AskPrice'] = used_cars_df['AskPrice'].replace({'₹': '', ',': ''}, regex=True).astype(float)
used_cars_df['kmDriven'] = used_cars_df['kmDriven'].replace({' km': '', ',': ''}, regex=True).astype(float)

# Group by Brand and Model, and calculate the necessary aggregates
most_popular_car_model = used_cars_df.groupby(['Brand', 'model']).agg(
    count=('model', 'size'),
    avg_year=('Year', 'mean'),
    avg_price=('AskPrice', 'mean'),
    avg_km_driven=('kmDriven', 'mean')
).reset_index()

# Sort by count to get the most popular models and select top 10
most_popular_car_model = most_popular_car_model.sort_values(by='count', ascending=False).head(10)

# Calculate the 'cost_per_km' column
most_popular_car_model['cost_per_km'] = most_popular_car_model['avg_price'] / most_popular_car_model['avg_km_driven']

cars = most_popular_car_model.set_index('model')['cost_per_km'].to_dict()
""",
    tags=["df_transformation", "pandas", "multistep"],
    variables_to_compare=["cars"],
)

MULTISTEP_TESTS = [
    TestCase(
        name="clean_messy_data_multi_step",
        test_case_core=CLEAN_MESSY_DATA_MULTISTEP,
        user_input="""Clean the data by:
- Convert the dates that are strings to timetime format
- Remove the substring -Stock from the Stock column
- Delete columns that only have one unqiue value
- Change the name of the Description column to Description""",
    ),
    TestCase(
        name="simple_recon",
        test_case_core=EAGLE_EXCEL_RECON_MULTISTEP,
        user_input="""
- Import transaction records from two different data sources: Eagle and an Excel file that is manually tracked.
- Merge them together on a column called Transaction ID
- Create a new column called "Check" and set it to the following:
    - If the either dataset does not have a value in the Share Quantity column, set the value of the Check column to "Action Required. Missing Data.".
    - If the Quantity numbers are the same, set the value of the Check column to "Matching. No action required."
    - If the numbers are not matching, set the value of the Check column to "Action Required. Quantity does not match."
- Finally, separate the data in 3 different sheets, one for each condition: `missing_data_df`, `matching_df`, `not_matching_df`""",
    ),
    TestCase(
        name="monthly_equity",
        test_case_core=MONTHLY_EQUITY_MULTISTEP,
        user_input="""Calculate the Total Equity for each month for each entity by subtracting the Management Fee from the Ending Capital.

Create two dataframes, `july_equity` and `august_equity` that the final columns: entity_id, ending_capital, fees, and total_equity.
""",
    ),
    TestCase(
        name="top_five_funds",
        test_case_core=TOP_FIVE_FUNDS_MULTISTEP,
        user_input="""Calculate the five funds with the highest total equity for each month. Where the total equity is the ending capital minus the management fee.

Create two dataframes, `top_five_funds_july` and `top_five_funds_august` that are a dataframe that contain the top 5 funds for each month. It should have the final columns: entity_id, ending_capital, fees, and total_equity, and the indexes should be 0 to 4.
""",
        
    ),
    TestCase(
        name="highest_monthly_ending_capital",
        test_case_core=HIGHEST_MONTHLY_ENDING_CAPITAL_MULTISTEP,
        user_input="""Find the month with the highest ending capital for each entity.

Create a dataframe called `highest_monthly_ending_capital` that has the final columns: entity_id, ending_capital, and month.
""",
    ),
    TestCase(
        name="convert_to_float_and_calc_quartiles",
        test_case_core=LABEL_BEATER_CARS_MULTISTEP,
        user_input="""Convert the column `kmDriven` to a float and remove any commas and units.

Next, create two new columns: `AgeQuartile` and `kmDrivenQuartile`. Each quartile should have a label: Q1, Q2, etc.

Finally, create a new column called `beater` that is `True` if the `kmDrivenQuartile` and `AgeQuartile` are both in the fourth quartile.
""",
    ),
    TestCase(
        name="most_popular_car_model",
        test_case_core=MOST_POPULAR_CAR_MODEL_MULTISTEP,
        user_input="""1. Create a new dataframe called `most_popular_car_model`. For each car `Brand`, identify the most popular model and include the following information in the dataframe: the `Brand`, `model`, and the count of that model.

2. Filter the dataframe to keep only the top 10 most popular models.

3. For each model, calculate the following averages:
   - Average car year
   - Average price
   - Average kilometers driven

   Add these averages as new columns to the dataframe.

4. Add a new column called `cost_per_km`, which is calculated by dividing the average price by the average kilometers driven for each model.

5. Create a dictionary variable named `cars` where the key is the name of the most popular model, and the value is its `cost_per_km`.
""",
    ),
]
