#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
"""
Contains tests for various composed functions.
"""

from typing import Any, List, Tuple, Union
import numpy as np
import pytest
import math
from mitosheet.tests.test_utils import create_mito_wrapper

# Test pure arithmetic
ARITHMETIC_COMPOSITION_TESTS: List[Tuple[Any, ...]] = [
    (4, 4, '=SUM(AVG(A, B), 10)', 14),
    (4, 4, '=SUM(AVG(A, B), MULTIPLY(A, 1))', 8),
    (4, 4, '=SUM(AVG(A, B), AVG(A, B))', 8),
    (4, 4, '=SUM(AVG(A, B), AVG(A, B)) + SUM(A, 10)', 22),
    (4, 4, '=AVG(SUM(AVG(A, B), AVG(A, B)) + SUM(A, 10), 0)', 11),
    (4, 4, '=MULTIPLY(AVG(SUM(AVG(A, B), AVG(A, B)) + SUM(A, 10), 0), 2)', 22),
    (4, 4, '=SUBSTITUTE(A, 4, 2) * B', 8),
    (50, 4, '=LEFT(A) * B', 20),
    (51, 4, '=RIGHT(A) * B', 4),
    (5, 4, '=PROPER(A) * B', 20),
    (5, 4, '=UPPER(A) * B', 20),
    (5, 4, '=LOWER(A) * B', 20),
]

"""
{
    'CLEAN': CLEAN,
    'CONCAT': CONCAT,
    'FIND': FIND,
    'LEFT': LEFT,
    'LEN': LEN,
    'LOWER': LOWER,
    'MID': MID,
    'MULTIPLY': MULTIPLY,
    'PROPER': PROPER,
    'RIGHT': RIGHT,
    'SUBSTITUTE': SUBSTITUTE,
    'SUM': SUM,
    'TRIM': TRIM,
}
"""

# Test pure string operations
# NOTE: we have to wrap the second arg in quotes, given how it is set in the test
STRING_COMPOSITION_TESTS: List[Tuple[Any, ...]] = [
    ('Hi', '\"Jake\"', 'CONCAT(A, RIGHT(B))', 'Hie'),
    ('Hi', '\"Jake\"', '=CONCAT(A, RIGHT(B))', 'Hie'),
    ('Hi', '\"Jake\"', '=CONCAT(A, \" \", RIGHT(B, 100))', 'Hi Jake'),
    ('Hi', '\"Jake\"', '=CONCAT(UPPER(A), \" \", RIGHT(B, 100))', 'HI Jake'),
    ('Hi', '\"Jake\"', '=LOWER(CONCAT(UPPER(A), \" \", RIGHT(B, 100)))', 'hi jake'),
    ('Hi', '\"Jake\"', '=PROPER(LOWER(CONCAT(UPPER(A), \" \", RIGHT(B, 100))))', 'Hi Jake'),
    ('Hi', '\"Jake\"', '=LEFT(A, FIND(A, \"i\"))', 'Hi'),
    ('Hi', '\"Jake\"', '=LEFT(A, FIND(A, \"H\"))', 'H'),
    ('Hi', '\"Jake\"', '=RIGHT(A, FIND(A, \"i\"))', 'Hi'),
    ('1Hi2', '\"Jake\"', '=MID(A, FIND(A, \"H\"), FIND(A, \"i\") - FIND(A, \"H\") + 1)', 'Hi'),
    ('1Hi2', '\"Jake\"', '=MID(A, FIND(A, \"1\") + 1, FIND(A, \"2\") - FIND(A, \"1\") - 1)', 'Hi'),
    ('123', '\"1234\"', '=SUBSTITUTE(CONCAT(A, B), \"123\", \"haha\")', 'hahahaha4'),
    ('123', '\"1234\"', '=CONCAT(SUBSTITUTE(A, \"123\", \"haha\"), B)', 'haha1234'),
    ('ben', '\"jones\"', '=PROPER(CONCAT(A, \" \", B))', 'Ben Jones'),
    ('   ben', '\"jones   \"', '=PROPER(TRIM(CONCAT(A, \" \", B)))', 'Ben Jones'),
    ('   ben', '\"jones   \"', '=PROPER(CONCAT(TRIM(A), \" \", TRIM(B)))', 'Ben Jones'),
    ('Ben Jones', '\"\"', '=LEFT(A, FIND(A, \" \") - 1)', 'Ben'),
    ('Ben Jones', '\"\"', '=TRIM(LEFT(A, FIND(A, \" \")))', 'Ben'),
    ('Ben Jones', '\"\"', '=TRIM(RIGHT(A, LEN(A) - FIND(A, \" \")))', 'Jones'),
    ('Ben Jones', '\"\"', '=RIGHT(A, LEN(A) - FIND(A, \" \"))', 'Jones'),
    ('ben', '\"jones\"', '=PROPER(CONCAT(UPPER(A), \" \", UPPER(B)))', 'Ben Jones'),
    ('ben', '\"jones\"', '=PROPER(CONCAT(UPPER(A),  \" \", LOWER(\"TEST STRING\"),  \" \", UPPER(B)))', 'Ben Test String Jones'),
    ('ben', '\"jones\"', '=PROPER(CONCAT(UPPER(A),  \" \", TRIM(\"    TEST STRING    \"),  \" \", UPPER(B)))', 'Ben Test String Jones'),
    ('ben', '\"jones\"', '=PROPER(CONCAT(UPPER(A),  \" \", UPPER(LOWER(\"TEST STRING\")),  \" \", UPPER(B)))', 'Ben Test String Jones'),
    ('ben', '\"jones\"', '=CONCAT(PROPER(UPPER(A)),  \" \", PROPER(UPPER(LOWER(\"TEST STRING\"))),  \" \", PROPER(UPPER(B)))', 'Ben Test String Jones'),
    ('ben', '\"jones\"', '=SUBSTITUTE(PROPER(CONCAT(UPPER(A), \" \", UPPER(B))), \" \", \"-\")', 'Ben-Jones'),
]
FORMULA_COMP_TESTS = ARITHMETIC_COMPOSITION_TESTS + STRING_COMPOSITION_TESTS


@pytest.mark.parametrize("A_input,B_input,formula,result", FORMULA_COMP_TESTS)
def test_function_composition(A_input, B_input, formula, result):
    mito = create_mito_wrapper([A_input])
    mito.set_formula(f'={B_input}', 0, 'B', add_column=True)
    mito.set_formula(formula, 0, 'C', add_column=True)
    assert mito.get_value(0, 'C', 1) == result

