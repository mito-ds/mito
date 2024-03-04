#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
"""
Contains tests for AI Transformation
"""

import datetime
import pandas as pd
import pytest
from mitosheet.tests.test_utils import create_mito_wrapper

AI_TRANSFORMATION_TESTS = [
    # Edit dataframe
    (
        [
            pd.DataFrame({'A': [1, 2, 3], 'B': [1.0, 2.0, 3.0], 'C': [True, False, True], 'D': ["string", "with spaces", "and/!other@characters"], 'E': pd.to_datetime(['12-22-1997', '12-23-1997', '12-24-1997']), 'F': pd.to_timedelta(['1 days', '2 days', '3 days'])})
        ],
        """df1.drop(columns=['A'], inplace=True)""",
        [
            pd.DataFrame({'B': [1.0, 2.0, 3.0], 'C': [True, False, True], 'D': ["string", "with spaces", "and/!other@characters"], 'E': pd.to_datetime(['12-22-1997', '12-23-1997', '12-24-1997']), 'F': pd.to_timedelta(['1 days', '2 days', '3 days'])})
        ]
    ),
    # Create dataframe
    (
        [
            pd.DataFrame({'A': [1, 2, 3], 'B': [1.0, 2.0, 3.0], 'C': [True, False, True], 'D': ["string", "with spaces", "and/!other@characters"], 'E': pd.to_datetime(['12-22-1997', '12-23-1997', '12-24-1997']), 'F': pd.to_timedelta(['1 days', '2 days', '3 days'])})
        ],
        """
import pandas as pd
df2 = pd.DataFrame({'a': [123]})
""",
        [
            pd.DataFrame({'A': [1, 2, 3], 'B': [1.0, 2.0, 3.0], 'C': [True, False, True], 'D': ["string", "with spaces", "and/!other@characters"], 'E': pd.to_datetime(['12-22-1997', '12-23-1997', '12-24-1997']), 'F': pd.to_timedelta(['1 days', '2 days', '3 days'])}),
            pd.DataFrame({'a': [123]})
        ]
    ),
    # Create dataframe with last expression
    (
        [
            pd.DataFrame({'A': [1, 2, 3], 'B': [1.0, 2.0, 3.0], 'C': [True, False, True], 'D': ["string", "with spaces", "and/!other@characters"], 'E': pd.to_datetime(['12-22-1997', '12-23-1997', '12-24-1997']), 'F': pd.to_timedelta(['1 days', '2 days', '3 days'])})
        ],
        """df1.drop(columns=['A'])""",
        [
            pd.DataFrame({'A': [1, 2, 3], 'B': [1.0, 2.0, 3.0], 'C': [True, False, True], 'D': ["string", "with spaces", "and/!other@characters"], 'E': pd.to_datetime(['12-22-1997', '12-23-1997', '12-24-1997']), 'F': pd.to_timedelta(['1 days', '2 days', '3 days'])}),
            pd.DataFrame({'B': [1.0, 2.0, 3.0], 'C': [True, False, True], 'D': ["string", "with spaces", "and/!other@characters"], 'E': pd.to_datetime(['12-22-1997', '12-23-1997', '12-24-1997']), 'F': pd.to_timedelta(['1 days', '2 days', '3 days'])}),
        ]
    ),
    # Edit multiple dataframes
    (
        [
            pd.DataFrame({'A': [1, 2, 3], 'B': [1.0, 2.0, 3.0], 'C': [True, False, True], 'D': ["string", "with spaces", "and/!other@characters"], 'E': pd.to_datetime(['12-22-1997', '12-23-1997', '12-24-1997']), 'F': pd.to_timedelta(['1 days', '2 days', '3 days'])}),
            pd.DataFrame({'A': [1, 2, 3], 'B': [1.0, 2.0, 3.0], 'C': [True, False, True], 'D': ["string", "with spaces", "and/!other@characters"], 'E': pd.to_datetime(['12-22-1997', '12-23-1997', '12-24-1997']), 'F': pd.to_timedelta(['1 days', '2 days', '3 days'])})
        ],
        """
df1.drop(columns=['A'], inplace=True)
df2.drop(columns=['B'], inplace=True)
""",
        [
            pd.DataFrame({'B': [1.0, 2.0, 3.0], 'C': [True, False, True], 'D': ["string", "with spaces", "and/!other@characters"], 'E': pd.to_datetime(['12-22-1997', '12-23-1997', '12-24-1997']), 'F': pd.to_timedelta(['1 days', '2 days', '3 days'])}),
            pd.DataFrame({'A': [1, 2, 3], 'C': [True, False, True], 'D': ["string", "with spaces", "and/!other@characters"], 'E': pd.to_datetime(['12-22-1997', '12-23-1997', '12-24-1997']), 'F': pd.to_timedelta(['1 days', '2 days', '3 days'])}),
        ]
    ),
    # Create multiple dataframes
    (
        [
            pd.DataFrame({'A': [1, 2, 3], 'B': [1.0, 2.0, 3.0], 'C': [True, False, True], 'D': ["string", "with spaces", "and/!other@characters"], 'E': pd.to_datetime(['12-22-1997', '12-23-1997', '12-24-1997']), 'F': pd.to_timedelta(['1 days', '2 days', '3 days'])}),
        ],
        """
import pandas as pd
df2 = pd.DataFrame({'a': [123]})
df3 = pd.DataFrame({'b': [123]})
""",
        [
            pd.DataFrame({'A': [1, 2, 3], 'B': [1.0, 2.0, 3.0], 'C': [True, False, True], 'D': ["string", "with spaces", "and/!other@characters"], 'E': pd.to_datetime(['12-22-1997', '12-23-1997', '12-24-1997']), 'F': pd.to_timedelta(['1 days', '2 days', '3 days'])}),
            pd.DataFrame({'a': [123]}),
            pd.DataFrame({'b': [123]})
        ]
    ),
    # Edit and create dataframes
    (
        [
            pd.DataFrame({'A': [1, 2, 3], 'B': [1.0, 2.0, 3.0], 'C': [True, False, True], 'D': ["string", "with spaces", "and/!other@characters"], 'E': pd.to_datetime(['12-22-1997', '12-23-1997', '12-24-1997']), 'F': pd.to_timedelta(['1 days', '2 days', '3 days'])}),
        ],
        """
import pandas as pd
df1.drop(columns=['A'], inplace=True)
df2 = pd.DataFrame({'a': [123]})
""",
        [
            pd.DataFrame({'B': [1.0, 2.0, 3.0], 'C': [True, False, True], 'D': ["string", "with spaces", "and/!other@characters"], 'E': pd.to_datetime(['12-22-1997', '12-23-1997', '12-24-1997']), 'F': pd.to_timedelta(['1 days', '2 days', '3 days'])}),
            pd.DataFrame({'a': [123]}),
        ]
    ),
    # Add column and using formula
    (
        [
            pd.DataFrame({'A': [1, 2, 3], 'B': [1.0, 2.0, 3.0], 'C': [True, False, True], 'D': ["string", "with spaces", "and/!other@characters"], 'E': pd.to_datetime(['12-22-1997', '12-23-1997', '12-24-1997']), 'F': pd.to_timedelta(['1 days', '2 days', '3 days'])}),
        ],
        """
import pandas as pd
df1['G'] = df1['A'] + df1['B']
""",
        [
            pd.DataFrame({'A': [1, 2, 3], 'B': [1.0, 2.0, 3.0], 'C': [True, False, True], 'D': ["string", "with spaces", "and/!other@characters"], 'E': pd.to_datetime(['12-22-1997', '12-23-1997', '12-24-1997']), 'F': pd.to_timedelta(['1 days', '2 days', '3 days']), 'G': [2.0, 4.0, 6.0]}),
        ]
    ),
    # Add column and using Mito formula
    (
        [
            pd.DataFrame({'A': [1, 2, 3], 'B': [1.0, 2.0, 3.0], 'C': [True, False, True], 'D': ["string", "with spaces", "and/!other@characters"], 'E': pd.to_datetime(['12-22-1997', '12-23-1997', '12-24-1997']), 'F': pd.to_timedelta(['1 days', '2 days', '3 days'])}),
        ],
        """
import pandas as pd
from mitosheet import *
df1['G'] = SUM(df1['A'], df1['B'])
""",
        [
            pd.DataFrame({'A': [1, 2, 3], 'B': [1.0, 2.0, 3.0], 'C': [True, False, True], 'D': ["string", "with spaces", "and/!other@characters"], 'E': pd.to_datetime(['12-22-1997', '12-23-1997', '12-24-1997']), 'F': pd.to_timedelta(['1 days', '2 days', '3 days']), 'G': [2.0, 4.0, 6.0]}),
        ]
    ),
    # Create a series, turned into dataframe
    (
        [
        ],
        """
import pandas as pd
pd.Series([1, 2, 3], index=['a', 'b', 'c'])
""",
        [
            pd.DataFrame(pd.Series([1, 2, 3], index=['a', 'b', 'c']), index=['a', 'b', 'c'])
        ]
    ),
    # Create dataframe, and have the last line as it's expression. It should get added with the right name
    (
        [
            pd.DataFrame({'A': [1, 2, 3], 'B': [1.0, 2.0, 3.0], 'C': [True, False, True], 'D': ["string", "with spaces", "and/!other@characters"], 'E': pd.to_datetime(['12-22-1997', '12-23-1997', '12-24-1997']), 'F': pd.to_timedelta(['1 days', '2 days', '3 days'])})
        ],
        """
import pandas as pd
df2 = pd.DataFrame({'a': [123]})
df2
""",
        [
            pd.DataFrame({'A': [1, 2, 3], 'B': [1.0, 2.0, 3.0], 'C': [True, False, True], 'D': ["string", "with spaces", "and/!other@characters"], 'E': pd.to_datetime(['12-22-1997', '12-23-1997', '12-24-1997']), 'F': pd.to_timedelta(['1 days', '2 days', '3 days'])}),
            pd.DataFrame({'a': [123]})
        ]
    ),
    # Rename two headers to the same thing fails
    (
        [
            pd.DataFrame({'A': [1, 2, 3], 'B': [1.0, 2.0, 3.0]})
        ],
        """
df1.rename(columns={'A': 'B', 'B': 'B'}, inplace=True)
""",
        [
            pd.DataFrame({'A': [1, 2, 3], 'B': [1.0, 2.0, 3.0]})
        ]
    ),
    # Split a date and time into two components
    (
        [
            pd.DataFrame({'Date': pd.to_datetime(['1997-07-16T19:20'])})
        ],
        """
import pandas as pd


df1[['Date', 'Time']] = df1['Date'].apply(lambda x: pd.Series([x.date(), x.time()]))
""",
        [
            pd.DataFrame({'Date': [datetime.date(1997, 7, 16)], 'Time': [datetime.time(19, 20)]})
        ]
    ),
]
@pytest.mark.parametrize("input_dfs, edited_completion, output_dfs", AI_TRANSFORMATION_TESTS)
def test_ai_transformation(input_dfs, edited_completion, output_dfs):
    mito = create_mito_wrapper(*input_dfs)

    mito.ai_transformation('fake user input', 'fake version', 'fake prompt', 'fake_completion', edited_completion)

    assert len(mito.dfs) == len(output_dfs)
    for actual, expected in zip(mito.dfs, output_dfs):
        assert actual.equals(expected) 

def test_get_modified_dataframe_recon_in_result():
    mito = create_mito_wrapper(pd.DataFrame({'A': [1, 2, 3]}))
    mito.ai_transformation('fake user input', 'fake version', 'fake prompt', 'fake_completion', "df1.drop(columns=['A'], inplace=True)")

    # Get the final execution data
    assert len(mito.mito_backend.steps_manager.steps_including_skipped[-1].execution_data['result']['modified_dataframes_recons']) > 0
