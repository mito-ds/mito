import json
import os
import pandas as pd
import pytest

from mitosheet.tests.test_utils import create_mito_wrapper
from mitosheet.tests.decorators import requires_flask
from mitosheet.mito_flask.v1.flatten_utils import (flatten_mito_backend_to_json,
                                                read_backend_state_string_to_mito_backend)

TEST_DFS = [
    (pd.DataFrame({"a": [1, 2], "b": ['abc', 'def'], "c": [True, False], "d": [1.0, 2.0]})),
]


@pytest.mark.parametrize("df", TEST_DFS)
@requires_flask
def test_convert_to_string(df):
    mito = create_mito_wrapper()

    df.to_csv("test.csv", index=False)
    mito.simple_import(["test.csv"])

    mb = mito.mito_backend
    s = flatten_mito_backend_to_json(mb)

    assert json.loads(s)["shared_state_variables"] == mb.get_shared_state_variables()

    backend_state = json.loads(s)["backend_state"]
    new_mb = read_backend_state_string_to_mito_backend(backend_state)
    assert new_mb.steps_manager.dfs[0].equals(df)

    os.remove("test.csv")

@requires_flask
def test_process_edit_convert_to_string_then_convert_back_still_processes():
    test_wrapper = create_mito_wrapper()
    df = pd.DataFrame({'A': [1, 2, 3], 'B': [1, 2, 3]})
    df.to_csv("test.csv", index=False)
    test_wrapper.simple_import(["test.csv"])
    test_wrapper.add_column(0, 'C')

    s = flatten_mito_backend_to_json(test_wrapper.mito_backend)
    new_mb = read_backend_state_string_to_mito_backend(json.loads(s)["backend_state"])

    assert new_mb.steps_manager.dfs[0].equals(pd.DataFrame({'A': [1, 2, 3], 'B': [1, 2, 3], 'C': [0, 0, 0]}))

    new_test_wrapper = create_mito_wrapper(mito_backend=new_mb)
    new_test_wrapper.add_column(0, 'D')

    assert new_mb.steps_manager.dfs[0].equals(pd.DataFrame({'A': [1, 2, 3], 'B': [1, 2, 3], 'C': [0, 0, 0], 'D': [0, 0, 0]}))

    os.remove("test.csv")
    