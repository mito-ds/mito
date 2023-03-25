from datetime import datetime, timedelta
from typing import Optional, Union

import numpy as np


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


def cast_to_bool(unknown: Union[str, int, float, bool, datetime, timedelta]) -> Optional[bool]:
    if isinstance(unknown, str):
        return cast_string_to_bool(unknown)
    elif isinstance(unknown, int):
        return bool(unknown)
    elif isinstance(unknown, float):
        # We cast NaN's to false
        if np.isnan(unknown):
            return False

        return bool(unknown)
    elif isinstance(unknown, bool):
        return unknown

    return None