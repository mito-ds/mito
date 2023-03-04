from typing import Any, Callable, Dict, Optional

from mitosheet.types import PrimitiveTypeName


CAST_TO_STR: Dict[PrimitiveTypeName, Optional[Callable[[Any], Optional[str]]]] = {
    'str': str, 
    'int': str, 
    'float': str, 
    'bool': str, 
    'datetime': str, 
    'timedelta': str
}