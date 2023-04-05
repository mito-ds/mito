
from datetime import datetime, timedelta
from typing import Optional, Union

from mitosheet.public.v3.types.float import cast_string_to_float


def cast_to_number(unknown: Union[str, int, float, bool, datetime, timedelta]) -> Optional[Union[int, float]]:
    """
    A super-type of int and float, this number type will keep ints as ints and floats
    as floats. It will cast strings to floats by default.
    """
    if isinstance(unknown, bool):
        return int(unknown)
    elif isinstance(unknown, str):
        return cast_string_to_float(unknown)
    elif isinstance(unknown, int):
        return unknown
    elif isinstance(unknown, float):
        return unknown
    

    return None