from datetime import datetime, timedelta
from typing import Optional, Union

import pandas as pd

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