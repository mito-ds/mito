


from mitosheet.public.v1.sheet_functions import FUNCTIONS
from mitosheet.public.v1.sheet_functions import *
from mitosheet.public.v1.utils import flatten_column_header, deduplicate_column_headers
from mitosheet.public.v1.sheet_functions.types import to_int_series, to_boolean_series, to_float_series, to_timedelta_series, get_datetime_format
from mitosheet.public.v1.sheet_functions.types import *
import pandas as pd


def register_analysis(analysis_name):
    """
    A helper function that is used in the frontend
    to save which analysis is being run (so it can be replayed)
    """
    from mitosheet.telemetry.telemetry_utils import log
    log('ran_generated_code', {'analysis_name': analysis_name}) 


# Forwards compatible functions
from mitosheet.public.v2.excel_utils import get_table_range_from_upper_left_corner_value, get_read_excel_params_from_range, get_table_range, convert_csv_file_to_xlsx_file