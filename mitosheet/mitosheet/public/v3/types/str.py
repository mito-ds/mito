from datetime import datetime, timedelta
from typing import Optional, Union

import numpy as np

def cast_to_string(unknown: Union[str, int, float, bool, datetime, timedelta]) -> Optional[str]:
    if isinstance(unknown, float) and np.isnan(unknown):
        return None

    return str(unknown)