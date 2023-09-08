



from datetime import datetime, timedelta
from typing import List, Type, Union

import pandas as pd

from mitosheet.public.v3.rolling_range import RollingRange

# Input types
StringRestrictedInputType = Union[pd.Series, str]
StringInputType = Union[pd.DataFrame, RollingRange, StringRestrictedInputType]

IntRestrictedInputType = Union[pd.Series, int]
IntInputType = Union[pd.DataFrame, RollingRange, IntRestrictedInputType]

FloatRestrictedInputType = Union[pd.Series, float]
FloatInputType = Union[pd.DataFrame, RollingRange, FloatRestrictedInputType]

NumberRestrictedInputType = Union[IntRestrictedInputType, FloatRestrictedInputType]
NumberInputType = Union[IntInputType, FloatInputType]

BoolRestrictedInputType = Union[pd.Series, bool]
BoolInputType = Union[pd.DataFrame, RollingRange, BoolRestrictedInputType]

DatetimeRestrictedInputType = Union[pd.Series, datetime, pd.Timestamp]
DatetimeInputType = Union[pd.DataFrame, RollingRange, DatetimeRestrictedInputType]

AnyPrimitiveInputType = Union[str, int, float, bool, datetime, timedelta]
AnyPrimitiveOrSeriesInputType = Union[AnyPrimitiveInputType, pd.Series]

IfsInputType = Union[pd.Series, AnyPrimitiveOrSeriesInputType]

# Return types
StringFunctionReturnType = Union[pd.Series, str]
IntFunctionReturnType = Union[pd.Series, int]
FloatFunctonReturnType = Union[pd.Series, float]
NumberFunctionReturnType = Union[pd.Series, int, float]
BoolFunctionReturnType = Union[pd.Series, bool]
DatetimeFunctionReturnType = Union[pd.Series, datetime]
