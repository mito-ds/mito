
from datetime import datetime, timedelta
from typing import Optional, Union

from mitosheet.public.v3.types.float import cast_string_to_float


def cast_str_to_int(s: str) -> Optional[int]:
    f = cast_string_to_float(s)
    if f is None:
        return None
    else:
        return int(f)

def cast_to_int(unknown: Union[str, int, float, bool, datetime, timedelta]) -> Optional[int]:
    if isinstance(unknown, str):
        return cast_str_to_int(unknown)
    elif isinstance(unknown, int):
        return unknown
    elif isinstance(unknown, float):
        return int(unknown)
    elif isinstance(unknown, bool):
        return int(unknown)

    return None