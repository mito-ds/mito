#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
"""
Contains all functions that can be used in a sheet that operate on
numbers.

All functions describe their behavior with a function documentation object
in the function docstring. Function documentation objects are described
in more detail in docs/README.md.

NOTE: This file is alphabetical order!
"""
import functools
from typing import Tuple
import pandas as pd
import numpy as np

from mitosheet.sheet_functions.types.decorators import fill_nans, filter_nans, convert_args_to_series_type, convert_arg_to_series_type, handle_sheet_function_errors
from mitosheet.sheet_functions.sheet_function_utils import try_extend_series_to_index, fill_series_with_one_index, fill_series_with_one_index

@handle_sheet_function_errors
@convert_arg_to_series_type(
    0,
    'float',
    'error',
    ('default', np.NaN)
)
def ABS(series: pd.Series) -> pd.Series:
    """
    {
        "function": "ABS",
        "description": "Returns the absolute value of the passed number or series.",
        "search_terms": ["abs", "absolute value"],
        "examples": [
            "ABS(-1.3)",
            "ABS(A)"
        ],
        "syntax": "ABS(value)",
        "syntax_elements": [{
                "element": "value",
                "description": "The value or series to take the absolute value of."
            }
        ]
    }
    """
    return series.abs()


@handle_sheet_function_errors
@filter_nans
@convert_args_to_series_type('float', 'skip', ('default', np.NaN))
def AVG(*argv: pd.Series) -> pd.Series:
    """
    {
        "function": "AVG",
        "description": "Returns the numerical mean value of the passed numbers and series.",
        "search_terms": ["avg", "average", "mean"],
        "examples": [
            "AVG(1, 2)",
            "AVG(A, B)",
            "AVG(A, 2)"
        ],
        "syntax": "AVG(value1, [value2, ...])",
        "syntax_elements": [{
                "element": "value1",
                "description": "The first number or series to consider when calculating the average."
            },
            {
                "element": "value2, ... [OPTIONAL]",
                "description": "Additional numbers or series to consider when calculating the average."
            }
        ]
    }
    """
    # Fill sum to the max length of any series
    argv = fill_series_with_one_index(argv)

    arg_sum = functools.reduce((lambda x, y: x + y), argv) 
    return arg_sum / len(argv)


@handle_sheet_function_errors
@convert_arg_to_series_type(
    0,
    'float',
    'error',
    ('default', np.NaN)
)
@convert_arg_to_series_type(
    1,
    'float',
    'error',
    ('default', np.NaN)
)
def CORR(s1: pd.Series, s2: pd.Series) -> pd.Series:
    """
    {
        "function": "CORR",
        "description": "Computes the correlation between two series, excluding missing values.",
        "search_terms": ["corr", "correlation", "r^2"],
        "examples": [
            "=CORR(A, B)",
            "=CORR(B, A)"
        ],
        "syntax": "CORR(series_one, series_two)",
        "syntax_elements": [{
                "element": "series_one",
                "description": "The number series to convert to calculate the correlation."
            }, {
                "element": "series_two",
                "description": "The number series to convert to calculate the correlation."
            }
        ]
    }
    """
    corr = s1.corr(s2, method='pearson')
    return pd.Series(
        [corr] * len(s1),
        index=s1.index
    )

@handle_sheet_function_errors
@filter_nans
@convert_arg_to_series_type(
    0,
    'float',
    'error',
    ('default', np.NaN)
)
def FLOAT(series: pd.Series) -> pd.Series:
    """
    {
        "function": "FLOAT",
        "description": "Converts a string series to a float series. Any values that fail to convert will return NaN.",
        "search_terms": ["number", "to number"],
        "examples": [
            "=FLOAT(Prices_string)",
            "=FLOAT('123.123')"
        ],
        "syntax": "FLOAT(string_series)",
        "syntax_elements": [{
                "element": "string_series",
                "description": "The series or string to convert to a float."
            }
        ]
    }
    """
    return series

@handle_sheet_function_errors
@fill_nans(0, 0)
@convert_arg_to_series_type(
    0,
    'int',
    'error',
    ('default', 0)
)
def INT(series: pd.Series) -> pd.Series:
    """
    {
        "function": "INT",
        "description": "Converts a string series to a int series. Any values that fail to convert will return 0.",
        "search_terms": ["number", "to integer"],
        "examples": [
            "=INT(Prices_string)",
            "=INT('123')"
        ],
        "syntax": "INT(string_series)",
        "syntax_elements": [{
                "element": "string_series",
                "description": "The series or string to convert to a int."
            }
        ]
    }
    """
    return series


@handle_sheet_function_errors
@convert_arg_to_series_type(
    0,
    'float',
    'error',
    ('default', np.NaN)
)
# We don't use the @filter_nans decorator because kurtosis ignores NaN values
def KURT(series: pd.Series) -> pd.Series:
    """
    {
        "function": "KURT",
        "description": "Computes the unbiased kurtosis, a measure of tailedness, of a series, excluding missing values.",
        "search_terms": ["kurtosis"],
        "examples": [
            "=KURT(A)",
            "=KURT(A * B)"
        ],
        "syntax": "KURT(series)",
        "syntax_elements": [{
                "element": "series",
                "description": "The series to calculate the unbiased kurtosis of."
            }
        ]
    }
    """
    kurtosis = series.kurtosis()
    return pd.Series(
        [kurtosis] * len(series),
        index=series.index
    )


@handle_sheet_function_errors
@filter_nans
# NOTE: we set the default to -inf, so that we ignore values that fail to convert
@convert_args_to_series_type('float', 'skip', ('default', float("-inf")))
def MAX(*argv: pd.Series) -> pd.Series:
    """
    {
        "function": "MAX",
        "description": "Returns the maximum value among the passed arguments.",
        "search_terms": ["max", "maximum", "minimum"],
        "examples": [
            "MAX(10, 11)",
            "MAX(Old_Data, New_Data)"
        ],
        "syntax": "MAX(value1, [value2, ...])",
        "syntax_elements": [{
                "element": "value1",
                "description": "The first number or column to consider for the maximum value."
            },
            {
                "element": "value2, ... [OPTIONAL]",
                "description": "Additional numbers or columns to compute the maximum value from."
            }
        ]
    }
    """
    # We make a dataframe out of the series, and take the max between all the columns
    argv = fill_series_with_one_index(argv)
    return pd.DataFrame(argv).max()


@handle_sheet_function_errors
@filter_nans
# NOTE: we set the default to inf, so that we ignore values that fail to convert
@convert_args_to_series_type('float', 'skip', ('default', float("inf")))
def MIN(*argv: pd.Series) -> pd.Series:
    """
    {
        "function": "MIN",
        "description": "Returns the minimum value among the passed arguments.",
        "search_terms": ["min", "minimum", "maximum"],
        "examples": [
            "MIN(10, 11)",
            "MIN(Old_Data, New_Data)"
        ],
        "syntax": "MIN(value1, [value2, ...])",
        "syntax_elements": [{
                "element": "value1",
                "description": "The first number or column to consider for the minumum value."
            },
            {
                "element": "value2, ... [OPTIONAL]",
                "description": "Additional numbers or columns to compute the minumum value from."
            }
        ]
    }
    """
    # We make a dataframe out of the series, and take the min between all the columns
    argv = fill_series_with_one_index(argv)
    return pd.DataFrame(argv).min()


@handle_sheet_function_errors
@filter_nans
@convert_args_to_series_type('float', 'skip', ('default', 1))
def MULTIPLY(*argv: pd.Series) -> pd.Series:
    """
    {
        "function": "MULTIPLY",
        "description": "Returns the product of two numbers.",
        "search_terms": ["mulitply", "product"],
        "examples": [
            "MULTIPLY(2,3)",
            "MULTIPLY(A,3)"
        ],
        "syntax": "MULTIPLY(factor1, [factor2, ...])",
        "syntax_elements": [{
                "element": "factor1",
                "description": "The first number to multiply."
            },
            {
                "element": "factor2, ... [OPTIONAL]",
                "description": "Additional numbers or series to multiply."
            }
        ]
    }
    """
    # We make sure all the series are the max length, so the * has something at every index
    argv = fill_series_with_one_index(argv)

    return functools.reduce((lambda x, y: x * y), argv) 


@handle_sheet_function_errors
@filter_nans
@convert_arg_to_series_type(
    0,
    'float',
    'error',
    ('default', np.NaN)
)
@convert_arg_to_series_type(
    1,
    'float',
    'skip',
    ('default', 1)
)
def POWER(series, power):
    """
    {
        "function": "POWER",
        "description": "The POWER function can be used to raise a number to a given power.",
        "search_terms": ["power", "raise", "exponent", "square", "cube"],
        "examples": [
            "POWER(4, 1/2)",
            "POWER(Dose, 2)"
        ],
        "syntax": "POWER(value, exponent)",
        "syntax_elements": [{
                "element": "value",
                "description": "Number to raise to a power."
            },
            {
                "element": "exponent",
                "description": "The number to raise value to."
            }
        ]
    }
    """
    power = try_extend_series_to_index(power, series.index)
    return series.pow(power)


@handle_sheet_function_errors
@filter_nans
@convert_arg_to_series_type(
    0,
    'float',
    'error',
    ('default', np.NaN)
)
@convert_arg_to_series_type(
    1,
    'float',
    'error',
    ('default', 2),
    optional=True
)
def ROUND(series, decimals=None):
    """
    {
        "function": "ROUND",
        "description": "Rounds a number to a given number of decimals.",
        "search_terms": ["round", "decimal", "integer"],
        "examples": [
            "ROUND(1.3)",
            "ROUND(A, 2)"
        ],
        "syntax": "ROUND(value, [decimals])",
        "syntax_elements": [{
                "element": "value",
                "description": "The value or series to round."
            },
            {
                "element": "decimals",
                "description": " The number of decimals to round to. Default is 0."
            }
        ]
    }
    """

    # If no decimals option is passed, round to no decimals
    if decimals is None:
        return series.round()
    
    # Otherwise, fill the decimals to length
    decimals = try_extend_series_to_index(decimals, series.index)

    return pd.Series(
        [round(num, dec) for num, dec in zip(series, decimals)],
        index=series.index
    )

@handle_sheet_function_errors
@convert_arg_to_series_type(
    0,
    'float',
    'error',
    ('default', np.NaN)
)
# We don't use the @filter_nans decorator because skew ignores NaN values
def SKEW(series: pd.Series) -> pd.Series:
    """
    {
        "function": "SKEW",
        "description": "Computes the skew of a series, excluding missing values.",
        "search_terms": [],
        "examples": [
            "=SKEW(A)",
            "=SKEW(A * B)"
        ],
        "syntax": "SKEW(series)",
        "syntax_elements": [{
                "element": "series",
                "description": "The series to calculate the skew of."
            }
        ]
    }
    """
    skew = series.skew()
    return pd.Series(
        [skew] * len(series),
        index=series.index
    )


@handle_sheet_function_errors
@filter_nans
@convert_args_to_series_type('float', 'skip', ('default', 0))
def SUM(*argv: pd.Series) -> pd.Series:
    """
    {
        "function": "SUM",
        "description": "Returns the sum of the given numbers and series.",
        "search_terms": ["add"],
        "examples": [
            "SUM(10, 11)",
            "SUM(A, B, D, F)",
            "SUM(A, B, D, F)"
        ],
        "syntax": "SUM(value1, [value2, ...])",
        "syntax_elements": [{
                "element": "value1",
                "description": "The first number or column to add together."
            },
            {
                "element": "value2, ... [OPTIONAL]",
                "description": "Additional numbers or columns to sum."
            }
        ]
    }
    """
    # Fill sum to the max length of any series
    argv = fill_series_with_one_index(argv)

    return functools.reduce((lambda x, y: x + y), argv) 


@handle_sheet_function_errors
@convert_arg_to_series_type(
    0,
    'float',
    'error',
    ('default', np.NaN)
)
# We don't use the @filter_nans decorator because std ignores NaN values
def STDEV(series: pd.Series) -> pd.Series:
    """
    {
        "function": "STDEV",
        "description": "Computes the standard deviation of a series, excluding missing values.",
        "search_terms": ["standard", "deviation", "standard", "distribution"],
        "examples": [
            "=STDEV(A)",
            "=STDEV(A * B)"
        ],
        "syntax": "STDEV(series)",
        "syntax_elements": [{
                "element": "series",
                "description": "The series to calculate the standard deviation of."
            }
        ]
    }
    """
    std = series.std()
    return pd.Series(
        [std] * len(series),
        index=series.index
    )



@handle_sheet_function_errors
@filter_nans
@convert_arg_to_series_type(
    0,
    'float',
    'error',
    ('default', np.NaN)
)
def VALUE(series: pd.Series) -> pd.Series:
    """
    {
        "function": "VALUE",
        "description": "Converts a string series to a number series. Any values that fail to convert will return an NaN.",
        "search_terms": ["number", "to number", "dtype", "convert", "parse"],
        "examples": [
            "=VALUE(A)",
            "=VALUE('123')"
        ],
        "syntax": "VALUE(string)",
        "syntax_elements": [{
                "element": "string",
                "description": "The string or series to convert to a number."
            }
        ]
    }
    """
    return series


@handle_sheet_function_errors
@filter_nans
@convert_arg_to_series_type(
    0,
    'float',
    'error',
    ('default', np.NaN)
)
def EXP(series: pd.Series) -> pd.Series:
    """
    {
        "function": "EXP",
        "description": "Returns e, the base of the natural logarithm, raised to the power of passed series.",
        "search_terms": ["exp", "exponent", "log", "natural log"],
        "examples": [
            "=EXP(data)",
            "=EXP(A)"
        ],
        "syntax": "EXP(series)",
        "syntax_elements": [{
                "element": "series",
                "description": "The series to raise e to."
            }
        ]
    }
    """
    return np.exp(series)


@handle_sheet_function_errors
@convert_arg_to_series_type(
    0,
    'float',
    'error',
    ('default', np.NaN)
)
# We don't use the @filter_nans decorator because var ignores NaN values
def VAR(series: pd.Series) -> pd.Series:
    """
    {
        "function": "VAR",
        "description": "Computes the variance of a series, excluding missing values.",
        "search_terms": ["variance"],
        "examples": [
            "=VAR(A)",
            "=VAR(A - B)"
        ],
        "syntax": "VAR(series)",
        "syntax_elements": [{
                "element": "series",
                "description": "The series to calculate the variance of."
            }
        ]
    }
    """
    var = series.var()
    return pd.Series(
        [var] * len(series),
        index=series.index
    )

# TODO: we should see if we can list these automatically!
NUMBER_FUNCTIONS = {
    'ABS': ABS,
    'AVG': AVG,
    'CORR': CORR,
    'FLOAT': FLOAT,
    'INT': INT,
    'EXP': EXP,
    'KURT': KURT,
    'MAX': MAX,
    'MIN': MIN,
    'MULTIPLY': MULTIPLY,
    'POWER': POWER,
    'ROUND': ROUND,
    'SKEW': SKEW,
    'SUM': SUM,
    'STDEV': STDEV,
    'VALUE': VALUE,
    'VAR': VAR
}