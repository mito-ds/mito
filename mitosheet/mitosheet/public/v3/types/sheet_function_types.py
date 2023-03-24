



from datetime import datetime
from typing import Union

import pandas as pd

from mitosheet.public.v3.rolling_range import RollingRange

# Input types
StringRestrictedInputType = Union[pd.Series, str, None]
StringInputType = Union[pd.DataFrame, RollingRange, StringRestrictedInputType]

IntRestrictedInputType = Union[pd.Series, int, None]
IntInputType = Union[pd.DataFrame, RollingRange, IntRestrictedInputType]

FloatRestrictedInputType = Union[pd.Series, float, None]
FloatInputType = Union[pd.DataFrame, RollingRange, FloatRestrictedInputType]

NumberRestrictedInputType = Union[IntRestrictedInputType, FloatRestrictedInputType]
NumberInputType = Union[IntInputType, FloatInputType]

BoolRestrictedInputType = Union[pd.Series, bool, None]
BoolInputType = Union[pd.DataFrame, RollingRange, BoolRestrictedInputType]

DatetimeRestrictedInputType = Union[pd.Series, datetime, pd.Timestamp, None]
DatetimeInputType = Union[pd.DataFrame, RollingRange, DatetimeRestrictedInputType]



# Return types
StringFunctionReturnType = Union[pd.Series, str]
IntFunctionReturnType = Union[pd.Series, int]
FloatFunctonReturnType = Union[pd.Series, float]
NumberFunctionReturnType = Union[pd.Series, int, float]
BoolFunctionReturnType = Union[pd.Series, bool]
DatetimeFunctionReturnType = Union[pd.Series, datetime]