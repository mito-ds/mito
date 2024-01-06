
from datetime import datetime, timedelta
from typing import Optional, Union

from mitosheet.public.v3.errors import make_invalid_param_type_conversion_error
from mitosheet.public.v3.types.float import cast_string_to_float


def cast_str_to_int(s: str) -> Optional[int]:
    f = cast_string_to_float(s)
    if f is None:
        raise make_invalid_param_type_conversion_error(s, 'int')
    else:
        return int(f)

def cast_to_int(unknown: Union[str, int, float, bool, datetime, timedelta]) -> Optional[int]:
    if isinstance(unknown, bool):
        return int(unknown)
    elif isinstance(unknown, str):
        return cast_str_to_int(unknown)
    elif isinstance(unknown, int):
        return unknown
    elif isinstance(unknown, float):
        try:
            return int(unknown)
        except:
            raise make_invalid_param_type_conversion_error(unknown, 'int')

    return None