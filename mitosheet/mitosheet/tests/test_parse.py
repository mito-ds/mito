#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
from distutils.version import LooseVersion
from typing import Any, Dict, List
import warnings
import pytest
import pandas as pd

from mitosheet.errors import MitoError
from mitosheet.parser import get_backend_formula_from_frontend_formula, parse_formula, safe_contains, get_frontend_formula
from mitosheet.types import FORMULA_ENTIRE_COLUMN_TYPE
from mitosheet.tests.decorators import pandas_post_1_2_only


def get_number_data_for_df(columns: List[Any], length: int) -> Dict[Any, Any]:
    return {ch: [i for i in range(length)] for ch in columns}


def get_string_data_for_df(columns: List[Any], length: int) -> Dict[Any, Any]:
    return {ch: [str(i) for i in range(length)] for ch in columns}

CONSTANT_TEST_CASES: Any = [
    (
        '=100',
        'B',
        0,
        pd.DataFrame(get_string_data_for_df(['B'], 2)),
        'df[\'B\'] = 100',
        set([]),
        set([])
    ),
    (
        '    =100',
        'B',
        0,
        pd.DataFrame(get_string_data_for_df(['B'], 2)),
        'df[\'B\'] = 100',
        set([]),
        set([])
    ),
    (
        '\t\n=100',
        'B',
        0,
        pd.DataFrame(get_string_data_for_df(['B'], 2)),
        'df[\'B\'] = 100',
        set([]),
        set([])
    ),
    (
        '=100\n+100',
        'B',
        0,
        pd.DataFrame(get_string_data_for_df(['B'], 2)),
        'df[\'B\'] = 100+100',
        set([]),
        set([])
    ),
    (
        '=100\t+100',
        'B',
        0,
        pd.DataFrame(get_string_data_for_df(['B'], 2)),
        'df[\'B\'] = 100+100',
        set([]),
        set([])
    ),
    (
        '=True',
        'B',
        0,
        pd.DataFrame(get_string_data_for_df(['B'], 2)),
        'df[\'B\'] = True',
        set([]),
        set([])
    ),
    (
        '=TRUE',
        'B',
        0,
        pd.DataFrame(get_string_data_for_df(['B'], 2)),
        'df[\'B\'] = True',
        set([]),
        set([])
    ),
    (
        '=true',
        'B',
        0,
        pd.DataFrame(get_string_data_for_df(['B'], 2)),
        'df[\'B\'] = True',
        set([]),
        set([])
    ),
    (
        '=true0',
        'true',
        0,
        pd.DataFrame(get_string_data_for_df(['true'], 2)),
        'df[\'true\'] = df[\'true\']',
        set([]),
        {'true'}
    ),
    (
        '=TRUE0',
        'TRUE',
        0,
        pd.DataFrame(get_string_data_for_df(['TRUE'], 2)),
        'df[\'TRUE\'] = df[\'TRUE\']',
        set([]),
        {'TRUE'}
    ),
    (
        '=\'StringSingleQuotes\'',
        'B',
        0,
        pd.DataFrame(get_string_data_for_df(['B'], 2)),
        'df[\'B\'] = \'StringSingleQuotes\'',
        set([]),
        set([])
    ),
    (
        '=\"StringDoubleQuotes\"',
        'B',
        0,
        pd.DataFrame(get_string_data_for_df(['B'], 2)),
        'df[\'B\'] = \"StringDoubleQuotes\"',
        set([]),
        set([])
    ), 
    (
        '=\"String Double Quotes\"',
        'B',
        0,
        pd.DataFrame(get_string_data_for_df(['B'], 2)),
        'df[\'B\'] = \"String Double Quotes\"',
        set([]),
        set([])
    ), 
    (
        '=FUNC(\"String Double Quotes\")',
        'B',
        0,
        pd.DataFrame(get_string_data_for_df(['B'], 2)),
        'df[\'B\'] = FUNC(\"String Double Quotes\")',
        set(['FUNC']),
        set([])
    ),
    (
        '=FUNC(\"DIFF_FUNC(A)\")',
        'B',
        0,
        pd.DataFrame(get_string_data_for_df(['B'], 2)),
        'df[\'B\'] = FUNC(\"DIFF_FUNC(A)\")',
        set(['FUNC']),
        set([])
    ),
    (
        '=\"String One FUNC(A)\" + \"STRING TWO FUNC(A)\"',
        'B',
        0,
        pd.DataFrame(get_string_data_for_df(['B'], 2)),
        'df[\'B\'] = \"String One FUNC(A)\" + \"STRING TWO FUNC(A)\"',
        set([]),
        set([])
    ),
    (
        '=\'String One FUNC(A)\' + \'STRING TWO FUNC(A)\'',
        'B',
        0,
        pd.DataFrame(get_string_data_for_df(['B'], 2)),
        'df[\'B\'] = \'String One FUNC(A)\' + \'STRING TWO FUNC(A)\'',
        set([]),
        set([])
    ),
    (
        '=FUNC1(\'String One FUNC(A)\') + FUNC2(\'STRING TWO FUNC(A)\')',
        'B',
        0,
        pd.DataFrame(get_string_data_for_df(['B'], 2)),
        'df[\'B\'] = FUNC1(\'String One FUNC(A)\') + FUNC2(\'STRING TWO FUNC(A)\')',
        set(['FUNC1', 'FUNC2']),
        set([])
    ),
    (
        '=A\nA + 100',
        'B',
        0,
        pd.DataFrame(get_string_data_for_df(['B', 'A\nA'], 2)),
        'df[\'B\'] = df[\'A\\nA\'] + 100',
        set([]),
        set(['A\nA'])
    ),
    (
        '=A\tA + 100',
        'B',
        0,
        pd.DataFrame(get_string_data_for_df(['B', 'A\tA'], 2)),
        'df[\'B\'] = df[\'A\\tA\'] + 100',
        set([]),
        set(['A\tA'])
    ),
    (
        '=CONCAT(A, "=123")',
        'B',
        0,
        pd.DataFrame(get_string_data_for_df(['B', 'A'], 2)),
        'df[\'B\'] = CONCAT(df[\'A\'], "=123")',
        set(['CONCAT']),
        set(['A'])
    ),
    (
        '=" = "',
        'B',
        0,
        pd.DataFrame(get_string_data_for_df(['B'], 2)),
        'df[\'B\'] = " = "',
        set([]),
        set([])
    ),
    (
        '="="',
        'B',
        0,
        pd.DataFrame(get_string_data_for_df(['B'], 2)),
        'df[\'B\'] = "="',
        set([]),
        set([])
    ),
    (
        '="=="',
        'B',
        0,
        pd.DataFrame(get_string_data_for_df(['B'], 2)),
        'df[\'B\'] = "=="',
        set([]),
        set([])
    ),
    (
        "'=='",
        'B',
        0,
        pd.DataFrame(get_string_data_for_df(['B'], 2)),
        "df[\'B\'] = '=='",
        set([]),
        set([])
    ),
]

# Tests cases to ensure operators are parsed correctly
OPERATOR_TEST_CASES = [
    # Simple add operation
    (
        '=A + B',
        'C',
        0,
        pd.DataFrame(get_number_data_for_df(['A', 'B', 'C'], 2)),
        'df[\'C\'] = df[\'A\'] + df[\'B\']',
        set(),
        set(['A', 'B'])
    ),
    # Simple subtract operation
    (
        '=A - B',
        'C',
        0,
        pd.DataFrame(get_number_data_for_df(['A', 'B', 'C'], 2)),
        'df[\'C\'] = df[\'A\'] - df[\'B\']',
        set(),
        set(['A', 'B'])
    ),
    # Simple multiply operation
    (
        '=A * B',
        'C',
        0,
        pd.DataFrame(get_number_data_for_df(['A', 'B', 'C'], 2)),
        'df[\'C\'] = df[\'A\'] * df[\'B\']',
        set(),
        set(['A', 'B'])
    ),
    # Simple divide operation
    (
        '=A / B',
        'C',
        0,
        pd.DataFrame(get_number_data_for_df(['A', 'B', 'C'], 2)),
        'df[\'C\'] = df[\'A\'] / df[\'B\']',
        set(),
        set(['A', 'B'])
    ),
    # Handles multi-char columns
    (
        '=AAA + BBB + CCC + DDD',
        'E',
        0,
        pd.DataFrame(get_number_data_for_df(['AAA', 'BBB', 'CCC', 'DDD'], 2)),
        'df[\'E\'] = df[\'AAA\'] + df[\'BBB\'] + df[\'CCC\'] + df[\'DDD\']',
        set(),
        set(['AAA', 'BBB', 'CCC', 'DDD'])
    ),
    # Maintains parens and constants
    (
        '=(A + B) / C + A * 100',
        'D',
        0,
        pd.DataFrame(get_number_data_for_df(['A', 'B', 'C'], 2)),
        'df[\'D\'] = (df[\'A\'] + df[\'B\']) / df[\'C\'] + df[\'A\'] * 100',
        set(),
        set(['A', 'B', 'C'])
    ),
    # Operator in functions
    (
        '=FUNC(A + B / C + A * 100)',
        'D',
        0,
        pd.DataFrame(get_number_data_for_df(['A', 'B', 'C'], 2)),
        'df[\'D\'] = FUNC(df[\'A\'] + df[\'B\'] / df[\'C\'] + df[\'A\'] * 100)',
        set(['FUNC']),
        set(['A', 'B', 'C'])
    ),
    # Equality Operator
    (
        '=A == B',
        'C',
        0,
        pd.DataFrame(get_number_data_for_df(['A', 'B', 'C'], 2)),
        'df[\'C\'] = df[\'A\'] == df[\'B\']',
        set(),
        set(['A', 'B'])
    ),
    # Equality Operator with Equals Sign in Column Header
    (
        '=A=123 == B',
        'C',
        0,
        pd.DataFrame(get_number_data_for_df(['A=123', 'B', 'C'], 2)),
        'df[\'C\'] = df[\'A=123\'] == df[\'B\']',
        set(),
        set(['A=123', 'B'])
    ),
    # If equals sign is in a column header, then we 
    # don't check for single equals sings because its too hard and rare
    (
        '=A=123 = B',
        'C',
        0,
        pd.DataFrame(get_number_data_for_df(['A=123', 'B', 'C'], 2)),
        'df[\'C\'] = df[\'A=123\'] = df[\'B\']',
        set(),
        set(['A=123', 'B'])
    ),
]

# Tests proper function parsing
FUNCTION_TEST_CASES = [
    # Simple, singular function call
    (
        '=FUNC(A)',
        'B',
        0,
        pd.DataFrame(get_number_data_for_df(['A', 'B', 'C'], 2)),
        'df[\'B\'] = FUNC(df[\'A\'])',
        set(['FUNC']),
        set(['A'])
    ),
    # Simple, singular function call that has the name of a column
    (
        '=C(A)',
        'B',
        0,
        pd.DataFrame(get_number_data_for_df(['A', 'B', 'C'], 2)),
        'df[\'B\'] = C(df[\'A\'])',
        set(['C']),
        set(['A'])
    ),
    # Nested functions with different names
    (
        '=FUNCA(FUNCB(FUNCC(FUNCD(FUNCE(FUNCF(FUNCG(FUNCH(A))))))))',
        'B',
        0,
        pd.DataFrame(get_number_data_for_df(['A', 'B', 'C'], 2)),
        'df[\'B\'] = FUNCA(FUNCB(FUNCC(FUNCD(FUNCE(FUNCF(FUNCG(FUNCH(df[\'A\']))))))))',
        set(['FUNCA', 'FUNCB', 'FUNCC', 'FUNCD', 'FUNCE', 'FUNCF', 'FUNCG', 'FUNCH']),
        set(['A'])
    ),
    # Nested functions with basic operators
    (
        '=RIGHT(A, LEN(B) - 10)',
        'C',
        0,
        pd.DataFrame(get_number_data_for_df(['A', 'B', 'C'], 2)),
        'df[\'C\'] = RIGHT(df[\'A\'], LEN(df[\'B\']) - 10)',
        set(['RIGHT', 'LEN']),
        set(['A', 'B'])
    ),
    # More nested functions with columns
    (
        '=FUNC(A, FUNC(B, FUNC(C)))',
        'D',
        0,
        pd.DataFrame(get_number_data_for_df(['A', 'B', 'C'], 2)),
        'df[\'D\'] = FUNC(df[\'A\'], FUNC(df[\'B\'], FUNC(df[\'C\'])))',
        set(['FUNC']),
        set(['A', 'B', 'C'])
    ),
    # Lots of column references
    (
        '=FUNC(A, B, C, D, E, F, G, H, I)',
        'J',
        0,
        pd.DataFrame(get_number_data_for_df(['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'], 2)),
        'df[\'J\'] = FUNC(df[\'A\'], df[\'B\'], df[\'C\'], df[\'D\'], df[\'E\'], df[\'F\'], df[\'G\'], df[\'H\'], df[\'I\'])',
        set(['FUNC']),
        set(['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'])
    ),
    # Lots of column references to columns with numbers
    (
        '=FUNC(column1, column2)',
        'J',
        0,
        pd.DataFrame(get_number_data_for_df(['column1', 'column2', 'J'], 2)),
        'df[\'J\'] = FUNC(df[\'column1\'], df[\'column2\'])',
        set(['FUNC']),
        set(['column1', 'column2'])
    ),
    # Test references to columns with spaces
    (
        '=FUNC(column 1, column 2)',
        'J',
        0,
        pd.DataFrame(get_number_data_for_df(['column 1', 'column 2', 'J'], 2)),
        'df[\'J\'] = FUNC(df[\'column 1\'], df[\'column 2\'])',
        set(['FUNC']),
        set(['column 1', 'column 2'])
    ),
    # Test references to columns that are numbers
    (
        '=FUNC(123, 456)',
        'J',
        0,
        pd.DataFrame(get_number_data_for_df([123, 456, 'J'], 2)),
        'df[\'J\'] = FUNC(df[123], df[456])',
        set(['FUNC']),
        set([123, 456])
    ),
    # Test references to columns that are numbers and are also strings
    (
        '=FUNC(123, 456, abc)',
        'J',
        0,
        pd.DataFrame(get_number_data_for_df(['abc', 456, 123, "J"], 2)),
        'df[\'J\'] = FUNC(df[123], df[456], df[\'abc\'])',
        set(['FUNC']),
        set([123, 456, 'abc'])
    ),
    # Test references to strings that has a single quotes in it
    (
        '=FUNC(this is a string \' that has a quote, 456, abc)',
        'J',
        0,
        pd.DataFrame(get_number_data_for_df(['abc', 456, 'this is a string \' that has a quote', "J"], 2)),
        'df[\'J\'] = FUNC(df["this is a string \' that has a quote"], df[456], df[\'abc\'])',
        set(['FUNC']),
        set(['abc', 456, 'this is a string \' that has a quote'])
    ),
    # Test references to strings that have mulitple quotes
    (
        '=FUNC(this is a string \'test\' that has a quote, 456, abc)',
        'J',
        0,
        pd.DataFrame(get_number_data_for_df(['abc', 456, 'this is a string \'test\' that has a quote', "J"], 2)),
        'df[\'J\'] = FUNC(df["this is a string \'test\' that has a quote"], df[456], df[\'abc\'])',
        set(['FUNC']),
        set(['abc', 456, 'this is a string \'test\' that has a quote'])
    ),
    # Test references to a string in quotes, but is a column header
    (
        '=FUNC("column")',
        'J',
        0,
        pd.DataFrame(get_number_data_for_df(["\"column\"", "J"], 2)),
        'df[\'J\'] = FUNC(df[\'"column"\'])',
        set(['FUNC']),
        set(["\"column\""])
    ),
    # Test references to a quote that is covered by a column header
    (
        '=FUNC("this is a string")',
        'J',
        0,
        pd.DataFrame(get_number_data_for_df(["string", "J"], 2)),
        'df[\'J\'] = FUNC("this is a string")',
        set(['FUNC']),
        set([])
    ),
    # Test references a boolean column
    (
        '=true + false',
        'A',
        0,
        pd.DataFrame(get_number_data_for_df([True, False], 2)),
        'df[\'A\'] = df[True] + df[False]',
        set([]),
        set([True, False])
    ),
    # Test references a multi-index header
    (
        '=Height, min',
        'Name',
        0,
        pd.DataFrame(get_number_data_for_df([('Name', ''), ('Height', 'min')], 2)),
        'df[\'Name\'] = df[(\'Height\', \'min\')]',
        set([]),
        set([('Height', 'min')])
    ),
    # Test references a multi-index header in a function
    (
        '=FUNC(Height, min)',
        'Name',
        0,
        pd.DataFrame(get_number_data_for_df([('Name', ''), ('Height', 'min')], 2)),
        'df[\'Name\'] = FUNC(df[(\'Height\', \'min\')])',
        set(['FUNC']),
        set([('Height', 'min')])
    ),
    # Test references a multi-index header with an empty second item
    (
        '=FUNC(Name)',
        'Name',
        0,
        pd.DataFrame(get_number_data_for_df([('Name', ''), ('Height', 'min')], 2)),
        'df[\'Name\'] = FUNC(df[(\'Name\', \'\')])',
        set(['FUNC']),
        set([('Name', '')])
    ),
    # Test references a header with characters that make an invalid regex
    (
        '=FUNC(C++)',
        'A',
        0,
        pd.DataFrame(get_number_data_for_df(['A', 'C++'], 2)),
        'df[\'A\'] = FUNC(df[\'C++\'])',
        set(['FUNC']),
        set(['C++'])
    ),
]

# To supress warnings, we create these variables here
with warnings.catch_warnings():
    # Check that the pandas verison is < 2.0
    if LooseVersion(pd.__version__) < LooseVersion('2.0'):
        warnings.simplefilter('ignore')
        unit64_index = pd.UInt64Index(range(10))
        float64_index = pd.Float64Index(range(10))
    else:
        unit64_index = pd.Index(range(10), dtype='uint64')
        float64_index = pd.Index(range(10), dtype='float64')


INDEX_TEST_CASES = [
    # Test references a range index with a valid number 0
    (
        'A0',
        'A',
        0,
        pd.DataFrame(get_number_data_for_df(['A', 'B'], 2), index=pd.RangeIndex(0, 2)),
        'df[\'A\'] = df[\'A\']',
        set([]),
        set(['A'])
    ),
    # Test references a range index with a valid number 0, with two
    (
        'A0 + A0',
        'A',
        0,
        pd.DataFrame(get_number_data_for_df(['A', 'B'], 2), index=pd.RangeIndex(0, 2)),
        'df[\'A\'] = df[\'A\'] + df[\'A\']',
        set([]),
        set(['A'])
    ),
    # Test references a range index with a valid number 0, function
    (
        '=FUNC(A0)',
        'A',
        0,
        pd.DataFrame(get_number_data_for_df(['A', 'B'], 2), index=pd.RangeIndex(0, 2)),
        'df[\'A\'] = FUNC(df[\'A\'])',
        set(['FUNC']),
        set(['A'])
    ),
    # Test references a range index with a valid number non 0
    (
        '=FUNC(A0, A1)',
        'A',
        0,
        pd.DataFrame(get_number_data_for_df(['A', 'B'], 2), index=pd.RangeIndex(0, 2)),
        'df[\'A\'] = FUNC(df[\'A\'], df[\'A\'].shift(-1, fill_value=0))',
        set(['FUNC']),
        set(['A'])
    ),
    # Test references a range index with a valid number non 0, positive shift
    (
        '=FUNC(A0, A1)',
        'A',
        1,
        pd.DataFrame(get_number_data_for_df(['A', 'B'], 2), index=pd.RangeIndex(0, 2)),
        'df[\'A\'] = FUNC(df[\'A\'].shift(1, fill_value=0), df[\'A\'])',
        set(['FUNC']),
        set(['A'])
    ),
    # Test references a range index with a number that is NOT part of the index
    (
        '=FUNC(A0, A2)',
        'A',
        0,
        pd.DataFrame(get_number_data_for_df(['A', 'B'], 2), index=pd.RangeIndex(0, 2)),
        'df[\'A\'] = FUNC(df[\'A\'], A2)',
        set(['FUNC']),
        set(['A'])
    ),
    # Test references a range index that does not start at 0 for proper offset
    (
        '=FUNC(A10, A11)',
        'A',
        10,
        pd.DataFrame(get_number_data_for_df(['A', 'B'], 2), index=pd.RangeIndex(10, 12)),
        'df[\'A\'] = FUNC(df[\'A\'], df[\'A\'].shift(-1, fill_value=0))',
        set(['FUNC']),
        set(['A'])
    ),
    # Test references a range index that does not start at 0 for proper offset, positive shift
    (
        '=FUNC(A10, A11)',
        'A',
        11,
        pd.DataFrame(get_number_data_for_df(['A', 'B'], 2), index=pd.RangeIndex(10, 12)),
        'df[\'A\'] = FUNC(df[\'A\'].shift(1, fill_value=0), df[\'A\'])',
        set(['FUNC']),
        set(['A'])
    ),
    # Test references a different number index
    (
        '=FUNC(A0, A2)',
        'A',
        0,
        pd.DataFrame(get_number_data_for_df(['A', 'B'], 10), index=unit64_index),
        'df[\'A\'] = FUNC(df[\'A\'], df[\'A\'].shift(-2, fill_value=0))',
        set(['FUNC']),
        set(['A'])
    ),
    # Test references an index with a number dtype
    (
        '=FUNC(A0.0, A2.2)',
        'A',
        0.0,
        pd.DataFrame(get_number_data_for_df(['A', 'B'], 3), index=pd.Index([0.0, 1.1, 2.2], dtype='float64')),
        'df[\'A\'] = FUNC(df[\'A\'], df[\'A\'].shift(-2, fill_value=0))',
        set(['FUNC']),
        set(['A'])
    ),
    # Test references an index with a number dtype, positive shift
    (
        '=FUNC(A0.0, A2.2)',
        'A',
        2.2,
        pd.DataFrame(get_number_data_for_df(['A', 'B'], 3), index=pd.Index([0.0, 1.1, 2.2], dtype='float64')),
        'df[\'A\'] = FUNC(df[\'A\'].shift(2, fill_value=0), df[\'A\'])',
        set(['FUNC']),
        set(['A'])
    ),
    # Test references a range index not starting from 0
    (
        '=FUNC(A1)',
        'A',
        1,
        pd.DataFrame(get_number_data_for_df(['A', 'B'], 1), index=pd.RangeIndex(1, 2)),
        'df[\'A\'] = FUNC(df[\'A\'])',
        set(['FUNC']),
        set(['A'])
    ),
    # Test references a range index not starting from below 0
    (
        '=FUNC(A-2)',
        'A',
        -2,
        pd.DataFrame(get_number_data_for_df(['A', 'B'], 4), index=pd.RangeIndex(-2, 2)),
        'df[\'A\'] = FUNC(df[\'A\'])',
        set(['FUNC']),
        set(['A'])
    ),
    # Test references a range index not starting from below 0, positive shift
    (
        '=FUNC(A1, A-2)',
        'A',
        1,
        pd.DataFrame(get_number_data_for_df(['A', 'B'], 4), index=pd.RangeIndex(-2, 2)),
        'df[\'A\'] = FUNC(df[\'A\'], df[\'A\'].shift(3, fill_value=0))',
        set(['FUNC']),
        set(['A'])
    ),
    # Test references a range index starting with a decimal
    (
        '=FUNC(A0.1, A0.2)',
        'A',
        .1,
        pd.DataFrame(get_number_data_for_df(['A', 'B'], 3), index=pd.Index([.1, .2, .3])),
        'df[\'A\'] = FUNC(df[\'A\'], df[\'A\'].shift(-1, fill_value=0))',
        set(['FUNC']),
        set(['A'])
    ),
    # Test a datetime reference no offset
    (
        '=FUNC(A2007-01-22 00:00:00)',
        'A',
        pd.to_datetime('2007-01-22 00:00:00'),
        pd.DataFrame(get_number_data_for_df(['A', 'B'], 1), index=pd.DatetimeIndex([pd.to_datetime('2007-01-22 00:00:00')])),
        'df[\'A\'] = FUNC(df[\'A\'])',
        set(['FUNC']),
        set(['A'])
    ),
    # Test a datetime reference with offset of 1 day
    (
        '=FUNC(A2007-01-23 00:00:00)',
        'A',
        pd.to_datetime('2007-01-22 00:00:00'),
        pd.DataFrame(get_number_data_for_df(['A', 'B'], 2), index=pd.DatetimeIndex([pd.to_datetime('2007-01-22 00:00:00'), pd.to_datetime('2007-01-23 00:00:00')])),
        'df[\'A\'] = FUNC(df[\'A\'].shift(-1, fill_value=0))',
        set(['FUNC']),
        set(['A'])
    ),
    # Test a datetime reference with offset of 1 day, positive shift
    (
        '=FUNC(A2007-01-22 00:00:00)',
        'A',
        pd.to_datetime('2007-01-23 00:00:00'),
        pd.DataFrame(get_number_data_for_df(['A', 'B'], 2), index=pd.DatetimeIndex([pd.to_datetime('2007-01-22 00:00:00'), pd.to_datetime('2007-01-23 00:00:00')])),
        'df[\'A\'] = FUNC(df[\'A\'].shift(1, fill_value=0))',
        set(['FUNC']),
        set(['A'])
    ),
    # Test a datetime reference with offset of 1 month, should still only have offset of 1
    (
        '=FUNC(A2007-02-22 00:00:00)',
        'A',
        pd.to_datetime('2007-01-22 00:00:00'),
        pd.DataFrame(get_number_data_for_df(['A', 'B'], 2), index=pd.DatetimeIndex([pd.to_datetime('2007-01-22 00:00:00'), pd.to_datetime('2007-02-22 00:00:00')])),
        'df[\'A\'] = FUNC(df[\'A\'].shift(-1, fill_value=0))',
        set(['FUNC']),
        set(['A'])
    ),
    # Test a datetime reference with no offset, and some offset
    (
        '=FUNC(A2007-02-22 00:00:00, A2007-01-22 00:00:00)',
        'A',
        pd.to_datetime('2007-01-22 00:00:00'),
        pd.DataFrame(get_number_data_for_df(['A', 'B'], 2), index=pd.DatetimeIndex([pd.to_datetime('2007-01-22 00:00:00'), pd.to_datetime('2007-02-22 00:00:00')])),
        'df[\'A\'] = FUNC(df[\'A\'].shift(-1, fill_value=0), df[\'A\'])',
        set(['FUNC']),
        set(['A'])
    ),
    # Test a string index with no offset
    (
        '=FUNC(Aa)',
        'A',
        'a',
        pd.DataFrame(get_number_data_for_df(['A', 'B'], 1), index=pd.Index(['a'])),
        'df[\'A\'] = FUNC(df[\'A\'])',
        set(['FUNC']),
        set(['A'])
    ),
    # Test a string index with at the end of the formula
    (
        '=Aa',
        'A',
        'a',
        pd.DataFrame(get_number_data_for_df(['A', 'B'], 1), index=pd.Index(['a'])),
        'df[\'A\'] = df[\'A\']',
        set([]),
        set(['A'])
    ),
    # Test a string index with 1 offset
    (
        '=FUNC(Ab)',
        'A',
        'a',
        pd.DataFrame(get_number_data_for_df(['A', 'B'], 2), index=pd.Index(['a', 'b'])),
        'df[\'A\'] = FUNC(df[\'A\'].shift(-1, fill_value=0))',
        set(['FUNC']),
        set(['A'])
    ),
    # Test a string index with with 1 offset, positive
    (
        '=FUNC(Aa)',
        'A',
        'b',
        pd.DataFrame(get_number_data_for_df(['A', 'B'], 2), index=pd.Index(['a', 'b'])),
        'df[\'A\'] = FUNC(df[\'A\'].shift(1, fill_value=0))',
        set(['FUNC']),
        set(['A'])
    ),
    # Test a string index with spaces
    (
        '=FUNC(Athis has spaces)',
        'A',
        'this has spaces',
        pd.DataFrame(get_number_data_for_df(['A', 'aaa'], 2), index=pd.Index(['this has spaces', 'this also has spaces'])),
        'df[\'A\'] = FUNC(df[\'A\'])',
        set(['FUNC']),
        set(['A'])
    ),
    # Test a string index that contains a column header, no shift
    (
        '=FUNC(AthisA)',
        'A',
        'thisA',
        pd.DataFrame(get_number_data_for_df(['A', 'aaa'], 2), index=pd.Index(['thisA', 'also this'])),
        'df[\'A\'] = FUNC(df[\'A\'])',
        set(['FUNC']),
        set(['A'])
    ),
    # Test a string index that contains a column header, shift
    (
        '=FUNC(AthisA)',
        'A',
        'also this',
        pd.DataFrame(get_number_data_for_df(['A', 'aaa'], 2), index=pd.Index(['also this', 'thisA'])),
        'df[\'A\'] = FUNC(df[\'A\'].shift(-1, fill_value=0))',
        set(['FUNC']),
        set(['A'])
    ),
    # Test a string index that has prefixes
    (
        '=FUNC(Aaa)',
        'A',
        'b',
        pd.DataFrame(get_number_data_for_df(['A', 'aaa'], 3), index=pd.Index(['b', 'a', 'aa'])),
        'df[\'A\'] = FUNC(df[\'A\'].shift(-2, fill_value=0))',
        set(['FUNC']),
        set(['A'])
    ),
    # Test a string index that has prefixes with spaces
    (
        '=FUNC(Aa aa)',
        'A',
        'b',
        pd.DataFrame(get_number_data_for_df(['A', 'aaa'], 3), index=pd.Index(['b', 'a ', 'a aa'])),
        'df[\'A\'] = FUNC(df[\'A\'].shift(-2, fill_value=0))',
        set(['FUNC']),
        set(['A'])
    ),
    # Test a datetime column has no fill value
    (
        '=FUNC(A2007-01-23 00:00:00)',
        'A',
        pd.to_datetime('2007-01-22 00:00:00'),
        pd.DataFrame({'A': [pd.to_datetime('2007-01-22 00:00:00'), pd.to_datetime('2007-01-23 00:00:00')]}, index=pd.DatetimeIndex([pd.to_datetime('2007-01-22 00:00:00'), pd.to_datetime('2007-01-23 00:00:00')])),
        'df[\'A\'] = FUNC(df[\'A\'].shift(-1))',
        set(['FUNC']),
        set(['A'])
    ),
    # Test a boolean column has no fill value
    (
        '=FUNC(A2007-01-23 00:00:00)',
        'A',
        pd.to_datetime('2007-01-22 00:00:00'),
        pd.DataFrame({'A': [True]}, index=pd.DatetimeIndex([pd.to_datetime('2007-01-22 00:00:00'), pd.to_datetime('2007-01-23 00:00:00')])),
        'df[\'A\'] = FUNC(df[\'A\'].shift(-1))',
        set(['FUNC']),
        set(['A'])
    ),
]

INDEX_TEST_CASES_THAT_DONT_RECONSTRUCT_EXACTLY = [
    # Test references a column header and a range specifically
    (
        '=FUNC(A, A1)',
        'A',
        0,
        pd.DataFrame(get_number_data_for_df(['A', 'B'], 2), index=pd.RangeIndex(0, 2)),
        'df[\'A\'] = FUNC(df[\'A\'], df[\'A\'].shift(-1, fill_value=0))',
        set(['FUNC']),
        set(['A'])
    ),
    # Test references a different number index
    (
        '=FUNC(A0.0, A2.0, A7)',
        'A',
        0,
        pd.DataFrame(get_number_data_for_df(['A', 'B'], 10), index=float64_index),
        'df[\'A\'] = FUNC(df[\'A\'], df[\'A\'].shift(-2, fill_value=0), df[\'A\'].shift(-7, fill_value=0))',
        set(['FUNC']),
        set(['A'])
    ),
    # Test references an index with a int dtype
    (
        '=FUNC(A0.0, A2.0)',
        'A',
        0,
        pd.DataFrame(get_number_data_for_df(['A', 'B'], 3), index=pd.Index([0, 1, 2], dtype='int64')),
        'df[\'A\'] = FUNC(df[\'A\'], df[\'A\'].shift(-2, fill_value=0))',
        set(['FUNC']),
        set(['A'])
    ),
    # Test references to a column header that contains the index, and one that is unqualified
    (
        '=FUNC(HEADER00, HEADER0HEADER1)',
        'A',
        0,
        pd.DataFrame(get_number_data_for_df(['HEADER0', 'HEADER0HEADER1'], 2), index=pd.RangeIndex(0, 2)),
        'df[\'A\'] = FUNC(df[\'HEADER0\'], df[\'HEADER0HEADER1\'])',
        set(['FUNC']),
        set(['HEADER0', 'HEADER0HEADER1'])
    ),
    # Test a string index with column header containing the index
    (
        '=FUNC(aaa)',
        'A',
        'a',
        pd.DataFrame(get_number_data_for_df(['A', 'aaa'], 2), index=pd.Index(['a', 'b'])),
        'df[\'A\'] = FUNC(df[\'aaa\'])',
        set(['FUNC']),
        set(['aaa'])
    ),
    # Test a string index with column header containing the index, no shift
    (
        '=FUNC(aaaa)',
        'A',
        'a',
        pd.DataFrame(get_number_data_for_df(['A', 'aaa'], 2), index=pd.Index(['a', 'b'])),
        'df[\'A\'] = FUNC(df[\'aaa\'])',
        set(['FUNC']),
        set(['aaa'])
    ),
    # Test a string index with column header containing the index, no shift
    (
        '=FUNC(aaab)',
        'A',
        'a',
        pd.DataFrame(get_number_data_for_df(['A', 'aaa'], 2), index=pd.Index(['a', 'b'])),
        'df[\'A\'] = FUNC(df[\'aaa\'].shift(-1, fill_value=0))',
        set(['FUNC']),
        set(['aaa'])
    ),
    # Test a string index with column headers AND indexes that are prefixes, just detects column header
    (
        '=FUNC(aaaa)',
        'A',
        'a',
        pd.DataFrame(get_number_data_for_df(['aaa', 'aaaa'], 2), index=pd.Index(['a', 'aa'])),
        'df[\'A\'] = FUNC(df[\'aaaa\'])',
        set(['FUNC']),
        set(['aaaa'])
    ),
]

HEADER_HEADER_RANGE_TEST_CASES = [
    # Simple header header reference
    (
        '=A:A',
        'B',
        0,
        pd.DataFrame(get_number_data_for_df(['A', 'B'], 2), index=pd.RangeIndex(0, 2)),
        'df[\'B\'] = df[[\'A\']]',
        set([]),
        set(['A'])
    ),
    # Header header reference in a formula
    (
        '=SUM(A:A)',
        'B',
        0,
        pd.DataFrame(get_number_data_for_df(['A', 'B'], 2), index=pd.RangeIndex(0, 2)),
        'df[\'B\'] = SUM(df[[\'A\']])',
        set(['SUM']),
        set(['A'])
    ),
    # Multiple header header references
    (
        '=SUM(A:A, B:B)',
        'B',
        0,
        pd.DataFrame(get_number_data_for_df(['A', 'B'], 2), index=pd.RangeIndex(0, 2)),
        'df[\'B\'] = SUM(df[[\'A\']], df[[\'B\']])',
        set(['SUM']),
        set(['A', "B"])
    ),
    # One range across two headers
    (
        '=SUM(A:B)',
        'B',
        0,
        pd.DataFrame(get_number_data_for_df(['A', 'B'], 2), index=pd.RangeIndex(0, 2)),
        'df[\'B\'] = SUM(df.loc[:, \'A\':\'B\'])',
        set(['SUM']),
        set(['A', "B"])
    ),
    # One range across two headers, with as well as other specific cell reference
    (
        '=SUM(A:B, A0)',
        'B',
        0,
        pd.DataFrame(get_number_data_for_df(['A', 'B'], 2), index=pd.RangeIndex(0, 2)),
        "df[\'B\'] = SUM(df.loc[:, \'A\':\'B\'], df['A'])",
        set(['SUM']),
        set(['A', "B"])
    ),
    # One range across three headers, includes the middle one
    (
        '=SUM(A:C)',
        'D',
        0,
        pd.DataFrame(get_number_data_for_df(['A', 'B', 'C'], 2), index=pd.RangeIndex(0, 2)),
        "df[\'D\'] = SUM(df.loc[:, \'A\':\'C\'])",
        set(['SUM']),
        set(["A", "B", "C"])
    ),
]

HEADER_INDEX_HEADER_INDEX_MATCHES = [
    # Simple header index header index reference
    (
        '=A0:A1',
        'B',
        0,
        pd.DataFrame(get_number_data_for_df(['A', 'B'], 2), index=pd.RangeIndex(0, 2)),
        "df['B'] = RollingRange(df[['A']], 2, 0)",
        set([]),
        set(['A'])
    ),
    # Header index header index reference with offset
    (
        '=A1:A2',
        'B',
        0,
        pd.DataFrame(get_number_data_for_df(['A', 'B'], 3), index=pd.RangeIndex(0, 3)),
        "df['B'] = RollingRange(df[['A']], 2, 1)",
        set([]),
        set(['A'])
    ),
    # Header index header index reference with offset and two columns
    (
        '=A1:B2',
        'B',
        0,
        pd.DataFrame(get_number_data_for_df(['A', 'B'], 3), index=pd.RangeIndex(0, 3)),
        "df['B'] = RollingRange(df.loc[:, 'A':'B'], 2, 1)",
        set([]),
        set(['A', 'B'])
    ),
    # Header index header index reference with offset and two columns in function
    (
        '=SUM(A1:B2)',
        'B',
        0,
        pd.DataFrame(get_number_data_for_df(['A', 'B'], 3), index=pd.RangeIndex(0, 3)),
        "df['B'] = SUM(RollingRange(df.loc[:, 'A':'B'], 2, 1))",
        set(['SUM']),
        set(['A', 'B'])
    ),
    # Header index header index reference with offset and two columns in function, as well as other specific cell reference and header ref
    (
        '=SUM(A1:B2, A0)',
        'B',
        0,
        pd.DataFrame(get_number_data_for_df(['A', 'B'], 3), index=pd.RangeIndex(0, 3)),
        "df['B'] = SUM(RollingRange(df.loc[:, 'A':'B'], 2, 1), df['A'])",
        set(['SUM']),
        set(['A', 'B'])
    ),
    # Header index header index as well as header header
    (
        '=SUM(A1:B2, A:B)',
        'B',
        0,
        pd.DataFrame(get_number_data_for_df(['A', 'B'], 3), index=pd.RangeIndex(0, 3)),
        "df['B'] = SUM(RollingRange(df.loc[:, 'A':'B'], 2, 1), df.loc[:, 'A':'B'])",
        set(['SUM']),
        set(['A', 'B'])
    ),
    # Header index header index reference with offset
    (
        '=A3:A7',
        'B',
        5,
        pd.DataFrame(get_number_data_for_df(['A', 'B'], 10), index=pd.RangeIndex(0, 10)),
        "df['B'] = RollingRange(df[['A']], 5, -2)",
        set([]),
        set(['A'])
    ),
    # Headers in incorrect direction in rolling range
    (
        '=SUM(B0:A0)',
        'C',
        0,
        pd.DataFrame(get_number_data_for_df(['A', 'B'], 3), index=pd.RangeIndex(0, 3)),
        "df['C'] = SUM(RollingRange(df.loc[:, 'A':'B'], 1, 0))",
        set(['SUM']),
        set(['B', 'A'])
    ),
    # One range across three headers, includes the middle one
    (
        '=SUM(C0:A0)',
        'D',
        0,
        pd.DataFrame(get_number_data_for_df(['A', 'B', 'C'], 2), index=pd.RangeIndex(0, 2)),
        "df[\'D\'] = SUM(RollingRange(df.loc[:, 'A':'C'], 1, 0))",
        set(['SUM']),
        set(["A", "B", "C"])
    ),
]

"""
PARSE_TESTS contains a variety of tests that make sure
formula parsing is working properly; it is passed as 
a parameter into the test_parse test below.

Order of params is: formula, address, python_code, functions, columns

See documentation here: https://docs.pytest.org/en/latest/parametrize.html#parametrize-basics
"""
PARSE_TESTS = CONSTANT_TEST_CASES + OPERATOR_TEST_CASES + FUNCTION_TEST_CASES + INDEX_TEST_CASES + INDEX_TEST_CASES_THAT_DONT_RECONSTRUCT_EXACTLY + HEADER_HEADER_RANGE_TEST_CASES + HEADER_INDEX_HEADER_INDEX_MATCHES

@pytest.mark.parametrize("formula,column_header,formula_label,df,python_code,functions,columns", PARSE_TESTS)
def test_parse(formula, column_header, formula_label, df, python_code, functions, columns):
    code, funcs, cols, _ = parse_formula(formula, column_header, formula_label, {'type': FORMULA_ENTIRE_COLUMN_TYPE}, [df], ['df'], 0) 
    assert (code, funcs, cols) == \
        (
            python_code, 
            functions, 
            columns
        )


# Right now, VLOOKUP is the only formula that allows cross-sheet referencing. In the future, 
# other cross-sheet references in parser can be added here. 
VLOOKUP_TESTS = [
    (
        '=VLOOKUP(A0, df_2!C:D, 2)',
        'B',
        0,
        [
            pd.DataFrame(
                get_number_data_for_df(['A', 'B'], 2),
                index=pd.RangeIndex(0, 2)
            ),
            pd.DataFrame(
                get_number_data_for_df(['C', 'D'], 2),
                index=pd.RangeIndex(0, 2)
            )
        ],
        ['df_1', 'df_2'],
        0,
        'df_1[\'B\'] = VLOOKUP(df_1[\'A\'], df_2.loc[:, \'C\':\'D\'], 2)',
        set(['VLOOKUP']),
        set(['A', 'D', 'C'])
    ),
    (
        '=VLOOKUP(A0, df_2!B:C, 2)',
        'B',
        0,
        [
            pd.DataFrame(
                get_number_data_for_df(['A', 'B'], 2),
                index=pd.RangeIndex(0, 2)
            ),
            pd.DataFrame(
                get_number_data_for_df(['B', 'C'], 2),
                index=pd.RangeIndex(0, 2)
            )
        ],
        ['df_1', 'df_2'],
        0,
        'df_1[\'B\'] = VLOOKUP(df_1[\'A\'], df_2.loc[:, \'B\':\'C\'], 2)',
        set(['VLOOKUP']),
        set(['A', 'B', 'C'])
    ),
    # Test for setting the column headers to be the order that they appear in the dataframe after parsing
    (
        '=VLOOKUP(A0, df_2!C:B, 2)',
        'B',
        0,
        [
            pd.DataFrame(
                get_number_data_for_df(['A', 'B'], 2),
                index=pd.RangeIndex(0, 2)
            ),
            pd.DataFrame(
                get_number_data_for_df(['B', 'C'], 2),
                index=pd.RangeIndex(0, 2)
            )
        ],
        ['df_1', 'df_2'],
        0,
        'df_1[\'B\'] = VLOOKUP(df_1[\'A\'], df_2.loc[:, \'B\':\'C\'], 2)',
        set(['VLOOKUP']),
        set(['A', 'B', 'C'])
    ),
    # Test for calling VLOOKUP inside another function
    (
        '=SUM(C0, VLOOKUP(A0, df_2!C:B, 2))',
        'B',
        0,
        [
            pd.DataFrame(
                get_number_data_for_df(['A', 'B', 'C'], 2),
                index=pd.RangeIndex(0, 2)
            ),
            pd.DataFrame(
                get_number_data_for_df(['B', 'C'], 2),
                index=pd.RangeIndex(0, 2)
            )
        ],
        ['df_1', 'df_2'],
        0,
        'df_1[\'B\'] = SUM(df_1[\'C\'], VLOOKUP(df_1[\'A\'], df_2.loc[:, \'B\':\'C\'], 2))',
        set(['VLOOKUP', 'SUM']),
        set(['A', 'B', 'C'])
    )
]

@pytest.mark.parametrize("formula,column_header,formula_label,dfs,df_names,sheet_index,python_code,functions,columns", VLOOKUP_TESTS)
def test_parse_cross_sheet_formulas(formula, column_header, formula_label, dfs, df_names, sheet_index, python_code, functions, columns):
    code, funcs, cols, _ = parse_formula(formula, column_header, formula_label, {'type': FORMULA_ENTIRE_COLUMN_TYPE}, dfs, df_names, sheet_index) 
    assert (code, funcs, cols) == \
        (
            python_code, 
            functions, 
            columns
        )

POST_PD_1_2_VLOOKUP_TESTS = [
    # Test for cross-sheet reference with non-string column header
    (
        '=VLOOKUP(A0, df_2!1:C, 2)',
        'B',
        0,
        [
            pd.DataFrame(
                get_number_data_for_df(['A', 'B', 'C'], 2),
                index=pd.RangeIndex(0, 2)
            ),
            pd.DataFrame(get_number_data_for_df([1, 'C'], 2))
        ],
        ['df_1', 'df_2'],
        0,
        'df_1[\'B\'] = VLOOKUP(df_1[\'A\'], df_2.loc[:, 1:\'C\'], 2)',
        set(['VLOOKUP']),
        set([1, 'A', 'C'])
    )
]

@pytest.mark.parametrize("formula,column_header,formula_label,dfs,df_names,sheet_index,python_code,functions,columns", POST_PD_1_2_VLOOKUP_TESTS)
@pandas_post_1_2_only
def post_pandas_1_2_cross_sheet_tests(formula,column_header,formula_label,dfs,df_names,sheet_index,python_code,functions,columns):
    test_parse_cross_sheet_formulas(formula,column_header,formula_label,dfs,df_names,sheet_index,python_code,functions,columns)

# Right now, only {SHEET}{HEADER}{HEADER} is supported, so any other kind of cross-sheet reference should throw an error.
INVALID_VLOOKUP_TESTS = [
    (
        '=VLOOKUP(df_2!A0, df_2!C:D, 2)',
        'B',
        0,
        [
            pd.DataFrame(
                get_number_data_for_df(['A', 'B'], 2),
                index=pd.RangeIndex(0, 2)
            ),
            pd.DataFrame(
                get_number_data_for_df(['C', 'D'], 2),
                index=pd.RangeIndex(0, 2)
            )
        ],
        ['df_1', 'df_2'],
        0
    ),
    (
        '=VLOOKUP(A0, df_2!C, 2)',
        'B',
        0,
        [
            pd.DataFrame(
                get_number_data_for_df(['A', 'B'], 2),
                index=pd.RangeIndex(0, 2)
            ),
            pd.DataFrame(
                get_number_data_for_df(['C', 'D'], 2),
                index=pd.RangeIndex(0, 2)
            )
        ],
        ['df_1', 'df_2'],
        0
    ),
    (
        '=VLOOKUP(A0, C:D, df_1!)',
        'B',
        0,
        [
            pd.DataFrame(
                get_number_data_for_df(['A', 'B'], 2),
                index=pd.RangeIndex(0, 2)
            ),
            pd.DataFrame(
                get_number_data_for_df(['C', 'D'], 2),
                index=pd.RangeIndex(0, 2)
            )
        ],
        ['df_1', 'df_2'],
        0
    ),
    (
        '=VLOOKUP(A0, df_2!C0:D0, 1)',
        'B',
        0,
        [
            pd.DataFrame(
                get_number_data_for_df(['A', 'B'], 2),
                index=pd.RangeIndex(0, 2)
            ),
            pd.DataFrame(
                get_number_data_for_df(['C', 'D'], 2),
                index=pd.RangeIndex(0, 2)
            )
        ],
        ['df_1', 'df_2'],
        0
    ),
    (
        '=VLOOKUP(A0, df_2!C0, 1)',
        'B',
        0,
        [
            pd.DataFrame(
                get_number_data_for_df(['A', 'B'], 2),
                index=pd.RangeIndex(0, 2)
            ),
            pd.DataFrame(
                get_number_data_for_df(['C', 'D'], 2),
                index=pd.RangeIndex(0, 2)
            )
        ],
        ['df_1', 'df_2'],
        0
    )
]

@pytest.mark.parametrize("formula,column_header,formula_label,dfs,df_names,sheet_index", INVALID_VLOOKUP_TESTS)
def test_parse_invalid_cross_sheet_formulas(formula, column_header, formula_label, dfs, df_names, sheet_index):
    with pytest.raises(MitoError) as e_info:
        parse_formula(formula, column_header, formula_label, {'type': FORMULA_ENTIRE_COLUMN_TYPE}, dfs, df_names, sheet_index) 
    assert e_info.value.type_ == 'invalid_formula_error'
    assert e_info.value.to_fix == 'Cross-sheet references are only allowed for ranges of columns.'

PARSE_TEST_ERRORS = [
    ('=HLOOKUP(100, A)', 'B', 'invalid_formula_error', 'HLOOKUP'),
    ('=XLOOKUP(100, A)', 'B', 'invalid_formula_error', 'XLOOKUP'),
    ('=A <> 100', 'B', 'invalid_formula_error', '<>'),
    ('=SUM(A', 'B', 'invalid_formula_error', 'parentheses'),
    ('=A=B', 'B', 'invalid_formula_error', 'equality'),
    ('=IF(A=B, 1, 0)', 'B', 'invalid_formula_error', 'equality'),
    ('IF(A=B, 1, 0)', 'B', 'invalid_formula_error', 'equality'),
    ("A='='", 'B', 'invalid_formula_error', 'equality'),
    ("'=' = '='", 'B', 'invalid_formula_error', 'equality'),
    ("= = =", 'B', 'invalid_formula_error', 'equality'),
    ("A == A = A", 'B', 'invalid_formula_error', 'equality'),   
]
@pytest.mark.parametrize("formula, address, error_type, to_fix_substr", PARSE_TEST_ERRORS)
def test_parse_errors(formula, address, error_type, to_fix_substr):
    with pytest.raises(MitoError) as e_info:
        parse_formula(formula, address, 0, {'type': FORMULA_ENTIRE_COLUMN_TYPE}, [pd.DataFrame(get_number_data_for_df(['A', 'B'], 2))], ['df'], 0, 1)
    assert e_info.value.type_ == error_type
    if to_fix_substr is not None:
        assert to_fix_substr in e_info.value.to_fix


SAFE_CONTAINS_TESTS = [
    ('=A & "B"', '&', True),
    ('=A - +  "&"', '&', False),
    ('=A - +  \'&\'', '&', False),
]

@pytest.mark.parametrize('formula,substring,contains', SAFE_CONTAINS_TESTS)
def test_safe_contains(formula, substring, contains):
    assert safe_contains(formula, substring, ['A', 'B']) == contains


@pytest.mark.parametrize("formula,column_header,formula_label,df,python_code,functions,columns", INDEX_TEST_CASES + HEADER_HEADER_RANGE_TEST_CASES + HEADER_INDEX_HEADER_INDEX_MATCHES)
def test_get_frontend_formula_reconstucts_properly(formula,column_header,formula_label,df,python_code,functions,columns):
    frontend_formula = get_frontend_formula(formula, formula_label, [df], ['df'], 0)
    assert get_backend_formula_from_frontend_formula(frontend_formula, formula_label, df) == formula

@pytest.mark.parametrize("formula,column_header,formula_label,dfs,df_names,sheet_index,python_code,functions,columns", VLOOKUP_TESTS)
def test_get_cross_sheet_frontend_formula_reconstucts_properly(formula,column_header,formula_label,dfs,df_names,sheet_index,python_code,functions,columns):
    frontend_formula = get_frontend_formula(formula, formula_label, dfs, df_names, sheet_index)
    assert get_backend_formula_from_frontend_formula(frontend_formula, formula_label, dfs[sheet_index]) == formula