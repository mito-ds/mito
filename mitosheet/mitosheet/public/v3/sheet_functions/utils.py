


from typing import Callable, List, Optional, Tuple, TypeVar, Union
import numpy as np

import pandas as pd

from mitosheet.public.v3.rolling_range import RollingRange


PrimitiveType = TypeVar('PrimitiveType')

ResultType = Union[pd.Series, PrimitiveType]


def get_default_value_if_value_is_none_or_nan(value: PrimitiveType, default_value: PrimitiveType) -> PrimitiveType:
    if value is None or (isinstance(value, float) and np.isnan(value)):
        return default_value
    
    return value


def _get_new_result_series_or_primitive_helper(
        default_value: PrimitiveType,
        previous_result: ResultType, 
        new_value: ResultType,
        get_new_result_from_primitive_values: Callable[[PrimitiveType, PrimitiveType], PrimitiveType],
        get_new_result_from_series: Callable[[pd.Series, pd.Series], pd.Series]
    ) -> ResultType:
    """
    This helper function: TODO
    
    """
    if isinstance(previous_result, pd.Series):
        if isinstance(new_value, pd.Series):
            result =  get_new_result_from_series(previous_result.fillna(default_value), new_value.fillna(default_value))
            return result
        else:
            return previous_result.apply(lambda v: get_new_result_from_primitive_values(
                get_default_value_if_value_is_none_or_nan(v, default_value), 
                get_default_value_if_value_is_none_or_nan(new_value, default_value)
            ))
    else:
        if isinstance(new_value, pd.Series):
            return new_value.apply(lambda v: get_new_result_from_primitive_values(
                get_default_value_if_value_is_none_or_nan(previous_result, default_value), 
                get_default_value_if_value_is_none_or_nan(v, default_value)
            ))
        else:
            return get_new_result_from_primitive_values(
                get_default_value_if_value_is_none_or_nan(previous_result, default_value), 
                get_default_value_if_value_is_none_or_nan(new_value, default_value), 
            )


def _get_new_result_series_or_primitive(
        default_value: PrimitiveType,
        previous_result: ResultType,
        arg: Union[PrimitiveType, None, pd.Series, RollingRange], 
        get_primitive_value_from_dataframe: Callable[[pd.DataFrame], PrimitiveType],
        get_new_result_from_primitive_values: Callable[[PrimitiveType, PrimitiveType], PrimitiveType],
        get_new_result_from_series: Callable[[pd.Series, pd.Series], pd.Series]
    ) -> ResultType:

    def get_new_result(_previous_result: ResultType, new_value: ResultType) -> ResultType:
        return _get_new_result_series_or_primitive_helper(
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
        default_result: PrimitiveType,
        argv: Tuple[Union[PrimitiveType, None, pd.Series, RollingRange], ...], 
        get_primitive_value_from_dataframe: Callable[[pd.DataFrame], PrimitiveType],
        get_new_result_from_primitive_values: Callable[[PrimitiveType, PrimitiveType], PrimitiveType],
        get_new_result_from_series: Callable[[pd.Series, pd.Series], pd.Series]
    ) -> ResultType:

    result: ResultType = default_result

    for arg in argv:

        result = _get_new_result_series_or_primitive(
            default_result,
            result,
            arg,
            get_primitive_value_from_dataframe,
            get_new_result_from_primitive_values,
            get_new_result_from_series
        )

    return result 