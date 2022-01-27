#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Mito.
# Distributed under the terms of the Modified BSD License.

"""
File that holds all the type conversion functions
"""

from mitosheet.sheet_functions.types.utils import (
    BOOLEAN_SERIES,
    DATETIME_SERIES,
    TIMEDELTA_SERIES,
    NUMBER_SERIES,
    STRING_SERIES,
)

from mitosheet.sheet_functions.types.to_number_series import to_number_series
from mitosheet.sheet_functions.types.to_string_series import to_string_series
from mitosheet.sheet_functions.types.to_boolean_series import to_boolean_series
from mitosheet.sheet_functions.types.to_datetime_series import to_datetime_series
from mitosheet.sheet_functions.types.to_timedelta_series import to_timedelta_series


SERIES_CONVERSION_FUNCTIONS = {
    BOOLEAN_SERIES: to_boolean_series,
    DATETIME_SERIES: to_datetime_series,
    NUMBER_SERIES: to_number_series,
    STRING_SERIES: to_string_series,
    TIMEDELTA_SERIES: to_timedelta_series
}