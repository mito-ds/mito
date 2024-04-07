import pandas as pd
from mitosheet.errors import MitoError
from mitosheet.tests.test_utils import create_mito_wrapper
from mitosheet.types import FC_NUMBER_EXACTLY
import pytest
from mitosheet.public.v3.sheet_functions.number_functions import SUMIF
from mitosheet.tests.decorators import pro_only

calling_df = pd.DataFrame({'Key One': ['A', 'A', 'B', 'C', 'D']})
data_df = pd.DataFrame({'Key': ['A', 'A', 'B', 'C', 'C'], 'Value': [1, 2, 3, 4, 5]})

SUMIF_VALID_TESTS = [
    # Tests for when criteria is a series with string keys
    (
        [
            data_df[['Key']],
            calling_df['Key One'],
            data_df[['Value']]
        ],
        pd.Series([3, 3, 3, 9, 0])
    ),
    # Tests for when criteria is a series with number keys
    (
        [
            pd.DataFrame({'Key': [1, 1, 2, 3]}),
            pd.Series([2, 3, 1, -100]),
            pd.DataFrame({'Value': [1, 2, 3, 4]})
        ],
        pd.Series([3, 4, 3, 0])
    ),
    # Test that if the criteria is a series with the same name as the sum_range column that we are
    # still able to identify the correct column to return
    (
        [
            pd.DataFrame({'Key': [1, 1, 2, 3]}),
            pd.DataFrame({'Value': [2, 3, 1, -100]})['Value'],
            pd.DataFrame({'Value': [1, 2, 3, 4]})
        ],
        pd.Series([3, 4, 3, 0])
    ),
    # Tests for when criteria is a series with completely different indexes
    (
        [
            data_df[['Key']],
            pd.DataFrame({'Key': ['A', 'A', 'B', 'C', 'D']}, index=['01', '02', '03', '04', '05'])['Key'],
            data_df[['Value']]
        ],
        pd.Series([3, 3, 3, 9, 0], index=['01', '02', '03', '04', '05'])
    ),
    # Tests for when criteria is a series should be case insensitive
    (
        [
            data_df[['Key']],
            pd.Series(['a', 'a', 'b', 'c', 'd']),
            data_df[['Value']]
        ],
        pd.Series([3, 3, 3, 9, 0])
    ),
    # Tests for when criteria is a series should be case insensitive even with different indexes
    (
        [
            data_df[['Key']],
            pd.DataFrame({'Key': ['a', 'a', 'b', 'c', 'd']}, index=['01', '02', '03', '04', '05'])['Key'],
            data_df[['Value']]
        ],
        pd.Series([3, 3, 3, 9, 0], index=['01', '02', '03', '04', '05'])
    ),
    # Tests for when the lookup value is a primitive string
    (
        [
            data_df[['Key']],
            'A',
            data_df[['Value']]
        ],
        3
    ),
    # Tests for when the lookup value is a primitive string is still case insensitive
    (
        [
            data_df[['Key']],
            'a',
            data_df[['Value']]
        ],
        3
    ),
    # Tests for when the lookup value is a primitive number
    (
        [
            pd.DataFrame({'Key': [0, 0, 0, 1, 1]}),
            0,
            pd.DataFrame({'Value': [1, 2, 3, -1, -1]})
        ],
        6
    ),
    # Tests for when the lookup value is a primitive with no match
    (
        [
            data_df[['Key']],
            'Z',
            data_df[['Value']]
        ],
        0
    ),
    # Handles datetimes as match criteria with series
    (
        [
            pd.DataFrame({'Date': pd.to_datetime(['2011-01-01', '2012-01-01'])}),
            pd.Series(pd.to_datetime(['2011-01-01', '2012-01-01', '2013-01-01'])),
            pd.DataFrame({'Value': [1, 2]})
        ],
        pd.Series([1, 2, 0])
    ),
    # Handles datetimes as match criteria with constant value
    (
        [
            pd.DataFrame({'Date': pd.to_datetime(['2011-01-01', '2012-01-01'])}),
            pd.to_datetime('2011-01-01'),
            pd.DataFrame({'Value': [1, 2]})
        ],
        1
    )
]

@pro_only
@pytest.mark.parametrize("_argv, expected", SUMIF_VALID_TESTS)
def test_sumif_direct(_argv, expected):
    result = SUMIF(*_argv)
    if isinstance(result, pd.Series):
        pd.testing.assert_series_equal(result, expected, check_names=False, check_series_type=False, check_dtype=False)
    else: 
        assert result == expected


# Invalid tests
SUMIF_INVALID_TESTS = [
    # Test for different types between lookup value and first column of where
    (
        [
            pd.DataFrame({'Key': [1, 2, 3, 4, 5]}),
            pd.Series(['A', 'B', 'C', 'D', 'E']),
            pd.DataFrame({'Value': [1, 2, 3, 4, 5]})
        ],
        'SUMIF requires the  value and the first column of the where range to be the same type. The lookup value is of type int64 and the first column of the where range is of type string.'
    )
]
@pro_only
@pytest.mark.parametrize("_argv, expected", SUMIF_INVALID_TESTS)
def test_invalid_args_error(_argv, expected):
    with pytest.raises(MitoError) as e_info:
        SUMIF(*_argv)
        assert e_info.value.error_dict['error_type'] == 'invalid_args_error'
        assert e_info.value.error_dict['function_name'] == 'SUMIF'
        assert e_info.value.error_dict['error_message'] == expected

@pro_only
def test_filter_data_table_then_sumif():
    df1 = pd.DataFrame({
        'A': [1, 2, 3, 4, 5, 1, 2, 3, 4, 5],
        'B': [1, 0, 1, 0, 1, 0, 1, 0, 1, 0],
    })

    df2 = pd.DataFrame({
        'A': [1, 2, 3, 4, 5, 1, 2, 3, 4, 5],
        'C': [1, 2, 3, 4, 5, 1, 2, 3, 4, 5],
    })

    mito = create_mito_wrapper(df1, df2)
    mito.filter(1, "A", "And", FC_NUMBER_EXACTLY, 1)
    mito.set_formula('=SUMIF(df2!A:A, A0, df2!C:C)', 0, 'C', True)

    result = mito.get_column(0, 'C', True)
    expected = pd.Series([2, 0, 0, 0, 0, 2, 0, 0, 0, 0])

    assert result == list(expected)

@pro_only
def test_filter_source_table_then_sumif():
    df1 = pd.DataFrame({
        'A': [1, 2, 3, 4, 5, 1, 2, 3, 4, 5],
        'B': [1, 0, 1, 0, 1, 0, 1, 0, 1, 0],
    })

    df2 = pd.DataFrame({
        'A': [1, 2, 3, 4, 5, 1, 2, 3, 4, 5],
        'C': [1, 2, 3, 4, 5, 1, 2, 3, 4, 5],
    })

    mito = create_mito_wrapper(df1, df2)
    mito.filter(0, "A", "And", FC_NUMBER_EXACTLY, 2)
    mito.set_formula('=SUMIF(df2!A:A, A1, df2!C:C)', 0, 'C', True)

    result = mito.get_column(0, 'C', True)
    expected = pd.Series([4, 4])

    assert result == list(expected)

@pro_only
def test_only_first_sum_range_column_is_used():
    df1 = pd.DataFrame({
        'A': [1, 2, 3],
    })

    df2 = pd.DataFrame({
        'A': [1, 2, 3],
        'B': [1, 2, 3],
        'C': ['ignored', 'ignored', 'ignored'],
    })

    mito = create_mito_wrapper(df1, df2)
    mito.set_formula('=SUMIF(df2!A:A, A0, df2!B:C)', 0, 'B', True)

    result = mito.get_column(0, 'B', True)
    expected = pd.Series([1, 2, 3])

    assert result == list(expected)