import pandas as pd
import pytest

from mitosheet.tests.test_utils import create_mito_wrapper
from mitosheet.mito_backend import MitoBackend
from mitosheet.mito_flask.flatten_utils import (flatten_mito_backend_to_string,
                                                flatten_string_to_mito_backend)

TEST_DFS = [
    (pd.DataFrame({"a": [1, 2], "b": ['abc', 'def'], "c": [True, False], "d": [1.0, 2.0], "e": pd.to_datetime([1, 2])})),
]


@pytest.mark.parametrize("df", TEST_DFS)
def test_convert_to_string(df):
    mb = MitoBackend(df)
    s = flatten_mito_backend_to_string(mb)
    new_mb = flatten_string_to_mito_backend(s)
    assert new_mb.steps_manager.dfs[0].equals(df)


def test_process_edit_convert_to_string_then_convert_back_still_processes():
    test_wrapper = create_mito_wrapper(pd.DataFrame({'A': [1, 2, 3]}))
    test_wrapper.add_column(0, 'B')

    s = flatten_mito_backend_to_string(test_wrapper.mito_backend)
    new_mb = flatten_string_to_mito_backend(s)

    assert new_mb.steps_manager.dfs[0].equals(pd.DataFrame({'A': [1, 2, 3], 'B': [0, 0, 0]}))

    new_test_wrapper = create_mito_wrapper(mito_backend=new_mb)
    new_test_wrapper.add_column(0, 'C')

    assert new_mb.steps_manager.dfs[0].equals(pd.DataFrame({'A': [1, 2, 3], 'B': [0, 0, 0], 'C': [0, 0, 0]}))


    