from datetime import datetime, timedelta
from typing import Optional, Union

import pandas as pd


def get_datetime_format(s: str) -> Optional[str]:
    try:
        # First try letting pandas guess the correct datetime
        converted = pd.to_datetime(s, errors='coerce', infer_datetime_format=True)
        if not pd.isnull(converted):
            return None

        # TODO: Add the most popular formats to here and check them first before 
        # trying all of the formats below for performance.

        FORMATS = [
            '%m{s}%d{s}%Y', 
            '%d{s}%m{s}%Y', 
            '%Y{s}%d{s}%m', 
            '%Y{s}%m{s}%d', 
            '%m{s}%d{s}%Y %H:%M:%S', 
            '%d{s}%m{s}%Y  %H:%M:%S', 
            '%Y{s}%d{s}%m  %H:%M:%S', 
            '%Y{s}%m{s}%d  %H:%M:%S'
        ]
        SEPERATORS = ['/', '-', '.', ',', ':', ' ', '']

        for seperator in SEPERATORS:
            if seperator in s:
                for _format in FORMATS:
                    format = _format.format(s=seperator)
                    result = pd.to_datetime(
                        s,
                        format=format,
                        errors='coerce'
                    )
                    if not pd.isnull(result):
                        return format

        return None
    except:
        return None


def cast_string_to_datetime(
        s: str,
    ) -> Optional[Union[pd.Timestamp, datetime]]:

    # TODO: improve this to work element wise!
    datetime_format = get_datetime_format(s)
    if datetime_format is not None:
        result = pd.to_datetime(
            s,
            format=datetime_format,
            errors='coerce'
        ) 
    else:
        result = pd.to_datetime(
            s,
            infer_datetime_format=True,
            errors='coerce'
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