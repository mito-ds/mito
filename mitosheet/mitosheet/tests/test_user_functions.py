
import json
import pytest
import pandas as pd
from mitosheet.enterprise.mito_config import MITO_CONFIG_CUSTOM_SHEET_FUNCTIONS_PATH, MITO_CONFIG_VERSION
from mitosheet.saved_analyses.save_utils import write_analysis
from mitosheet.tests.test_mito_config import delete_all_mito_config_environment_variables

from mitosheet.tests.test_utils import create_mito_wrapper


def test_can_pass_sheet_function():
    def ADD1(col):
        return col + 1 
    mito = create_mito_wrapper(pd.DataFrame({'A': [1, 2, 3]}), sheet_functions=[ADD1])

    mito.set_formula('=ADD1(A0)', 0, 'B', add_column=True)
    assert mito.dfs[0].equals(pd.DataFrame({'A': [1, 2, 3], 'B': [2, 3, 4]}))

def test_can_pass_multiple_sheet_functions():
    def ADD1(col):
        return col + 1 
    def ADD2(col):
        return col + 2
    mito = create_mito_wrapper(pd.DataFrame({'A': [1, 2, 3]}), sheet_functions=[ADD1, ADD2])

    mito.set_formula('=ADD2(ADD1(A0))', 0, 'B', add_column=True)
    assert mito.dfs[0].equals(pd.DataFrame({'A': [1, 2, 3], 'B': [4, 5, 6]}))


def test_pass_sheet_function_then_replay_errors_if_not_passed_again():
    def ADD1(col):
        return col + 1 
    df = pd.DataFrame({'A': [1, 2, 3]})
    mito = create_mito_wrapper(df, sheet_functions=[ADD1])

    mito.set_formula('=ADD1(A0)', 0, 'B', add_column=True)
    assert mito.dfs[0].equals(pd.DataFrame({'A': [1, 2, 3], 'B': [2, 3, 4]}))

    analysis_name = mito.mito_backend.analysis_name
    write_analysis(mito.mito_backend.steps_manager)

    new_mito = create_mito_wrapper(df)
    new_mito.replay_analysis(analysis_name)

    assert new_mito.dfs[0].equals(pd.DataFrame({'A': [1, 2, 3]}))

def test_pass_sheet_function_then_replay_works_if_passed_again():
    def ADD1(col):
        return col + 1 
    df = pd.DataFrame({'A': [1, 2, 3]})
    mito = create_mito_wrapper(df, sheet_functions=[ADD1])

    mito.set_formula('=ADD1(A0)', 0, 'B', add_column=True)
    assert mito.dfs[0].equals(pd.DataFrame({'A': [1, 2, 3], 'B': [2, 3, 4]}))

    analysis_name = mito.mito_backend.analysis_name
    write_analysis(mito.mito_backend.steps_manager)

    new_mito = create_mito_wrapper(df, sheet_functions=[ADD1])
    new_mito.replay_analysis(analysis_name)

    assert new_mito.dfs[0].equals(pd.DataFrame({'A': [1, 2, 3], 'B': [2, 3, 4]}))

def test_sheet_functions_with_non_caps_error():
    def lower(col):
        return col + 1 
    df = pd.DataFrame({'A': [1, 2, 3]})
    with pytest.raises(ValueError):
        mito = create_mito_wrapper(df, sheet_functions=[lower])


def test_pass_sheet_function_returns_list():
    def COLUMN_SUM(df):
        return [df.sum() for x in range(len(df))]

    df = pd.DataFrame({'A': [1, 2, 3]})
    mito = create_mito_wrapper(df, sheet_functions=[COLUMN_SUM])

    mito.set_formula('=COLUMN_SUM(A0)', 0, 'B', add_column=True)
    assert mito.dfs[0].equals(pd.DataFrame({'A': [1, 2, 3], 'B': [6, 6, 6]}))


def test_user_defined_function_valid_doc_string():
    def ADD1(col):
        """Adds 1 to the column"""
        return col + 1 
    mito = create_mito_wrapper(pd.DataFrame({'A': [1, 2, 3]}), sheet_functions=[ADD1])
    documentation = json.loads(mito.analysis_data_json)['userDefinedFunctions']

    assert documentation == [{'function': 'ADD1', 'description': 'Adds 1 to the column', 'search_terms': ['Adds', 'the', 'column'], 'syntax': 'ADD1(col)', 'syntax_elements': [{'element': 'col', 'description': ''}]}]

def test_user_defined_function_function_documentation_object():
    def ADD1(col):
        """
        {
            "function": "ADD1",
            "description": "Returns the absolute value of the passed number or series.",
            "search_terms": ["abs", "absolute value"],
            "examples": [
                "ABS(-1.3)",
                "ABS(A)"
            ],
            "syntax": "ABS(value)",
            "syntax_elements": [{
                    "element": "value",
                    "description": "The value or series to take the absolute value of."
                }
            ]
        }
        """
        return col + 1 
    mito = create_mito_wrapper(pd.DataFrame({'A': [1, 2, 3]}), sheet_functions=[ADD1])
    documentation = json.loads(mito.analysis_data_json)['userDefinedFunctions']

    assert documentation == [{'function': 'ADD1', 'description': 'Returns the absolute value of the passed number or series.', 'search_terms': ['abs', 'absolute value'], 'examples': ['ABS(-1.3)', 'ABS(A)'], 'syntax': 'ABS(value)', 'syntax_elements': [{'element': 'value', 'description': 'The value or series to take the absolute value of.'}]}]

def test_user_defined_function_from_environment_variable():
    file_one = """
def ADD1(col):
    return col + 1
"""

    # Write these files to the folder
    with open('file_one.py', 'w') as f:
        f.write(file_one)

    # Set the environment variable
    import os
    os.environ[MITO_CONFIG_VERSION] = "2"
    os.environ[MITO_CONFIG_CUSTOM_SHEET_FUNCTIONS_PATH] = "./file_one.py"

    mito = create_mito_wrapper(pd.DataFrame({'A': [1, 2, 3]}))
    mito.set_formula('=ADD1(A0)', 0, 'B', add_column=True)
    assert mito.dfs[0].equals(pd.DataFrame({'A': [1, 2, 3], 'B': [2, 3, 4]}))

    # Reset the environmnet
    delete_all_mito_config_environment_variables()
    os.remove('file_one.py')


def test_user_defined_function_from_environment_variable_with_imports():
    file_one = """
def HELPER_FUNCTION():
    print(1)
"""

    file_two = """
from file_one import HELPER_FUNCTION

def ADD1(col):
    HELPER_FUNCTION()
    return col + 1

def ADD2(col):
    return ADD1(col) + 1
"""

    # Write these files to the folder
    with open('file_one.py', 'w') as f:
        f.write(file_one)
    with open('file_two.py', 'w') as f:
        f.write(file_two)

    # Set the environment variable
    import os
    os.environ[MITO_CONFIG_VERSION] = "2"
    os.environ[MITO_CONFIG_CUSTOM_SHEET_FUNCTIONS_PATH] = "./file_two.py"

    mito = create_mito_wrapper(pd.DataFrame({'A': [1, 2, 3]}))
    mito.set_formula('=ADD2(A0)', 0, 'B', add_column=True)
    assert mito.dfs[0].equals(pd.DataFrame({'A': [1, 2, 3], 'B': [3, 4, 5]}))

    assert len(json.loads(mito.mito_backend.steps_manager.analysis_data_json)["userDefinedFunctions"]) == 2

    # Reset the environmnet
    delete_all_mito_config_environment_variables()
    os.remove('file_one.py')
    os.remove('file_two.py')

def test_user_defined_function_from_environment_variable_and_mitosheet_call():
    file_one = """
def ADD1(col):
    return col + 1
"""

    # Write these files to the folder
    with open('file_one.py', 'w') as f:
        f.write(file_one)

    # Set the environment variable
    import os
    os.environ[MITO_CONFIG_VERSION] = "2"
    os.environ[MITO_CONFIG_CUSTOM_SHEET_FUNCTIONS_PATH] = "./file_one.py"

    def ADD2(col):
        """
        {
            "function": "ADD1",
            "description": "Returns the absolute value of the passed number or series.",
            "search_terms": ["abs", "absolute value"],
            "examples": [
                "ABS(-1.3)",
                "ABS(A)"
            ],
            "syntax": "ABS(value)",
            "syntax_elements": [{
                    "element": "value",
                    "description": "The value or series to take the absolute value of."
                }
            ]
        }
        """
        return col + 2
    mito = create_mito_wrapper(pd.DataFrame({'A': [1, 2, 3], 'B': [1, 2, 3]}), sheet_functions=[ADD2])
    mito.set_formula('=ADD1(A0)', 0, 'A')
    mito.set_formula('=ADD2(B0)', 0, 'B')

    assert mito.dfs[0].equals(pd.DataFrame({'A': [2, 3, 4], 'B': [3, 4, 5]}))

    # Reset the environmnet
    delete_all_mito_config_environment_variables()
    os.remove('file_one.py')

