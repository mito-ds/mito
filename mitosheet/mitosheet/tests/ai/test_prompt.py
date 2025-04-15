# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

import pandas as pd
import pytest
from mitosheet.types import Selection
from typing import List, Tuple, Optional

from mitosheet.ai.prompt import get_prompt, MAX_CHARS

PROMPT_TESTS: List[Tuple[List[str], List[pd.DataFrame], Optional[Selection], str, List[Tuple[str, str]], List[str]]] = [
    (
        [],
        [],
        None,
        'import a dataframe',
        [],
        [
            "You are a pandas developer who has just started a new script.",
        ]
    ),
    (
        ['df_name'],
        [pd.DataFrame({'A': [1, 2, 3]})],
        {
            'selected_df_name': 'df_name',
            'selected_column_headers': [],
            'selected_row_labels': []
        },
        'import a dataframe',
        [],
        [
            "df_name = pd.DataFrame({'A': [1, 2, 3]})",
            "df_name.replace(1, 2, inplace=True)"
        ]
    ),
    (
        ['df_name_1', 'df_name_2'],
        [pd.DataFrame({'A': [1, 2, 3]}), pd.DataFrame({'B': [1, 2, 3]})],
        {
            'selected_df_name': 'df_name_2',
            'selected_column_headers': [],
            'selected_row_labels': []
        },
        'import a dataframe',
        [],
        [
            "df_name_2 = pd.DataFrame({'B': [1, 2, 3]})", # note that the selection is placed first
            "df_name_1 = pd.DataFrame({'A': [1, 2, 3]})", 
            "df_name_2.replace(1, 2, inplace=True)"
        ]
    ),
    # 50 dataframes
    (
        [f'df{i}' for i in range(50)],
        [pd.DataFrame({'A': [1, 2, 3]}) for i in range(50)],
        {
            'selected_df_name': 'df1',
            'selected_column_headers': [],
            'selected_row_labels': []
        },
        'import a dataframe',
        [],
        [
            "df31 = pd.DataFrame({'A': [1, 2, 3]})",
            "df49 = pd.DataFrame({'A': [1, 2, 3]})",
        ]
    ),
    # Selection in second dataframe
    (
        [f'df{i}' for i in range(3)],
        [pd.DataFrame({f'A': [1, 2, 3]}) for i in range(3)],
        {
            'selected_df_name': 'df1',
            'selected_column_headers': [],
            'selected_row_labels': []
        },
        'import a dataframe',
        [],
        [
            "df1 = pd.DataFrame(",
            "df0 = pd.DataFrame(",
            "df1.replace(1, 2, inplace=True)"
        ]
    ),
    # Dataframe with very many column headers
     (
         [f'df1'],
         [pd.DataFrame({f'{str(i)}': [1, 2, 3] for i in range(10_000)})],
         {
             'selected_df_name': 'df1',
             'selected_column_headers': [],
             'selected_row_labels': []
         },
         'import a dataframe',
        [],
         [
             "'1510', '1511', '1512', '1513', '1514', '1515', '1516', '1517', '1518', '1519', '1520'",
             "df1.replace(1, 2, inplace=True)"
         ]
     ),
    # Dataframe with long column header
    (
        [f'df1'],
        [pd.DataFrame({'A' * 100_000: [1, 2, 3]})],
        {
            'selected_df_name': 'df1',
            'selected_column_headers': [],
            'selected_row_labels': []
        },
        'import a dataframe',
        [],
        [
            "df1 = pd.DataFrame({columns=[ ... and 1 more]})",
            "df1.replace(1, 2, inplace=True)"
        ]
    ),
    # Dataframe with long values
    (
        [f'df1'],
        [pd.DataFrame({'A': ['A' * 100_000]})],
        {
            'selected_df_name': 'df1',
            'selected_column_headers': [],
            'selected_row_labels': []
        },
        'import a dataframe',
        [],
        [
            "df1 = pd.DataFrame(columns=['A'])",
            "df1.replace(1, 2, inplace=True)"
        ]
    ),
    # Previous failed completions are included
    (
        ['df_name'],
        [pd.DataFrame({'A': [1, 2, 3]})],
        {
            'selected_df_name': 'df_name',
            'selected_column_headers': [],
            'selected_row_labels': []
        },
        'import a dataframe',
        [
            ('df_name.replace(1, NOT_A_VARIABLE, inplace=True)', "NameError: name 'NOT_A_VARIABLE' is not defined")
        ],
        [
            "df_name = pd.DataFrame({'A': [1, 2, 3]})",
            "df_name.replace(1, NOT_A_VARIABLE, inplace=True)",
            "Error:",
        ]
    ),

    # NOTE: Note we don't test long df names (never seen this) - this is fine
]
@pytest.mark.parametrize("df_names, dfs, selection, user_input, previous_failed_completions, substrings", PROMPT_TESTS)
def test_get_prompt(df_names, dfs, selection, user_input, previous_failed_completions, substrings):
    prompt = get_prompt(df_names, dfs, selection, user_input, previous_failed_completions)
    assert len(prompt) < MAX_CHARS
    index = 0
    for substring in substrings:
        assert substring in prompt
        assert index < prompt.index(substring)
        index = prompt.index(substring)
    assert user_input in prompt
