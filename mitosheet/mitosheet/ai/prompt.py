



import string
from typing import List, Optional, Tuple, Union

import pandas as pd

from mitosheet.transpiler.transpile_utils import (
    CLOSE_BRACKET, NEWLINE, OPEN_BRACKET,
    get_column_header_list_as_transpiled_code, get_column_header_as_transpiled_code)
from mitosheet.types import Selection

MAX_TOKENS = 4096
CHARS_PER_TOKEN = 4 # https://platform.openai.com/docs/introduction/tokens
MAX_CHARS = MAX_TOKENS * CHARS_PER_TOKEN

MAX_TOKENS_FOR_INPUT_DATA = 3800
MAX_CHARS_FOR_INPUT_DATA = MAX_TOKENS_FOR_INPUT_DATA * CHARS_PER_TOKEN

PROMPT_VERSION = 'df-creation-prompt-1'

def get_dataframe_creation_code(df: pd.DataFrame, max_characters: Union[int, float]) -> str:
    """
    Given a dataframe like:

        date (year)      value sum
    0         2000             1.0
    1         2001             NaN

    Will return a string that looks something like
    ```
    pd.DataFrame({'date (year)': [2000, 2001], 'value sum: [1.0, np.NaN]})
    ```

    This notably will only include max_characters in the string it returns.
    It will chop characters first by not including the data present in the
    dataframe and just including the columns. 

    Then, it will chop characters by just including the column names, and 
    note the values in the columns. Then, it will chop characters by eliding
    some of the columns (it just takes a greedy approach to taking columns).
    """

    transpiled_column_headers_to_transpiled_values = {
        get_column_header_as_transpiled_code(column_header): get_column_header_list_as_transpiled_code(df[column_header].to_list())
        for column_header in df.columns
    }

    column_headers_to_values_string = ", ".join([f"{ch}: {vs}" for ch, vs in transpiled_column_headers_to_transpiled_values.items()])
    df_string_with_values = f'pd.DataFrame({OPEN_BRACKET}{column_headers_to_values_string}{CLOSE_BRACKET})'

    if len(df_string_with_values) < max_characters:
        return df_string_with_values
    
    column_headers_string = ", ".join([ch for ch in transpiled_column_headers_to_transpiled_values])
    df_string_with_only_headers = f'pd.DataFrame(columns=[{column_headers_string}])'

    if len(df_string_with_only_headers) < max_characters:
        return df_string_with_only_headers

    # Then, we find the maximum number of column headers we can include. Note that we use a binary search algorithm
    # to do this - as the loop that we original started with had performance problems on dataframes with a large
    # number of column headers that we noticed while testing
    reduced_headers = ''
    columns = df.columns.to_list()
    low = 0
    num_not_included = 1
    high = len(columns) - 1
    len_container = len(f'pd.DataFrame(columns=[ ... and {high} more])') # Max length of container

    while low < high:
        mid = (low + high) // 2
        reduced_headers = get_column_header_list_as_transpiled_code(columns[:mid])
        num_not_included = len(columns) - mid + 1

        if (len(reduced_headers) + len_container) < max_characters:
            low = mid + 1
        elif (len(reduced_headers) + len_container) > max_characters:
            high = mid - 1

    return f'pd.DataFrame({OPEN_BRACKET}columns=[{reduced_headers} ... and {num_not_included} more]{CLOSE_BRACKET})'


def get_input_data_string(df_names: List[str], dfs: List[pd.DataFrame], current_selection: Optional[Selection]) -> str:
    # First, we get the input data code for creating the dataframes
    dfs_creation_code = {}
    for df_name, df in zip(df_names, dfs):
        max_characters = MAX_CHARS_FOR_INPUT_DATA / len(df_names)
        dfs_creation_code[df_name] = get_dataframe_creation_code(df.head(5), max_characters)

    # Then, build the input data string, making sure to put the selected dataframe first - if these is one
    if current_selection is not None:
        input_data_string = f"""Input dataframes:
```
{current_selection['selected_df_name']} = {dfs_creation_code[current_selection['selected_df_name']]}
{NEWLINE.join([f'{df_name} = {df_creation_code}' for df_name, df_creation_code in dfs_creation_code.items() if df_name != current_selection['selected_df_name']])}
```
The dataframe {current_selection['selected_df_name']} is currently selected.
"""
    else:
        input_data_string = f"""Input dataframes:
```
{NEWLINE.join([f'{df_name} = {df_creation_code}' for df_name, df_creation_code in dfs_creation_code.items()])}
```"""

    return input_data_string

def get_transformation_and_code_string(transformation: str, code: Optional[str]=None) -> str:
    if code is None:
        return f"""Transformation: {transformation}
Code:
```
"""
    else:
        return f"""Transformation: {transformation}
Code:
```
{code}
```"""


def get_example_string(df_names: List[str], current_selection: Optional[Selection]) -> str:

    # TODO: If there is a previous edit in the mitosheet, we could use this as the example, as it's about as in-context as you can get

    # Otherwise, we make up a fake edit
    if current_selection is not None:
        return get_transformation_and_code_string(
            f"replace 1 with 2",
            f"{current_selection['selected_df_name']}.replace(1, 2, inplace=True)"
        )
    else:
        df_name = df_names[0] if len(df_names) > 0 else 'df'
        return get_transformation_and_code_string(
            f"replace 1 with 2 in {df_name}",
            f"{df_name}.replace(1, 2, inplace=True)"
        )


def get_previous_failed_completions_string(previous_failed_completions: List[Tuple[str, str]], user_input: str) -> str:
    if len(previous_failed_completions) == 0:
        return ""
    
    final_str = ''
    for index, (code, error) in enumerate(previous_failed_completions):

        if index == 0:
            final_str += f"""{code}
```
Error:
```
{error}
```

"""
        else:
            final_str += f"""Fixing previous errors, {get_transformation_and_code_string(user_input, code)}
Error:
```
{error}
```

"""

                
    final_str += f"Fixing previous errors, {get_transformation_and_code_string(user_input)}"

    return final_str


def get_prompt(
        df_names: List[str], 
        dfs: List[pd.DataFrame], 
        current_selection: Optional[Selection], 
        user_input: str,
        previous_failed_completions: List[Tuple[str, str]]
    ) -> str:

    previous_failed_completions_string = get_previous_failed_completions_string(previous_failed_completions, user_input)

    if len(dfs) > 0:
        input_data_string = get_input_data_string(df_names, dfs, current_selection)
        example_string = get_example_string(df_names, current_selection)

        return f"""You are a pandas developer who is working with the following dataframes.

{input_data_string}

{example_string}

{get_transformation_and_code_string(user_input)}{previous_failed_completions_string}
"""
    else:

        return f"""
You are a pandas developer who has just started a new script. You are looking to 
make the following transformation.

{get_transformation_and_code_string(user_input)}{previous_failed_completions_string}
"""