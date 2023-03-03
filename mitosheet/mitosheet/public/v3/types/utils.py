

from typing import Callable, Dict

import pandas as pd

from mitosheet.types import PrimitiveTypeNames

CONVERSION_FUNCTIONS: Dict[PrimitiveTypeNames, Callable] = {
    'str': str,
    'int': int,
    'float': float,
    'bool': bool,
    'datetime': pd.to_datetime,
    'timedelta': pd.to_timedelta
}