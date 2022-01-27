#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Mito.
# Distributed under the terms of the Modified BSD License.

from typing import Any
import pytest

from mitosheet.errors import MitoError
from mitosheet.parser import parse_formula, safe_replace, safe_contains

CONSTANT_TEST_CASES: Any = [
    (
        '=100',
        'B',
        ['B'],
        'df[\'B\'] = 100',
        set([]),
        set([])
    ),
    (
        '=True',
        'B',
        ['B'],
        'df[\'B\'] = True',
        set([]),
        set([])
    ),
    (
        '=\'StringSingleQuotes\'',
        'B',
        ['B'],
        'df[\'B\'] = \'StringSingleQuotes\'',
        set([]),
        set([])
    ),
    (
        '=\"StringDoubleQuotes\"',
        'B',
        ['B'],
        'df[\'B\'] = \"StringDoubleQuotes\"',
        set([]),
        set([])
    ), 
    (
        '=\"String Double Quotes\"',
        'B',
        ['B'],
        'df[\'B\'] = \"String Double Quotes\"',
        set([]),
        set([])
    ), 
    (
        '=FUNC(\"String Double Quotes\")',
        'B',
        ['B'],
        'df[\'B\'] = FUNC(\"String Double Quotes\")',
        set(['FUNC']),
        set([])
    ),
    (
        '=FUNC(\"DIFF_FUNC(A)\")',
        'B',
        ['B'],
        'df[\'B\'] = FUNC(\"DIFF_FUNC(A)\")',
        set(['FUNC']),
        set([])
    ),
    (
        '=\"String One FUNC(A)\" + \"STRING TWO FUNC(A)\"',
        'B',
        ['B'],
        'df[\'B\'] = \"String One FUNC(A)\" + \"STRING TWO FUNC(A)\"',
        set([]),
        set([])
    ),
    (
        '=\'String One FUNC(A)\' + \'STRING TWO FUNC(A)\'',
        'B',
        ['B'],
        'df[\'B\'] = \'String One FUNC(A)\' + \'STRING TWO FUNC(A)\'',
        set([]),
        set([])
    ),
    (
        '=FUNC1(\'String One FUNC(A)\') + FUNC2(\'STRING TWO FUNC(A)\')',
        'B',
        ['B'],
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
        ['A', 'B', 'C'],
        'df[\'C\'] = df[\'A\'] + df[\'B\']',
        set(),
        set(['A', 'B'])
    ),
    # Simple subtract operation
    (
        '=A - B',
        'C',
        ['A', 'B', 'C'],
        'df[\'C\'] = df[\'A\'] - df[\'B\']',
        set(),
        set(['A', 'B'])
    ),
    # Simple multiply operation
    (
        '=A * B',
        'C',
        ['A', 'B', 'C'],
        'df[\'C\'] = df[\'A\'] * df[\'B\']',
        set(),
        set(['A', 'B'])
    ),
    # Simple divide operation
    (
        '=A / B',
        'C',
        ['A', 'B', 'C'],
        'df[\'C\'] = df[\'A\'] / df[\'B\']',
        set(),
        set(['A', 'B'])
    ),
    # Handles multi-char columns
    (
        '=AAA + BBB + CCC + DDD',
        'E',
        ['AAA', 'BBB', 'CCC', 'DDD'],
        'df[\'E\'] = df[\'AAA\'] + df[\'BBB\'] + df[\'CCC\'] + df[\'DDD\']',
        set(),
        set(['AAA', 'BBB', 'CCC', 'DDD'])
    ),
    # Maintains parens and constants
    (
        '=(A + B) / C + A * 100',
        'D',
        ['A', 'B', 'C'],
        'df[\'D\'] = (df[\'A\'] + df[\'B\']) / df[\'C\'] + df[\'A\'] * 100',
        set(),
        set(['A', 'B', 'C'])
    ),
    # Operator in functions
    (
        '=FUNC(A + B / C + A * 100)',
        'D',
        ['A', 'B', 'C'],
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
        ['A', 'B', 'C'],
        'df[\'B\'] = FUNC(df[\'A\'])',
        set(['FUNC']),
        set(['A'])
    ),
    # Simple, singular function call that has the name of a column
    (
        '=C(A)',
        'B',
        ['A', 'B', 'C'],
        'df[\'B\'] = C(df[\'A\'])',
        set(['C']),
        set(['A'])
    ),
    # Nested functions with different names
    (
        '=FUNCA(FUNCB(FUNCC(FUNCD(FUNCE(FUNCF(FUNCG(FUNCH(A))))))))',
        'B',
        ['A', 'B', 'C'],
        'df[\'B\'] = FUNCA(FUNCB(FUNCC(FUNCD(FUNCE(FUNCF(FUNCG(FUNCH(df[\'A\']))))))))',
        set(['FUNCA', 'FUNCB', 'FUNCC', 'FUNCD', 'FUNCE', 'FUNCF', 'FUNCG', 'FUNCH']),
        set(['A'])
    ),
    # Nested functions with basic operators
    (
        '=RIGHT(A, LEN(B) - 10)',
        'C',
        ['A', 'B', 'C'],
        'df[\'C\'] = RIGHT(df[\'A\'], LEN(df[\'B\']) - 10)',
        set(['RIGHT', 'LEN']),
        set(['A', 'B'])
    ),
    # More nested functions with columns
    (
        '=FUNC(A, FUNC(B, FUNC(C)))',
        'D',
        ['A', 'B', 'C'],
        'df[\'D\'] = FUNC(df[\'A\'], FUNC(df[\'B\'], FUNC(df[\'C\'])))',
        set(['FUNC']),
        set(['A', 'B', 'C'])
    ),
    # Lots of column references
    (
        '=FUNC(A, B, C, D, E, F, G, H, I)',
        'J',
        ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'],
        'df[\'J\'] = FUNC(df[\'A\'], df[\'B\'], df[\'C\'], df[\'D\'], df[\'E\'], df[\'F\'], df[\'G\'], df[\'H\'], df[\'I\'])',
        set(['FUNC']),
        set(['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'])
    ),
    # Lots of column references to columns with numbers
    (
        '=FUNC(column1, column2)',
        'J',
        ['column1', 'column2', 'J'],
        'df[\'J\'] = FUNC(df[\'column1\'], df[\'column2\'])',
        set(['FUNC']),
        set(['column1', 'column2'])
    ),
    # Test references to columns with spaces
    (
        '=FUNC(column 1, column 2)',
        'J',
        ['column 1', 'column 2', 'J'],
        'df[\'J\'] = FUNC(df[\'column 1\'], df[\'column 2\'])',
        set(['FUNC']),
        set(['column 1', 'column 2'])
    ),
    # Test references to columns that are numbers
    (
        '=FUNC(123, 456)',
        'J',
        [123, 456, 'J'],
        'df[\'J\'] = FUNC(df[123], df[456])',
        set(['FUNC']),
        set([123, 456])
    ),
    # Test references to columns that are numbers and are also strings
    (
        '=FUNC(123, 456, abc)',
        'J',
        ['abc', 456, 123, "J"],
        'df[\'J\'] = FUNC(df[123], df[456], df[\'abc\'])',
        set(['FUNC']),
        set([123, 456, 'abc'])
    ),
    # Test references to strings that has a single quotes in it
    (
        '=FUNC(this is a string \' that has a quote, 456, abc)',
        'J',
        ['abc', 456, 'this is a string \' that has a quote', "J"],
        'df[\'J\'] = FUNC(df[\'this is a string \' that has a quote\'], df[456], df[\'abc\'])',
        set(['FUNC']),
        set(['abc', 456, 'this is a string \' that has a quote'])
    ),
    # Test references to strings that have mulitple quotes
    (
        '=FUNC(this is a string \'test\' that has a quote, 456, abc)',
        'J',
        ['abc', 456, 'this is a string \'test\' that has a quote', "J"],
        'df[\'J\'] = FUNC(df[\'this is a string \'test\' that has a quote\'], df[456], df[\'abc\'])',
        set(['FUNC']),
        set(['abc', 456, 'this is a string \'test\' that has a quote'])
    ),
    # Test references to a string in quotes, but is a column header
    (
        '=FUNC("column")',
        'J',
        ["\"column\"", "J"],
        'df[\'J\'] = FUNC(df[\'"column"\'])',
        set(['FUNC']),
        set(["\"column\""])
    ),
    # Test references to a quote that is covered by a column header
    (
        '=FUNC("this is a string")',
        'J',
        ["string", "J"],
        'df[\'J\'] = FUNC("this is a string")',
        set(['FUNC']),
        set([])
    ),
    # Test references a boolean column
    (
        '=true + false',
        'A',
        [True, False],
        'df[\'A\'] = df[True] + df[False]',
        set([]),
        set([True, False])
    ),
    # Test references a multi-index header
    (
        '=Height, min',
        'Name',
        [('Name', ''), ('Height', 'min')],
        'df[\'Name\'] = df[(\'Height\', \'min\')]',
        set([]),
        set([('Height', 'min')])
    ),
    # Test references a multi-index header in a function
    (
        '=FUNC(Height, min)',
        'Name',
        [('Name', ''), ('Height', 'min')],
        'df[\'Name\'] = FUNC(df[(\'Height\', \'min\')])',
        set(['FUNC']),
        set([('Height', 'min')])
    ),
    # Test references a multi-index header with an empty second item
    (
        '=FUNC(Name)',
        'Name',
        [('Name', ''), ('Height', 'min')],
        'df[\'Name\'] = FUNC(df[(\'Name\', \'\')])',
        set(['FUNC']),
        set([('Name', '')])
    ),
]


"""
PARSE_TESTS contains a variety of tests that make sure
formula parsing is working properly; it is passed as 
a parameter into the test_parse test below.

Order of params is: formula, address, python_code, functions, columns

See documentation here: https://docs.pytest.org/en/latest/parametrize.html#parametrize-basics
"""
PARSE_TESTS = CONSTANT_TEST_CASES + OPERATOR_TEST_CASES + FUNCTION_TEST_CASES
@pytest.mark.parametrize("formula,column_header,column_headers,python_code,functions,columns", PARSE_TESTS)
def test_parse(formula, column_header, column_headers, python_code, functions, columns):
    assert parse_formula(formula, column_header, column_headers) == \
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
        parse_formula(formula, address, ['A', 'B'])
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
    assert safe_replace(formula, old_column_header, new_column_header, column_headers) == new_formula


SAFE_CONTAINS_TESTS = [
    ('=A & "B"', '&', True),
    ('=A - +  "&"', '&', False),
    ('=A - +  \'&\'', '&', False),
]

@pytest.mark.parametrize('formula,substring,contains', SAFE_CONTAINS_TESTS)
def test_safe_contains(formula, substring, contains):
    assert safe_contains(formula, substring, ['A', 'B']) == contains