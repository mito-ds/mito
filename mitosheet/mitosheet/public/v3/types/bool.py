
from typing import Any, Callable, Dict, Optional
from mitosheet.public.v3.types.float import cast_string_to_float

from mitosheet.types import PrimitiveTypeName

def cast_string_to_bool(
        s: str,
    ) -> Optional[bool]:

    string_to_bool_conversion_dict = {
        '1': True,
        '1.0': True,
        1: True,
        1.0: True,
        'TRUE': True,
        'True': True, 
        'true': True,
        'T': True,
        't': True,
        'Y': True,
        'y': True,
        'Yes': True,
        'yes': True,
        #########################
        '0': False,
        '0.0': False,
        0: False,
        0.0: False,
        'FALSE': False,
        'False': False,
        'false': False,
        'F': False,
        'f': False,
        'N': False,
        'n': False,
        'No': False,
        'no': False, 
        'none': False,
        'None': False
    }

    if s in string_to_bool_conversion_dict:
        return string_to_bool_conversion_dict[s]
    else:
        return None # TODO: maybe we should default to False


CAST_TO_BOOL: Dict[PrimitiveTypeName, Optional[Callable[[Any], Optional[bool]]]] = {
    'str': cast_string_to_bool, 
    'int': bool, 
    'float': bool, 
    'bool': bool, 
    'datetime': None, 
    'timedelta': None
}