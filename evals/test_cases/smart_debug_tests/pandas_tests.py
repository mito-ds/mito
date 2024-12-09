from evals.eval_types import SmartDebugTestCase
from evals.notebook_states import EMPTY_NOTEBOOK, MESSY_DATA_NOTEBOOK
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

]