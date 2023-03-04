
from typing import Any, Callable, Dict, Optional
from mitosheet.public.v3.types.float import cast_string_to_float

from mitosheet.types import PrimitiveTypeName

def cast_str_to_int(s: str) -> Optional[int]:
    f = cast_string_to_float(s)
    if f is None:
        return None
    else:
        return int(f)


CAST_TO_INT: Dict[PrimitiveTypeName, Optional[Callable[[Any], Optional[float]]]] = {
    'str': cast_str_to_int, 
    'int': int, 
    'float': int, 
    'bool': int, 
    'datetime': None, 
    'timedelta': None
}