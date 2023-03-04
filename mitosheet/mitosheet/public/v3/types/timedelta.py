
from datetime import timedelta
from typing import Any, Callable, Dict, Optional

import pandas as pd

from mitosheet.types import PrimitiveTypeName

CAST_TO_TIMEDELTA: Dict[PrimitiveTypeName, Optional[Callable[[Any], Optional[timedelta]]]] = {
    'str': pd.to_timedelta, 
    'int': pd.to_timedelta, 
    'float': pd.to_timedelta, 
    'bool': lambda x: x, 
    'datetime': None, 
    'timedelta': lambda x: x
}