from datetime import datetime, timedelta
from typing import Optional, Union

import pandas as pd
from mitosheet.is_type_utils import is_string_dtype

from mitosheet.public.v1.sheet_functions.types.utils import get_to_datetime_params


def cast_string_to_datetime(
        s: str,
    ) -> Optional[Union[pd.Timestamp, datetime]]:

    to_datetime_params = get_to_datetime_params(pd.Series(s))

    result = pd.to_datetime(
        s,
        errors='coerce',
        **to_datetime_params
    ) 
    
    # Make sure we don't return a NaT
    if pd.isnull(result):
        return None
    else:
        return result # type: ignore

def cast_to_datetime(unknown: Union[str, int, float, bool, datetime, timedelta]) -> Optional[Union[datetime, pd.Timestamp]]:
    if isinstance(unknown, str):
        return cast_string_to_datetime(unknown)
    elif isinstance(unknown, int):
        return datetime.fromtimestamp(unknown)
    elif isinstance(unknown, float):
        return datetime.fromtimestamp(unknown)
    elif isinstance(unknown, datetime) or isinstance(unknown, pd.Timestamp):
        return unknown

    return None


def cast_series_to_datetime(series: pd.Series) -> pd.Series:
    """
    String casting can be very slow if you do it element-wise. As such, we provide a 
    function that casts the the entire series at once. 
    """

    dtype = str(series.dtype)
    if is_string_dtype(dtype):
        return pd.to_datetime(
            series,
            errors='coerce',
            **get_to_datetime_params(series)
        ) 
    
    # Otherwise, we just cast it element-wise
    return series.apply(cast_to_datetime)

