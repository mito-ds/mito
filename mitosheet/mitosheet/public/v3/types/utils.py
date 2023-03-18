

from datetime import datetime, timedelta
from typing import Any, Callable, Dict, Optional

import pandas as pd

from mitosheet.public.v3.rolling_range import RollingRange
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

def is_primitive_value(value: Any) -> bool:
    return isinstance(value, str) or \
        isinstance(value, int) or \
        isinstance(value, float) or \
        isinstance(value, bool) or \
        isinstance(value, datetime) or \
        isinstance(value, timedelta)
        # TODO: nan here?


def get_arg_cast_to_type(target_primitive_type_name: PrimitiveTypeName, arg: Any) -> Any:
    conversion_function = CONVERSION_FUNCTIONS[target_primitive_type_name]

    if is_primitive_value(arg):
        return conversion_function(arg)
    
    elif isinstance(arg, pd.Series):
        return arg.apply(conversion_function)

    elif isinstance(arg, pd.DataFrame):
        return arg.apply(lambda c: c.apply(conversion_function))

    elif isinstance(arg, RollingRange):
        obj = arg.obj
        new_obj = obj.apply(lambda c: c.apply(conversion_function))
        return RollingRange(new_obj, arg.window, arg.offset)