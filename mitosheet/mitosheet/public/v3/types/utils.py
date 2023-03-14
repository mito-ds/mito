

from typing import Any, Callable, Dict, Optional

from mitosheet.public.v3.types.bool import cast_to_bool
from mitosheet.public.v3.types.datetime import cast_to_datetime
from mitosheet.public.v3.types.float import cast_to_float
from mitosheet.public.v3.types.int import cast_to_int
from mitosheet.public.v3.types.number import cast_to_number
from mitosheet.public.v3.types.str import cast_to_string
from mitosheet.public.v3.types.timedelta import cast_to_timedelta

from mitosheet.types import PrimitiveTypeName

CONVERSION_FUNCTIONS: Dict[PrimitiveTypeName, Callable[[Any], Optional[Any]]] = {
    'str': cast_to_string,
    'int': cast_to_int,
    'float': cast_to_float,
    'number': cast_to_number,
    'bool': cast_to_bool,
    'datetime': cast_to_datetime,
    'timedelta': cast_to_timedelta,
}