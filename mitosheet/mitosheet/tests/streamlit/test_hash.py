import time
import pytest
import pandas as pd
from mitosheet.streamlit.v1.spreadsheet import get_dataframe_hash


TEST_HASHES = [
    (
        pd.DataFrame(data={'A': [1, 2, 3], 'B': [2, 3, 4]}),
        pd.DataFrame(data={'A': [1, 2, 3], 'B': [2, 3, 4]}),
        True
    ),
    # Extra column
    (
        pd.DataFrame(data={'A': [1, 2, 3], 'B': [2, 3, 4]}),
        pd.DataFrame(data={'A': [1, 2, 3], 'B': [2, 3, 4], 'C': [1, 2, 3]}),
        False
    ),
    # Different values
    (
        pd.DataFrame(data={'A': [1, 2, 3], 'B': [2, 3, 4]}),
        pd.DataFrame(data={'A': [1, 2, 3], 'B': [2, 3, 5]}),
        False
    ),
    # Different order
    (
        pd.DataFrame(data={'A': [1, 2, 3], 'B': [2, 3, 4]}),
        pd.DataFrame(data={'B': [1, 2, 3], 'A': [2, 3, 4]}),
        False
    ),
    # Different index
    (
        pd.DataFrame(data={'A': [1, 2, 3], 'B': [2, 3, 4]}, index=[1, 2, 3]),
        pd.DataFrame(data={'A': [1, 2, 3], 'B': [2, 3, 4]}, index=[1, 2, 4]),
        False
    ),
    # Missing column
    (
        pd.DataFrame(data={'A': [1, 2, 3], 'B': [2, 3, 4]}),
        pd.DataFrame(data={'A': [1, 2, 3]}),
        False
    ),
    # Different sort
    (
        pd.DataFrame(data={'A': [1, 2, 3], 'B': [2, 3, 4]}).sort_values(by=['A']),
        pd.DataFrame(data={'A': [1, 2, 3], 'B': [2, 3, 4]}).sort_values(by=['B'], ascending=False),
        False
    ),
    # Different headers
    (
        pd.DataFrame(data={'A': [1, 2, 3], 'C': [2, 3, 4]}),
        pd.DataFrame(data={'A': [1, 2, 3], 'B': [2, 3, 4]}),
        False
    ),
    # Reordered columns
    (
        pd.DataFrame(data={'A': [1, 2, 3], 'C': [2, 3, 4]}),
        pd.DataFrame(data={'C': [2, 3, 4], 'A': [1, 2, 3]}),
        False
    ),
]

@pytest.mark.parametrize("df1, df2, expected", TEST_HASHES)
def test_hash_pandas_dataframe(df1, df2, expected):
    assert len(get_dataframe_hash(df1)) < 100
    assert (get_dataframe_hash(df1) == get_dataframe_hash(df2)) == expected
    