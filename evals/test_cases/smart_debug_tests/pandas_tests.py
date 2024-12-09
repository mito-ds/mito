from evals.eval_types import SmartDebugTestCase
from evals.notebook_states import EMPTY_NOTEBOOK, LOANS_DF_NOTEBOOK, MESSY_DATA_NOTEBOOK, USED_CARS_DF_NOTEBOOK
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
"loans_df = loans_df[loans_df[annual_income] > 100000]",
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
""",
        correct_code="""
loans_df.rename(columns={'issue_date': 'Date'}, inplace=True)
""",
        tags=['simple', 'pandas']
    ),
    SmartDebugTestCase(
        name='column_delete_missing_inplace',
        notebook_state=LOANS_DF_NOTEBOOK,
        invalid_code="""
loans_df.drop(columns=['annual_income'])
""",
        correct_code="""
loans_df.drop(columns=['annual_income'], inplace=True)
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


]
