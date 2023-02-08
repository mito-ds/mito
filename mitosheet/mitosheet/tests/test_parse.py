#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
from typing import Any, Dict, List
import warnings
import pytest
import pandas as pd

from mitosheet.errors import MitoError
from mitosheet.parser import get_backend_formula_from_frontend_formula, parse_formula, safe_replace, safe_contains, get_frontend_formula
from mitosheet.types import FORMULA_ENTIRE_COLUMN_TYPE


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
        '=True',
        'B',
        0,
        pd.DataFrame(get_string_data_for_df(['B'], 2)),
        'df[\'B\'] = True',
        set([]),
        set([])
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
    )
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
    )
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
        'df[\'J\'] = FUNC(df[\'this is a string \' that has a quote\'], df[456], df[\'abc\'])',
        set(['FUNC']),
        set(['abc', 456, 'this is a string \' that has a quote'])
    ),
    # Test references to strings that have mulitple quotes
    (
        '=FUNC(this is a string \'test\' that has a quote, 456, abc)',
        'J',
        0,
        pd.DataFrame(get_number_data_for_df(['abc', 456, 'this is a string \'test\' that has a quote', "J"], 2)),
        'df[\'J\'] = FUNC(df[\'this is a string \'test\' that has a quote\'], df[456], df[\'abc\'])',
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
    warnings.simplefilter('ignore')
    unit64_index = pd.UInt64Index(range(10))
    float64_index = pd.Float64Index(range(10))


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


"""
PARSE_TESTS contains a variety of tests that make sure
formula parsing is working properly; it is passed as 
a parameter into the test_parse test below.

Order of params is: formula, address, python_code, functions, columns

See documentation here: https://docs.pytest.org/en/latest/parametrize.html#parametrize-basics
"""
PARSE_TESTS = CONSTANT_TEST_CASES + OPERATOR_TEST_CASES + FUNCTION_TEST_CASES + INDEX_TEST_CASES + INDEX_TEST_CASES_THAT_DONT_RECONSTRUCT_EXACTLY
@pytest.mark.parametrize("formula,column_header,formula_label,df,python_code,functions,columns", PARSE_TESTS)
def test_parse(formula, column_header, formula_label, df, python_code, functions, columns):
    code, funcs, cols, _ = parse_formula(formula, column_header, formula_label, {'type': FORMULA_ENTIRE_COLUMN_TYPE}, df) 
    assert (code, funcs, cols) == \
        (
            python_code, 
            functions, 
            columns
        )


PARSE_TEST_ERRORS = [
    ('=LOOKUP(100, A)', 'B', 'invalid_formula_error', 'LOOKUP'),
    ('=VLOOKUP(100, A)', 'B', 'invalid_formula_error', 'VLOOKUP'),
    ('=HLOOKUP(100, A)', 'B', 'invalid_formula_error', 'HLOOKUP'),
    ('=XLOOKUP(100, A)', 'B', 'invalid_formula_error', 'XLOOKUP'),
    ('=A <> 100', 'B', 'invalid_formula_error', '<>'),
    ('=SUM(A', 'B', 'invalid_formula_error', 'parentheses'),
]
@pytest.mark.parametrize("formula, address, error_type, to_fix_substr", PARSE_TEST_ERRORS)
def test_parse_errors(formula, address, error_type, to_fix_substr):
    with pytest.raises(MitoError) as e_info:
        parse_formula(formula, address, 0, {'type': FORMULA_ENTIRE_COLUMN_TYPE}, pd.DataFrame(get_number_data_for_df(['A', 'B'], 2)))
    assert e_info.value.type_ == error_type
    if to_fix_substr is not None:
        assert to_fix_substr in e_info.value.to_fix


SAFE_REPLACE_TESTS = [
    ('=A', 'A', 'B', ['A', 'B'], '=B'),
    ('=A + A', 'A', 'B', ['A', 'B'], '=B + B'),
    ('=A + B', 'A', 'B', ['A', 'B'], '=B + B'),
    ('=A + B + A', 'A', 'B', ['A', 'B'], '=B + B + B'),
    ('=This is a test', 'test', 'B', ['This is a test'], '=This is a test'),
    ('="test with spaces"', 'test with spaces', 'B', ['test with spaces'], '="test with spaces"'),
    ('=A + B + \"A\"', 'A', 'B', ['A', 'B'], '=B + B + \"A\"'),
    ('=A + B + \'A\'', 'A', 'B', ['A', 'B'], '=B + B + \'A\''),
    ('=A + B + \'A\'', 'A', 'B', ['A', 'B'], '=B + B + \'A\''),
    ('=FUNC(A, B, A) + TEST(FUNC(A, \'A\', \'B\')) + \'A\'', 'A', 'B', ['A', 'B'], '=FUNC(B, B, B) + TEST(FUNC(B, \'A\', \'B\')) + \'A\''),
    ('=APPLE(A, B, A) + AARON(AAA(A, \'A\', \'B\')) + \'A\'', 'A', 'B', ['A', 'B'], '=APPLE(B, B, B) + AARON(AAA(B, \'A\', \'B\')) + \'A\''),
]

@pytest.mark.parametrize('formula,old_column_header,new_column_header,column_headers,new_formula', SAFE_REPLACE_TESTS)
def test_safe_replace(formula, old_column_header, new_column_header, column_headers, new_formula):
    assert safe_replace(formula, old_column_header, new_column_header, 0, pd.DataFrame(get_number_data_for_df(column_headers, 2))) == new_formula


SAFE_CONTAINS_TESTS = [
    ('=A & "B"', '&', True),
    ('=A - +  "&"', '&', False),
    ('=A - +  \'&\'', '&', False),
]

@pytest.mark.parametrize('formula,substring,contains', SAFE_CONTAINS_TESTS)
def test_safe_contains(formula, substring, contains):
    assert safe_contains(formula, substring, ['A', 'B']) == contains


@pytest.mark.parametrize("formula,column_header,formula_label,df,python_code,functions,columns", INDEX_TEST_CASES)
def test_get_frontend_formula_reconstucts_properly(formula,column_header,formula_label,df,python_code,functions,columns):
    frontend_formula = get_frontend_formula(formula, formula_label, df)
    assert get_backend_formula_from_frontend_formula(frontend_formula, formula_label, df) == formula