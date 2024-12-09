from evals.eval_types import SmartDebugTestCase
from evals.notebook_states import EMPTY_NOTEBOOK, LOANS_DF_NOTEBOOK, MESSY_DATA_NOTEBOOK, STOCK_MARKET_DATA_NOTEBOOK, USED_CARS_DF_NOTEBOOK
from evals.test_cases.code_gen_tests.dataframe_transformation_tests import CONVERT_CURRENCY_STRING_TO_FLOAT


PANDAS_TESTS = [
    SmartDebugTestCase(
        name='create_dataframe_simple',
        notebook_state=EMPTY_NOTEBOOK,
        invalid_code="""
df = pd.DataFrame({'A': [1, 2, 3], 'B': [4, 5, 6]})
""",
        correct_code="""
df = pd.DataFrame({'A': [1, 2, 3], 'B': [4, 5, 6]})
""",
        tags=['simple', 'pandas']
    ),
    SmartDebugTestCase(
        name='datetime_conversion_required',
        notebook_state=EMPTY_NOTEBOOK,
        invalid_code="""
import pandas as pd
df = pd.DataFrame({'A': ['1/2/24', '2/2/24', '3/2/24'], 'B': [4, 5, 6]})
df['Year'] = df['A'].dt.year
""",
        correct_code="""
import pandas as pd
df = pd.DataFrame({'A': ['1/2/24', '2/2/24', '3/2/24'], 'B': [4, 5, 6]})
df['A'] = pd.to_datetime(df['A'])
df['Year'] = df['A'].dt.year
""",
        tags=['simple', 'pandas', 'type_error']
    ),
    SmartDebugTestCase(
        name='must_handle_missing_values_in_type_conversion',
        notebook_state=EMPTY_NOTEBOOK,
        invalid_code="""
import pandas as pd
df = pd.DataFrame({'A': ['1/2/24', '2/2/24', '3/2/24'], 'B': ['4', None, '6']})

# Convert to an integer, ignoring missing values
df['B'] = df['B'].astype(int)
""",
        correct_code="""
import pandas as pd
df = pd.DataFrame({'A': ['1/2/24', '2/2/24', '3/2/24'], 'B': ['4', None, '6']})

# Convert to an integer, ignoring missing values
df['B'] = df['B'].fillna(0).astype(int)
""",
        tags=['simple', 'pandas', 'type_error']
    ),
    SmartDebugTestCase(
        name='convert_currency_to_float',
        notebook_state=MESSY_DATA_NOTEBOOK,
        invalid_code="""
df['Transaction_Price'] = df['Transaction_Price'].astype(float)
""",
        correct_code="""df['Transaction_Price'] = df['Transaction_Price'].str[1:]
df['Transaction_Price'] = df['Transaction_Price'].astype(float)""",
        tags=['simple', 'pandas', 'type_error']
    ),
    SmartDebugTestCase(
        name='convert_kilometers_drive_to_float',
        notebook_state = USED_CARS_DF_NOTEBOOK,
        invalid_code="""
used_cars_df['kmDriven'] = used_cars_df['kmDriven'].astype(float)
""",
        correct_code="""
used_cars_df['kmDriven'] = used_cars_df['kmDriven'].str[:-3]
used_cars_df['kmDriven'] = used_cars_df['kmDriven'].replace({',': ''}, regex=True)
used_cars_df['kmDriven'] = used_cars_df['kmDriven'].astype(float)
""",
        tags=['simple', 'pandas', 'type_error']
    ),
    SmartDebugTestCase(
        name='missing_quotes_in_column_name',
        notebook_state=LOANS_DF_NOTEBOOK,
        invalid_code="""
loans_df = loans_df[loans_df[annual_income] > 100000],
""", 
        correct_code="""
loans_df = loans_df[loans_df['annual_income'] > 100000]
""",
        tags=['simple', 'pandas']
    ),
    SmartDebugTestCase(
        name='wrong_combine_filter_condition_syntax',
        notebook_state=LOANS_DF_NOTEBOOK,
        invalid_code="""
loans_df = loans_df[(loans_df['annual_income'] > 100000) and (loans_df['loan_condition'] == 'Bad Loan')]",
""",
        correct_code="""
loans_df = loans_df[(loans_df['annual_income'] > 100000) & (loans_df['loan_condition'] == 'Bad Loan')]
""",
        tags=['simple', 'pandas']
    ),
    SmartDebugTestCase(
        name='date_format_missing_required_format',
        notebook_state=USED_CARS_DF_NOTEBOOK,
        invalid_code="""
used_cars_df['PostedDate'] = pd.to_datetime(used_cars_df['PostedDate'])
""",
        correct_code="""
used_cars_df['PostedDate'] = pd.to_datetime(used_cars_df['PostedDate'], format='%b-%y')
""",
        tags=['simple', 'pandas', 'type_error']
    ),
    SmartDebugTestCase(
        name='invalid_date_format',
        notebook_state=USED_CARS_DF_NOTEBOOK,
        invalid_code="""
used_cars_df['PostedDate'] = pd.to_datetime(used_cars_df['PostedDate'], format='%b')
""",
        correct_code="""
used_cars_df['PostedDate'] = pd.to_datetime(used_cars_df['PostedDate'], format='%b-%y')
""",
        tags=['simple', 'pandas', 'type_error']
    ),
    SmartDebugTestCase(
        name='column_rename_missing_inplace',
        notebook_state=LOANS_DF_NOTEBOOK,
        invalid_code="""
loans_df.rename(columns={'issue_date': 'Date'})
loans_df['Year'] = loans_df['Date'].dt.year
""",
        correct_code="""
loans_df.rename(columns={'issue_date': 'Date'}, inplace=True)
loans_df['Year'] = loans_df['Date'].dt.year
""",
        tags=['simple', 'pandas']
    ),
    SmartDebugTestCase(
        name='replace_with_invalid_regex',
        notebook_state=LOANS_DF_NOTEBOOK,
        invalid_code="""
loans_df = loans_df.astype(str).replace("(?iLow", "Bottom Bucket", regex=True).astype(loans_df.dtypes.to_dict())
""",
        correct_code="""
loans_df = loans_df.astype(str).replace("(?i)Low", "Bottom Bucket", regex=True).astype(loans_df.dtypes.to_dict())
""",
        tags=['simple', 'pandas']
    ),
    SmartDebugTestCase(
        name='pivot_table_invalid_aggfunc_average',
        notebook_state=LOANS_DF_NOTEBOOK,
        invalid_code="""tmp_df = loans_df[['loan_amount', 'purpose']].copy()
pivot_table = tmp_df.pivot_table(
    index=['purpose'],
    values=['loan_amount'],
    aggfunc={'loan_amount': ['average']}
)
loans_df_pivot = pivot_table.reset_index()""",
        correct_code="""tmp_df = loans_df[['loan_amount', 'purpose']].copy()
pivot_table = tmp_df.pivot_table(
    index=['purpose'],
    values=['loan_amount'],
    aggfunc={'loan_amount': ['mean']}
)
loans_df_pivot = pivot_table.reset_index()""",
        tags=['simple', 'pandas']
    ),
    SmartDebugTestCase(
        name='pivot_table_missing_column',
        notebook_state=LOANS_DF_NOTEBOOK,
        invalid_code="""tmp_df = loans_df[['loan_amount', 'purpose']].copy()
pivot_table = tmp_df.pivot_table(
    index=['purpose'],
    values=['loan_amount', 'annual_income'],
    aggfunc={'loan_amount': ['mean']}
)
loans_df_pivot = pivot_table.reset_index()""",
        correct_code="""tmp_df = loans_df[['loan_amount', 'purpose', 'annual_income']].copy()
pivot_table = tmp_df.pivot_table(
    index=['purpose'],
    values=['loan_amount', 'annual_income'],
    aggfunc={'mean'}
)
loans_df_pivot = pivot_table.reset_index()""",
        tags=['simple', 'pandas']
    ),
    SmartDebugTestCase(
        name='pivot_table_missing_multiple_columns',
        notebook_state=LOANS_DF_NOTEBOOK,
        invalid_code="""
tmp_df = loans_df[['loan_amount', 'purpose']].copy()
pivot_table = tmp_df.pivot_table(
    index=['purpose'],
    columns=['income_category'],
    values=['loan_amount', 'annual_income'],
    aggfunc=['mean']
)
loans_df_pivot = pivot_table.reset_index()
""",
        correct_code="""
tmp_df = loans_df[['loan_amount', 'purpose', 'annual_income', 'income_category']].copy()
pivot_table = tmp_df.pivot_table(
    index=['purpose'],
    columns=['income_category'],
    values=['loan_amount', 'annual_income'],
    aggfunc=['mean']
)
loans_df_pivot = pivot_table.reset_index()
""",
        tags=['simple', 'pandas']
    ),
    SmartDebugTestCase(
        name='pivot_table_invalid_aggfunc_syntax',
        notebook_state=LOANS_DF_NOTEBOOK,
        invalid_code="""
tmp_df = loans_df[['loan_amount', 'purpose', 'annual_income']].copy()
pivot_table = tmp_df.pivot_table(
    index=['purpose'],
    values=['loan_amount', 'annual_income'],
    aggfunc=[{'mean'}]
)
loans_df_pivot = pivot_table.reset_index()
        """,
        correct_code="""tmp_df = loans_df[['loan_amount', 'purpose', 'annual_income']].copy()
pivot_table = tmp_df.pivot_table(
    index=['purpose'],
    values=['loan_amount', 'annual_income'],
    aggfunc=['mean']
)
loans_df_pivot = pivot_table.reset_index()""",
        tags=['simple', 'pandas']
    ),
    SmartDebugTestCase(
        name='pivot_table_incorrect_argument_rows',
        notebook_state=LOANS_DF_NOTEBOOK,
        invalid_code="""
tmp_df = loans_df[['loan_amount', 'purpose', 'annual_income']].copy()
pivot_table = tmp_df.pivot_table(
    rows=['purpose'],
    values=['loan_amount', 'annual_income'],
    aggfunc=['mean']
)
loans_df_pivot = pivot_table.reset_index()""",
        correct_code="""
tmp_df = loans_df[['loan_amount', 'purpose', 'annual_income']].copy()
pivot_table = tmp_df.pivot_table(
    index=['purpose'],
    values=['loan_amount', 'annual_income'],
    aggfunc=['mean']
)
loans_df_pivot = pivot_table.reset_index()""",
        tags=['simple', 'pandas']
    ),
    SmartDebugTestCase(
        name='pivot_table_incorrect_argument_columns',
        notebook_state=LOANS_DF_NOTEBOOK,
        invalid_code="""
tmp_df = loans_df[['loan_amount', 'purpose', 'annual_income', 'income_category']].copy()
pivot_table = tmp_df.pivot_table(
    index=['purpose'],
    cols=['income_category'],
    values=['loan_amount', 'annual_income'],
    aggfunc=['mean']
)
loans_df_pivot = pivot_table.reset_index()""",
        correct_code="""
tmp_df = loans_df[['loan_amount', 'purpose', 'annual_income', 'income_category']].copy()
pivot_table = tmp_df.pivot_table(
    index=['purpose'],
    columns=['income_category'],
    values=['loan_amount', 'annual_income'],
    aggfunc=['mean']
)
loans_df_pivot = pivot_table.reset_index()""",
        tags=['simple', 'pandas']
    ),
    SmartDebugTestCase(
        name='first_owner_function_wrong_arguments',
        notebook_state=USED_CARS_DF_NOTEBOOK,
        invalid_code="""def get_number_of_first_owner_vehicles_by_brand(brand):
    df = df[(df['Brand'].str.contains(brand, na=False, regex=False)) & (df['Owner'].str.contains('first', na=False, regex=False))]
    return len(df)

num_bmw = get_number_of_first_owner_vehicles_by_brand(used_cars_df, 'BMW')
num_toyota = get_number_of_first_owner_vehicles_by_brand(used_cars_df, 'Toyota')
num_ford = get_number_of_first_owner_vehicles_by_brand(used_cars_df, 'Ford')""",
        correct_code="""def get_number_of_first_owner_vehicles_by_brand(df, brand):
    df = df[(df['Brand'].str.contains(brand, na=False, regex=False)) & (df['Owner'].str.contains('first', na=False, regex=False))]
    return len(df)

num_bmw = get_number_of_first_owner_vehicles_by_brand(used_cars_df, 'BMW')
num_toyota = get_number_of_first_owner_vehicles_by_brand(used_cars_df, 'Toyota')
num_ford = get_number_of_first_owner_vehicles_by_brand(used_cars_df, 'Ford')""",
        tags=['simple', 'pandas']
    ),
    SmartDebugTestCase(
        name='first_owner_function_wrong_column_name',
        notebook_state=USED_CARS_DF_NOTEBOOK,
        invalid_code="""def get_number_of_first_owner_vehicles_by_brand(df, brand):
    df = df[(df['Brand'].str.contains(brand, na=False, regex=False)) & (df['owner'].str.contains('first', na=False, regex=False))]
    return len(df)

num_bmw = get_number_of_first_owner_vehicles_by_brand(used_cars_df, 'BMW')
num_toyota = get_number_of_first_owner_vehicles_by_brand(used_cars_df, 'Toyota')
num_ford = get_number_of_first_owner_vehicles_by_brand(used_cars_df, 'Ford')""",
        correct_code="""def get_number_of_first_owner_vehicles_by_brand(df, brand):
    df = df[(df['Brand'].str.contains(brand, na=False, regex=False)) & (df['Owner'].str.contains('first', na=False, regex=False))]
    return len(df)

num_bmw = get_number_of_first_owner_vehicles_by_brand(used_cars_df, 'BMW')
num_toyota = get_number_of_first_owner_vehicles_by_brand(used_cars_df, 'Toyota')
num_ford = get_number_of_first_owner_vehicles_by_brand(used_cars_df, 'Ford')""",
        tags=['simple', 'pandas']
    ),
    SmartDebugTestCase(
        name='first_owner_function_invalid_indentation',
        notebook_state=USED_CARS_DF_NOTEBOOK,
        invalid_code="""def get_number_of_first_owner_vehicles_by_brand(df, brand):
    df = df[(df['Brand'].str.contains(brand, na=False, regex=False)) & (df['owner'].str.contains('first', na=False, regex=False))]
return len(df)

num_bmw = get_number_of_first_owner_vehicles_by_brand(used_cars_df, 'BMW')
num_toyota = get_number_of_first_owner_vehicles_by_brand(used_cars_df, 'Toyota')
num_ford = get_number_of_first_owner_vehicles_by_brand(used_cars_df, 'Ford')""",
        correct_code="""def get_number_of_first_owner_vehicles_by_brand(df, brand):
    df = df[(df['Brand'].str.contains(brand, na=False, regex=False)) & (df['Owner'].str.contains('first', na=False, regex=False))]
    return len(df)

num_bmw = get_number_of_first_owner_vehicles_by_brand(used_cars_df, 'BMW')
num_toyota = get_number_of_first_owner_vehicles_by_brand(used_cars_df, 'Toyota')
num_ford = get_number_of_first_owner_vehicles_by_brand(used_cars_df, 'Ford')""",
        tags=['simple', 'pandas']
    ),
    SmartDebugTestCase( 
        # Should not use len around function return value
        name='first_owner_function_incorrect_handling_return_value', 
        notebook_state=USED_CARS_DF_NOTEBOOK,
        invalid_code="""def get_number_of_first_owner_vehicles_by_brand(df, brand):
    df = df[(df['Brand'].str.contains(brand, na=False, regex=False)) & (df['owner'].str.contains('first', na=False, regex=False))]
    return len(df)

num_bmw = len(get_number_of_first_owner_vehicles_by_brand(used_cars_df, 'BMW'))
num_toyota = len(get_number_of_first_owner_vehicles_by_brand(used_cars_df, 'Toyota'))
num_ford = len(get_number_of_first_owner_vehicles_by_brand(used_cars_df, 'Ford'))""",
        correct_code="""def get_number_of_first_owner_vehicles_by_brand(df, brand):
    df = df[(df['Brand'].str.contains(brand, na=False, regex=False)) & (df['Owner'].str.contains('first', na=False, regex=False))]
    return len(df)

num_bmw = get_number_of_first_owner_vehicles_by_brand(used_cars_df, 'BMW')
num_toyota = get_number_of_first_owner_vehicles_by_brand(used_cars_df, 'Toyota')
num_ford = get_number_of_first_owner_vehicles_by_brand(used_cars_df, 'Ford')""",
        tags=['simple', 'pandas']
    ),
    SmartDebugTestCase(
        # Missing 's' at end of last function call
        name='first_owner_function_called_with_wrong_name', 
        notebook_state=USED_CARS_DF_NOTEBOOK,
        invalid_code="""def get_number_of_first_owner_vehicles_by_brand(df, brand):
    df = df[(df['Brand'].str.contains(brand, na=False, regex=False)) & (df['Owner'].str.contains('first', na=False, regex=False))]
    return df

num_bmw = get_number_of_first_owner_vehicles_by_brand(used_cars_df, 'BMW')
num_toyota = get_number_of_first_owner_vehicle_by_brand(used_cars_df, 'Toyota')
num_ford = get_number_of_first_owner_vehicles_by_brand(used_cars_df, 'Ford')""",
        correct_code="""def get_number_of_first_owner_vehicles_by_brand(df, brand):
    df = df[(df['Brand'].str.contains(brand, na=False, regex=False)) & (df['Owner'].str.contains('first', na=False, regex=False))]
    return len(df)

num_bmw = get_number_of_first_owner_vehicles_by_brand(used_cars_df, 'BMW')
num_toyota = get_number_of_first_owner_vehicles_by_brand(used_cars_df, 'Toyota')
num_ford = get_number_of_first_owner_vehicles_by_brand(used_cars_df, 'Ford')""",
        tags=['simple', 'pandas']
    ),
    SmartDebugTestCase(
        # ValueError: window must be an integer 0 or greater
        name='stock_market_rolling_window_incorrect_period',
        notebook_state=STOCK_MARKET_DATA_NOTEBOOK,
        invalid_code="""
# Calculate 5 cell rolling average volume by ticker with min periods
stock_df = stock_df.sort_values('date')
rolling_vol = stock_df.groupby('ticker').rolling('5D')['volume'].mean()
stock_df['rolling_vol'] = rolling_vol
""",
        correct_code="""
# Calculate 5 cell rolling average volume by ticker with min periods
stock_df = stock_df.sort_values('date')
rolling_vol = stock_df.groupby('ticker')['volume'].rolling(5, min_periods=1).mean()
stock_df['rolling_vol'] = rolling_vol.reset_index(level=0, drop=True)
""",
        tags=['pandas']
    ),
    SmartDebugTestCase(
        name='stock_market_convert_T_and_B_to_float',
        notebook_state=STOCK_MARKET_DATA_NOTEBOOK,
        invalid_code="""
stock_df['market_cap_numeric_billions'] = stock_df['market_cap'].str.replace('$', '')
stock_df['market_cap_numeric_billions'] = stock_df['market_cap_numeric_billions'].astype(float)
""",
        correct_code="""
stock_df['market_cap_numeric_billions'] = stock_df['market_cap'].str.replace('$', '').str.replace('T', '000').str.replace('B', '')
stock_df['market_cap_numeric_billions'] = stock_df['market_cap_numeric_billions'].astype(float)
""",
        tags=['pandas']
    ),
    SmartDebugTestCase(
        # TypeError: agg function failed [how->mean,dtype->object]
        name='stock_market_agg_function_failed',
        notebook_state=STOCK_MARKET_DATA_NOTEBOOK,
        invalid_code="""
sector_dividend = stock_df.groupby('sector')['dividend_yield'].mean()
""",
        correct_code="""
stock_df['dividend_numeric'] = stock_df['dividend_yield'].replace('0%', '0').str.rstrip('%').astype(float) / 100
sector_dividend = stock_df.groupby('sector')['dividend_numeric'].mean()
""",
        tags=['pandas']
    ),
    SmartDebugTestCase(
        # TypeError: incompatible index of inserted column with frame index
        name='stock_market_incompatible_index',
        notebook_state=STOCK_MARKET_DATA_NOTEBOOK,
        invalid_code="""
# Calculate daily stock price volatility with log returns
stock_df = stock_df.sort_values(['ticker', 'date'])
stock_df['log_returns'] = np.log(stock_df.groupby('ticker')['price'].pct_change() + 1)
stock_df['volatility'] = stock_df.groupby('ticker')['log_returns'].rolling(window=20).std() * np.sqrt(252)
""",
        correct_code="""
# Calculate daily stock price volatility with log returns
stock_df = stock_df.sort_values(['ticker', 'date'])
stock_df['log_returns'] = np.log(stock_df.groupby('ticker')['price'].pct_change() + 1)
stock_df['volatility'] = (stock_df.groupby('ticker')['log_returns'].rolling(window=20).std() * np.sqrt(252)).reset_index(level=0, drop=True)
""",
        tags=['pandas']
    ),
    SmartDebugTestCase(
        # ValueError: setting an array element with a sequence. 
        # The requested array has an inhomogeneous shape after 2 dimensions. 
        # The detected shape was (4, 2) + inhomogeneous part.
        name='calculate_volume_weighted_average_price',
        notebook_state=STOCK_MARKET_DATA_NOTEBOOK,
        invalid_code="""
# Calculate VWAP for each stock
stock_df = stock_df.sort_values(['ticker', 'date'])
stock_df['vwap'] = (stock_df.groupby('ticker')['price'] * stock_df['volume']).cumsum() / stock_df.groupby('ticker')['volume'].cumsum()
stock_df.drop('price_volume', axis=1, inplace=True)
""",
        correct_code="""
# Calculate VWAP for each stock
stock_df = stock_df.sort_values(['ticker', 'date'])
stock_df['price_volume'] = stock_df['price'] * stock_df['volume']
stock_df['vwap'] = (stock_df.groupby('ticker')['price_volume'].cumsum() / stock_df.groupby('ticker')['volume'].cumsum())
stock_df.drop('price_volume', axis=1, inplace=True)
""",
        tags=['pandas']
    ),
    SmartDebugTestCase(
        name='rsi_calc_with_incompatible_index',
        notebook_state=STOCK_MARKET_DATA_NOTEBOOK,
        invalid_code="""
# Calculate RSI
def calculate_rsi(data, periods=14):
    delta = data.diff()
    gain = delta.where(delta > 0, 0)
    loss = -delta.where(delta < 0, 0)
    avg_gain = gain.rolling(window=periods).mean()
    avg_loss = loss.rolling(window=periods).mean()
    rs = avg_gain / avg_loss
    return 100 - (100 / (1 + rs))

stock_df['rsi'] = stock_df.groupby('ticker')['price'].apply(calculate_rsi)
""",
        correct_code="""
# Calculate RSI
def calculate_rsi(data, periods=14):
    delta = data.diff()
    gain = delta.where(delta > 0, 0)
    loss = -delta.where(delta < 0, 0)
    avg_gain = gain.ewm(com=periods-1, min_periods=periods).mean()
    avg_loss = loss.ewm(com=periods-1, min_periods=periods).mean()
    rs = avg_gain / avg_loss
    return 100 - (100 / (1 + rs))

# Without sorting first, the diff() calculations could be 
# comparing prices across different stocks within the same ticker group, 
# leading to incorrect gain/loss calculations.
stock_df = stock_df.sort_values(['ticker', 'date'])
stock_df['rsi'] = stock_df.groupby('ticker')['price'].transform(calculate_rsi)
""",
        tags=['logic_correction', 'pandas']
    )
]