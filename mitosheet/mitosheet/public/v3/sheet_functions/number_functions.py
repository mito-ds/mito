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
import decimal
import math
import sys
from datetime import datetime
from typing import Optional, Union

import numpy as np
import pandas as pd

from mitosheet.errors import MitoError
from mitosheet.is_type_utils import is_datetime_dtype
from mitosheet.public.v3.errors import handle_sheet_function_errors, pro_sheet_function
from mitosheet.public.v3.rolling_range import RollingRange
from mitosheet.public.v3.sheet_functions.utils import (
    get_final_result_series_or_primitive, get_index_from_series,
    get_series_from_primitive_or_series)
from mitosheet.public.v3.types.decorators import (
    cast_values_in_all_args_to_type, cast_values_in_arg_to_type)
from mitosheet.public.v3.types.sheet_function_types import (
    AnyPrimitiveOrSeriesInputType, DatetimeFunctionReturnType, DatetimeRestrictedInputType,
    FloatFunctonReturnType, IntFunctionReturnType, IntRestrictedInputType,
    NumberFunctionReturnType, NumberInputType, NumberRestrictedInputType)


@cast_values_in_arg_to_type('arg', 'number')
@handle_sheet_function_errors
def ABS(arg: NumberRestrictedInputType) -> NumberFunctionReturnType:
    """
    {
        "function": "ABS",
        "description": "Returns the absolute value of the passed number or series.",
        "search_terms": ["abs", "absolute value"],
        "category": "MATH",
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
    if isinstance(arg, int) or isinstance(arg, float):
        return abs(arg)

    return arg.abs() # type: ignore


@cast_values_in_all_args_to_type('number')
@handle_sheet_function_errors
def AVG(*argv: Optional[NumberInputType]) -> NumberFunctionReturnType:
    """
    {
        "function": "AVG",
        "description": "Returns the numerical mean value of the passed numbers and series.",
        "search_terms": ["avg", "average", "mean"],
        "category": "MATH",
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

    # Calculate the sum using the SUM function
    sum_for_avg = SUM(*argv)

    # Then, we count the number of entries in the arguements. To match Excel's behavior, we do not count 
    # nan values, and we do not count when a RollingRange runs off the end of the sum
    num_entries: Union[pd.Series,int] = 0

    for arg in argv:
        if isinstance(arg, pd.DataFrame):
            num_non_null_values = arg.count().sum()
            num_entries += int(num_non_null_values)

        elif isinstance(arg, RollingRange):
            num_non_null_values_series = arg.apply(lambda df: df.count().sum())
            num_entries += num_non_null_values_series
            
        elif isinstance(arg, pd.Series):
            # Because series are summed row-wise, we need to count the number of non-null
            # values in the row, which we do with this little type cast
            num_entries += (~arg.isna()).astype(int)
            
        elif arg is not None:
            num_entries += 1

    there_are_entries = (isinstance(num_entries, int) and num_entries != 0) or isinstance(num_entries, pd.Series)

    return sum_for_avg / num_entries if there_are_entries else 0

@cast_values_in_arg_to_type('s1', 'number')
@cast_values_in_arg_to_type('s2', 'number')
@handle_sheet_function_errors
def CORR(s1: NumberRestrictedInputType, s2: NumberRestrictedInputType) -> NumberFunctionReturnType:
    """
    {
        "function": "CORR",
        "description": "Computes the correlation between two series, excluding missing values.",
        "search_terms": ["corr", "correlation", "r^2"],
        "category": "MATH",
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
    if isinstance(s1, int) or isinstance(s1, float) or isinstance(s2, int) or isinstance(s2, float):
        return 0
    
    return s1.corr(s2, method='pearson') # type: ignore
 

@cast_values_in_arg_to_type('arg', 'number')
@handle_sheet_function_errors
def EXP(arg: NumberRestrictedInputType) -> NumberFunctionReturnType:
    """
    {
        "function": "EXP",
        "description": "Returns e, the base of the natural logarithm, raised to the power of passed series.",
        "search_terms": ["exp", "exponent", "log", "natural log"],
        "category": "MATH",
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
    if isinstance(arg, int) or isinstance(arg, float):
        return math.exp(arg)
    
    return pd.Series(np.exp(arg))


@cast_values_in_arg_to_type('arg', 'float')
@handle_sheet_function_errors
def FLOAT(arg: NumberRestrictedInputType) -> FloatFunctonReturnType:
    """
    {
        "function": "FLOAT",
        "description": "Converts a string series to a float series. Any values that fail to convert will return NaN.",
        "search_terms": ["number", "to number"],
        "category": "MATH",
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
    if isinstance(arg, int) or isinstance(arg, float):
        return float(arg)
    
    return arg.fillna(np.nan) # type: ignore

@cast_values_in_arg_to_type('arg', 'int')
@handle_sheet_function_errors
def INT(arg: IntRestrictedInputType) -> IntFunctionReturnType:
    """
    {
        "function": "INT",
        "description": "Converts a string series to a int series. Any values that fail to convert will return 0.",
        "search_terms": ["number", "to integer"],
        "category": "MATH",
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
    return arg
    


@cast_values_in_arg_to_type('arg', 'number')
@handle_sheet_function_errors
def KURT(arg: NumberRestrictedInputType) -> NumberFunctionReturnType:
    """
    {
        "function": "KURT",
        "description": "Computes the unbiased kurtosis, a measure of tailedness, of a series, excluding missing values.",
        "search_terms": ["kurtosis"],
        "category": "MATH",
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
    if isinstance(arg, int) or isinstance(arg, float):
        return 0
        
    return arg.kurt() # type: ignore


@cast_values_in_arg_to_type('arg', 'number')
@cast_values_in_arg_to_type('base', 'number')
@handle_sheet_function_errors
def LOG(arg: NumberRestrictedInputType, base: Optional[NumberRestrictedInputType]=None) -> NumberFunctionReturnType:
    """
    {
        "function": "LOG",
        "description": "Calculates the logarithm of the passed series with an optional base.",
        "search_terms": ["log", "logarithm", "natural log"],
        "category": "MATH",
        "examples": [
            "LOG(10) = 1",
            "LOG(100, 10) = 2"
        ],
        "syntax": "LOG(series, [base])",
        "syntax_elements": [{
                "element": "series",
                "description": "The series to take the logarithm of."
            },
            {
                "element": "base [OPTIONAL]",
                "description": "The base of the logarithm to use. Defaults to 10 if no base is passed."
            }
        ]
    }
    """
    
    if base is None:
        base = 10

    if (isinstance(arg, int) or isinstance(arg, float)) and (isinstance(base, int) or isinstance(base, float)):
        return math.log(arg, base)
    
    index = get_index_from_series(arg, base)
    arg = get_series_from_primitive_or_series(arg, index)
    base = get_series_from_primitive_or_series(base, index).fillna(10)
    
    # See here: https://stackoverflow.com/questions/25169297/numpy-logarithm-with-base-n
    return pd.Series(np.log(arg) / np.log(base)) # type: ignore

@cast_values_in_all_args_to_type('number', ['datetime'])
@handle_sheet_function_errors
def MAX(*argv: Union[NumberInputType, None, DatetimeRestrictedInputType]) -> Union[NumberFunctionReturnType, DatetimeFunctionReturnType]:
    """
    {
        "function": "MAX",
        "description": "Returns the maximum value among the passed arguments.",
        "search_terms": ["max", "maximum", "minimum"],
        "category": "MATH",
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

    # If the user passes numbers, we start the default as the smallest possible number
    # but if it's a datetime, we start the default as the earliest possible date
    default_value = -sys.maxsize - 1
    for arg in argv:
        if isinstance(arg, pd.Series) and is_datetime_dtype(str(arg.dtype)):
            default_value = pd.Timestamp.min
            break
        elif isinstance(arg, pd.Timestamp) or isinstance(arg, datetime):
            default_value = pd.Timestamp.min
            break
        elif isinstance(arg, pd.DataFrame):
            # Check if any series are datetimes
            for col in arg.columns:
                if is_datetime_dtype(str(arg[col].dtype)):
                    default_value = pd.Timestamp.min
                    break
        elif isinstance(arg, RollingRange):
            # Check if any series are datetimes
            for col in arg.obj.columns:
                if is_datetime_dtype(str(arg.obj[col].dtype)):
                    default_value = pd.Timestamp.min
                    break

    result = get_final_result_series_or_primitive(
        default_value,
        argv,
        lambda df: df.max().max(),
        lambda previous_value, new_value: max(previous_value, new_value),
        lambda previous_series, new_series: pd.concat([previous_series, new_series], axis=1).max(axis=1)
    )

    # If we don't find any arguements, we default to 0 -- like Excel -- even for numbers
    kept_default_max_value = not isinstance(result, pd.Series) and result == (default_value)
    return result if not kept_default_max_value else 0


@cast_values_in_all_args_to_type('number', ['datetime'])
@handle_sheet_function_errors
def MIN(*argv: Union[NumberInputType, None, DatetimeRestrictedInputType]) -> Union[NumberFunctionReturnType, DatetimeFunctionReturnType]:
    """
    {
        "function": "MIN",
        "description": "Returns the minimum value among the passed arguments.",
        "search_terms": ["min", "minimum", "maximum"],
        "category": "MATH",
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
    default_value = sys.maxsize
    for arg in argv:
        if isinstance(arg, pd.Series) and is_datetime_dtype(str(arg.dtype)):
            default_value = pd.Timestamp.max
            break
        elif isinstance(arg, pd.Timestamp) or isinstance(arg, datetime):
            default_value = pd.Timestamp.max
            break
        elif isinstance(arg, pd.DataFrame):
            # Check if any series are datetimes
            for col in arg.columns:
                if is_datetime_dtype(str(arg[col].dtype)):
                    default_value = pd.Timestamp.max
                    break
        elif isinstance(arg, RollingRange):
            # Check if any series are datetimes
            for col in arg.obj.columns:
                if is_datetime_dtype(str(arg.obj[col].dtype)):
                    default_value = pd.Timestamp.max
                    break

    result = get_final_result_series_or_primitive(
        default_value,
        argv,
        lambda df: df.min().min(),
        lambda previous_value, new_value: min(previous_value, new_value),
        lambda previous_series, new_series: pd.concat([previous_series, new_series], axis=1).min(axis=1)
    )

    # If we don't find any arguements, we default to 0 -- like Excel
    kept_default_min_value = not isinstance(result, pd.Series) and result == default_value
    return result if not kept_default_min_value else 0


@cast_values_in_all_args_to_type('number')
@handle_sheet_function_errors
def MULTIPLY(*argv: Optional[NumberInputType]) -> NumberFunctionReturnType:
    """
    {
        "function": "MULTIPLY",
        "description": "Returns the product of two numbers.",
        "search_terms": ["multiply", "product"],
        "category": "MATH",
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

    return get_final_result_series_or_primitive(
        1,
        argv,
        lambda df: df.prod().prod(),
        lambda previous_value, new_value: previous_value * new_value,
        lambda previous_series, new_series: previous_series * new_series
    )


@cast_values_in_arg_to_type('arg', 'number')
@cast_values_in_arg_to_type('power', 'number')
@handle_sheet_function_errors
def POWER(arg: NumberRestrictedInputType, power: NumberRestrictedInputType) -> NumberFunctionReturnType:
    """
    {
        "function": "POWER",
        "description": "The POWER function can be used to raise a number to a given power.",
        "search_terms": ["power", "raise", "exponent", "square", "cube"],
        "category": "MATH",
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
    if isinstance(arg, int) or isinstance(arg, float):
        return arg ** power
    
    return arg.pow(power) # type: ignore

@cast_values_in_arg_to_type('arg', 'number')
@cast_values_in_arg_to_type('decimals', 'number')
@handle_sheet_function_errors
def ROUND(arg: NumberRestrictedInputType, decimals: Optional[IntRestrictedInputType]=None) -> NumberFunctionReturnType:
    """
    {
        "function": "ROUND",
        "description": "Rounds a number to a given number of decimals.",
        "search_terms": ["round", "decimal", "integer"],
        "category": "MATH",
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

    def excel_round(x: Optional[Union[int, float]], decimals: int) -> Union[int, float, None]:
        if x is None or pd.isna(x): 
            return None

        context = decimal.getcontext()
        context.rounding = decimal.ROUND_HALF_UP
        number = decimal.Decimal(x)
        rounded_number = round(number, decimals)
        return type(x)(rounded_number)

    # If no decimals option is passed, round to no decimals
    if decimals is None:
        decimals = 0

    if (isinstance(arg, int) or isinstance(arg, float)) and isinstance(decimals, int):
        return excel_round(arg, decimals) 

    index = get_index_from_series(arg, decimals)
    arg = get_series_from_primitive_or_series(arg, index).fillna(np.nan)
    decimals = get_series_from_primitive_or_series(decimals, index).fillna(0)

    return pd.Series(
        [excel_round(num, decimal) for num, decimal in zip(arg, decimals)], # type: ignore
        index=index
    )


@cast_values_in_arg_to_type('arg', 'number')
@handle_sheet_function_errors
def SKEW(arg: NumberRestrictedInputType) -> NumberFunctionReturnType:
    """
    {
        "function": "SKEW",
        "description": "Computes the skew of a series, excluding missing values.",
        "search_terms": [],
        "category": "MATH",
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
    if isinstance(arg, int) or isinstance(arg, float):
        return 0
        
    return arg.skew() # type: ignore

@cast_values_in_arg_to_type('arg', 'number')
@handle_sheet_function_errors
def STDEV(arg: NumberInputType) -> NumberFunctionReturnType:
    """
    {
        "function": "STDEV",
        "description": "Computes the standard deviation of a series, excluding missing values.",
        "search_terms": ["standard", "deviation", "standard", "distribution"],
        "category": "MATH",
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
    if isinstance(arg, int) or isinstance(arg, float):
        return 0
    elif isinstance(arg, pd.Series):
        return arg.std() # type: ignore
    elif isinstance(arg, pd.DataFrame):
        return arg.stack().std() # We have to compute them all together
    else:
        return arg.apply(lambda x: x.stack().std()) # type: ignore


@cast_values_in_all_args_to_type('number')
@handle_sheet_function_errors
def SUM(*argv: Optional[NumberInputType]) -> NumberFunctionReturnType:
    """
    {
        "function": "SUM",
        "description": "Returns the sum of the given numbers and series.",
        "search_terms": ["add"],
        "category": "MATH",
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

    return get_final_result_series_or_primitive(
        0,
        argv,
        lambda df: df.sum().sum(),
        lambda previous_value, new_value: previous_value + new_value,
        lambda previous_series, new_series: previous_series + new_series
    )

@cast_values_in_arg_to_type('sum_range', 'number')
@handle_sheet_function_errors
@pro_sheet_function
def SUMIF(range: pd.DataFrame, criteria: AnyPrimitiveOrSeriesInputType, sum_range: pd.DataFrame) -> NumberFunctionReturnType:
    """
    {
        "function": "SUMIF",
        "description": "Returns the sum of the given numbers and series that meet a certain criteria.",
        "search_terms": ["add", "sum"],
        "category": "MATH",
        "examples": [
            "=SUMIF(df2!Key:Key, 'A1', df2!Value:Value)",
            "=SUMIF(df2!Key:Key, 'Apple', df2!Value:Value)"
        ],
        "syntax": "SUMIF(range, criteria, sum_range)",
        "syntax_elements": [{
                "element": "range",
                "description": "The range to evaluate the criteria against."
            },
            {
                "element": "criteria",
                "description": "The criteria to evaluate the range against."
            },
            {
                "element": "sum_range",
                "description": "The range to sum if the criteria is met."
            }
        ]
    }
    """

    
    # We do not support the full range of Excel's SUMIF function. There are at least three ways to use the SUMIF 
    # function in Excel. We only support the first case below because we have the infrastructure to do so and 
    # it is the only case that I have seen our users need in practice. 

    # 1. Sum when the criteria matches a string values
    # =SUMIF(Sheet2!A:A, A1, Sheet2!B:B) or =SUMIF(Sheet2!A:A, "Constant Key", Sheet2!B:B)

    # 2. Sum when the criteria matches a constant conditional expression
    # =SUMIF(Sheet2!A:A, ">10", Sheet2!C:C)

    # 3. Sum when the criteria matches a conditional expression with cell reference
    # =SUMIF(Sheet2!A:A, ">" & A1, Sheet2!B:B)

    
    # We strive to support the SUMIF implementation as closely as possible, including:
    # 1. Does not support summing across multiple columns directly in the [sum_range]. When you specify Sheet2!B:D 
    # as the sum range, Excel implicitly only considers the first column of this range (Sheet2!B:B) for summing the values.
    # 2. If the range and criteria are strings, Excel treats them case insensitive. 

    # Save info for easy reference later
    range_series_name = range.columns[0]
    range_dtype = range[range_series_name].dtype
    sum_range_series_name = sum_range.columns[0]

    # Combine the range and sumrange into a single dataframe
    source_data = pd.concat([range, sum_range], axis=1)

    if range_dtype == 'object':
        # Convert to lower case to match Excel's behavior
        source_data[range_series_name] = source_data[range_series_name].str.lower()

    # Calculate the sums 
    summed_table = source_data.pivot_table(index=[range_series_name], aggfunc={sum_range_series_name: 'sum'})
    summed_table.reset_index(inplace=True)

    print("HERE!!!")

    # If the criteria is a series, then we know the index of the series we need to create
    if isinstance(criteria, pd.Series):

        # Check if the criteria series is the same type as the first column of the range
        criteria_dtype = criteria.dtype
        range_dtype = range[range_series_name].dtype
        if criteria_dtype != range_dtype:
            raise MitoError(
                'invalid_args_error',
                'SUMIF',
                f'SUMIF requires the criteria and the first column of the range to be the same type. The criteria is of type {criteria_dtype} and the first column of the range is of type {range_dtype}.'
            )

        # Turn it into a dataframe
        criteria_df = pd.DataFrame(criteria)
        criteria_series_name = criteria_df.columns[0] 
        safe_criteria_series_name = str(criteria_series_name) + "_MITO_UNIQUE_COLUMN_IDENTIFIER"
        criteria_df.columns = [safe_criteria_series_name]

        # Convert to lower case to match Excel's behavior
        if criteria_dtype == 'object':
            criteria_df[safe_criteria_series_name] = criteria_df[safe_criteria_series_name].str.lower()

        # Merge the criteria with the summed table to get the results in the correct order 
        merged = pd.merge(criteria_df, summed_table, left_on=safe_criteria_series_name, right_on=range_series_name, how='left')

        # Keep the indexes from the criteria_df
        merged.index = criteria_df.index

        # Fill NaN with 0 to match Excel 
        merged[sum_range_series_name] = merged[sum_range_series_name].fillna(0)
        print("HERE")
        print(merged)
        return merged[sum_range_series_name]
    
    else: 
        # If the criteria is a string, make it lowercase
        if isinstance(criteria, str):
            criteria = criteria.lower()

        # Filter the summed table
        summed_table = summed_table[summed_table[range_series_name] == criteria]

        # If we don't find any matches, we return 0
        if summed_table.empty:
            return 0

        return summed_table[sum_range_series_name].iloc[0]


@cast_values_in_all_args_to_type('number')
@handle_sheet_function_errors
def SUMPRODUCT(*argv: Union[pd.Series, pd.DataFrame]) -> NumberFunctionReturnType:
    """
    {
        "function": "SUMPRODUCT",
        "description": "Returns the sum of the product of the passed arguments. Only available with Mito Pro.",
        "search_terms": ["sum product", "sumproduct", "sum", "product", "weighted average"],
        "category": "MATH",
        "examples": [
            "SUMPRODUCT(A:A, B:B)",
            "SUMPRODUCT(A:B)"
        ],
        "syntax": "SUMPRODUCT(array1, [array2, ...])",
        "syntax_elements": [{
                "element": "array1",
                "description": "The first array argument whose components you want to multiply and then add."
            },
            {
                "element": "value2, ... [OPTIONAL]",
                "description": "Additional series to multiply then add."
            }
        ]
    }
    """

    # We need to make sure that all of the passed arguments are the same length
    # so we can multiply them together. They must be all dataframes or all series
    for arg in argv:
        error = MitoError(
            'invalid_args_error',
            'SUMPRODUCT',
            f"SUMPRODUCT requires all arguments to be the same dimensions.",
            error_modal=False
        )

        length = len(arg)
        if length != len(argv[0]):
            raise error
        
        if type(arg) != type(argv[0]):
            raise error
        
    if isinstance(argv[0], pd.Series):
        # Put all the values into a single dataframe, prod the rows, and then
        # sum the results
        return pd.concat(argv, axis=1).fillna(1).prod(axis=1)
    else:
        # Multiply argv into a single dataframe - making the columns the same first
        result = argv[0]
        for arg in argv[1:]:
            result = result.mul(arg, fill_value=1)

        # And then sum the results
        return result.sum().sum()
        

@cast_values_in_arg_to_type('arg', 'number')
@handle_sheet_function_errors
def VALUE(arg: NumberRestrictedInputType) -> NumberFunctionReturnType:
    """
    {
        "function": "VALUE",
        "description": "Converts a string series to a number series. Any values that fail to convert will return an NaN.",
        "search_terms": ["number", "to number", "dtype", "convert", "parse"],
        "category": "MATH",
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
    if isinstance(arg, int) or isinstance(arg, float):
        return arg
    
    return arg.fillna(np.nan) # type: ignore


@cast_values_in_arg_to_type('arg', 'number')
@handle_sheet_function_errors
def VAR(arg: NumberInputType) -> NumberFunctionReturnType:
    """
    {
        "function": "VAR",
        "description": "Computes the variance of a series, excluding missing values.",
        "search_terms": ["variance"],
        "category": "MATH",
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
    if isinstance(arg, int) or isinstance(arg, float):
        return 0
    elif isinstance(arg, pd.Series):
        return arg.var() # type: ignore
    elif isinstance(arg, pd.DataFrame):
        return arg.stack().var() # type: ignore
    else:
        return arg.apply(lambda x: x.stack().var()) # type: ignore


NUMBER_FUNCTIONS = {
    'ABS': ABS,
    'AVG': AVG,
    'CORR': CORR,
    'FLOAT': FLOAT,
    'INT': INT,
    'EXP': EXP,
    'KURT': KURT,
    'LOG': LOG,
    'MAX': MAX,
    'MIN': MIN,
    'MULTIPLY': MULTIPLY,
    'POWER': POWER,
    'ROUND': ROUND,
    'SKEW': SKEW,
    'SUM': SUM,
    'SUMIF': SUMIF,
    'SUMPRODUCT': SUMPRODUCT,
    'STDEV': STDEV,
    'VALUE': VALUE,
    'VAR': VAR
}