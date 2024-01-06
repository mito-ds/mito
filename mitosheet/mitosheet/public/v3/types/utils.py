from datetime import datetime, timedelta
from typing import Any, Callable, Dict, List, Optional

import pandas as pd
from mitosheet.is_type_utils import is_bool_dtype, is_datetime_dtype, is_float_dtype, is_int_dtype, is_string_dtype, is_timedelta_dtype

from mitosheet.public.v3.rolling_range import RollingRange
from mitosheet.public.v3.types.bool import cast_to_bool
from mitosheet.public.v3.types.datetime import cast_series_to_datetime, cast_to_datetime
from mitosheet.public.v3.types.float import cast_to_float
from mitosheet.public.v3.types.int import cast_to_int
from mitosheet.public.v3.types.number import cast_to_number
from mitosheet.public.v3.types.str import cast_to_string
from mitosheet.public.v3.types.timedelta import cast_to_timedelta
from mitosheet.types import PrimitiveTypeName

SERIES_CONVERSION_FUNCTIONS: Dict[PrimitiveTypeName, Optional[Callable[[pd.Series], pd.Series]]] = {
    'str': None,
    'int': None,
    'float': None,
    'number': None,
    'bool': None,
    'datetime': cast_series_to_datetime,
    'timedelta': None,
}

ELEMENT_CONVERSION_FUNCTIONS: Dict[PrimitiveTypeName, Callable[[Any], Optional[Any]]] = {
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

def get_primitive_type_name_from_primitive_value(primitive_value: Any) -> PrimitiveTypeName:
    if isinstance(primitive_value, str):
        return 'str'
    elif isinstance(primitive_value, int):
        return 'int'
    elif isinstance(primitive_value, float):
        return 'float'
    elif isinstance(primitive_value, bool):
        return 'bool'
    elif isinstance(primitive_value, datetime):
        return 'datetime'
    elif isinstance(primitive_value, timedelta):
        return 'timedelta'
    else:
        return 'str'
    
def get_primitive_type_name_from_series(series: pd.Series) -> PrimitiveTypeName:
    dtype = str(series.dtype)
    if is_string_dtype(dtype):
        return 'str'
    elif is_int_dtype(dtype):
        return 'int'
    elif is_float_dtype(dtype):
        return 'float'
    elif is_bool_dtype(dtype):
        return 'bool'
    elif is_datetime_dtype(dtype):
        return 'datetime'
    elif is_timedelta_dtype(dtype):
        return 'timedelta'
    else:
        return 'str'


def get_arg_cast_to_type(
        target_primitive_type_name: PrimitiveTypeName, 
        arg: Any,
        primitive_types_to_ignore: Optional[List[PrimitiveTypeName]]=None
    ) -> Any:

    if primitive_types_to_ignore is None:
        primitive_types_to_ignore = []

    series_conversion_function_without_skip = SERIES_CONVERSION_FUNCTIONS[target_primitive_type_name]
    element_conversion_function_without_skip = ELEMENT_CONVERSION_FUNCTIONS[target_primitive_type_name]

    # Wrapper that make sure we skip any primitive types we want to ignore
    def element_conversion_function(arg: Any) -> Any:
        arg_type_name = get_primitive_type_name_from_primitive_value(arg)
        if arg_type_name in primitive_types_to_ignore: # type: ignore
            return arg

        return element_conversion_function_without_skip(arg)

    if series_conversion_function_without_skip is not None:
        def series_conversion_function(arg: Any) -> Any:
            arg_type_name = get_primitive_type_name_from_series(arg)
            if arg_type_name in primitive_types_to_ignore: # type: ignore
                return arg

            return series_conversion_function_without_skip(arg) # type: ignore
    else:
        series_conversion_function = None # type: ignore

    if is_primitive_value(arg):
        return element_conversion_function(arg)
    
    elif isinstance(arg, pd.Series):
        if series_conversion_function is not None:
            return series_conversion_function(arg)

        return arg.apply(element_conversion_function)

    elif isinstance(arg, pd.DataFrame):

        if series_conversion_function is not None:
            return arg.apply(lambda c: series_conversion_function(c))

        return arg.apply(lambda c: c.apply(element_conversion_function))

    elif isinstance(arg, RollingRange):
        obj = arg.obj

        if series_conversion_function is not None:
            new_obj = obj.apply(lambda c: series_conversion_function(c))
        else:
            new_obj = obj.apply(lambda c: c.apply(element_conversion_function))
            
        return RollingRange(new_obj, arg.window, arg.offset)