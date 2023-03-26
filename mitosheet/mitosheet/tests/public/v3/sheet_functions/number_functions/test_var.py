import pytest
import pandas as pd
import numpy as np

from mitosheet.public.v3.sheet_functions.number_functions import VAR

# Raw function tests
VAR_VALID_TESTS = [
    ([pd.Series([1,2,3,4])], 1.6666666666666667),
    ([pd.Series(['1','2','3', '4'])], 1.6666666666666667),
    ([pd.Series([-1,-2,-3,-4])], 1.6666666666666667),
    ([pd.Series(['Aaron', 1, 2, 3, 4])], 1.6666666666666667),
    ([pd.Series(['Aaron','Aaron','Aaron'])], np.nan),
    ([pd.Series([1, 2, 3, None, 4])], 1.6666666666666667),
]
@pytest.mark.parametrize("_argv, expected", VAR_VALID_TESTS)
def test_VAR_valid_input_direct(_argv, expected):
    result = VAR(*_argv)
    if isinstance(result, pd.Series):
        assert result.equals(expected)
    else: 
        if np.isnan(result) :
            assert np.isnan(expected)
        else:
            assert result == expected
