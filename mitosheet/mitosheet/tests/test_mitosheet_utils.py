#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Mito.
# Distributed under the terms of the Modified BSD License.

import pandas as pd
import pytest
import json

from mitosheet.tests.test_utils import create_mito_wrapper
from mitosheet.sheet_functions.types.utils import NUMBER_SERIES, STRING_SERIES, get_mito_type


COLUMN_FILTER_TYPE_TESTS = [
    ('int_column', NUMBER_SERIES),
    ('float_column', NUMBER_SERIES),
    ('mixed_float_and_int_column', NUMBER_SERIES),
    ('string_column', STRING_SERIES),
    ('mixed_string_and_int_column', STRING_SERIES),
]

@pytest.mark.parametrize('column_header, filter_type', COLUMN_FILTER_TYPE_TESTS)
def test_get_mito_type(column_header, filter_type):
    df = pd.DataFrame(data={
        'int_column': [1, 2, 3, 4, 5, 6],
        'float_column': [1.1, 2.2, 3.0, 4.5, 5.7, 6.9],
        'mixed_float_and_int_column': [1.1, 2, 3, 4, 5.7, 6.9],
        'string_column': ["1", "2", "3", "4", "5", "6"],
        'mixed_string_and_int_column': [1, 2, "3", 4, "5", "6"]
    })

    assert filter_type == get_mito_type(df[column_header])


def test_get_mito_type_after_formula():
    mito = create_mito_wrapper(['123'])
    mito.set_formula('=A', 0, 'B', add_column=True)
    assert STRING_SERIES == get_mito_type(mito.get_column(0, 'B', False))
    mito.set_formula('=100', 0, 'C', add_column=True)
    assert NUMBER_SERIES == get_mito_type(mito.get_column(0, 'C', False))