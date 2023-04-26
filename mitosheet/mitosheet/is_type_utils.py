from typing import Any, List, Tuple, Union
import pandas as pd

"""
A series of helper functions that help you figure out which dtype we're dealing with. 

NOTE: these should be identical to the TS utilities in dtypes.tsx
"""


def is_bool_dtype(dtype: str) -> bool:
    return 'bool' == dtype

def is_int_dtype(dtype: str) -> bool:
    return 'int' in dtype

def is_float_dtype(dtype: str) -> bool:
    return 'float' in dtype

def is_string_dtype(dtype: str) -> bool:
    return dtype == 'object' or dtype == 'str' or dtype == 'string'

def is_datetime_dtype(dtype: str) -> bool:
    # NOTE: this should handle all different datetime columns, no matter
    # the timezone, as it checks for string inclusion
    return 'datetime' in dtype

def is_timedelta_dtype(dtype: str) -> bool:
    return 'timedelta' in dtype

def is_number_dtype(dtype: str) -> bool:
    return is_int_dtype(dtype) or is_float_dtype(dtype)

def is_none_type(value: Union[str, None]) -> bool:
    """
    Helper function for determining if a value should be treated as None
    """
    return True if value is None or str(value).lower() in ['nan', 'nat'] else False


def get_float_dt_td_columns(df: pd.DataFrame) -> Tuple[List[Any], List[Any], List[Any]]:
    float_columns, date_columns, timedelta_columns = [], [], []
    for column_header in df.columns:
        dtype = str(df[column_header].dtype)
        # NOTE: these functions are called frequently, so we put them in 
        # the order they are most likely to be true in, so we can short out
        if is_float_dtype(dtype):
            float_columns.append(column_header)
        elif is_datetime_dtype(dtype):
            date_columns.append(column_header)
        elif is_timedelta_dtype(dtype):
            timedelta_columns.append(column_header)

    return float_columns, date_columns, timedelta_columns