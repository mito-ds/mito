

from datetime import datetime, timedelta
import pandas as pd
from typing import Any, Callable, Dict, Optional, Union
from mitosheet.is_type_utils import is_bool_dtype, is_datetime_dtype, is_float_dtype, is_int_dtype, is_number_dtype, is_string_dtype
from mitosheet.public.v3.types.bool import CAST_TO_BOOL
from mitosheet.public.v3.types.datetime import CAST_TO_DATETIME

from mitosheet.public.v3.types.float import CAST_TO_FLOAT
from mitosheet.public.v3.types.int import CAST_TO_INT
from mitosheet.public.v3.types.str import CAST_TO_STR
from mitosheet.public.v3.types.timedelta import CAST_TO_TIMEDELTA
from mitosheet.types import PrimitiveTypeName

CONVERSION_FUNCTIONS: Dict[PrimitiveTypeName, Dict[PrimitiveTypeName, Optional[Callable[[Any], Optional[Any]]]]] = {
    'str': CAST_TO_STR,
    'int': CAST_TO_INT,
    'float': CAST_TO_FLOAT,
    'bool': CAST_TO_BOOL,
    'datetime': CAST_TO_DATETIME,
    'timedelta': CAST_TO_TIMEDELTA
}


def get_primitive_type_name_from_primitive_value(unknown_value: Union[str, int, float, bool, datetime, timedelta]) -> PrimitiveTypeName:
    if isinstance(unknown_value, str):
        return 'str'
    elif isinstance(unknown_value, int):
        return 'int'
    elif isinstance(unknown_value, float):
        return 'float'
    elif isinstance(unknown_value, bool):
        return 'bool'
    elif isinstance(unknown_value, datetime):
        return 'datetime'
    else:
        return 'timedelta'


def get_primitive_type_name_from_series(series: pd.Series) -> PrimitiveTypeName:
    column_dtype = str(series.dtype)
    if is_string_dtype(column_dtype):
        return 'str'
    elif is_int_dtype(column_dtype):
        return 'int'
    elif is_float_dtype(column_dtype):
        return 'int'
    if is_bool_dtype(column_dtype):
        return 'bool'
    elif is_datetime_dtype(column_dtype):
        return 'datetime'
    else:
        return 'timedelta'
