
from datetime import datetime, timedelta
from typing import Callable, Union

import pandas as pd


class RollingRange():
    """
    A rolling range is a helper object that is passed to sheet functions when the user
    references a range. 

    Some examples:
    - A0 = SUM(B0:B0) => SUM(RollingRange(df[['B']], 1, 0))
    - A0 = SUM(B0:B1) => SUM(RollingRange(df[['B']], 2, 0))
    - A1 = SUM(B0:B1) => SUM(RollingRange(df[['B']], 2, -1))
    - A1 = SUM(B0:B2) => SUM(RollingRange(df[['B']], 3, -1))

    We use this object rather than pandas .shifts and rolling windows for a simple reason. Consider
    the formula A1 = SUM(B0:B2). 

    In this case:
    1.  if we shift df[['B']] before calling .rolling, we will loose some of the values 
    in the column B - but this formula clearly uses all of them. 
    2.  if we call .rolling on df[['B']] first, then we loose the ability to shift the 
        object in a single expression. But it needs to be in a single expression as 
        it's inside a SUM function.

    Thus, we need to attach both the window size and the offset in a single expression, and
    thus this is exactly what we capture in this new object.
    """

    def __init__(self, obj: pd.DataFrame, window: int, offset: int):
        self.obj = obj
        self.window = window
        self.offset = offset

    def apply(self, func: Callable[[pd.DataFrame], Union[str, float, int, bool, datetime, timedelta]], default_value: Union[str, float, int, bool, datetime, timedelta]=0) -> pd.Series:
        """
        Calls the func with each of the windows, and returns a series with
        the same index as the original dataframe.
        """
        result = []

        # Then, we get each window, and call the function with it
        start = 0 + self.offset
        end = start + self.window

        while (start - self.offset) < len(self.obj): 
            df_subset = self.obj[max(0, start):end] # avoid negative start, as this wraps around to the end

            # We manually detect the default value case, as it messes up types otherwise (e.g. .sum().sum() returns a float with an empty df)
            if len(df_subset) == 0:
                result.append(default_value)
            else:
                result.append(func(df_subset))

            start, end = start + 1, end + 1

        # If we haven't filled up the results fully, we append default value. If the offset is negative, we
        # put them at the start - otherwise we put them at the end
        if len(result) < len(self.obj):
            default_values = [default_value for _ in range(len(self.obj) - len(result))]
            # If the offset is negative
            if self.offset < 0:
                result = default_values + result
            else:
                result = result + default_values

        return pd.Series(result, index=self.obj.index)