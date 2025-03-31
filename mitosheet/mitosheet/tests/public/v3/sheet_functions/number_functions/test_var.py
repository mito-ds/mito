# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

import pytest
import pandas as pd
import numpy as np
from mitosheet.public.v3.rolling_range import RollingRange

from mitosheet.public.v3.sheet_functions.number_functions import VAR

# Raw function tests
VAR_VALID_TESTS = [
    ([pd.Series([1,2,3,4])], 1.6666666666666667),
    ([pd.Series(['1','2','3', '4'])], 1.6666666666666667),
    ([pd.Series([-1,-2,-3,-4])], 1.6666666666666667),
    ([pd.Series(['Aaron', 1, 2, 3, 4])], 1.6666666666666667),
    ([pd.Series(['Aaron','Aaron','Aaron'])], np.nan),
    ([pd.Series([1, 2, 3, None, 4])], 1.6666666666666667),
    ([pd.DataFrame({'A': [1, 2, 3], 'B': [4, 5, 6]})], 1.8708286933869707 ** 2),
    ([pd.DataFrame({'A': [1, 2, 3], 'B': [4, np.nan, 6]})], 1.9235384061671346 ** 2),
    ([pd.DataFrame({'A': ['1', '2', '3'], 'B': [4, np.nan, 6]})], 1.9235384061671346  ** 2),
    ([RollingRange(pd.DataFrame({'A': ['1', '2', '4']}), 2, 0)], pd.Series([0.707107 ** 2, 1.414214 ** 2, np.nan])),
    ([RollingRange(pd.DataFrame({'A': ['1', '2', '4'], "B": [3, 4, 5]}), 2, 0)], pd.Series([1.290994449 ** 2, 1.258305739 ** 2, 0.707106781  ** 2])),
]
@pytest.mark.parametrize("_argv, expected", VAR_VALID_TESTS)
def test_VAR_valid_input_direct(_argv, expected):
    result = VAR(*_argv)
    if isinstance(result, pd.Series):
        assert np.allclose(result, expected, equal_nan=True)
    else: 
        if np.isnan(result) :
            assert np.isnan(expected)
        else:
            assert result == expected
