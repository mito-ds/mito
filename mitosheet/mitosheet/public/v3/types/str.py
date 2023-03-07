from datetime import datetime, timedelta
from typing import Optional, Union

def cast_to_string(unknown: Union[str, int, float, bool, datetime, timedelta]) -> Optional[str]:
    return str(unknown)