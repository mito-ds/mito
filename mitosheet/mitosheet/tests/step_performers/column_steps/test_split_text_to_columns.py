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
        pd.DataFrame({'A': ['1,2-3\t4 5/6'], 'A-split-0-1': ['1'], 'A-split-1-1': ['2-3\t4 5/6']})
    ),
    (
        pd.DataFrame({'A': ['1,2-3\t4 5/6']}),
        'A',
        ['-'],
        pd.DataFrame({'A': ['1,2-3\t4 5/6'], 'A-split-0-1': ['1,2'], 'A-split-1-1': ['3\t4 5/6']})
    ),
    (
        pd.DataFrame({'A': ['1,2-3\t4 5/6']}),
        'A',
        ['\t'],
        pd.DataFrame({'A': ['1,2-3\t4 5/6'], 'A-split-0-1': ['1,2-3'], 'A-split-1-1': ['4 5/6']})
    ),
    (
        pd.DataFrame({'A': ['1,2-3\t4 5/6']}),
        'A',
        [' '],
        pd.DataFrame({'A': ['1,2-3\t4 5/6'], 'A-split-0-1': ['1,2-3\t4'], 'A-split-1-1': ['5/6']})
    ),
    (
        pd.DataFrame({'A': ['1,2-3\t4 5/6']}),
        'A',
        ['.'],
        pd.DataFrame({'A': ['1,2-3\t4 5/6'], 'A-split-0-1': ['1,2-3\t4 5/6']})
    ),
    (
        pd.DataFrame({'A': ['1.2-3.4 5/6']}),
        'A',
        ['.'],
        pd.DataFrame({'A': ['1.2-3.4 5/6'], 'A-split-0-1': ['1'], 'A-split-1-1': ['2-3'], 'A-split-2-1': ['4 5/6']})
    ),
    (
        pd.DataFrame({'A': ['1,2-3\t4 5/6']}),
        'A',
        ['/'],
        pd.DataFrame({'A': ['1,2-3\t4 5/6'], 'A-split-0-1': ['1,2-3\t4 5'], 'A-split-1-1': ['6']})
    ),
    (
        pd.DataFrame({'A': ['1,2-3\t4 5/6']}),
        'A',
        ['\t',','],
        pd.DataFrame({'A': ['1,2-3\t4 5/6'], 'A-split-0-1': ['1'], 'A-split-1-1': ['2-3'], 'A-split-2-1': ['4 5/6']})
    ),
    (
        pd.DataFrame({'A': ['1,2-3\t4 5/6']}),
        'A',
        [',','/'],
        pd.DataFrame({'A': ['1,2-3\t4 5/6'], 'A-split-0-1': ['1'], 'A-split-1-1': ['2-3\t4 5'], 'A-split-2-1': ['6']})
    ),
    (
        pd.DataFrame({'A': ['1,2-3\t4 5/6']}),
        'A',
        [',', '/', '\t', ' ', '-'],
        pd.DataFrame({'A': ['1,2-3\t4 5/6'], 'A-split-0-1': ['1'], 'A-split-1-1': ['2'], 'A-split-2-1': ['3'], 'A-split-3-1': ['4'], 'A-split-4-1': ['5'], 'A-split-5-1': ['6']})
    ),
    (
        pd.DataFrame({'A': ["12'34'56"]}),
        'A',
        ["'"],
        pd.DataFrame({'A': ["12'34'56"], 'A-split-0-1': ['12'], 'A-split-1-1': ['34'], 'A-split-2-1': ['56']})
    ),
    (
        pd.DataFrame({'A': ['12"34"56']}),
        'A',
        ['"'],
        pd.DataFrame({'A': ['12"34"56'], 'A-split-0-1': ['12'], 'A-split-1-1': ['34'], 'A-split-2-1': ['56']})
    ),
    (
        pd.DataFrame({'A': [1.23, 1.23]}),
        'A',
        ['.'],
        pd.DataFrame({'A': [1.23, 1.23], 'A-split-0-1': ['1', '1'], 'A-split-1-1': ['23', '23']})
    ),
    (
        pd.DataFrame({'A': pd.to_datetime(['1/2/22', '4/06/99'], format='%m/%d/%y')}),
        'A',
        [' ', '-'],
        pd.DataFrame({'A': pd.to_datetime(['1/2/22', '4/06/99'], format='%m/%d/%y'), 'A-split-0-1': ['2022', '1999'], 'A-split-1-1': ['01', '04'], 'A-split-2-1': ['02', '06'], 'A-split-3-1': ['00:00:00', '00:00:00']})
    ),
    (
        # Create a timedelta by subtracting two dates
        pd.DataFrame({'A': [pd.to_datetime('3/07/21') - pd.to_datetime('1/12/22')]}),
        'A',
        [' '],
        pd.DataFrame({'A': [pd.to_datetime('3/07/21') - pd.to_datetime('1/12/22')], 'A-split-0-1': ['-311'], 'A-split-1-1': ['days'], 'A-split-2-1': ['+00:00:00']})
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
    mito.set_formula('=A-split-0-1', 0, 'C', add_column=False)

    assert mito.dfs[0].equals(pd.DataFrame({'A': ['1,2-3\t4 5/6'], 'A-split-0-1': ['1,2-3\t4'], 'A-split-1-1': ['5/6'], 'C': ['1,2-3\t4']}))

def test_split_text_to_columns_then_edit_original_column():
    mito = create_mito_wrapper_dfs(pd.DataFrame({'A': ['1,2-3\t4 5/6']}),)

    mito.split_text_to_columns(
        0, 
        'A',
        [' '],
        '1'
    )

    mito.set_cell_value(0, 'A', 0, 'aaron')

    assert mito.dfs[0].equals(pd.DataFrame({'A': ['aaron'], 'A-split-0-1': ['1,2-3\t4'], 'A-split-1-1': ['5/6']}))


def test_split_text_to_columns_then_delete_optimizes():
    mito = create_mito_wrapper_dfs(pd.DataFrame({'A': ['1,2-3\t4 5/6']}),)

    mito.split_text_to_columns(
        0, 
        'A',
        [' '],
        '1'
    )
    mito.delete_dataframe(0)

    assert mito.transpiled_code == []

