


from mitosheet.public.v1.sheet_functions import FUNCTIONS
from mitosheet.public.v1.sheet_functions import *
from mitosheet.public.v1.utils import flatten_column_header
from mitosheet.public.v1.sheet_functions.types import to_int_series, to_boolean_series, to_float_series, to_timedelta_series, get_datetime_format
from mitosheet.public.v1.sheet_functions.types import *


def register_analysis(analysis_name):
    """
    A helper function that is used in the frontend
    to save which analysis is being run (so it can be replayed)
    """
    from mitosheet.telemetry.telemetry_utils import log
    log('ran_generated_code', {'analysis_name': analysis_name}) 