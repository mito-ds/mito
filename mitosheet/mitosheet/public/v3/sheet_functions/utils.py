


from typing import Callable, List, Optional, Tuple, TypeVar, Union
import numpy as np
from datetime import datetime, timedelta

import pandas as pd

from mitosheet.public.v3.rolling_range import RollingRange


PrimitiveType = TypeVar('PrimitiveType', bound=Union[str, float, int, bool, datetime, timedelta])

ResultType = Union[pd.Series, PrimitiveType]


def __get_default_value_if_value_is_none_or_nan(value: PrimitiveType, default_value: PrimitiveType) -> PrimitiveType:
    if value is None or (isinstance(value, float) and np.isnan(value)):
        return default_value
    
    return value


def __get_new_result_series_or_primitive_helper(
        default_value: PrimitiveType,
        previous_result: ResultType, 
        new_value: ResultType,
        get_new_result_from_primitive_values: Callable[[PrimitiveType, PrimitiveType], PrimitiveType],
        get_new_result_from_series: Callable[[pd.Series, pd.Series], pd.Series]
    ) -> ResultType:
    """
    This helper function is just responsible for combining two previous results into one new
    result. 

    It does so by:
    1. Filling NaN values with the default value.
    2. Delegating to the get_new_result_from_primitive_values and get_new_result_from_series functions
    """
    if isinstance(previous_result, pd.Series):
        if isinstance(new_value, pd.Series):
            result =  get_new_result_from_series(previous_result.fillna(default_value), new_value.fillna(default_value))
            return result
        else:
            return previous_result.apply(lambda v: get_new_result_from_primitive_values(
                __get_default_value_if_value_is_none_or_nan(v, default_value), 
                __get_default_value_if_value_is_none_or_nan(new_value, default_value)
            ))
    else:
        if isinstance(new_value, pd.Series):
            return new_value.apply(lambda v: get_new_result_from_primitive_values(
                __get_default_value_if_value_is_none_or_nan(previous_result, default_value), 
                __get_default_value_if_value_is_none_or_nan(v, default_value)
            ))
        else:
            return get_new_result_from_primitive_values(
                __get_default_value_if_value_is_none_or_nan(previous_result, default_value), 
                __get_default_value_if_value_is_none_or_nan(new_value, default_value), 
            )


def __get_new_result_series_or_primitive(
        default_value: PrimitiveType,
        previous_result: ResultType,
        arg: Union[PrimitiveType, None, pd.Series, RollingRange, pd.DataFrame], 
        get_primitive_value_from_dataframe: Callable[[pd.DataFrame], PrimitiveType],
        get_new_result_from_primitive_values: Callable[[PrimitiveType, PrimitiveType], PrimitiveType],
        get_new_result_from_series: Callable[[pd.Series, pd.Series], pd.Series]
    ) -> ResultType:
    """
    This helper function does the preprocessing for a single arg, and then combines it
    with the previous result to get the new result.
    """

    def get_new_result(_previous_result: ResultType, new_value: ResultType) -> ResultType:
        return __get_new_result_series_or_primitive_helper(
            default_value,
            _previous_result,
            new_value,
            get_new_result_from_primitive_values,
            get_new_result_from_series
        )

    if isinstance(arg, pd.DataFrame):
        reduced_df = get_primitive_value_from_dataframe(arg)
        return get_new_result(previous_result, reduced_df)

    elif isinstance(arg, RollingRange):
        new_series = arg.apply(lambda df: get_primitive_value_from_dataframe(df))
        return get_new_result(previous_result, new_series)
        
    elif isinstance(arg, pd.Series):
        return get_new_result(previous_result, arg)
        
    elif arg is not None:
        return get_new_result(previous_result, arg)
    
    # Otherwise the arg is None, so we just skip it
    return previous_result


def get_final_result_series_or_primitive(
        default_value: PrimitiveType,
        argv: Tuple[Union[PrimitiveType, None, pd.Series, RollingRange, pd.DataFrame], ...], 
        get_primitive_value_from_dataframe: Callable[[pd.DataFrame], PrimitiveType],
        get_new_result_from_primitive_values: Callable[[PrimitiveType, PrimitiveType], PrimitiveType],
        get_new_result_from_series: Callable[[pd.Series, pd.Series], pd.Series]
    ) -> ResultType:
    """
    This function is the main workhorse of many sheet functions that fit a common pattern:

    1. The start with a default result (default_value).
    2. They update the result with each arg in two steps, preprocessing the arg and then combining that with the result
    3. Preprocessing the arg:
        - For dataframe values, they turned into primitive values with get_primitive_value_from_dataframe
        - For rolling ranges, they are turned into series using repeated application of get_primitive_value_from_dataframe
    4. Combining with the previous result. We are either combining two primtiive values, a primitive value and a series, or two series
        - If combining two primitive values, we combine with get_new_result_from_primitive_values
        - If combining a primitive value and a series, we use a .apply on the series with get_new_result_from_primitive_values
        - If combining two series, then we use get_new_result_from_series

    This makes it much easier to specify many functions like AND, SUM, OR, etc. 

    Notably, to make get_new_result_from_primitive_values and get_new_result_from_series easier, we fill all NaN and None
    values in the primitive values and series results being combined with the default_value before sending them to 
    these functions in step (4).
    """

    result: ResultType = default_value

    for arg in argv:
        result = __get_new_result_series_or_primitive(
            default_value,
            result,
            arg,
            get_primitive_value_from_dataframe,
            get_new_result_from_primitive_values,
            get_new_result_from_series
        )

    return result 
    

def get_index_from_series(*args: Union[PrimitiveType, pd.Series]) -> pd.Index:
    if any(isinstance(arg, pd.Series) for arg in args):
        # Search for the first series and use its index
        return next(arg.index for arg in args if isinstance(arg, pd.Series))
    else:
        raise Exception("No series found in args")
    

def get_series_from_primitive_or_series(
        arg: Union[PrimitiveType, pd.Series], 
        index: pd.Index
    ) -> pd.Series:
    if isinstance(arg, pd.Series):
        return arg
    else:
        return pd.Series([arg] * len(index), index=index)