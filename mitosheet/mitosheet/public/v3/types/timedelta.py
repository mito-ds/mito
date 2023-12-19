from datetime import datetime, timedelta
from typing import Optional, Union

import pandas as pd

def cast_to_timedelta(unknown: Union[str, int, float, bool, datetime, timedelta]) -> Optional[timedelta]:
    if isinstance(unknown, str):
        return pd.to_timedelta(unknown)
    elif isinstance(unknown, int):
        return pd.to_timedelta(unknown)
    elif isinstance(unknown, float):
        return pd.to_timedelta(unknown)
    elif isinstance(unknown, timedelta):
        return unknown

    return None