import pytest
import pandas as pd
import numpy as np

from mitosheet.tests.test_utils import create_mito_wrapper

# The commented out tests fail because we don't handle string literals correctly as the first arg

NaN_Second_Arg_FUNCS = [
    ('=AVG(A, 1)', 1),
    ('=AVG(1, A)', 1),
    ('=AVG(A, A,)', 1),
    ('=CLEAN(A)', '1.0'),
    ('=CONCAT(A,\'aaron\')', '1.0aaron'),
    ('=CONCAT(\'aaron\', A)', 'aaron1.0'),
    ('=FIND(A, \'aaron\')', 0),
    #('=FIND(\'aaron\', A)', 0),
    ('=FIND(A, A)', 1),
    #('=LEFT(\'aaron\', A)', 'a'),
    ('=LEFT(A, 1)', 1),
    ('=LEN(A)', 3),
    ('=LOWER(A)', 1),
    ('=MID(A, 1, 1)', 1),
    #('=MID(\'aaron\', A, 3)'), this fails because we can't successfully fill_series_to_length
    #('=MID(\'aaron\', 1, A)', 'a'), 
    ('=MULTIPLY(A, 4)', 4),
    ('=MULTIPLY(4, A)', 4),
    ('=PROPER(A)', 1),
    ('=RIGHT(A, 1)', 0.0), # note this is 0.0 because the A1 is 1.0 so taking the right and displaying it as a float is 0.0
    #('=RIGHT(\'aaron\', A)'), this fails because we can't successfully fill_series_to_length
    ('=SUBSTITUTE(A, \'aaron\', \'jacob\')', 1),
    #('=SUBSTITUTE(\'aaron\', A, \'jacob\')', 'aaron'),
    #('=SUBSTITUTE(\'aaron\', \'aaron\', A)', '1.0'),
    ('=SUM(A, 5)', 6),
    ('=SUM(3, A)', 4),
    ('=TRIM(A)', 1),
    ('=UPPER(A)', 1),
]


@pytest.mark.parametrize("formula, b1_value", NaN_Second_Arg_FUNCS)
def test_series_ending_nan(formula, b1_value):
    mito = create_mito_wrapper([1, None])
    mito.add_column(0, 'B')

    mito.set_formula(formula, 0, 'B')
    assert pd.isna(mito.get_value(0, 'B', 2)) == True
    assert mito.get_value(0, 'B', 1) == b1_value


@pytest.mark.parametrize("formula, b1_value", NaN_Second_Arg_FUNCS)
def test_series_middle_nan(formula, b1_value):
    mito = create_mito_wrapper([1, None, 1])
    mito.add_column(0, 'B')

    b3_value = b1_value

    mito.set_formula(formula, 0, 'B')

    assert pd.isna(mito.get_value(0, 'B', 2)) == True
    assert mito.get_value(0, 'B', 1) == b1_value
    assert mito.get_value(0, 'B', 3) == b3_value


@pytest.mark.parametrize("formula, b1_value", NaN_Second_Arg_FUNCS)
def test_series_start_nan(formula, b1_value):
    mito = create_mito_wrapper([None, 1])
    mito.set_formula(formula, 0, 'B', add_column=True)

    assert pd.isna(mito.get_value(0, 'B', 1)) == True
    assert mito.get_value(0, 'B', 2) == b1_value
