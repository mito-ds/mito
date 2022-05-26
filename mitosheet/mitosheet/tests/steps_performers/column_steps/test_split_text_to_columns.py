#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
"""
Contains tests for splitting text to columns.
"""

import pandas as pd
import pytest
from mitosheet.tests.test_utils import create_mito_wrapper_dfs


SPLIT_TEXT_TO_COLUMNS_TESTS = [
    (
        pd.DataFrame({'A': ['1,2-3\t4 5/6']}),
        'A',
        [','],
        pd.DataFrame({'A': ['1,2-3\t4 5/6'], 'split-0-of-A-1': ['1'], 'split-1-of-A-1': ['2-3\t4 5/6']})
    ),
    (
        pd.DataFrame({'A': ['1,2-3\t4 5/6']}),
        'A',
        ['-'],
        pd.DataFrame({'A': ['1,2-3\t4 5/6'], 'split-0-of-A-1': ['1,2'], 'split-1-of-A-1': ['3\t4 5/6']})
    ),
    (
        pd.DataFrame({'A': ['1,2-3\t4 5/6']}),
        'A',
        ['\t'],
        pd.DataFrame({'A': ['1,2-3\t4 5/6'], 'split-0-of-A-1': ['1,2-3'], 'split-1-of-A-1': ['4 5/6']})
    ),
    (
        pd.DataFrame({'A': ['1,2-3\t4 5/6']}),
        'A',
        [' '],
        pd.DataFrame({'A': ['1,2-3\t4 5/6'], 'split-0-of-A-1': ['1,2-3\t4'], 'split-1-of-A-1': ['5/6']})
    ),
    (
        pd.DataFrame({'A': ['1,2-3\t4 5/6']}),
        'A',
        ['/'],
        pd.DataFrame({'A': ['1,2-3\t4 5/6'], 'split-0-of-A-1': ['1,2-3\t4 5'], 'split-1-of-A-1': ['6']})
    ),
    (
        pd.DataFrame({'A': ['1,2-3\t4 5/6']}),
        'A',
        ['\t',','],
        pd.DataFrame({'A': ['1,2-3\t4 5/6'], 'split-0-of-A-1': ['1'], 'split-1-of-A-1': ['2-3'], 'split-2-of-A-1': ['4 5/6']})
    ),
    (
        pd.DataFrame({'A': ['1,2-3\t4 5/6']}),
        'A',
        [',','/'],
        pd.DataFrame({'A': ['1,2-3\t4 5/6'], 'split-0-of-A-1': ['1'], 'split-1-of-A-1': ['2-3\t4 5'], 'split-2-of-A-1': ['6']})
    ),
    (
        pd.DataFrame({'A': ['1,2-3\t4 5/6']}),
        'A',
        [',', '/', '\t', ' ', '-'],
        pd.DataFrame({'A': ['1,2-3\t4 5/6'], 'split-0-of-A-1': ['1'], 'split-1-of-A-1': ['2'], 'split-2-of-A-1': ['3'], 'split-3-of-A-1': ['4'], 'split-4-of-A-1': ['5'], 'split-5-of-A-1': ['6']})
    ),
    (
        pd.DataFrame({'A': ["12'34'56"]}),
        'A',
        ["'"],
        pd.DataFrame({'A': ["12'34'56"], 'split-0-of-A-1': ['12'], 'split-1-of-A-1': ['34'], 'split-2-of-A-1': ['56']})
    ),
    (
        pd.DataFrame({'A': ['12"34"56']}),
        'A',
        ['"'],
        pd.DataFrame({'A': ['12"34"56'], 'split-0-of-A-1': ['12'], 'split-1-of-A-1': ['34'], 'split-2-of-A-1': ['56']})
    ),
    (
        pd.DataFrame({'A': [1.23, 1.23]}),
        'A',
        ['.'],
        pd.DataFrame({'A': [1.23, 1.23], 'split-0-of-A-1': ['1', '1'], 'split-1-of-A-1': ['23', '23']})
    ),
    (
        pd.DataFrame({'A': pd.to_datetime(['1/2/22', '4/06/99'])}),
        'A',
        [' ', '-'],
        pd.DataFrame({'A': pd.to_datetime(['1/2/22', '4/06/99']), 'split-0-of-A-1': ['2022', '1999'], 'split-1-of-A-1': ['01', '04'], 'split-2-of-A-1': ['02', '06'], 'split-3-of-A-1': ['00:00:00', '00:00:00']})
    ),
    (
        pd.DataFrame({'A': pd.to_datetime(['1/2/22', None])}),
        'A',
        [' ', '-'],
        pd.DataFrame({'A': pd.to_datetime(['1/2/22', None]), 'split-0-of-A-1': ['2022', None], 'split-1-of-A-1': ['01', None], 'split-2-of-A-1': ['02', None], 'split-3-of-A-1': ['00:00:00', None]})
    ),
]


@pytest.mark.parametrize("input_df, column_header, delimiters, output_df", SPLIT_TEXT_TO_COLUMNS_TESTS)
def test_split_text_to_columns(input_df, column_header, delimiters, output_df):
    mito = create_mito_wrapper_dfs(input_df)

    mito.split_text_to_columns(0, column_header, delimiters, '1')

    assert mito.dfs[0].equals(output_df)
    

def test_step_after_split_text_to_columns():
    mito = create_mito_wrapper_dfs(pd.DataFrame({'A': ['1,2-3\t4 5/6']}),)

    mito.split_text_to_columns(
        0, 
        'A',
        [' '],
        '1'
    )

    mito.add_column(0, 'C')
    mito.set_formula('=split-0-of-A-1', 0, 'C', add_column=False)

    assert mito.dfs[0].equals(pd.DataFrame({'A': ['1,2-3\t4 5/6'], 'split-0-of-A-1': ['1,2-3\t4'], 'split-1-of-A-1': ['5/6'], 'C': ['1,2-3\t4']}))

def test_split_text_to_columns_then_edit_original_column():
    mito = create_mito_wrapper_dfs(pd.DataFrame({'A': ['1,2-3\t4 5/6']}),)

    mito.split_text_to_columns(
        0, 
        'A',
        [' '],
        '1'
    )

    mito.set_cell_value(0, 'A', 0, 'aaron')

    assert mito.dfs[0].equals(pd.DataFrame({'A': ['aaron'], 'split-0-of-A-1': ['1,2-3\t4'], 'split-1-of-A-1': ['5/6']}))


def test_split_text_to_columns_then_delete_optimizes():
    mito = create_mito_wrapper_dfs(pd.DataFrame({'A': ['1,2-3\t4 5/6']}),)

    mito.split_text_to_columns(
        0, 
        'A',
        [' '],
        '1'
    )
    mito.delete_dataframe(0)

    assert mito.transpiled_code == ['del df1']

